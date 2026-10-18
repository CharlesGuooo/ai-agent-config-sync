// OS detection, the run context, and directory links. Links are junctions on
// Windows (no admin or Developer Mode needed) and symlinks elsewhere; which kind
// is decided by the host, while ctx.os decides how configs are rendered.
import { symlinkSync, readlinkSync, lstatSync, rmdirSync, unlinkSync, rmSync, mkdirSync, statSync, realpathSync, existsSync } from 'node:fs';
import { dirname, resolve, join, sep } from 'node:path';
import { homedir, platform } from 'node:os';

const HOST_WIN = process.platform === 'win32';

export function osName(p = platform()) {
  return p === 'win32' ? 'windows' : p === 'darwin' ? 'mac' : 'linux';
}

// repo = this checkout; home = whose agents get configured; local = where the
// machine state and generated Cursor rules live (default <repo>/.local).
export function makeContext({ repo, home, os = osName(), local }) {
  return { repo: resolve(repo), home: resolve(home ?? homedir()), os, local: resolve(local ?? join(repo, '.local')) };
}

// Forward-slash form of a path, for generated configs and hook commands.
export const slash = (p) => p.replace(/\\/g, '/');

const norm = (p) => (HOST_WIN ? resolve(p).toLowerCase() : resolve(p));

export const samePath = (a, b) => norm(a) === norm(b);

export const inside = (root, p) => norm(p).startsWith(norm(root) + sep);

export function isLink(p) {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

export function linkTarget(p) {
  return isLink(p) ? resolve(dirname(p), readlinkSync(p)) : null;
}

export function makeDirLink(target, linkPath) {
  mkdirSync(dirname(linkPath), { recursive: true });
  symlinkSync(target, linkPath, HOST_WIN ? 'junction' : 'dir');
}

// Removes the link itself; what it points to is never touched.
export function removeLink(p) {
  if (HOST_WIN) rmdirSync(p);
  else unlinkSync(p);
}

// Removes a single real file or a whole directory tree. Refuses a link, so a tree
// delete can never start walking into the repo through a junction. A folder link made
// by hand higher up the path (say ~/.claude/skills pointing at the repo's skills) makes
// a machine path resolve into the repo without being a link itself, so with `protect`
// set to the repo root it also refuses a path whose real location is that root or below.
export function removeTree(p, protect) {
  if (isLink(p)) throw new Error(`refusing to tree-delete a link: ${p}`);
  if (protect && existsSync(p)) {
    const real = realpathSync(p);
    const root = realpathSync(protect);
    if (samePath(real, root) || inside(root, real)) {
      throw new Error(`refusing to tree-delete ${p}: it resolves into ${protect}`);
    }
  }
  rmSync(p, { recursive: true, force: true });
}

// True for a linked git worktree (its .git is a file), false for the main checkout.
export function isWorktree(repo) {
  try {
    return statSync(join(repo, '.git')).isFile();
  } catch {
    return false;
  }
}
