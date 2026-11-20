// `add` / `remove`: links chosen pack skills into a real project for every installed agent, and keeps them out of
// the project's git status. Only skill links and the managed block in .git/info/exclude are ever written, and only
// a link into the repo is ever removed or replaced: a real folder, a file or somebody else's link is left alone,
// even a copy identical to the repo's.
import { existsSync, realpathSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { abs, makeDirLink, removeLink, isLink, linkTarget, samePath, inside, resolvesInto } from './platform.mjs';
import { globalSkills, packSkillSets, PACKS } from './skills.mjs';
import { loadState, saveState } from './state.mjs';
import { makeRun } from './run.mjs';
import { readText, writeText } from './util.mjs';
import { ADAPTERS } from './agents/index.mjs';

const BEGIN = '# >>> ai-agent-config-sync (managed: node harness.mjs add/remove)';
const END = '# <<< ai-agent-config-sync';

// Every skill the repo ships, global ones and the skills of all packs: name -> where it lives.
export function skillIndex(repo) {
  const index = new Map();
  for (const set of packSkillSets(repo, Object.keys(PACKS))) {
    for (const name of set.names) if (!index.has(name)) index.set(name, { dir: join(set.src, name), global: false });
  }
  const g = globalSkills(repo);
  for (const name of g.names) index.set(name, { dir: join(g.src, name), global: true });
  return index;
}

// The spelling already in the state if there is one, so a path in another case does not become a second entry.
export function projectKey(state, project) {
  return Object.keys(state.projects ?? {}).find((k) => samePath(k, project)) ?? abs(project);
}

// New text for info/exclude: the managed block swapped for `lines` (dropped when there are none), the rest untouched.
export function excludeText(text, lines) {
  if (text === null && !lines.length) return null;
  const block = lines.length ? `${BEGIN}\n${lines.join('\n')}\n${END}\n` : '';
  const from = (text ?? '').indexOf(BEGIN);
  const endAt = from < 0 ? -1 : text.indexOf(END, from);
  if (from >= 0 && endAt >= 0) {
    const after = text.indexOf('\n', endAt);
    return text.slice(0, from) + block + (after < 0 ? '' : text.slice(after + 1));
  }
  const base = text ?? '';
  return block ? base + (base && !base.endsWith('\n') ? '\n' : '') + block : base;
}

// [the project's path inside the work tree as git sees it, info/exclude file] of the git repository holding the
// project, or null when there is none. Git's view, not the typed path: the project may be reached through a link.
// A relative info/exclude is relative to where git really is, so it is resolved from the project's real path.
function gitExclude(project) {
  const r = spawnSync('git', ['-C', project, 'rev-parse', '--show-prefix', '--git-path', 'info/exclude'], { encoding: 'utf8' });
  if (r.error || r.status !== 0) return null;
  const [prefix, file] = r.stdout.split(/\r?\n/);
  return file ? [prefix, resolve(realpathSync(project), file)] : null;
}

function blockLines(text) {
  const from = (text ?? '').indexOf(BEGIN);
  const to = from < 0 ? -1 : text.indexOf(END, from);
  return to < 0 ? [] : text.slice(from + BEGIN.length, to).split(/\r?\n/).filter(Boolean);
}

const escapeGit = (s) => s.replace(/[\\*?[]/g, '\\$&');

// A link into the repo is ours to remove, wherever it points; anything else is not.
function unlinkOurs(ctx, p, run) {
  const target = linkTarget(p);
  if (!target || !inside(ctx.repo, target)) return;
  run.change(`unlink ${p}`);
  if (!run.dryRun) removeLink(p);
}

// Brings the project's links in line with `names` for `agents` and returns the names that are linked somewhere.
// `previous` is what was recorded before, so what dropped out of `names` can be unlinked.
export function syncProject(ctx, { project, names, previous, agents, removeAgents = [] }, run) {
  if (!existsSync(project)) {
    run.warn(`project folder is gone: ${project} — run: node harness.mjs remove all "${project}"`);
    return previous;
  }
  const index = skillIndex(ctx.repo);
  const dirOf = (agent) => ADAPTERS[agent].plan(ctx, [], () => {}).skills.pack(project);
  // A folder link made by hand (say .claude/skills into the repo) would make links appear inside the repo.
  const usable = (dir) => {
    if (!resolvesInto(ctx.repo, dir)) return true;
    run.warn(`skipped, this skills folder leads into the repo: ${dir}`);
    return false;
  };
  const keep = [];
  for (const name of names) {
    const entry = index.get(name);
    if (!entry) run.note(`${name}: no longer in the repo; its links were removed`);
    else if (entry.global) run.note(`${name}: now a global skill; its project links were removed`);
    else keep.push(name);
  }
  const linked = new Map();
  for (const agent of agents) {
    const dir = dirOf(agent);
    if (!usable(dir)) continue;
    for (const name of keep) {
      const p = join(dir, name);
      const target = index.get(name).dir;
      const current = linkTarget(p);
      if (current && samePath(current, target)) {
        linked.set(p, name);
      } else if (current && inside(ctx.repo, current)) {
        run.change(`relink ${p} (was ${current})`);
        if (!run.dryRun) {
          removeLink(p);
          makeDirLink(target, p);
        }
        linked.set(p, name);
      } else if (isLink(p) || existsSync(p)) {
        run.warn(`left as it is (not a link into the repo): ${p}`);
      } else {
        run.change(`link ${p}`);
        if (!run.dryRun) makeDirLink(target, p);
        linked.set(p, name);
      }
    }
    for (const name of previous) if (!keep.includes(name)) unlinkOurs(ctx, join(dir, name), run);
  }
  for (const agent of removeAgents) {
    const dir = dirOf(agent);
    if (usable(dir)) for (const name of previous) unlinkOurs(ctx, join(dir, name), run);
  }

  const result = [...new Set(linked.values())].sort();
  for (const name of keep) {
    if (previous.includes(name) && !result.includes(name)) {
      run.note(`${name}: no place in ${project} could be linked; no longer tracked — clear the way and add it again`);
    }
  }
  const ex = gitExclude(project);
  if (ex) {
    const [prefix, file] = ex;
    const line = (p) => '/' + escapeGit(prefix + relative(project, p).split(/[\\/]/).join('/'));
    // The block is shared by every project in this git repo: only the lines under this project's own skills
    // folders (all agents, installed or not) are ours to replace.
    const mine = Object.keys(ADAPTERS).map((agent) => line(dirOf(agent)) + '/');
    const old = readText(file);
    const others = blockLines(old).filter((l) => !mine.some((m) => l.startsWith(m)));
    const next = excludeText(old, [...new Set([...others, ...[...linked.keys()].map(line)])].sort());
    if (next !== old) {
      run.change(`update ${file}`);
      if (!run.dryRun) writeText(file, next);
    }
  }
  return result;
}

function refuseProject(ctx, project) {
  const bad = samePath(project, ctx.home)
    || Object.values(PACKS).some((pack) => {
      const dir = join(ctx.home, pack);
      return samePath(project, dir) || inside(dir, project);
    })
    || resolvesInto(ctx.repo, project);
  if (bad) throw new Error(`not a project folder: ${project}`);
}

function record(state, key, names) {
  if (names.length) state.projects[key] = names;
  else delete state.projects[key];
}

export function addSkills(ctx, { project, names, dryRun = false }) {
  const state = loadState(ctx.local);
  if (!state.agents.length) throw new Error('nothing installed yet — run: node harness.mjs install --agents <list>');
  project = abs(project);
  refuseProject(ctx, project);
  const index = skillIndex(ctx.repo);
  for (const n of names) {
    const entry = index.get(n);
    if (!entry) throw new Error(`unknown skill "${n}" — the pack index is in HARNESS.md`);
    if (entry.global) throw new Error(`"${n}" is a global skill: every session has it already`);
  }
  if (!existsSync(project)) throw new Error(`no such folder: ${project}`);

  const key = projectKey(state, project);
  const previous = state.projects[key] ?? [];
  const run = makeRun({ state, dryRun });
  const kept = syncProject(ctx, { project, names: [...new Set([...previous, ...names])].sort(), previous, agents: state.agents }, run);
  if (!dryRun) {
    record(state, key, kept);
    saveState(ctx.local, state);
  }
  return run.report;
}

export function removeSkills(ctx, { project, names, dryRun = false }) {
  const state = loadState(ctx.local);
  project = abs(project);
  const key = projectKey(state, project);
  const previous = state.projects[key];
  if (!previous) throw new Error(`no skills were added to ${project}`);
  const gone = names === 'all' ? previous : names;
  for (const n of gone) if (!previous.includes(n)) throw new Error(`"${n}" was not added to ${project}`);
  const left = previous.filter((n) => !gone.includes(n));

  const run = makeRun({ state, dryRun });
  // A folder that is gone has no links left to remove; only the record goes.
  const kept = existsSync(project) ? syncProject(ctx, { project, names: left, previous, agents: state.agents }, run) : left;
  if (!dryRun) {
    record(state, key, kept);
    saveState(ctx.local, state);
  }
  return run.report;
}
