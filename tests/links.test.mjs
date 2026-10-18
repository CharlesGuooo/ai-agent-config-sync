import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, renameSync, cpSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fixtureRepo, tempDir, newRun, emptyState, put } from './helpers.mjs';
import { makeContext, isLink, linkTarget, samePath, makeDirLink } from '../lib/platform.mjs';
import { syncLinks, pruneLinks, dirsEqual } from '../lib/links.mjs';
import { globalSkills, packSkillSets } from '../lib/skills.mjs';

function setup() {
  const repo = fixtureRepo();
  const home = tempDir();
  const ctx = makeContext({ repo, home });
  const dst = join(home, '.claude', 'skills');
  return { ctx, repo, dst, set: { ...globalSkills(repo), dst } };
}

test('globalSkills and packSkillSets list what the repo ships', () => {
  const { repo } = setup();
  assert.deepEqual(globalSkills(repo).names, ['alpha', 'beta']);
  const sets = packSkillSets(repo, ['dev']).map((s) => [s.pack, s.sub, s.names]);
  assert.deepEqual(sets.sort(), [['dev-project', '', ['gamma']], ['dev-project', 'frontend', ['delta']]]);
  assert.throws(() => packSkillSets(repo, ['nope']), /unknown pack/);
});

test('packSkillSets finds a skills folder nested two levels down and names its sub-path with slashes', () => {
  const { repo } = setup();
  put(repo, 'skills/project-packs/finance-project/advisory/compliance/skills/audit/SKILL.md', '---\nname: audit\n---\n');
  const sets = packSkillSets(repo, ['finance']);
  assert.deepEqual(sets.map((s) => [s.pack, s.sub, s.names]), [['finance-project', 'advisory/compliance', ['audit']]]);
  assert.ok(samePath(sets[0].src, join(repo, 'skills', 'project-packs', 'finance-project', 'advisory', 'compliance', 'skills')));
});

test('links every repo skill, then has nothing to do', () => {
  const { ctx, repo, dst, set } = setup();
  syncLinks(ctx, set, newRun());
  for (const n of ['alpha', 'beta']) assert.ok(samePath(linkTarget(join(dst, n)), join(repo, 'skills', 'global', n)));
  const again = newRun();
  syncLinks(ctx, set, again);
  assert.deepEqual(again.report.changes, []);
});

test('an identical real copy is replaced by a link', () => {
  const { ctx, repo, dst, set } = setup();
  cpSync(join(repo, 'skills', 'global', 'alpha'), join(dst, 'alpha'), { recursive: true });
  syncLinks(ctx, set, newRun());
  assert.ok(isLink(join(dst, 'alpha')));
});

test('a differing real copy is a conflict until resolved with repo', () => {
  const { ctx, repo, dst, set } = setup();
  cpSync(join(repo, 'skills', 'global', 'alpha'), join(dst, 'alpha'), { recursive: true });
  writeFileSync(join(dst, 'alpha', 'SKILL.md'), 'edited on this machine');
  const run = newRun();
  syncLinks(ctx, set, run);
  assert.deepEqual(run.report.conflicts.map((c) => c.id), [`link:${join(dst, 'alpha')}`]);
  assert.ok(!isLink(join(dst, 'alpha')));
  syncLinks(ctx, set, newRun({ resolutions: { all: 'repo' } }));
  assert.ok(isLink(join(dst, 'alpha')));
  assert.notEqual(readFileSync(join(repo, 'skills', 'global', 'alpha', 'SKILL.md'), 'utf8'), 'edited on this machine');
});

test('vendor entries stay; links to skills the repo dropped go', () => {
  const { ctx, repo, dst, set } = setup();
  mkdirSync(join(dst, 'vendor-skill'), { recursive: true });
  writeFileSync(join(dst, 'vendor-skill', 'SKILL.md'), 'vendor');
  syncLinks(ctx, set, newRun());
  syncLinks(ctx, { ...set, names: ['alpha'] }, newRun());
  assert.ok(!isLink(join(dst, 'beta')) && !existsSync(join(dst, 'beta')));
  assert.ok(existsSync(join(repo, 'skills', 'global', 'beta', 'SKILL.md')));
  assert.equal(readFileSync(join(dst, 'vendor-skill', 'SKILL.md'), 'utf8'), 'vendor');
});

