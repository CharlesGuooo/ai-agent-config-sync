// Removes what the v1 sync scripts (scripts/sync.ps1 / sync.sh) left behind.
// Every rule matches v1 output only, so it does nothing on a fresh machine and is
// safe on every update. Delete this file once no machine has v1 leftovers.
import { existsSync, readdirSync, rmdirSync } from 'node:fs';
import { join } from 'node:path';
import { readText, readJson, writeText, isObj, lf } from './util.mjs';
import { removeTree, isLink } from './platform.mjs';
import { dirsEqual } from './links.mjs';
import { isV1Prompt } from './managed.mjs';
import { removeHookGroups } from './toml.mjs';

const V1_HOOK = /[\\/]\.agent-hooks[\\/](guard|format)\.mjs/;
const V1_TOML_COMMENT = '# Shared safety guard + defensive formatter (scripts installed at ~/.agent-hooks).';

// removeTree refuses links and anything that resolves into the repo, so a hand-made link
// can never turn a v1 cleanup into deleting the repo's own files.
function rm(path, ctx, run, label = 'remove-v1') {
  if (!existsSync(path)) return;
  run.change(`${label} ${path}`);
  if (run.dryRun) return;
  removeTree(path, ctx.repo);
}

const only = (dir, names) => existsSync(dir) && readdirSync(dir).every((n) => names.includes(n));

function safeJson(p) {
  try {
    return readJson(p);
  } catch {
    return null;
  }
}

function v1Prompt(path, ctx, run) {
  const text = readText(path);
  if (text !== null && isV1Prompt(text)) rm(path, ctx, run);
}

// v1 copied these two files verbatim, so a file whose first line differs is the user's own.
const firstLine = (text) => lf(text).split('\n').find((l) => l.trim() !== '');

function v1Copy(path, repoFile, ctx, run) {
  const mine = readText(path);
  const ours = readText(repoFile);
  if (mine !== null && ours !== null && firstLine(mine) === firstLine(ours)) rm(path, ctx, run);
}

// Keeps the file's line ending, like jsonfile.mjs.
function editJson(file, run, edit) {
  let text;
  let obj;
  try {
    text = readText(file);
    obj = text === null ? null : JSON.parse(text);
  } catch {
    return;
  }
  if (!isObj(obj) || !edit(obj)) return;
  run.change(`remove-v1 entries in ${file}`);
  if (run.dryRun) return;
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  writeText(file, JSON.stringify(obj, null, 2).replace(/\n/g, eol) + eol);
}

