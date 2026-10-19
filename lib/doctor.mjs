// Read-only health check. Its core is a dry-run update — pending changes are
// drift, conflicts are conflicts — plus the checks an update cannot make.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readText, readJson, lf } from './util.mjs';
import { loadState } from './state.mjs';
import { runInstall, buildPlan, packRoot } from './engine.mjs';
import { globalSkills, packSkillSets, PACKS } from './skills.mjs';
import { catalogErrors } from './prompt.mjs';
import { loadCatalog, catalogProblems, serversFor, envRefs } from './mcp.mjs';
import { samePath } from './platform.mjs';
import { LSP_PLUGINS } from './agents/claude.mjs';

// Repo self-check (also `node harness.mjs check`).
export function repoProblems(ctx) {
  let mcp;
  try {
    mcp = catalogProblems(loadCatalog(ctx.repo));
  } catch (e) {
    // An MCP catalog that does not even parse is one more problem to list.
    mcp = [e.message];
  }
  const out = [...catalogErrors(ctx.repo), ...mcp];
  const core = readText(join(ctx.repo, 'prompt', 'core.md')) ?? '';
  for (const p of ['{{TITLE}}', '{{SKILLS}}', '{{MCP}}', '{{NOTES}}', '{{REPO}}']) if (!core.includes(p)) out.push(`prompt/core.md is missing ${p}`);
  const gen = join(ctx.repo, 'scripts', 'gen-harness.mjs');
  if (existsSync(gen)) {
    const harness = spawnSync(process.execPath, [gen, '--check'], { encoding: 'utf8' });
    if (harness.status !== 0) out.push('HARNESS.md is out of date — run: node scripts/gen-harness.mjs');
  }
  return out;
}

export async function doctor(ctx, { deep = false } = {}) {
  const found = [];
  const fail = (msg) => found.push({ level: 'fail', msg });
  const warn = (msg) => found.push({ level: 'warn', msg });
  for (const p of repoProblems(ctx)) fail(p);
  let state;
  try {
    state = loadState(ctx.local);
  } catch (e) {
    fail(e.message);
    return found;
  }
  if (!state.agents.length) {
    warn('nothing is installed on this machine yet — run: node harness.mjs install --agents <list>');
    return found;
  }
  // A malformed config or a folder link into the repo stops the dry run; that is one finding, and the checks below still run.
  let report = null;
  try {
    report = runInstall(ctx, { agents: state.agents, packs: state.packs, dryRun: true });
  } catch (e) {
    fail(e.message);
  }
  if (report?.changes.length) {
    const shown = report.changes.slice(0, 30).join('\n    ');
    warn(`update would make ${report.changes.length} change(s):\n    ${shown}${report.changes.length > 30 ? '\n    …' : ''}`);
  }
  for (const c of report?.conflicts ?? []) fail(`conflict ${c.id}: ${c.msg}`);
  for (const w of report?.warnings ?? []) warn(w);
  for (const [id, e] of Object.entries(state.entries)) if (e.pinned) warn(`kept on this machine, not managed: ${id}`);
  for (const [file, why] of shadowing(ctx, state)) warn(`${file} exists: ${why}`);
  gitChecks(ctx, warn);
  try {
    for (const dir of orphanSkillDirs(ctx, state)) warn(`no plan covers this skill directory (left from a removed pack or sub-pack?): ${dir}`);
    for (const v of missingEnv(ctx, state)) warn(`environment variable ${v} is not set, but a server that is on by default needs it`);
  } catch (e) {
    // These build the same plans the dry run does, so what stops them stopped it too and is listed already.
    if (report) fail(e.message);
  }
  if (deep) await deepChecks(ctx, state, warn);
  return found;
}

// Files an agent reads in place of, or merged with, the ones the harness writes.
function shadowing(ctx, state) {
  const instead = (agent, dir) => [join(dir, 'AGENTS.override.md'), `${agent} reads it instead of ${join(dir, 'AGENTS.md')}, so the harness instructions there are not used`];
  const opencode = join(ctx.home, '.config', 'opencode');
  const merged = (name) => [join(opencode, name), `OpenCode merges it with ${join(opencode, 'opencode.json')}, so its mcp or lsp settings can change the harness's`];
  const files = {
    codex: [instead('Codex', join(ctx.home, '.codex'))],
    pi: [instead('Pi', join(ctx.home, '.pi', 'agent'))],
    opencode: [merged('opencode.jsonc'), merged('config.json')],
  };
  return state.agents.flatMap((a) => files[a] ?? []).filter(([file]) => existsSync(file));
}

function gitChecks(ctx, warn) {
  const git = (...args) => spawnSync('git', ['-C', ctx.repo, ...args], { encoding: 'utf8' });
  const branch = git('rev-parse', '--abbrev-ref', 'HEAD').stdout?.trim();
  if (branch && branch !== 'master') warn(`this checkout is on "${branch}" — agents link into it, so that branch is what they run`);
  const dirty = git('status', '--porcelain', '--', 'skills', 'agents', 'prompt', 'mcp', 'scripts/hooks').stdout?.trim();
  if (dirty) warn(`uncommitted changes in shipped content (edits made through the links land here):\n    ${dirty.split('\n').join('\n    ')}`);
}