test('a link pointing outside the repo is a conflict', () => {
  const { ctx, dst, set } = setup();
  makeDirLink(tempDir(), join(dst, 'alpha'));
  const run = newRun();
  syncLinks(ctx, set, run);
  assert.equal(run.report.conflicts.length, 1);
});

test('dry run reports and touches nothing', () => {
  const { ctx, dst, set } = setup();
  const run = newRun({ dryRun: true });
  syncLinks(ctx, set, run);
  assert.equal(run.report.changes.length, 2);
  assert.ok(!existsSync(dst));
});

test('dirsEqual compares file sets and bytes, ignoring __pycache__ but never .git or a link', () => {
  const a = tempDir();
  const b = tempDir();
  writeFileSync(join(a, 'x'), '1');
  writeFileSync(join(b, 'x'), '1');
  mkdirSync(join(b, '__pycache__'));
  writeFileSync(join(b, '__pycache__', 'y.pyc'), 'z');
  assert.ok(dirsEqual(a, b));
  writeFileSync(join(b, 'x'), '2');
  assert.ok(!dirsEqual(a, b));
  // A directory that is its own git clone is never the same as the repo's copy, whichever side it is on.
  writeFileSync(join(b, 'x'), '1');
  put(b, '.git/HEAD', 'ref: refs/heads/main\n');
  assert.ok(!dirsEqual(a, b));
  assert.ok(!dirsEqual(b, a));
  // Nor is one holding a link: its bytes are not compared and it would go with the copy. Not even equal to itself.
  const c = tempDir();
  writeFileSync(join(c, 'x'), '1');
  makeDirLink(tempDir(), join(c, 'link'));
  assert.ok(!dirsEqual(a, c));
  assert.ok(!dirsEqual(c, a));
  assert.ok(!dirsEqual(c, c));
  const d = tempDir();
  writeFileSync(join(d, 'x'), '1');
  writeFileSync(join(d, 'link'), 'a plain file where the other side has a link');
  assert.ok(!dirsEqual(d, c));
  assert.ok(!dirsEqual(c, d));
});

test('a skill directory that is its own git clone is never replaced on its own, even when its files match', () => {
  const { ctx, repo, dst, set } = setup();
  const path = join(dst, 'alpha');
  cpSync(join(repo, 'skills', 'global', 'alpha'), path, { recursive: true });
  put(path, '.git/HEAD', 'ref: refs/heads/main\n');
  const run = newRun();
  syncLinks(ctx, set, run);
  assert.deepEqual(run.report.conflicts.map((c) => c.id), [`link:${path}`]);
  assert.ok(!isLink(path));
  assert.ok(existsSync(join(path, '.git', 'HEAD')));
});

test('a link into the repo that points at another skill is relinked without asking', () => {
  const { ctx, repo, dst, set } = setup();
  makeDirLink(join(repo, 'skills', 'global', 'beta'), join(dst, 'alpha'));
  const was = linkTarget(join(dst, 'alpha'));
  const run = newRun();
  syncLinks(ctx, set, run);
  assert.deepEqual(run.report.conflicts, []);
  assert.deepEqual(run.report.changes, [`relink ${join(dst, 'alpha')} (was ${was})`, `link ${join(dst, 'beta')}`]);
  assert.ok(samePath(linkTarget(join(dst, 'alpha')), join(repo, 'skills', 'global', 'alpha')));
});

test('a dangling link outside the repo (say the clone moved) is relinked without asking', () => {
  const { ctx, repo, dst, set } = setup();
  const moved = tempDir();
  makeDirLink(moved, join(dst, 'alpha'));
  rmSync(moved, { recursive: true });
  assert.ok(isLink(join(dst, 'alpha')) && !existsSync(join(dst, 'alpha')));
  const was = linkTarget(join(dst, 'alpha'));
  const run = newRun();
  syncLinks(ctx, set, run);
  assert.deepEqual(run.report.conflicts, []);
  assert.deepEqual(run.report.changes, [`relink ${join(dst, 'alpha')} (was ${was})`, `link ${join(dst, 'beta')}`]);
  assert.ok(samePath(linkTarget(join(dst, 'alpha')), join(repo, 'skills', 'global', 'alpha')));
});

