// Removes what the v1 sync scripts (scripts/sync.ps1 / sync.sh) left behind.
// Every rule matches v1 output only, so it does nothing on a fresh machine and is
// safe on every update, and nothing the user made is deleted (v1 cleanup keeps no
// backups). A file that cannot be read or is not exactly what v1 wrote is left alone.
// Delete this file once no machine has v1 leftovers.
import { existsSync, readdirSync, rmdirSync, lstatSync } from 'node:fs';
import { join } from 'node:path';
import { readText, parseJson, writeText, isObj, lf } from './util.mjs';
import { removeTree, isLink } from './platform.mjs';
import { dirsEqual } from './links.mjs';
import { isV1Prompt } from './managed.mjs';
import { removeHookGroups } from './toml.mjs';

const V1_HOOK = /[\\/]\.agent-hooks[\\/](guard|format)\.mjs/;

// The files v1 copied from mcp/opt-in into ~/MCP-Templates (the folder is gone from the repo).
const V1_TEMPLATES = ['README.md', ...['cloudflare', 'deploy', 'everything', 'fullstack', 'ios-simulator', 'magic', 'mobile', 'railway', 'revenuecat', 'supabase', 'vercel', 'xcodebuildmcp', 'zai'].map((n) => `${n}.mcp.json`)];

// v1 mirrored skills/global wholesale; these are the descriptions its two data files carried.
const V1_CATALOG = 'Curated catalog of global skills: the single source for the generated skill tables in each agent\'s instruction file. The generator (scripts/gen-skill-table.mjs) reconciles this against the actual skills/global/*/ directories and fails if they disagree, so a new skill cannot silently drift out of the tables.';
const V1_RULES = 'Global skill activation rules for Claude Code. Global rules should cover process discipline and routing only. Domain-specific guidance belongs in local project skill packs.';

// First lines of the skills/global/README.md versions v1 copied into agent skill dirs (from git history).
const V1_SKILLS_README = ['# Skills'];

const V1_TOML_COMMENT = '# Shared safety guard + defensive formatter (scripts installed at ~/.agent-hooks).';
// The comment block v1 copied from agents/codex/config.toml; its second line has the hooks path filled in.
const V1_TOML_BLOCK = [
  /^# Shared safety guard \+ defensive formatter \(same scripts as the other agents\)\.$/,
  /^# .*[\\/]\.agent-hooks is replaced with the absolute ~\/\.agent-hooks path by sync after$/,
  /^# this file is copied\. Codex uses the same PreToolUse\/PostToolUse schema as$/,
  /^# Claude's hooks\.json, so guard\.mjs \/ format\.mjs are reused verbatim\.$/,
];

// v1 wrote UTF-8 text and valid JSON only, so a file that cannot be read, decoded or parsed is not v1 output:
// it is skipped silently (a warning would repeat on every run of a machine that never ran v1).
function read(path) {
  try {
    return readText(path);
  } catch {
    return null;
  }
}

function readJsonSafe(path) {
  const text = read(path);
  if (text === null) return null;
  try {
    return parseJson(text, path);
  } catch {
    return null;
  }
}

// removeTree refuses links and anything that resolves into the repo, so a hand-made link
// can never turn a v1 cleanup into deleting the repo's own files; that is a warning, not a stop.
function rm(path, ctx, run, label = 'remove-v1') {
  if (isLink(path)) {
    run.warn(`${path} is a link, left alone`);
    return;
  }
  if (!existsSync(path)) return;
  if (run.dryRun) {
    run.change(`${label} ${path}`);
    return;
  }
  try {
    removeTree(path, ctx.repo);
  } catch (e) {
    run.warn(`left ${path}: ${e.message}`);
    return;
  }
  run.change(`${label} ${path}`);
}