function dropV1Hooks(obj) {
  if (!isObj(obj.hooks)) return false;
  let dirty = false;
  for (const [event, groups] of Object.entries(obj.hooks)) {
    if (!Array.isArray(groups)) continue;
    const kept = groups.filter((g) => !(g.hooks ?? []).some((h) => V1_HOOK.test(h.command ?? '')));
    if (kept.length === groups.length) continue;
    dirty = true;
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
  if (only(join(h, '.agent-hooks'), ['guard.mjs', 'format.mjs'])) rm(join(h, '.agent-hooks'), ctx, run);
  const templates = join(h, 'MCP-Templates');
  if (existsSync(templates) && readdirSync(templates).every((n) => n.endsWith('.json') || n === 'README.md')) rm(templates, ctx, run);
  v1Prompt(join(h, 'AGENTS.md'), ctx, run);
}

// v1 mirrored skills/global wholesale, so its two data files sit in every agent's skill dir.
export function cleanSkillDir(ctx, dir, run) {
  rm(join(dir, 'catalog.json'), ctx, run);
  rm(join(dir, 'skill-rules.json'), ctx, run);
}

// Drops the v1 comment line (whole line only), leaving every other byte as it was.
function dropV1Comment(text) {
  return text.split(/(?<=\n)/).filter((l) => l.replace(/\r?\n$/, '') !== V1_TOML_COMMENT).join('');
}

function cleanCodexConfig(file, run) {
  const text = readText(file);
  if (text === null) return;
  let next;
  try {
    next = dropV1Comment(removeHookGroups(text, V1_HOOK));
  } catch (e) {
    run.warn(`could not read the v1 hooks in ${file}: ${e.message}`);
    return;
  }
  if (next === text) return;
  run.change(`remove-v1 hooks in ${file}`);
  if (!run.dryRun) writeText(file, next);
}

// v1 mirrored skills/global into ~/.opencode/skills, so the skills named in its catalog.json are v1 copies; anything
// else in the directory is the user's. A copy that no longer matches the repo is labelled, since nothing is backed up.
function cleanOpencodeSkills(ctx, dir, run) {
  const catalog = join(dir, 'catalog.json');
  if (!existsSync(catalog)) return;
  let names;
  try {
    const c = readJson(catalog);
    if (!isObj(c) || !isObj(c.skills)) throw new Error('no skills table');
    names = Object.keys(c.skills);
  } catch (e) {
    run.warn(`could not read the v1 skill list in ${catalog}, left ${dir} alone: ${e.message}`);
    return;
  }
  for (const name of names) {
    if (/[/\\]/.test(name) || name === '.' || name === '..') continue;
    const path = join(dir, name);
    if (!existsSync(path) || isLink(path)) continue;
    const mirror = join(ctx.repo, 'skills', 'global', name);
    const same = existsSync(mirror) && dirsEqual(path, mirror);
    rm(path, ctx, run, same ? 'remove-v1' : 'remove-v1 (differs from the repo)');
  }
  rm(catalog, ctx, run);
  rm(join(dir, 'skill-rules.json'), ctx, run);
  if (run.dryRun) return;
  const left = readdirSync(dir);
  if (!left.length) rmdirSync(dir);
  else run.note(`kept ${dir}: it still holds ${left.join(', ')}`);
}

export function cleanAgent(ctx, agent, catalogNames, run) {
  const h = ctx.home;
  if (agent === 'claude') {
    editJson(join(h, '.claude', 'settings.json'), run, (obj) => {
      let dirty = dropV1Hooks(obj);
      // v1 also merged mcpServers into settings.json, where Claude Code never reads them.
      if (isObj(obj.mcpServers) && Object.keys(obj.mcpServers).every((n) => catalogNames.includes(n))) {
        delete obj.mcpServers;
        dirty = true;
      }
      return dirty;
    });
  }
  if (agent === 'codex') {
    const profiles = join(h, '.codex', 'profiles');
    if (only(profiles, ['development.toml', 'full.toml', 'minimal.toml', 'switch.ps1', 'switch.sh'])) rm(profiles, ctx, run);
    cleanCodexConfig(join(h, '.codex', 'config.toml'), run);
  }
  if (agent === 'cursor') {
    v1Prompt(join(h, '.cursor', 'global-rules.md'), ctx, run);
    v1Prompt(join(h, '.cursor', 'rules', 'global-rules.md'), ctx, run);
    editJson(join(h, '.cursor', 'mcp.json'), run, (obj) => {
      let dirty = false;
      for (const [name, v] of Object.entries(isObj(obj.mcpServers) ? obj.mcpServers : {})) {
        if (catalogNames.includes(name) && v?.enabled === false) {
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
    const cfg = safeJson(join(old, 'opencode.json'));
    if (isObj(cfg) && Object.keys(cfg).every((k) => ['$schema', 'lsp', 'mcp'].includes(k))) rm(join(old, 'opencode.json'), ctx, run);
    cleanOpencodeSkills(ctx, join(old, 'skills'), run);
    const src = join(ctx.repo, 'agents', 'opencode', 'commands');
    const ours = existsSync(src) ? readdirSync(src) : [];
    if (only(join(old, 'command'), ours)) rm(join(old, 'command'), ctx, run);
    // v2 writes commands/ (OpenCode's documented name); v1 wrote command/.
    const singular = join(h, '.config', 'opencode', 'command');
    for (const f of ours) {
      const t = readText(join(singular, f));
      if (t !== null && lf(t) === lf(readText(join(src, f)))) rm(join(singular, f), ctx, run);
    }
    if (!run.dryRun && existsSync(singular) && !readdirSync(singular).length) rmdirSync(singular);
  }
}