test('a link to an existing directory elsewhere is a conflict; a choice for its id relinks it and leaves the directory alone', () => {
  const { ctx, repo, dst, set } = setup();
  const mine = tempDir();
  writeFileSync(join(mine, 'MINE'), 'x');
  const path = join(dst, 'alpha');
  const id = `link:${path}`;
  makeDirLink(mine, path);
  const first = newRun();
  syncLinks(ctx, set, first);
  assert.deepEqual(first.report.conflicts.map((c) => c.id), [id]);
  assert.match(first.report.conflicts[0].msg, /links somewhere outside the repo/);
  assert.ok(first.report.conflicts[0].msg.includes(path));
  assert.ok(first.seen.has(id));
  assert.ok(samePath(linkTarget(path), mine));
  syncLinks(ctx, set, newRun({ resolutions: { [id]: 'repo' } }));
  assert.ok(samePath(linkTarget(path), join(repo, 'skills', 'global', 'alpha')));
  assert.equal(readFileSync(join(mine, 'MINE'), 'utf8'), 'x');
});

test('keeping a link to somewhere else pins it: later runs say nothing, "all" cannot lift the pin, its own id can', () => {
  const { ctx, repo, dst, set } = setup();
  const mine = tempDir();
  const path = join(dst, 'alpha');
  const id = `link:${path}`;
  makeDirLink(mine, path);
  const state = emptyState();
  const keep = newRun({ state, resolutions: { [id]: 'keep' } });
  keep.agent = 'claude';
  syncLinks(ctx, set, keep);
  assert.deepEqual(keep.report.conflicts, []);
  assert.equal(keep.report.notes.length, 1);
  assert.deepEqual(state.entries[id], { agent: 'claude', kind: 'link', hash: null, pinned: true });
  assert.ok(samePath(linkTarget(path), mine));

  const quiet = newRun({ state });
  syncLinks(ctx, set, quiet);
  assert.deepEqual(quiet.report, { changes: [], conflicts: [], warnings: [], notes: [] });
  assert.ok(quiet.seen.has(id));
  assert.ok(samePath(linkTarget(path), mine));

  syncLinks(ctx, set, newRun({ state, resolutions: { all: 'repo' } }));
  assert.ok(samePath(linkTarget(path), mine));
  assert.equal(state.entries[id].pinned, true);

  const was = linkTarget(path);
  const lift = newRun({ state, resolutions: { [id]: 'repo' } });
  syncLinks(ctx, set, lift);
  assert.deepEqual(lift.report.changes, [`relink ${path} (was ${was})`]);
  assert.ok(samePath(linkTarget(path), join(repo, 'skills', 'global', 'alpha')));
  assert.equal(state.entries[id], undefined);
});

test('a kept real directory stays pinned until it matches the repo again, then it is replaced by a link', () => {
  const { ctx, repo, dst, set } = setup();
  const path = join(dst, 'alpha');
  const id = `link:${path}`;
  const shipped = join(repo, 'skills', 'global', 'alpha');
  cpSync(shipped, path, { recursive: true });
  writeFileSync(join(path, 'SKILL.md'), 'edited on this machine');
  const state = emptyState();
  const keep = newRun({ state, resolutions: { all: 'keep' } });
  keep.agent = 'claude';
  syncLinks(ctx, set, keep);
  assert.deepEqual(keep.report.conflicts, []);
  assert.equal(keep.report.notes.length, 1);
  assert.deepEqual(state.entries[id], { agent: 'claude', kind: 'link', hash: null, pinned: true });

  const quiet = newRun({ state });
  syncLinks(ctx, set, quiet);
  assert.deepEqual(quiet.report, { changes: [], conflicts: [], warnings: [], notes: [] });
  assert.equal(readFileSync(join(path, 'SKILL.md'), 'utf8'), 'edited on this machine');

  // The machine copy is brought back in line with the repo: nothing of the user's is left to protect.
  writeFileSync(join(path, 'SKILL.md'), readFileSync(join(shipped, 'SKILL.md')));
  const before = structuredClone(state.entries);
  const dry = newRun({ state, dryRun: true });
  syncLinks(ctx, set, dry);
  assert.deepEqual(dry.report.changes, [`replace-copy ${path}`]);
  assert.ok(dry.seen.has(id));
  assert.deepEqual(state.entries, before);
  assert.ok(!isLink(path));

  const back = newRun({ state });
  syncLinks(ctx, set, back);
  assert.deepEqual(back.report.changes, [`replace-copy ${path}`]);
  assert.ok(isLink(path));
  assert.equal(state.entries[id], undefined);
});

