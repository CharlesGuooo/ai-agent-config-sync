// The pack routing table is written by hand in one place, the top of HARNESS.md. It must route to every pack
// the repo ships, and name only folders
// that exist: a pack folder under skills/project-packs/, or one of its sub-folders that holds a skills/ directory.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readText } from './util.mjs';
import { PACKS, packSkillSets } from './skills.mjs';

const DOCS = ['HARNESS.md'];

export function routingProblems(repo) {
  const packs = Object.values(PACKS).filter((p) => existsSync(join(repo, 'skills', 'project-packs', p)));
  const subs = new Map(packs.map((p) => [p, []]));
  for (const set of packSkillSets(repo, Object.keys(PACKS))) if (set.sub) subs.get(set.pack).push(set.sub);
  // '' is the pack itself; a sub is real when it holds skills or is an ancestor of one that does.
  const real = (pack, sub) => subs.has(pack) && (!sub || subs.get(pack).some((s) => s === sub || s.startsWith(`${sub}/`)));
  const out = [];
  for (const doc of DOCS) {
    let text = readText(join(repo, doc));
    if (text == null) continue;
    text = text.split('<!-- PACKS:BEGIN -->')[0];                  // HARNESS.md's generated index is not hand-written
    const named = [];                                               // [pack, sub] in order of appearance
    for (const line of text.split(/\r?\n/)) {
      for (const m of line.matchAll(/~\/([a-z0-9-]+-project)((?:\/[a-z0-9-]+)*)/g)) named.push([m[1], m[2].slice(1)]);
      // A table row that routes to a pack root (`~/finance-project/` or `~/finance-project/<sub>/`) may list its
      // sub-folders as bare tokens: `trading` `advisory/{ib,pe}` `frontend/`.
      const rowPack = line.match(/`~\/([a-z0-9-]+-project)\/(?:<sub>\/)?`/)?.[1];
      if (rowPack && line.trimStart().startsWith('|')) {
        for (const m of line.matchAll(/`([a-z0-9-]+)(?:\/[^`]*)?`/g)) if (!m[0].startsWith('`~')) named.push([rowPack, m[1]]);
      }
    }
    for (const p of packs) if (!named.some(([n]) => n === p)) out.push(`${doc}: no route to ~/${p}/`);
    const seen = new Set();
    for (const [pack, sub] of named) {
      // The sub-folders of an unknown pack are not checked one by one: the pack itself is the problem.
      const key = subs.has(pack) && sub ? `${pack}/${sub}` : pack;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!real(pack, subs.has(pack) ? sub : '')) out.push(`${doc}: names ~/${key}/, which is not a pack folder in skills/project-packs/`);
    }
  }
  return out;
}