// A real, non-empty directory whose entries are all among `names`.
function only(dir, names, run) {
  let st;
  let entries;
  try {
    st = lstatSync(dir);
    entries = readdirSync(dir);
  } catch {
    return false;
  }
  const match = entries.length > 0 && entries.every((n) => names.includes(n));
  // A link is never followed for deleting; it is reported only when what it leads to would have matched.
  if (st.isSymbolicLink() && match) run.warn(`${dir} is a link, left alone`);
  return match && !st.isSymbolicLink();
}

function v1Prompt(path, ctx, run) {
  const text = read(path);
  if (text !== null && isV1Prompt(text)) rm(path, ctx, run);
}

// v1 copied these two files verbatim, so a file whose first line differs is the user's own.
const firstLine = (text) => lf(text).split('\n').find((l) => l.trim() !== '');

function v1Copy(path, repoFile, ctx, run) {
  const mine = read(path);
  const ours = read(repoFile);
  if (mine !== null && ours !== null && firstLine(mine) === firstLine(ours)) rm(path, ctx, run);
}

// A data file counts as v1's only when it parses and carries v1's description.
function v1Data(path, description, run) {
  const obj = readJsonSafe(path);
  return isObj(obj) && obj.description === description;
}

// Keeps the file's line ending, like jsonfile.mjs.
function editJson(file, run, edit) {
  const text = read(file);
  if (text === null) return;
  const obj = readJsonSafe(file);
  if (!isObj(obj) || !edit(obj)) return;
  run.change(`remove-v1 entries in ${file}`);
  if (run.dryRun) return;
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  writeText(file, JSON.stringify(obj, null, 2).replace(/\n/g, eol) + eol);
}

// Takes v1's hooks out of each group and drops a group only when nothing else is left in it,
// so a hook the user added to one of v1's groups survives.
function dropV1Hooks(obj) {
  if (!isObj(obj.hooks)) return false;
  let dirty = false;
  for (const [event, groups] of Object.entries(obj.hooks)) {
    if (!Array.isArray(groups)) continue;
    const kept = [];
    for (const g of groups) {
      if (!isObj(g) || !Array.isArray(g.hooks)) {
        kept.push(g);
        continue;
      }
      const rest = g.hooks.filter((h) => !(isObj(h) && V1_HOOK.test(String(h.command ?? ''))));
      if (rest.length === g.hooks.length) {
        kept.push(g);
        continue;
      }
      dirty = true;
      if (rest.length) kept.push({ ...g, hooks: rest });
    }
    if (kept.length === groups.length && kept.every((g, i) => g === groups[i])) continue;
    if (kept.length) obj.hooks[event] = kept;
    else delete obj.hooks[event];
  }
  return dirty;
}

// Copies v1 put directly in the home directory.
export function cleanHome(ctx, run) {
  const h = ctx.home;
  v1Copy(join(h, 'HARNESS.md'), join(ctx.repo, 'HARNESS.md'), ctx, run);
  v1Copy(join(h, 'PLAYBOOK.md'), join(ctx.repo, 'PLAYBOOK.md'), ctx, run);
  if (only(join(h, '.agent-hooks'), ['guard.mjs', 'format.mjs'], run)) rm(join(h, '.agent-hooks'), ctx, run);
  cleanTemplates(ctx, join(h, 'MCP-Templates'), run);
  v1Prompt(join(h, 'AGENTS.md'), ctx, run);
}

// Only the files v1 shipped; the folder goes when nothing else is in it.
function cleanTemplates(ctx, dir, run) {
  let st;
  let entries;
  try {
    st = lstatSync(dir);
    entries = readdirSync(dir);
  } catch {
    return;
  }
  const mine = entries.filter((n) => V1_TEMPLATES.includes(n));
  if (!mine.length) return;
  if (st.isSymbolicLink()) {
    run.warn(`${dir} is a link, left alone`);
    return;
  }
  if (mine.length === entries.length) {
    rm(dir, ctx, run);
    return;
  }
  for (const n of mine) rm(join(dir, n), ctx, run);
  run.note(`kept ${dir}: it still holds ${entries.filter((n) => !mine.includes(n)).join(', ')}`);
}