test('keep for all does not stop an identical copy from being replaced', () => {
  const { ctx, repo, dst, set } = setup();
  cpSync(join(repo, 'skills', 'global', 'alpha'), join(dst, 'alpha'), { recursive: true });
  const state = emptyState();
  const run = newRun({ state, resolutions: { all: 'keep' } });
  syncLinks(ctx, set, run);
  assert.ok(isLink(join(dst, 'alpha')));
  assert.deepEqual(state.entries, {});
  assert.deepEqual(run.report.notes, []);
});

test('a pin is dropped when its path is empty again and the repo link goes in', () => {
  const { ctx, dst, set } = setup();
  const id = `link:${join(dst, 'alpha')}`;
  const state = emptyState();
  state.entries[id] = { agent: 'claude', kind: 'link', hash: null, pinned: true };
  syncLinks(ctx, set, newRun({ state }));
  assert.ok(isLink(join(dst, 'alpha')));
  assert.equal(state.entries[id], undefined);
});

test('a dry run notes a keep but records nothing and replaces nothing', () => {
  const { ctx, repo, dst, set } = setup();
  const path = join(dst, 'alpha');
  cpSync(join(repo, 'skills', 'global', 'alpha'), path, { recursive: true });
  writeFileSync(join(path, 'SKILL.md'), 'edited on this machine');
  const state = emptyState();
  const run = newRun({ state, dryRun: true, resolutions: { all: 'keep' } });
  syncLinks(ctx, set, run);
  assert.equal(run.report.notes.length, 1);
  assert.deepEqual(state.entries, {});
  assert.ok(!isLink(path));
});

test('a plain file where a skill belongs is a conflict, not a crash', () => {
  const { ctx, repo, dst, set } = setup();
  const path = put(dst, 'alpha', 'not a directory');
  const run = newRun();
  assert.doesNotThrow(() => syncLinks(ctx, set, run));
  assert.deepEqual(run.report.conflicts.map((c) => c.id), [`link:${path}`]);
  assert.match(run.report.conflicts[0].msg, /a file is in the way of a skill link/);
  assert.ok(run.report.conflicts[0].msg.includes(path));
  assert.equal(readFileSync(path, 'utf8'), 'not a directory');
  syncLinks(ctx, set, newRun({ resolutions: { all: 'repo' } }));
  assert.ok(isLink(path));
  assert.ok(existsSync(join(repo, 'skills', 'global', 'alpha', 'SKILL.md')));
});

test('a skills folder that is itself a link into the repo stops the run before anything is created or reported', () => {
  for (const inRepo of [['skills', 'global'], ['skills'], []]) {
    for (const dryRun of [false, true]) {
      const { ctx, repo, dst, set } = setup();
      const folder = join(repo, ...inRepo);
      const before = readdirSync(folder);
      makeDirLink(folder, dst);
      const run = newRun({ dryRun });
      assert.throws(() => syncLinks(ctx, set, run), (e) => /resolves into the repo/.test(e.message) && e.message.includes(dst) && e.message.includes(repo) && /remove that folder link first/.test(e.message));
      assert.deepEqual(run.report.changes, []);
      assert.deepEqual(readdirSync(folder), before);
      for (const n of ['alpha', 'beta']) assert.ok(existsSync(join(repo, 'skills', 'global', n, 'SKILL.md')));
    }
  }
});

