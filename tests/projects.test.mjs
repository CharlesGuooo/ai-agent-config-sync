import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdirSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fixtureRepo, tempDir, put } from './helpers.mjs';
import { makeContext, isLink, linkTarget, samePath, makeDirLink, removeLink } from '../lib/platform.mjs';
import { addSkills, removeSkills, projectKey, excludeText } from '../lib/projects.mjs';
import { runInstall } from '../lib/engine.mjs';
import { doctor } from '../lib/doctor.mjs';

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

test('two projects in one git repo keep each other\'s exclude lines', () => {
  const top = tempDir('top-');
  git('init', '-q', top);
  const a = join(top, 'a');
  const b = join(top, 'b');
  mkdirSync(a);
  mkdirSync(b);
  addSkills(ctx, { project: a, names: ['gamma'] });
  addSkills(ctx, { project: b, names: ['delta'] });
  const ex = () => readFileSync(join(top, '.git/info/exclude'), 'utf8');
  for (const l of ['/a/.claude/skills/gamma\n', '/a/.pi/skills/gamma\n', '/b/.claude/skills/delta\n', '/b/.pi/skills/delta\n']) assert.ok(ex().includes(l), l);
  assert.equal(git('-C', top, 'status', '--porcelain', '--untracked-files=all').stdout, '');
  removeSkills(ctx, { project: a, names: 'all' });
  assert.ok(!ex().includes('/a/') && ex().includes('/b/.claude/skills/delta\n'));
  removeSkills(ctx, { project: b, names: 'all' });
  assert.ok(!ex().includes('ai-agent-config-sync'));
});

test('a project reached through a directory link gets git\'s own paths in the exclude', () => {
  const top = tempDir('top-');
  git('init', '-q', top);
  const real = join(top, 'proj');
  mkdirSync(real);
  const via = join(tempDir('via-'), 'proj');
  makeDirLink(real, via);
  addSkills(ctx, { project: via, names: ['gamma'] });
  const ex = readFileSync(join(top, '.git/info/exclude'), 'utf8');
  assert.ok(ex.includes('/proj/.claude/skills/gamma\n') && !ex.includes('/../'), ex);
  assert.equal(git('-C', top, 'status', '--porcelain', '--untracked-files=all').stdout, '');
});

test('a skills folder linked into the repo is skipped, and nothing is written there', () => {
  const packSkills = join(repo, 'skills/project-packs/dev-project/skills');
  makeDirLink(packSkills, join(project, '.claude', 'skills'));
  const r = addSkills(ctx, { project, names: ['delta'] });
  assert.ok(!existsSync(join(packSkills, 'delta')));
  assert.ok(r.warnings.some((w) => w.includes(join(project, '.claude', 'skills')) && /into the repo/.test(w)));
  assert.ok(isLink(L('pi', 'delta')));
});

const update = () => runInstall(ctx, { agents: ['claude', 'pi'], packs: ['dev'] });

test('update relinks a project skill that moved in the repo and drops one that was deleted', () => {
  update();
  addSkills(ctx, { project, names: ['gamma', 'delta'] });
  renameSync(join(repo, 'skills/project-packs/dev-project/skills/gamma'), join(repo, 'skills/project-packs/dev-project/frontend/skills/gamma'));
  rmSync(join(repo, 'skills/project-packs/dev-project/frontend/skills/delta'), { recursive: true });
  const r = update();
  assert.ok(samePath(linkTarget(L('pi', 'gamma')), join(repo, 'skills/project-packs/dev-project/frontend/skills/gamma')));
  assert.ok(!existsSync(L('pi', 'delta')) && !isLink(L('pi', 'delta')));
  assert.ok(r.notes.some((n) => /delta: no longer in the repo/.test(n)));
  assert.deepEqual(Object.values(state().projects), [['gamma']]);
});

test('a project skill that became global is dropped from the project', () => {
  update();
  addSkills(ctx, { project, names: ['gamma'] });
  renameSync(join(repo, 'skills/project-packs/dev-project/skills/gamma'), join(repo, 'skills/global/gamma'));
  // The catalog needs gamma too, or checkRepo refuses the run.
  const catalog = JSON.parse(readFileSync(join(repo, 'skills/global/catalog.json'), 'utf8'));
  catalog.skills.gamma = { category: 'process', tagline: 'Gamma tagline' };
  writeFileSync(join(repo, 'skills/global/catalog.json'), JSON.stringify(catalog));
  const r = update();
  assert.ok(!isLink(L('claude', 'gamma')));
  assert.ok(r.notes.some((n) => /gamma: now a global skill/.test(n)));
});

test('uninstalling one agent removes only its project links, and the exclude block keeps the rest', () => {
  update();
  git('init', '-q', project);
  addSkills(ctx, { project, names: ['gamma'] });
  runInstall(ctx, { agents: ['pi'], packs: ['dev'], uninstall: true });
  assert.ok(!existsSync(L('pi', 'gamma')) && isLink(L('claude', 'gamma')));
  const ex = readFileSync(join(project, '.git/info/exclude'), 'utf8');
  assert.ok(ex.includes('/.claude/skills/gamma') && !ex.includes('/.pi/skills/gamma'));
});

test('a project folder that is gone is reported, not fatal, and remove all clears it', () => {
  update();
  addSkills(ctx, { project, names: ['gamma'] });
  rmSync(project, { recursive: true });
  assert.ok(update().warnings.some((w) => /project folder is gone/.test(w)));
  assert.equal(Object.keys(state().projects).length, 1);
  removeSkills(ctx, { project, names: 'all' });
  assert.deepEqual(state().projects, {});
});

test('doctor reports a project link that went missing', async () => {
  update();
  addSkills(ctx, { project, names: ['gamma'] });
  removeLink(L('pi', 'gamma'));
  const found = await doctor(ctx);
  assert.ok(found.some((f) => f.msg.includes('update would make') && f.msg.includes(L('pi', 'gamma'))));
});
