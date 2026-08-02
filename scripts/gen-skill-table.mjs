#!/usr/bin/env node
// Generate the per-agent "Global Skills" table from a single source and inject it
// into each agent's instruction file between <!-- SKILLS:BEGIN --> / <!-- SKILLS:END -->.
//
// Single source of truth:
//   - skills/global/catalog.json   (curated: category + tagline per skill)
//   - skills/global/*/SKILL.md     (the actual skill directories — authoritative LIST)
// The generator reconciles the two: any skill directory missing from the catalog
// (or any catalog entry without a directory) is an error. This is the drift gate
// that would have caught the `teach` skill being absent from every table.
//
// Usage:
//   node scripts/gen-skill-table.mjs           # write generated tables into instruction files
//   node scripts/gen-skill-table.mjs --check   # verify only; exit 1 if anything is out of date
//
// No external dependencies (Node 20+).

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');
const GLOBAL = join(REPO, 'skills', 'global');
const CATALOG = join(GLOBAL, 'catalog.json');

const BEGIN = '<!-- SKILLS:BEGIN -->';
const END = '<!-- SKILLS:END -->';

// Instruction files that carry the generated skill table.
const TARGETS = [
  'agents/claude/CLAUDE.md',
  'agents/codex/AGENTS.md',
  'agents/codex/AGENTS.local.md',
  'agents/opencode/AGENTS.md',
  'agents/cursor/rules/global-rules.md',
  'agents/cursor/global-rules.md',
  'agents/pi/AGENTS.md',
];

const check = process.argv.includes('--check');
const errors = [];

// --- load catalog ---
const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
const catSkills = catalog.skills;
const categories = catalog.categories;

// --- scan actual skill directories (a dir is a "skill" iff it has SKILL.md) ---
const dirSkills = readdirSync(GLOBAL)
  .filter((n) => {
    const p = join(GLOBAL, n);
    return statSync(p).isDirectory() && existsSync(join(p, 'SKILL.md'));
  })
  .sort();

// --- reconcile: catalog vs directories ---
for (const name of dirSkills) {
  if (!catSkills[name]) {
    errors.push(`Skill directory "${name}" has no entry in catalog.json (add it under "skills").`);
  }
}
for (const name of Object.keys(catSkills)) {
  if (!dirSkills.includes(name)) {
    errors.push(`catalog.json lists "${name}" but skills/global/${name}/SKILL.md does not exist.`);
  }
}
for (const [name, meta] of Object.entries(catSkills)) {
  if (!categories.some((c) => c.key === meta.category)) {
    errors.push(`Skill "${name}" has unknown category "${meta.category}".`);
  }
}

if (errors.length) {
  console.error('Skill catalog reconciliation FAILED:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

// --- build the generated markdown block ---
function buildBlock() {
  const lines = [];
  lines.push(BEGIN);
  lines.push('');
  lines.push(`## Global Skills (${dirSkills.length})`);
  lines.push('');
  lines.push('> Auto-generated from `skills/global/` by `scripts/gen-skill-table.mjs`.');
  lines.push('> Do not edit between the SKILLS markers by hand — run the generator instead.');
  lines.push('');
  for (const cat of categories) {
    const names = Object.keys(catSkills).filter((n) => catSkills[n].category === cat.key);
    if (!names.length) continue;
    lines.push(`### ${cat.title} (${names.length}) — ${cat.blurb}`);
    lines.push('');
    lines.push('| Skill | When to use |');
    lines.push('| --- | --- |');
    for (const n of names) lines.push(`| \`${n}\` | ${catSkills[n].tagline} |`);
    lines.push('');
  }
  lines.push(END);
  return lines.join('\n');
}

const block = buildBlock();

// --- inject into each target between the markers ---
let drift = 0;
for (const rel of TARGETS) {
  const file = join(REPO, rel);
  if (!existsSync(file)) {
    console.error(`Target missing: ${rel}`);
    process.exit(1);
  }
  const src = readFileSync(file, 'utf8');
  const i = src.indexOf(BEGIN);
  const j = src.indexOf(END);
  if (i === -1 || j === -1 || j < i) {
    console.error(`Target ${rel} has no SKILLS markers. Add a "${BEGIN}" / "${END}" pair.`);
    process.exit(1);
  }
  const next = src.slice(0, i) + block + src.slice(j + END.length);
  if (next !== src) {
    drift++;
    if (check) {
      console.error(`OUT OF DATE: ${rel}`);
    } else {
      writeFileSync(file, next);
      console.log(`updated: ${rel}`);
    }
  } else if (!check) {
    console.log(`unchanged: ${rel}`);
  }
}

if (check && drift) {
  console.error(`\n${drift} file(s) out of date. Run: node scripts/gen-skill-table.mjs`);
  process.exit(1);
}
console.log(check ? 'skill tables up to date.' : `done (${dirSkills.length} skills).`);