const AGENT_DIRS = ['.claude', '.codex', '.cursor', '.opencode', '.pi'];
const SKIP_DIRS = new Set(['node_modules', '.git', '.venv', 'venv', '__pycache__']);

function orphanSkillDirs(ctx, state) {
  const planned = [];
  for (const name of state.agents) {
    const plan = buildPlan(ctx, name);
    for (const set of packSkillSets(ctx.repo, state.packs)) planned.push(plan.skills.pack(packRoot(ctx, set)));
  }
  const out = [];
  const walk = (dir, depth) => {
    if (depth > 3 || !existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory() || SKIP_DIRS.has(e.name)) continue;
      const p = join(dir, e.name);
      if (!AGENT_DIRS.includes(e.name)) {
        walk(p, depth + 1);
        continue;
      }
      const skills = join(p, 'skills');
      if (existsSync(skills) && readdirSync(skills).length && !planned.some((q) => samePath(q, skills))) out.push(skills);
    }
  };
  for (const pack of Object.values(PACKS)) walk(join(ctx.home, pack), 0);
  return out;
}

// Names only: a value never leaves process.env.
function missingEnv(ctx, state) {
  const catalog = loadCatalog(ctx.repo);
  const need = new Set();
  for (const name of state.agents) {
    for (const s of serversFor(catalog, name, ctx.os)) {
      if (!s.on) continue;
      for (const v of [...envRefs(s.http ?? ''), ...(s.bearerEnv ? [s.bearerEnv] : []), ...Object.values(s.env).flatMap(envRefs)]) need.add(v);
    }
  }
  return [...need].filter((v) => !process.env[v]).sort();
}

async function deepChecks(ctx, state, warn) {
  const names = globalSkills(ctx.repo).names;
  const tool = (cmd, args) => spawnSync(cmd, args, { cwd: ctx.home, encoding: 'utf8', timeout: 180000, shell: process.platform === 'win32' });
  if (state.agents.includes('opencode')) {
    const out = tool('opencode', ['debug', 'skill']).stdout ?? '';
    const at = out.search(/\[\s*\{/);
    let loaded = null;
    try {
      loaded = at === -1 ? null : new Set(JSON.parse(out.slice(at)).map((s) => s.name));
    } catch {
      loaded = null;
    }
    if (!loaded) warn('opencode debug skill gave no skill list — is opencode installed?');
    else if (names.some((n) => !loaded.has(n))) warn(`OpenCode does not load: ${names.filter((n) => !loaded.has(n)).join(', ')}`);
  }
  if (state.agents.includes('codex')) {
    const r = tool('codex', ['debug', 'prompt-input', 'doctor']);
    if (r.status !== 0) warn('codex debug prompt-input failed — is codex installed?');
    else if (names.some((n) => !r.stdout.includes(n))) warn(`Codex does not load: ${names.filter((n) => !r.stdout.includes(n)).join(', ')}`);
  }
  if (state.agents.includes('claude')) {
    const installed = readJson(join(ctx.home, '.claude', 'plugins', 'installed_plugins.json'));
    const have = new Set(Object.keys(installed?.plugins ?? installed ?? {}));
    for (const p of LSP_PLUGINS) if (!have.has(p)) warn(`Claude plugin is enabled but not installed: ${p} — run /plugin install ${p} in Claude Code`);
  }
  if (state.agents.includes('cursor')) await cursorRules(ctx, warn);
}

function cursorDb(ctx) {
  if (ctx.os === 'windows') return join(process.env.APPDATA ?? join(ctx.home, 'AppData', 'Roaming'), 'Cursor', 'User', 'globalStorage', 'state.vscdb');
  if (ctx.os === 'mac') return join(ctx.home, 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'state.vscdb');
  return join(ctx.home, '.config', 'Cursor', 'User', 'globalStorage', 'state.vscdb');
}

// Cursor keeps user rules in its settings database; read it, never write it.
async function cursorRules(ctx, warn) {
  const db = cursorDb(ctx);
  const rules = join(ctx.local, 'cursor-rules.md');
  if (!existsSync(db)) return warn(`Cursor settings database not found at ${db}`);
  let sqlite;
  try {
    sqlite = await import('node:sqlite');
  } catch {
    return warn('Cursor rules not checked: needs Node 22.5+ for node:sqlite');
  }
  let value = '';
  try {
    const conn = new sqlite.DatabaseSync(db, { readOnly: true });
    const row = conn.prepare("SELECT value FROM ItemTable WHERE key = 'aicontext.personalContext'").get();
    conn.close();
    value = row ? (typeof row.value === 'string' ? row.value : Buffer.from(row.value).toString('utf8')) : '';
  } catch (e) {
    return warn(`Cursor rules not checked: ${e.message}`);
  }
  if (!value.trim()) warn(`Cursor user rules are empty — paste ${rules} into Cursor Settings → Rules → User Rules`);
  else if (lf(value).trim() !== lf(readText(rules) ?? '').trim()) warn(`Cursor user rules differ from ${rules} — paste it again`);
}
