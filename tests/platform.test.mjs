import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tempDir } from './helpers.mjs';
import { osName, makeContext, isLink, linkTarget, samePath, inside, makeDirLink, removeLink, removeTree, isWorktree, slash } from '../lib/platform.mjs';

test('osName maps node platforms', () => {
  assert.equal(osName('win32'), 'windows');
  assert.equal(osName('darwin'), 'mac');
  assert.equal(osName('linux'), 'linux');
});

test('makeContext puts state in <repo>/.local unless told otherwise', () => {
  const ctx = makeContext({ repo: '/r', home: '/h', os: 'linux' });
  assert.ok(samePath(ctx.local, join('/r', '.local')));
  assert.ok(samePath(makeContext({ repo: '/r', home: '/h', local: '/x' }).local, '/x'));
});

test('a directory link reads through and removing it leaves the target', () => {
  const dir = tempDir();
  const target = join(dir, 'target');
  mkdirSync(target);
  writeFileSync(join(target, 'KEEP'), 'x');
  const link = join(dir, 'deep', 'link');
  makeDirLink(target, link);
  assert.ok(isLink(link));
  assert.ok(samePath(linkTarget(link), target));
  assert.equal(readFileSync(join(link, 'KEEP'), 'utf8'), 'x');
  removeLink(link);
  assert.ok(!isLink(link));
  assert.ok(existsSync(join(target, 'KEEP')));
});

test('removeTree deletes a real tree and refuses a link', () => {
  const dir = tempDir();
  mkdirSync(join(dir, 'real', 'sub'), { recursive: true });
  writeFileSync(join(dir, 'real', 'sub', 'f'), 'x');
  makeDirLink(join(dir, 'real'), join(dir, 'link'));
  assert.throws(() => removeTree(join(dir, 'link')), /refusing/);
  removeTree(join(dir, 'real', 'sub'));
  assert.ok(!existsSync(join(dir, 'real', 'sub')));
});

test('removeTree with a protected root refuses a path that resolves into it', () => {
  const dir = tempDir();
  const repo = join(dir, 'repo');
  mkdirSync(join(repo, 'skills', 'a'), { recursive: true });
  writeFileSync(join(repo, 'skills', 'a', 'SKILL.md'), 'x');
  makeDirLink(join(repo, 'skills'), join(dir, 'agent-skills'));
  const through = join(dir, 'agent-skills', 'a');
  assert.ok(!isLink(through));
  assert.throws(() => removeTree(through, repo), (e) => /resolves into/.test(e.message) && e.message.includes(through) && e.message.includes(repo));
  assert.ok(existsSync(join(repo, 'skills', 'a', 'SKILL.md')));
});

test('removeTree with a protected root refuses the root itself', () => {
  const repo = tempDir();
  writeFileSync(join(repo, 'f'), 'x');
  assert.throws(() => removeTree(repo, repo), /resolves into/);
  assert.ok(existsSync(join(repo, 'f')));
});

test('removeTree with a protected root refuses a parent of the root', () => {
  const dir = tempDir();
  const repo = join(dir, 'repo');
  mkdirSync(repo);
  writeFileSync(join(repo, 'f'), 'x');
  assert.throws(() => removeTree(dir, repo), /contains/);
  assert.ok(existsSync(join(repo, 'f')));
});

test('removeTree with a protected root still removes a real directory and a single file outside it', () => {
  const dir = tempDir();
  const repo = join(dir, 'repo');
  mkdirSync(repo);
  // A sibling whose name starts with the root's name is still outside the root.
  mkdirSync(join(dir, 'repo-old', 'sub'), { recursive: true });
  writeFileSync(join(dir, 'repo-old', 'sub', 'f'), 'x');
  writeFileSync(join(dir, 'single'), 'x');
  removeTree(join(dir, 'repo-old'), repo);
  removeTree(join(dir, 'single'), repo);
  assert.ok(!existsSync(join(dir, 'repo-old')));
  assert.ok(!existsSync(join(dir, 'single')));
  assert.ok(existsSync(repo));
});

test('removeTree with a protected root ignores a path that does not exist', () => {
  const dir = tempDir();
  const repo = join(dir, 'repo');
  mkdirSync(repo);
  assert.doesNotThrow(() => removeTree(join(dir, 'missing'), repo));
});

test('inside() is true only below the root', () => {
  const root = tempDir();
  assert.ok(inside(root, join(root, 'a', 'b')));
  assert.ok(!inside(root, root));
  assert.ok(!inside(root, `${root}-sibling`));
});

test('isWorktree tells a .git file from a .git directory', () => {
  const wt = tempDir();
  writeFileSync(join(wt, '.git'), 'gitdir: elsewhere');
  const main = tempDir();
  mkdirSync(join(main, '.git'));
  assert.ok(isWorktree(wt));
  assert.ok(!isWorktree(main));
});

test('slash turns backslashes into forward slashes', () => {
  assert.equal(slash('C:\\Users\\me'), 'C:/Users/me');
});
