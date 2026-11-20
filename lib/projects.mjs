// `add` / `remove`: links chosen pack skills into a real project for every installed agent, and keeps them out of
// the project's git status. Only skill links and the managed block in .git/info/exclude are ever written, and only
// a link into the repo is ever removed or replaced: a real folder, a file or somebody else's link is left alone,
// even a copy identical to the repo's.
import { existsSync, realpathSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
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

// Where p really is, folder links on the way followed; a folder that is gone is placed by its nearest existing parent.
function realPath(p) {
  p = abs(p);
  if (existsSync(p)) return abs(realpathSync(p));
  const up = dirname(p);
  return up === p ? p : join(realPath(up), basename(p));
}

// A project is kept under where it really is, so one reached through a folder link is one entry and has all its links
// excluded together; the spelling already in the state wins, so a path in another case is not a second entry either.
export function projectKey(state, project) {
  const real = realPath(project);
  return Object.keys(state.projects ?? {}).find((k) => samePath(k, real)) ?? real;
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
// Git that does not run at all is worth a warning; a folder outside any git repository is not.
function gitExclude(project, run) {
  const r = spawnSync('git', ['-C', project, 'rev-parse', '--show-prefix', '--git-path', 'info/exclude'], { encoding: 'utf8' });
  if (r.error) run.warn(`git not found: links in ${project} are not excluded from git`);
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
function ours(ctx, p) {
  const target = linkTarget(p);
  return Boolean(target) && inside(ctx.repo, target);
}

// Brings the project's links in line with `names` for `agents` and returns the names that are linked somewhere.
// `previous` is what was recorded before, so what dropped out of `names` can be unlinked.
// A link of ours must never show in the project's git status nor go unrecorded, even when something fails halfway:
// its exclude line is written before any link is made and dropped only once the link is gone, and a link or unlink
// that fails is a warning that leaves that place as it is.
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
  // The places that are to hold a link of ours (place -> name), the links to make there, and our links to remove.
  const want = new Map();
  const make = [];
  const drop = [];
  for (const agent of agents) {
    const dir = dirOf(agent);
    if (!usable(dir)) continue;
    for (const name of keep) {
      const p = join(dir, name);
      const target = index.get(name).dir;
      const current = linkTarget(p);
      if (current && samePath(current, target)) {
        want.set(p, name);
      } else if (current && inside(ctx.repo, current) && previous.includes(name)) {
        // Ours from an earlier add, and the skill has moved in the repo. For a name added only now, a link into the
        // repo that points elsewhere was made by somebody else.
        make.push({ p, target, was: current });
        want.set(p, name);
      } else if (isLink(p) || existsSync(p)) {
        run.warn(`left as it is (not a link to this skill in the repo): ${p}`);
      } else {
        make.push({ p, target });
        want.set(p, name);
      }
    }
    for (const name of previous) if (!keep.includes(name)) drop.push({ p: join(dir, name), name });
  }
  for (const agent of removeAgents) {
    const dir = dirOf(agent);
    if (usable(dir)) for (const name of previous) drop.push({ p: join(dir, name), name });
  }

  // Runs fn and reports it (a dry run only reports); false when it failed.
  const attempt = (what, fn) => {
    if (!run.dryRun) {
      try {
        fn();
      } catch (e) {
        run.warn(`could not ${what}: ${e.message}`);
        return false;
      }
    }
    run.change(what);
    return true;
  };
  for (const { p, name } of drop) {
    if (ours(ctx, p) && !attempt(`unlink ${p}`, () => removeLink(p))) want.set(p, name);
  }

  const ex = gitExclude(project, run);
  // Writes the exclude lines for the places in `want`; returns the error when the file cannot be read or written.
  const exclude = () => {
    const [prefix, file] = ex;
    const line = (p) => '/' + escapeGit(prefix + relative(project, p).split(/[\\/]/).join('/'));
    // The block is shared by every project in this git repo: only the lines under this project's own skills
    // folders (all agents, installed or not) are ours to replace.
    const mine = Object.keys(ADAPTERS).map((agent) => line(dirOf(agent)) + '/');
    try {
      const old = readText(file);
      const others = blockLines(old).filter((l) => !mine.some((m) => l.startsWith(m)));
      const next = excludeText(old, [...new Set([...others, ...[...want.keys()].map(line)])].sort());
      if (next !== old) {
        if (!run.dryRun) writeText(file, next);
        run.change(`update ${file}`);
      }
      return null;
    } catch (e) {
      return e;
    }
  };
  let err = ex && exclude();
  if (err) {
    run.warn(`no new link in ${project}: could not update ${ex[1]} to keep the links out of git: ${err.message}`);
    // Names recorded earlier stay recorded, so the next run tries again.
    for (const { p } of make) if (!ours(ctx, p)) want.delete(p);
    return [...new Set([...want.values(), ...keep.filter((n) => previous.includes(n))])].sort();
  }
  const excluded = want.size;
  for (const { p, target, was } of make) {
    const made = was
      ? attempt(`relink ${p} (was ${was})`, () => {
        removeLink(p);
        makeDirLink(target, p);
      })
      : attempt(`link ${p}`, () => makeDirLink(target, p));
    if (!made && !ours(ctx, p)) want.delete(p);
  }
  // The line of a link that could not be made would hide whatever the user puts there later.
  if (ex && want.size < excluded && (err = exclude())) run.warn(`could not update ${ex[1]}: ${err.message}`);

  const result = [...new Set(want.values())].sort();
  // With every agent uninstalled nothing is linked, and the names stay recorded for a later install.
  if (agents.length) {
    for (const name of keep) {
      if (previous.includes(name) && !result.includes(name)) {
        run.note(`${name}: no place in ${project} could be linked; no longer tracked — clear the way and add it again`);
      }
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
  if (!existsSync(project) || !statSync(project).isDirectory()) throw new Error(`no such folder: ${project}`);

  const key = projectKey(state, project);
  const previous = state.projects[key] ?? [];
  const run = makeRun({ state, dryRun });
  const kept = syncProject(ctx, { project: key, names: [...new Set([...previous, ...names])].sort(), previous, agents: state.agents }, run);
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
  const kept = existsSync(key) ? syncProject(ctx, { project: key, names: left, previous, agents: state.agents }, run) : left;
  if (!dryRun) {
    record(state, key, kept);
    saveState(ctx.local, state);
  }
  return run.report;
}
