// What the repo ships as skills: the global skill directories, and every
// directory named "skills" inside the selected project packs.
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const PACKS = {
  dev: 'dev-project',
  finance: 'finance-project',
  ios: 'ios-project',
  data: 'data-analysis-project',
  marketing: 'marketing-project',
  research: 'research-project',
  productivity: 'productivity-project',
  craft: 'craft-project',
};

// Directory names under `dir` that contain a SKILL.md.
export function skillNames(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, 'SKILL.md')))
    .map((e) => e.name)
    .sort();
}

export function globalSkills(repo) {
  const src = join(repo, 'skills', 'global');
  return { src, names: skillNames(src) };
}

// One entry per "skills" directory: sub is the '/'-separated path from the pack
// root to that directory's parent ('' for the pack root).
export function packSkillSets(repo, packKeys) {
  const out = [];
  for (const key of packKeys) {
    const pack = PACKS[key];
    if (!pack) throw new Error(`unknown pack "${key}" — known: ${Object.keys(PACKS).join(', ')}`);
    const root = join(repo, 'skills', 'project-packs', pack);
    if (existsSync(root)) collect(root, '', pack, out);
  }
  return out;
}

function collect(root, sub, pack, out) {
  for (const e of readdirSync(join(root, sub), { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const rel = sub ? `${sub}/${e.name}` : e.name;
    if (e.name === 'skills') {
      const src = join(root, rel);
      out.push({ pack, sub, src, names: skillNames(src) });
    } else {
      collect(root, rel, pack, out);
    }
  }
}
