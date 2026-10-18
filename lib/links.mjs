// One link per repo skill inside an agent's skill directory. Links that point
// into the repo at skills it no longer has are removed; everything else in the
// directory (vendor skills, ones you installed yourself, links you made by hand)
// is never touched.
import { readdirSync, readFileSync, existsSync, statSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { isLink, linkTarget, makeDirLink, removeLink, removeTree, samePath, inside } from './platform.mjs';

export function syncLinks(ctx, { src, names, dst }, run) {
  // A skills folder that is itself linked into the repo would get its skill links created inside the repo's working tree.
  if (existsSync(dst)) {
    const real = realpathSync(dst);
    const root = realpathSync(ctx.repo);
    if (samePath(real, root) || inside(root, real)) {
      throw new Error(`${dst} resolves into the repo ${ctx.repo}; v2 links skills one by one — remove that folder link first`);
    }
  }
  for (const name of names) linkOne(ctx, join(src, name), join(dst, name), run);
  // A shipped name is linkOne's business (compared like paths, so a case-only rename is still the same name). Of the
  // rest, what goes is our own link to a skill the repo dropped and any dangling link into the repo. A working link to
  // something else in the repo is the user's own, or another set's sharing this folder, so it stays.
  const shipped = (name) => names.some((n) => samePath(join(dst, n), join(dst, name)));
  pruneLinks(ctx, dst, (name, target) => shipped(name) || (existsSync(target) && !samePath(target, join(src, name))), run);
}

function act(run, label, fn) {
  run.change(label);
  if (!run.dryRun) fn();
}

// Puts the repo's skill at `path`. Where nothing of the user's is at stake it goes in without asking: over a
// link into the repo, a dangling link (the clone was moved), nothing at all, or a real directory identical to
// the repo's copy. Anything else is theirs, so it is a conflict. A pin left by an earlier "keep" silences that
// conflict, and only a choice for this very id (never "all") lifts the pin. Once the repo's link is in place
// the pin has nothing left to protect, so it is dropped. The id is always marked seen, so a pin on a skill the
// repo still ships is never taken for the leftover of one it dropped.
function linkOne(ctx, target, path, run) {
  const id = `link:${path}`;
  run.seen.add(id);
  let label = `link ${path}`;
  let remove = null;
  let clash = null;
  if (isLink(path)) {
    const current = linkTarget(path);
    if (samePath(current, target)) {
      if (!run.dryRun) delete run.state.entries[id];
      return;
    }
    // Names the old target, so a link whose drive was only offline can be put back.
    label = `relink ${path} (was ${current})`;
    remove = () => removeLink(path);
    if (!inside(ctx.repo, current) && existsSync(current)) clash = `links somewhere outside the repo (${current}): ${path}`;
  } else if (existsSync(path)) {
    // A real directory: a copy left by the v1 sync, or something you put there. A plain file is in the way too.
    label = `replace-copy ${path}`;
    // Guarded by the repo root: with the whole skills folder hand-linked into the repo, this path is the repo's own skill.
    remove = () => removeTree(path, ctx.repo);
    if (!statSync(path).isDirectory()) clash = `a file is in the way of a skill link: ${path}`;
    else if (!dirsEqual(path, target)) clash = `a real directory here differs from the repo's copy: ${path}`;
  }
  if (clash) {
    if (run.state.entries[id]?.pinned && run.resolutions[id] !== 'repo') return;
    const how = run.resolution(id);
    if (how === 'keep') {
      if (!run.dryRun) run.state.entries[id] = { agent: run.agent, kind: 'link', hash: null, pinned: true };
      return run.note(`kept this machine's version and stopped managing it: ${id}`);
    }
    if (how !== 'repo') return run.conflict(id, clash);
  }
  act(run, label, () => {
    remove?.();
    makeDirLink(target, path);
    delete run.state.entries[id];
  });
}

// Removes links in `dir` that point into the repo, unless keep(name, target) says to leave them.
export function pruneLinks(ctx, dir, keep, run) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const target = linkTarget(path);
    if (!target || !inside(ctx.repo, target)) continue;
    if (keep(name, target)) continue;
    act(run, `unlink ${path}`, () => removeLink(path));
  }
}

function files(root, rel = '', out = new Map()) {
  for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
    if (e.name === '__pycache__') continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) files(root, r, out);
    else out.set(r, e.isFile() ? join(root, r) : null);
  }
  return out;
}

// Same relative file set with the same bytes. Python caches are ignored, but .git is not: a skill directory
// that is its own git clone must never count as equal, because replacing it would delete the user's repository.
// Neither is a copy holding a link or any other entry that is not a plain file (recorded as null): its bytes
// are not compared, and replacing the copy would drop it.
export function dirsEqual(a, b) {
  const fa = files(a);
  const fb = files(b);
  if (fa.size !== fb.size) return false;
  for (const [rel, p] of fa) {
    const q = fb.get(rel);
    if (!p || !q || !readFileSync(p).equals(readFileSync(q))) return false;
  }
  return true;
}
