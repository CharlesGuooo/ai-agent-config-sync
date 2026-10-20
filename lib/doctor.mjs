// Read-only health check. Its core is a dry-run update — pending changes are
// drift, conflicts are conflicts — plus the checks an update cannot make.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { readText, readJson, lf } from './util.mjs';
import { loadState } from './state.mjs';
import { runInstall, buildPlan, packRoot } from './engine.mjs';
import { globalSkills, packSkillSets, PACKS } from './skills.mjs';
import { catalogErrors, PLACEHOLDERS } from './prompt.mjs';
import { loadCatalog, catalogProblems, serversFor, envRefs } from './mcp.mjs';
import { samePath, inside, linkTarget } from './platform.mjs';
import { LSP_PLUGINS } from './agents/claude.mjs';
import { loadSources, sourcesProblems } from './upstream.mjs';
import { routingProblems } from './routing.mjs';

// Repo self-check (also `node harness.mjs check`).
export function repoProblems(ctx) {
  let mcp;
  try {
    mcp = catalogProblems(loadCatalog(ctx.repo));
  } catch (e) {
    // An MCP catalog that does not even parse is one more problem to list.
    mcp = [e.message];
  }
  let sources;
  try {
    sources = sourcesProblems(ctx.repo, loadSources(ctx.repo));
  } catch (e) {
    sources = [e.message];
  }
  const out = [...catalogErrors(ctx.repo), ...mcp, ...sources, ...routingProblems(ctx.repo)];
  const core = readText(join(ctx.repo, 'prompt', 'core.md')) ?? '';
  for (const k of PLACEHOLDERS) if (!core.includes(`{{${k}}}`)) out.push(`prompt/core.md is missing {{${k}}}`);
  // Rendering refuses these, so every install would stop on one.
  for (const k of new Set([...core.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))) if (!PLACEHOLDERS.includes(k)) out.push(`prompt/core.md has an unknown placeholder {{${k}}}`);
  const gen = join(ctx.repo, 'scripts', 'gen-harness.mjs');
  if (existsSync(gen)) {
    const harness = spawnSync(process.execPath, [gen, '--check'], { encoding: 'utf8' });
    if (harness.status !== 0) {
      // Only "OUT OF DATE" means regenerating helps; anything else (no HARNESS.md, no markers, a crash) is its own problem.
      const first = (harness.stderr ?? '').split(/\r?\n/).find((l) => l.trim())?.trim() ?? '';
      if (first.startsWith('OUT OF DATE')) out.push('HARNESS.md is out of date — run: node scripts/gen-harness.mjs');
      else out.push(`scripts/gen-harness.mjs --check failed: ${first || harness.error?.message || `exit status ${harness.status}`}`);
    }
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
  // The dry run already warns about a variable a server it renders needs right now.
  const warned = (v) => (report?.warnings ?? []).some((w) => w.endsWith(`environment variable ${v} is not set`));
  try {
    for (const dir of orphanSkillDirs(ctx, state)) warn(`no plan covers this skill directory (left from a removed pack or sub-pack?): ${dir}`);
    for (const v of missingEnv(ctx, state).filter((v) => !warned(v))) warn(`environment variable ${v} is not set, but a server that is on by default needs it`);
  } catch (e) {
    // These build the same plans the dry run does, so what stops them stopped it too and is listed already.
    if (report) fail(e.message);
  }
  if (!deep) return found;
  // The agents read the real home whatever ctx.home says, so against any other home they would check the wrong files.
  if (!samePath(ctx.home, homedir())) warn('deep checks skipped: they run the real agents and only make sense for the real home');
  else await deepChecks(ctx, state, warn);
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
  // Read-only: without this, git status would refresh the index and could race with the user's own git.
  const git = (...args) => spawnSync('git', ['--no-optional-locks', '-C', ctx.repo, ...args], { encoding: 'utf8' });
  const branch = git('rev-parse', '--abbrev-ref', 'HEAD').stdout?.trim();
  if (branch && branch !== 'master') warn(`this checkout is on "${branch}" — agents link into it, so that branch is what they run`);
  // Line by line: a status line starts with a space (" M" is a change not staged), so only line ends are trimmed.
  const dirty = (git('status', '--porcelain', '--', 'skills', 'agents', 'prompt', 'mcp', 'scripts/hooks').stdout ?? '').split('\n').map((l) => l.trimEnd()).filter(Boolean);
  if (dirty.length) warn(`uncommitted changes in shipped content (edits made through the links land here):\n    ${dirty.join('\n    ')}`);
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
    if (depth > 3) return;
    for (const e of entries(dir)) {
      if (!e.isDirectory() || SKIP_DIRS.has(e.name)) continue;
      const p = join(dir, e.name);
      if (!AGENT_DIRS.includes(e.name)) {
        walk(p, depth + 1);
        continue;
      }
      const skills = join(p, 'skills');
      if (!planned.some((q) => samePath(q, skills)) && leftovers(ctx, skills)) out.push(skills);
    }
  };
  for (const pack of Object.values(PACKS)) walk(join(ctx.home, pack), 0);
  return out;
}

