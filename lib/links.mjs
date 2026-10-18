// One link per repo skill inside an agent's skill directory. Links that point
// into the repo at skills it no longer has are removed; everything else in the
// directory (vendor skills, ones you installed yourself) is never touched.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { isLink, linkTarget, makeDirLink, removeLink, removeTree, samePath, inside } from './platform.mjs';

export function syncLinks(ctx, { src, names, dst }, run) {
  for (const name of names) linkOne(ctx, join(src, name), join(dst, name), run);
  pruneLinks(ctx, dst, (name, target) => names.includes(name) && samePath(target, join(src, name)), run);
}

function act(run, label, fn) {
  run.change(label);
  if (!run.dryRun) fn();
}

function linkOne(ctx, target, path, run) {
  const id = `link:${path}`;
  if (isLink(path)) {
    const current = linkTarget(path);
    if (samePath(current, target)) return;
    if (!inside(ctx.repo, current)) return run.conflict(id, `links somewhere outside the repo (${current}): ${path}`);
    return act(run, `relink ${path}`, () => {
      removeLink(path);
      makeDirLink(target, path);
    });
  }
  if (existsSync(path)) {
    // A real directory: a copy left by the v1 sync, or something you put there.
    const resolution = run.resolution(id);
    if (resolution === 'keep') return;
    if (resolution !== 'repo' && !dirsEqual(path, target)) return run.conflict(id, `a real directory here differs from the repo's copy: ${path}`);
    return act(run, `replace-copy ${path}`, () => {
      removeTree(path);
      makeDirLink(target, path);
    });
  }
  act(run, `link ${path}`, () => makeDirLink(target, path));
}

// Removes links in `dir` that point into the repo, unless keep(name, target)
// says otherwise and the target still exists.
export function pruneLinks(ctx, dir, keep, run) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const target = linkTarget(path);
    if (!target || !inside(ctx.repo, target)) continue;
    if (keep(name, target) && existsSync(target)) continue;
    act(run, `unlink ${path}`, () => removeLink(path));
  }
}

function files(root, rel = '', out = new Map()) {
  for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
    if (e.name === '__pycache__' || e.name === '.git') continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) files(root, r, out);
    else if (e.isFile()) out.set(r, join(root, r));
  }
  return out;
}

// Same relative file set with the same bytes (Python caches ignored).
export function dirsEqual(a, b) {
  const fa = files(a);
  const fb = files(b);
  if (fa.size !== fb.size) return false;
  for (const [rel, p] of fa) {
    const q = fb.get(rel);
    if (!q || !readFileSync(p).equals(readFileSync(q))) return false;
  }
  return true;
}
