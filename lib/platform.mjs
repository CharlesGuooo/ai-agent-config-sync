// OS detection, the run context, and directory links. Links are junctions on
// Windows (no admin or Developer Mode needed) and symlinks elsewhere; which kind
// is decided by the host, while ctx.os decides how configs are rendered.
import { symlinkSync, readlinkSync, lstatSync, unlinkSync, rmSync, mkdirSync, statSync, realpathSync, existsSync, readFileSync } from 'node:fs';
import { dirname, basename, resolve, join, sep } from 'node:path';
import { homedir, platform } from 'node:os';

const HOST_WIN = process.platform === 'win32';
// Windows and macOS file systems ignore case by default, so a path spelled in another case is the same path there.
const FOLD_CASE = process.platform === 'win32' || process.platform === 'darwin';

export function osName(p = platform()) {
  return p === 'win32' ? 'windows' : p === 'darwin' ? 'mac' : 'linux';
}

// repo = this checkout; home = whose agents get configured; local = where the
// machine state and generated Cursor rules live (default <repo>/.local).
export function makeContext({ repo, home, os = osName(), local }) {
  return { repo: abs(repo), home: abs(home ?? homedir()), os, local: abs(local ?? join(repo, '.local')) };
}

// On a Windows host "d:\x" and "D:\x" are the same place; one spelling keeps generated text (and so every prompt block) stable.
export function abs(p) {
  const r = resolve(p);
  return HOST_WIN ? r.replace(/^[a-z]:/, (d) => d.toUpperCase()) : r;
}

// Forward-slash form of a path, for generated configs and hook commands.
export const slash = (p) => p.replace(/\\/g, '/');

const norm = (p) => (FOLD_CASE ? resolve(p).toLowerCase() : resolve(p));

export const samePath = (a, b) => norm(a) === norm(b);

// A filesystem root already ends in a separator; adding another would match nothing.
export const inside = (root, p) => {
  const r = norm(root);
  const q = norm(p);
  return q !== r && q.startsWith(r.endsWith(sep) ? r : r + sep);
};

// Whether p is, or once created would be, at root or below it in reality. A folder link made by hand higher up the
// path (say ~/.claude pointing into the repo) sends p there although p need not exist yet, so p is judged by where
// its nearest existing ancestor really is. A dangling link on the way counts by where it points, since whatever is
// written through it is created there.
export function resolvesInto(root, p) {
  const r = realpathSync(root);
  let q = resolve(p);
  let rest = [];
  // Bounded, so links that point at each other cannot loop forever; nothing can be written through them anyway.
  for (let hops = 0; hops < 40;) {
    if (existsSync(q)) {
      const real = realpathSync(q);
      return samePath(real, r) || inside(r, real);
    }
    if (isLink(q)) {
      q = join(linkTarget(q), ...rest);
      rest = [];
      hops++;
      continue;
    }
    const up = dirname(q);
    if (up === q) return false;
    rest = [basename(q), ...rest];
    q = up;
  }
  return false;
}

// resolve() drops a trailing slash, which on POSIX would make lstat follow the link instead of describing it.
export function isLink(p) {
  try {
    return lstatSync(resolve(p)).isSymbolicLink();
  } catch {
    return false;
  }
}

export function linkTarget(p) {
  p = resolve(p);
  return isLink(p) ? resolve(dirname(p), readlinkSync(p)) : null;
}

export function makeDirLink(target, linkPath) {
  mkdirSync(dirname(linkPath), { recursive: true });
  symlinkSync(target, linkPath, HOST_WIN ? 'junction' : 'dir');
}

// Removes the link itself; what it points to is never touched. Unlink on every host: on
// Windows it also removes a junction (a dangling one too) but refuses a real directory,
// where rmdir would delete an empty one.
export function removeLink(p) {
  unlinkSync(p);
}

// Removes a single real file or a whole directory tree. Refuses a link, so a tree
// delete can never start walking into the repo through a junction. A folder link made
// by hand higher up the path (say ~/.claude/skills pointing at the repo's skills) makes
// a machine path resolve into the repo without being a link itself, so with `protect`
// set to the repo root it also refuses a path whose real location is that root or below
// it, or a parent of it (deleting that would take the root along).
export function removeTree(p, protect) {
  p = resolve(p);
  if (isLink(p)) throw new Error(`refusing to tree-delete a link: ${p}`);
  if (protect && existsSync(p)) {
    const real = realpathSync(p);
    const root = realpathSync(protect);
    if (samePath(real, root) || inside(root, real)) {
      throw new Error(`refusing to tree-delete ${p}: it resolves into ${protect}`);
    }
    if (inside(real, root)) {
      throw new Error(`refusing to tree-delete ${p}: it contains ${protect}`);
    }
  }
  rmSync(p, { recursive: true, force: true });
}

// True for a linked git worktree, false for the main checkout. A submodule or a
// --separate-git-dir clone also has a .git file, but only a linked worktree's gitdir has
// a commondir file (it points back at the main repository's git directory).
export function isWorktree(repo) {
  try {
    const dotGit = join(repo, '.git');
    if (!statSync(dotGit).isFile()) return false;
    const match = /^gitdir:\s*(.+?)\s*$/m.exec(readFileSync(dotGit, 'utf8'));
    return match !== null && existsSync(join(resolve(repo, match[1]), 'commondir'));
  } catch {
    return false;
  }
}