test('the tree-delete guard stays as the backstop: a skill path that is the repo itself is refused', () => {
  // The up-front check only knows folders at or below the repo. Here the skills folder is the repo's parent and a
  // skill is named like the repo, so replacing its "identical copy" would delete the repo.
  const base = tempDir();
  const repo = join(base, 'repo');
  cpSync(fixtureRepo(), repo, { recursive: true });
  const src = tempDir();
  cpSync(repo, join(src, 'repo'), { recursive: true });
  const ctx = makeContext({ repo, home: tempDir() });
  assert.throws(() => syncLinks(ctx, { src, names: ['repo'], dst: base }, newRun()), /resolves into/);
  assert.ok(existsSync(join(repo, 'skills', 'global', 'alpha', 'SKILL.md')));
});

test('a skills folder that is a link to somewhere outside the repo is fine, even right beside it', () => {
  const { ctx, repo, dst, set } = setup();
  // The name starts with the repo's path but the folder is not inside it.
  const beside = `${repo}-skills`;
  mkdirSync(beside);
  makeDirLink(beside, dst);
  syncLinks(ctx, set, newRun());
  for (const n of ['alpha', 'beta']) assert.ok(samePath(linkTarget(join(beside, n)), join(repo, 'skills', 'global', n)));
});

test('working links the user made by hand into the repo survive a sync', () => {
  const { ctx, repo, dst, set } = setup();
  const gamma = join(repo, 'skills', 'project-packs', 'dev-project', 'skills', 'gamma');
  const alpha = join(repo, 'skills', 'global', 'alpha');
  makeDirLink(gamma, join(dst, 'gamma'));
  makeDirLink(alpha, join(dst, 'my-alpha'));
  const first = newRun();
  syncLinks(ctx, set, first);
  assert.deepEqual(first.report.changes, [`link ${join(dst, 'alpha')}`, `link ${join(dst, 'beta')}`]);
  for (const n of ['alpha', 'beta']) assert.ok(first.seen.has(`link:${join(dst, n)}`));
  const again = newRun();
  syncLinks(ctx, set, again);
  assert.deepEqual(again.report.changes, []);
  assert.ok(samePath(linkTarget(join(dst, 'gamma')), gamma));
  assert.ok(samePath(linkTarget(join(dst, 'my-alpha')), alpha));
});

test('two sets sharing one skills folder do not prune the links of the other', () => {
  const { ctx, repo, dst, set } = setup();
  const pack = { ...packSkillSets(repo, ['dev']).find((s) => s.sub === ''), dst };
  syncLinks(ctx, set, newRun());
  syncLinks(ctx, pack, newRun());
  const again = newRun();
  syncLinks(ctx, set, again);
  syncLinks(ctx, pack, again);
  assert.deepEqual(again.report.changes, []);
  for (const n of ['alpha', 'beta', 'gamma']) assert.ok(isLink(join(dst, n)));
});

test('a dangling link into the repo under a shipped name is only relinked, in a dry run too', () => {
  const { ctx, repo, dst, set } = setup();
  const gone = join(repo, 'skills', 'global', 'gone');
  mkdirSync(gone);
  makeDirLink(gone, join(dst, 'alpha'));
  rmSync(gone, { recursive: true });
  assert.ok(isLink(join(dst, 'alpha')) && !existsSync(join(dst, 'alpha')));
  const was = linkTarget(join(dst, 'alpha'));
  const expected = [`relink ${join(dst, 'alpha')} (was ${was})`, `link ${join(dst, 'beta')}`];
  const dry = newRun({ dryRun: true });
  syncLinks(ctx, set, dry);
  assert.deepEqual(dry.report.changes, expected);
  assert.ok(isLink(join(dst, 'alpha')) && !existsSync(join(dst, 'alpha')));
  const real = newRun();
  syncLinks(ctx, set, real);
  assert.deepEqual(real.report.changes, expected);
  assert.ok(samePath(linkTarget(join(dst, 'alpha')), join(repo, 'skills', 'global', 'alpha')));
});

