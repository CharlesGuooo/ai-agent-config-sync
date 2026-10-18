import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, parse } from 'node:path';
import { tempDir, put } from './helpers.mjs';
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

test('removeLink refuses a real directory, even an empty one', () => {
  const dir = tempDir();
  mkdirSync(join(dir, 'empty'));
  assert.throws(() => removeLink(join(dir, 'empty')));
  assert.ok(existsSync(join(dir, 'empty')));
});

test('a dangling link is still a link: it names its target, resists removeTree and goes with removeLink', () => {
  const dir = tempDir();
  const target = join(dir, 'target');
  mkdirSync(target);
  const link = join(dir, 'link');
  makeDirLink(target, link);
  removeTree(target);
  assert.ok(isLink(link));
  assert.ok(samePath(linkTarget(link), target));
  assert.throws(() => removeTree(link), /refusing/);
  removeLink(link);
  assert.ok(!isLink(link));
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

test('removeTree removes a link inside the tree and leaves what it points to', () => {
  const dir = tempDir();
  const target = join(dir, 'target');
  mkdirSync(target);
  writeFileSync(join(target, 'KEEP'), 'x');
  mkdirSync(join(dir, 'tree', 'sub'), { recursive: true });
  makeDirLink(target, join(dir, 'tree', 'sub', 'inner'));
  removeTree(join(dir, 'tree'));
  assert.ok(!existsSync(join(dir, 'tree')));
  assert.ok(existsSync(join(target, 'KEEP')));
});

test('a trailing slash does not hide a link', () => {
  const dir = tempDir();
  const target = join(dir, 'target');
  mkdirSync(target);
  writeFileSync(join(target, 'KEEP'), 'x');
  const link = join(dir, 'link');
  makeDirLink(target, link);
  // On POSIX, lstat('link/') follows the link instead of describing it.
  assert.ok(isLink(`${link}/`));
  assert.ok(samePath(linkTarget(`${link}/`), target));
  assert.throws(() => removeTree(`${link}/`), /refusing/);
  assert.ok(existsSync(join(target, 'KEEP')));
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

test('inside() works when the root is a filesystem root', () => {
  const root = parse(process.cwd()).root;
  assert.ok(inside(root, join(root, 'x')));
  assert.ok(!inside(root, root));
});

test('samePath ignores case on a Windows host', { skip: process.platform !== 'win32' }, () => {
  assert.ok(samePath('C:\\A\\b', 'c:\\a\\B'));
});

test('isWorktree is true for a linked worktree, whether its gitdir line is absolute or relative', () => {
  const base = tempDir();
  put(base, 'main/.git/worktrees/wt/commondir', '../..\n');
  put(base, 'abs/.git', `gitdir: ${slash(join(base, 'main', '.git', 'worktrees', 'wt'))}\n`);
  put(base, 'rel/.git', 'gitdir: ../main/.git/worktrees/wt\n');
  assert.ok(isWorktree(join(base, 'abs')));
  assert.ok(isWorktree(join(base, 'rel')));
});

test('isWorktree is false for a submodule or a --separate-git-dir clone, whose gitdir has no commondir', () => {
  const base = tempDir();
  put(base, 'main/.git/modules/subm/HEAD', 'ref: refs/heads/main\n');
  put(base, 'main/subm/.git', 'gitdir: ../.git/modules/subm\n');
  put(base, 'sep.git/HEAD', 'ref: refs/heads/main\n');
  put(base, 'sepwork/.git', `gitdir: ${slash(join(base, 'sep.git'))}\n`);
  assert.ok(!isWorktree(join(base, 'main', 'subm')));
  assert.ok(!isWorktree(join(base, 'sepwork')));
});

test('isWorktree is false for a main checkout, a .git file pointing nowhere and a plain directory', () => {
  const main = tempDir();
  mkdirSync(join(main, '.git'));
  assert.ok(!isWorktree(main));
  assert.ok(!isWorktree(join(main, 'missing')));
  const stray = tempDir();
  writeFileSync(join(stray, '.git'), 'gitdir: elsewhere\n');
  assert.ok(!isWorktree(stray));
  assert.ok(!isWorktree(tempDir()));
});

test('slash turns backslashes into forward slashes', () => {
  assert.equal(slash('C:\\Users\\me'), 'C:/Users/me');
});