// v1 mirrored skills/global wholesale, so its two data files and its README sit in every agent's skill dir.
export function cleanSkillDir(ctx, dir, run) {
  if (existsSync(join(dir, 'catalog.json')) && v1Data(join(dir, 'catalog.json'), V1_CATALOG, run)) rm(join(dir, 'catalog.json'), ctx, run);
  if (existsSync(join(dir, 'skill-rules.json')) && v1Data(join(dir, 'skill-rules.json'), V1_RULES, run)) rm(join(dir, 'skill-rules.json'), ctx, run);
  const readme = read(join(dir, 'README.md'));
  if (readme !== null && V1_SKILLS_README.includes(firstLine(readme))) rm(join(dir, 'README.md'), ctx, run);
}

// Drops v1's comment above its hook groups: the single line, or the four-line block, and only
// when a v1 hook group starts directly under it. Every other byte stays.
function dropV1Comment(text) {
  const lines = text.split(/(?<=\n)/);
  const bare = (l) => l.replace(/\r?\n$/, '');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    let len = 0;
    if (bare(lines[i]) === V1_TOML_COMMENT) len = 1;
    else if (V1_TOML_BLOCK.every((re, k) => i + k < lines.length && re.test(bare(lines[i + k])))) len = V1_TOML_BLOCK.length;
    const next = lines[i + len];
    if (len && next !== undefined && bare(next).startsWith('[[hooks.') && V1_HOOK.test(lines.slice(i + len, i + len + 6).join(''))) {
      i += len - 1;
      continue;
    }
    out.push(lines[i]);
  }
  return out.join('');
}

function cleanCodexConfig(file, run) {
  const text = read(file);
  if (text === null || !text.includes('.agent-hooks')) return;
  let next;
  try {
    const stripped = dropV1Comment(text);
    next = removeHookGroups(stripped, V1_HOOK);
    if (next === stripped) next = text;
  } catch (e) {
    run.warn(`could not read the v1 hooks in ${file}: ${e.message}`);
    return;
  }
  if (next === text) return;
  run.change(`remove-v1 hooks in ${file}`);
  if (!run.dryRun) writeText(file, next);
}

// v1 mirrored skills/global into ~/.opencode/skills, so the skills named in its catalog.json are v1 copies;
// anything else in the directory is the user's. A copy that no longer matches the repo is labelled.
function cleanOpencodeSkills(ctx, dir, run) {
  const catalog = join(dir, 'catalog.json');
  if (!existsSync(catalog)) return;
  const c = readJsonSafe(catalog);
  if (!isObj(c) || c.description !== V1_CATALOG) return;
  if (isLink(dir)) {
    run.warn(`${dir} is a link, left alone`);
    return;
  }
  if (!isObj(c.skills)) {
    run.warn(`could not read the v1 skill list in ${catalog}, left ${dir} alone`);
    return;
  }
  for (const name of Object.keys(c.skills)) {
    if (name === '' || name === '.' || name === '..' || /[/\\]/.test(name)) continue;
    const path = join(dir, name);
    if (!existsSync(path) || isLink(path)) continue;
    if (existsSync(join(path, '.git'))) {
      run.note(`kept ${path}: it is a git clone`);
      continue;
    }
    const mirror = join(ctx.repo, 'skills', 'global', name);
    if (!existsSync(mirror)) rm(path, ctx, run, 'remove-v1 (the repo no longer ships it)');
    else rm(path, ctx, run, dirsEqual(path, mirror) ? 'remove-v1' : 'remove-v1 (differs from the repo\'s copy)');
  }
  rm(catalog, ctx, run);
  if (existsSync(join(dir, 'skill-rules.json')) && v1Data(join(dir, 'skill-rules.json'), V1_RULES, run)) rm(join(dir, 'skill-rules.json'), ctx, run);
  if (run.dryRun) return;
  const left = readdirSync(dir);
  if (!left.length) rmdirSync(dir);
  else run.note(`kept ${dir}: it still holds ${left.join(', ')}`);
}