// A folder that cannot be read is passed over; it is no reason to stop the check.
function entries(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

// What the harness leaves in a skills folder: links into the repo, and links whose target is gone. A project's own
// skills (real folders, or links to anywhere else) are the user's and never count.
function leftovers(ctx, dir) {
  return entries(dir).some((e) => {
    const target = linkTarget(join(dir, e.name));
    return target !== null && (!existsSync(target) || inside(ctx.repo, target));
  });
}

// Names only: a value never leaves the environment.
function missingEnv(ctx, state) {
  const catalog = loadCatalog(ctx.repo);
  const need = new Set();
  for (const name of state.agents) {
    for (const s of serversFor(catalog, name, ctx.os)) {
      if (!s.on) continue;
      for (const v of [...envRefs(s.http ?? ''), ...(s.bearerEnv ? [s.bearerEnv] : []), ...Object.values(s.env).flatMap(envRefs)]) need.add(v);
    }
  }
  const env = ctx.env ?? process.env;
  return [...need].filter((v) => !env[v]).sort();
}

// Of `names`, the skills `opencode debug skill` did not list, or null when its output holds no list. The list is a JSON
// array that may follow log lines (or trail some), so it is read from a line that starts with "[" to the last "]".
export function opencodeNotLoaded(out, names) {
  for (const m of out.matchAll(/^\[/gm)) {
    let list;
    try {
      list = JSON.parse(out.slice(m.index, out.lastIndexOf(']') + 1));
    } catch {
      continue;
    }
    if (!Array.isArray(list)) continue;
    const loaded = new Set(list.map((s) => s?.name));
    return names.filter((n) => !loaded.has(n));
  }
  return null;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Of `names`, the skills missing from the "- <name>:" lines in the <skills_instructions> part of what
// `codex debug prompt-input` prints: a JSON list of messages whose content parts hold the prompt text. Only that part
// says what Codex loaded: the rest of the prompt holds our AGENTS.md, which names every skill either way. Null when the
// output is not that JSON.
export function codexNotLoaded(out, names) {
  let text;
  try {
    text = JSON.parse(out).flatMap((m) => m.content ?? []).map((c) => c.text ?? '').join('\n');
  } catch {
    return null;
  }
  const section = /<skills_instructions>([\s\S]*?)<\/skills_instructions>/.exec(text)?.[1] ?? '';
  return names.filter((n) => !new RegExp(`^[ \\t]*- ${escapeRe(n)}:`, 'm').test(section));
}

// The LSP plugins the harness enables that Claude Code has not installed (installed_plugins.json is
// { version, plugins: { "<name>@<marketplace>": [...] } }). A plugin the user kept as it is is theirs to decide.
export function missingLspPlugins(installed, entries) {
  const have = new Set(Object.keys(installed?.plugins ?? installed ?? {}));
  return LSP_PLUGINS.filter((p) => !have.has(p) && !entries[`claude:plugin:${p}`]?.pinned);
}

async function deepChecks(ctx, state, warn) {
  const names = globalSkills(ctx.repo).names;
  // One command line through the shell, which finds the npm .cmd shims on Windows; the commands are constants.
  const tool = (line) => spawnSync(line, { cwd: ctx.home, encoding: 'utf8', timeout: 180000, shell: true });
  const checks = {
    opencode() {
      const missing = opencodeNotLoaded(tool('opencode debug skill').stdout ?? '', names);
      if (!missing) warn('opencode debug skill gave no skill list — is opencode installed?');
      else if (missing.length) warn(`OpenCode does not load: ${missing.join(', ')}`);
    },
    codex() {
      const r = tool('codex debug prompt-input doctor');
      if (r.status !== 0) return warn('codex debug prompt-input failed — is codex installed?');
      const missing = codexNotLoaded(r.stdout ?? '', names);
      if (!missing) warn('codex debug prompt-input gave no readable output');
      else if (missing.length) warn(`Codex does not load: ${missing.join(', ')}`);
    },
    claude() {
      const installed = readJson(join(ctx.home, '.claude', 'plugins', 'installed_plugins.json'));
      for (const p of missingLspPlugins(installed, state.entries)) warn(`Claude plugin is enabled but not installed: ${p} — run /plugin install ${p} in Claude Code`);
    },
    cursor: () => cursorRules(ctx, warn),
  };
  // One agent's check failing (a tool that hangs, a file that does not parse) leaves the others' findings standing.
  for (const name of state.agents) {
    try {
      await checks[name]?.();
    } catch (e) {
      warn(`deep check for ${name} failed: ${e.message}`);
    }
  }
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
    // node:sqlite exists from 22.5 but needs --experimental-sqlite until 22.13 (23.4 on the 23 line).
    return warn('Cursor rules not checked: needs Node 22.13+ for node:sqlite');
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