test('a dangling link into the repo under a name nothing ships any more is removed', () => {
  const { ctx, repo, dst, set } = setup();
  const gone = join(repo, 'skills', 'global', 'gone');
  mkdirSync(gone);
  makeDirLink(gone, join(dst, 'old'));
  rmSync(gone, { recursive: true });
  const run = newRun();
  syncLinks(ctx, set, run);
  assert.deepEqual(run.report.changes, [`link ${join(dst, 'alpha')}`, `link ${join(dst, 'beta')}`, `unlink ${join(dst, 'old')}`]);
  assert.ok(!isLink(join(dst, 'old')));
});

test('links to places outside the repo are never pruned, whatever their name', () => {
  const { ctx, dst, set } = setup();
  const mine = tempDir();
  const vanished = tempDir();
  makeDirLink(mine, join(dst, 'other'));
  makeDirLink(vanished, join(dst, 'stale'));
  rmSync(vanished, { recursive: true });
  const run = newRun();
  syncLinks(ctx, set, run);
  assert.deepEqual(run.report.changes, [`link ${join(dst, 'alpha')}`, `link ${join(dst, 'beta')}`]);
  // The rule for uninstalling removes every link into the repo and still leaves those two.
  const everything = newRun();
  pruneLinks(ctx, dst, () => false, everything);
  assert.deepEqual(everything.report.changes.sort(), [`unlink ${join(dst, 'alpha')}`, `unlink ${join(dst, 'beta')}`]);
  assert.ok(samePath(linkTarget(join(dst, 'other')), mine));
  assert.ok(isLink(join(dst, 'stale')));
});

test('a copy holding a link is not identical to the repo copy, so it is not replaced on its own', () => {
  const { ctx, repo, dst, set } = setup();
  const path = join(dst, 'alpha');
  const outside = tempDir();
  writeFileSync(join(outside, 'KEEP'), 'x');
  cpSync(join(repo, 'skills', 'global', 'alpha'), path, { recursive: true });
  makeDirLink(outside, join(path, 'extra'));
  const run = newRun();
  syncLinks(ctx, set, run);
  assert.deepEqual(run.report.conflicts.map((c) => c.id), [`link:${path}`]);
  assert.ok(!isLink(path));
  assert.ok(isLink(join(path, 'extra')));
  assert.equal(readFileSync(join(outside, 'KEEP'), 'utf8'), 'x');
});

test('a pin on a path that is now linked as it should be is dropped; a dry run only looks', () => {
  const { ctx, dst, set } = setup();
  syncLinks(ctx, set, newRun());
  const id = `link:${join(dst, 'alpha')}`;
  const state = emptyState();
  state.entries[id] = { agent: 'claude', kind: 'link', hash: null, pinned: true };
  const before = structuredClone(state.entries);
  const dry = newRun({ state, dryRun: true });
  syncLinks(ctx, set, dry);
  assert.ok(dry.seen.has(id));
  assert.deepEqual(state.entries, before);
  const run = newRun({ state });
  syncLinks(ctx, set, run);
  assert.ok(run.seen.has(id));
  assert.equal(state.entries[id], undefined);
  assert.deepEqual(run.report, { changes: [], conflicts: [], warnings: [], notes: [] });
});

test('a skill the repo renamed only in case keeps its link', { skip: process.platform !== 'win32' }, () => {
  const { ctx, repo, dst } = setup();
  const skills = join(repo, 'skills', 'global');
  syncLinks(ctx, { ...globalSkills(repo), dst }, newRun());
  renameSync(join(skills, 'alpha'), join(skills, 'Alpha'));
  const set = { ...globalSkills(repo), dst };
  assert.deepEqual(set.names, ['Alpha', 'beta']);
  const run = newRun();
  syncLinks(ctx, set, run);
  assert.deepEqual(run.report.changes, []);
  assert.ok(isLink(join(dst, 'alpha')));
});
