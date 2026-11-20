import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fixtureRepo, tempDir, put } from './helpers.mjs';
import { makeContext, isLink, linkTarget, samePath, makeDirLink } from '../lib/platform.mjs';
import { addSkills, removeSkills, projectKey, excludeText } from '../lib/projects.mjs';

const git = (...args) => spawnSync('git', args, { encoding: 'utf8' });
let repo, home, project, ctx;
const state = () => JSON.parse(readFileSync(join(repo, '.local/state.json'), 'utf8'));
const L = (agent, name) => join(project, agent === 'claude' ? '.claude' : '.pi', 'skills', name);

beforeEach(() => {
  repo = fixtureRepo();
  home = tempDir('harness-home-');
  project = tempDir('harness-project-');
  ctx = makeContext({ repo, home });
  mkdirSync(join(repo, '.local'), { recursive: true });
  writeFileSync(join(repo, '.local/state.json'), JSON.stringify({ version: 1, agents: ['claude', 'pi'], packs: ['dev'], entries: {} }));
});

test('add links a pack skill into every installed agent and records it', () => {
  addSkills(ctx, { project, names: ['gamma', 'delta'] });
  assert.ok(samePath(linkTarget(L('claude', 'gamma')), join(repo, 'skills/project-packs/dev-project/skills/gamma')));
  assert.ok(samePath(linkTarget(L('pi', 'delta')), join(repo, 'skills/project-packs/dev-project/frontend/skills/delta')));
  assert.deepEqual(state().projects[projectKey(state(), project)], ['delta', 'gamma']);
  assert.deepEqual(addSkills(ctx, { project, names: ['gamma'] }).changes, []);
});

test('add refuses an unknown name, a global skill and a missing folder, and writes nothing', () => {
  assert.throws(() => addSkills(ctx, { project, names: ['gamma', 'nope'] }), /unknown skill "nope"/);
  assert.throws(() => addSkills(ctx, { project, names: ['alpha'] }), /"alpha" is a global skill/);
  assert.throws(() => addSkills(ctx, { project: join(project, 'missing'), names: ['gamma'] }), /no such folder/);
  assert.ok(!existsSync(join(project, '.claude')));
  assert.deepEqual(state().projects ?? {}, {});
});

test('a real folder or a foreign link with the same name is left alone and reported', () => {
  // Even a copy identical to the repo's is not replaced.
  put(project, '.claude/skills/gamma/SKILL.md', readFileSync(join(repo, 'skills/project-packs/dev-project/skills/gamma/SKILL.md')));
  const elsewhere = tempDir('elsewhere-');
  makeDirLink(elsewhere, L('pi', 'gamma'));
  const r = addSkills(ctx, { project, names: ['gamma'] });
  assert.ok(!isLink(L('claude', 'gamma')) && existsSync(join(L('claude', 'gamma'), 'SKILL.md')));
  assert.ok(samePath(linkTarget(L('pi', 'gamma')), elsewhere));
  assert.equal(r.warnings.filter((w) => /left as it is/.test(w)).length, 2);
  assert.deepEqual(state().projects ?? {}, {});
});

test('a name linked in at least one place is recorded even when another place is skipped', () => {
  put(project, '.claude/skills/gamma/SKILL.md', 'mine\n');
  addSkills(ctx, { project, names: ['gamma'] });
  assert.ok(isLink(L('pi', 'gamma')));
  assert.deepEqual(Object.values(state().projects), [['gamma']]);
});

test('remove unlinks only the named skills and never a real folder', () => {
  put(project, '.claude/skills/own/SKILL.md', 'mine\n');
  addSkills(ctx, { project, names: ['gamma', 'delta'] });
  removeSkills(ctx, { project, names: ['gamma'] });
  assert.ok(!existsSync(L('claude', 'gamma')) && !existsSync(L('pi', 'gamma')));
  assert.ok(isLink(L('pi', 'delta')) && existsSync(join(L('claude', 'own'), 'SKILL.md')));
  assert.throws(() => removeSkills(ctx, { project, names: ['gamma'] }), /"gamma" was not added/);
  removeSkills(ctx, { project, names: 'all' });
  assert.ok(!existsSync(L('pi', 'delta')));
  assert.deepEqual(state().projects, {});
  assert.throws(() => removeSkills(ctx, { project, names: 'all' }), /no skills were added/);
});

test('a git project gets each link excluded, and the block goes with the last link', () => {
  git('init', '-q', project);
  put(project, '.git/info/exclude', '# mine\n*.tmp\n');
  addSkills(ctx, { project, names: ['gamma'] });
  const ex = readFileSync(join(project, '.git/info/exclude'), 'utf8');
  assert.match(ex, /^# mine\n\*\.tmp\n/);
  assert.ok(ex.includes('/.claude/skills/gamma\n') && ex.includes('/.pi/skills/gamma\n'));
  assert.equal(git('-C', project, 'status', '--porcelain').stdout, '');
  removeSkills(ctx, { project, names: 'all' });
  assert.equal(readFileSync(join(project, '.git/info/exclude'), 'utf8'), '# mine\n*.tmp\n');
});

test('a project in a sub-folder of a git repo, with spaces and brackets in its path', () => {
  const top = tempDir('top-');
  git('init', '-q', top);
  const sub = join(top, '我的 proj [v2]');
  mkdirSync(sub);
  addSkills(ctx, { project: sub, names: ['gamma'] });
  assert.ok(readFileSync(join(top, '.git/info/exclude'), 'utf8').includes('/我的 proj \\[v2]/.claude/skills/gamma\n'));
  assert.equal(git('-C', top, 'status', '--porcelain', '--untracked-files=all').stdout, '');
});

test('the home, a home pack folder and a folder inside the repo are refused', () => {
  mkdirSync(join(home, 'dev-project', 'x'), { recursive: true });
  mkdirSync(join(repo, 'inner'));
  for (const p of [home, join(home, 'dev-project'), join(home, 'dev-project', 'x'), join(repo, 'inner')]) {
    assert.throws(() => addSkills(ctx, { project: p, names: ['gamma'] }), /not a project folder/);
  }
});

test('a dry run reports the links and writes nothing', () => {
  const r = addSkills(ctx, { project, names: ['gamma'], dryRun: true });
  assert.ok(r.changes.some((c) => c.startsWith('link ') && c.endsWith('gamma')));
  assert.ok(!existsSync(join(project, '.claude')));
  assert.deepEqual(state().projects ?? {}, {});
});

test('the same project spelled in another case is one entry', { skip: process.platform === 'linux' }, () => {
  addSkills(ctx, { project: project.toUpperCase(), names: ['gamma'] });
  addSkills(ctx, { project: project.toLowerCase(), names: ['delta'] });
  assert.deepEqual(Object.values(state().projects), [['delta', 'gamma']]);
});

test('excludeText replaces only its own block', () => {
  assert.equal(excludeText(null, []), null);
  const a = excludeText('x\n', ['/a']);
  assert.match(a, /^x\n# >>> ai-agent-config-sync .*\n\/a\n# <<< ai-agent-config-sync\n$/);
  assert.equal(excludeText(a, ['/b']).includes('/a'), false);
  assert.equal(excludeText(a, []), 'x\n');
});