// Removes the command files that are exactly the repo's; the folder goes when nothing else is in it.
function cleanCommands(ctx, dir, src, ours, run) {
  let st;
  let entries;
  try {
    st = lstatSync(dir);
    entries = readdirSync(dir);
  } catch {
    return;
  }
  const same = entries.filter((f) => {
    if (!ours.includes(f)) return false;
    const t = read(join(dir, f));
    const o = read(join(src, f));
    return t !== null && o !== null && lf(t) === lf(o);
  });
  if (!same.length) return;
  if (st.isSymbolicLink()) {
    run.warn(`${dir} is a link, left alone`);
    return;
  }
  if (same.length === entries.length) {
    rm(dir, ctx, run);
    return;
  }
  for (const f of same) rm(join(dir, f), ctx, run);
}

export function cleanAgent(ctx, agent, catalogNames, run) {
  const h = ctx.home;
  if (agent === 'claude') {
    editJson(join(h, '.claude', 'settings.json'), run, (obj) => {
      let dirty = dropV1Hooks(obj);
      // v1 also merged mcpServers into settings.json, where Claude Code never reads them.
      if (isObj(obj.mcpServers) && Object.keys(obj.mcpServers).length && Object.keys(obj.mcpServers).every((n) => catalogNames.includes(n))) {
        delete obj.mcpServers;
        dirty = true;
      }
      return dirty;
    });
  }
  if (agent === 'codex') {
    const profiles = join(h, '.codex', 'profiles');
    if (only(profiles, ['development.toml', 'full.toml', 'minimal.toml', 'switch.ps1', 'switch.sh'], run)) rm(profiles, ctx, run);
    cleanCodexConfig(join(h, '.codex', 'config.toml'), run);
  }
  if (agent === 'cursor') {
    v1Prompt(join(h, '.cursor', 'global-rules.md'), ctx, run);
    v1Prompt(join(h, '.cursor', 'rules', 'global-rules.md'), ctx, run);
    editJson(join(h, '.cursor', 'mcp.json'), run, (obj) => {
      let dirty = false;
      for (const [name, v] of Object.entries(isObj(obj.mcpServers) ? obj.mcpServers : {})) {
        // An entry v2 manages is not a v1 leftover, whatever it looks like.
        if (catalogNames.includes(name) && v?.enabled === false && !run.state.entries[`cursor:mcp:${name}`]) {
          delete obj.mcpServers[name];
          dirty = true;
        }
      }
      return dirty;
    });
  }
  if (agent === 'opencode') {
    const old = join(h, '.opencode');
    v1Prompt(join(old, 'AGENTS.md'), ctx, run);
    const cfgPath = join(old, 'opencode.json');
    const cfg = readJsonSafe(cfgPath);
    // v1 wrote exactly the repo's file: lsp: true and the catalog's servers. Anything else in it is the user's.
    if (isObj(cfg) && Object.keys(cfg).every((k) => ['$schema', 'lsp', 'mcp'].includes(k))
      && (cfg.lsp === undefined || cfg.lsp === true)
      && isObj(cfg.mcp) && Object.keys(cfg.mcp).length > 0 && Object.keys(cfg.mcp).every((n) => catalogNames.includes(n))) rm(cfgPath, ctx, run);
    cleanOpencodeSkills(ctx, join(old, 'skills'), run);
    const src = join(ctx.repo, 'agents', 'opencode', 'commands');
    const ours = existsSync(src) ? readdirSync(src) : [];
    cleanCommands(ctx, join(old, 'command'), src, ours, run);
    // v2 writes commands/ (OpenCode's documented name); v1 wrote command/.
    cleanCommands(ctx, join(h, '.config', 'opencode', 'command'), src, ours, run);
  }
}
