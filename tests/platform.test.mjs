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
