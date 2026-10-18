import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync, readFileSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { fixtureRepo, tempDir, newRun } from './helpers.mjs';
import { makeContext, isLink, linkTarget, samePath, makeDirLink } from '../lib/platform.mjs';
import { syncLinks, dirsEqual } from '../lib/links.mjs';
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

test('dirsEqual compares file sets and bytes, ignoring __pycache__', () => {
  const a = tempDir();
  const b = tempDir();
  writeFileSync(join(a, 'x'), '1');
  writeFileSync(join(b, 'x'), '1');
  mkdirSync(join(b, '__pycache__'));
  writeFileSync(join(b, '__pycache__', 'y.pyc'), 'z');
  assert.ok(dirsEqual(a, b));
  writeFileSync(join(b, 'x'), '2');
  assert.ok(!dirsEqual(a, b));
});
