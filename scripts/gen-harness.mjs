#!/usr/bin/env node
// Generate the local-pack skill index inside HARNESS.md (the agent-facing routing
// manifest). Single source = the actual skills/project-packs/**/SKILL.md files, so
// the index cannot drift out of the tree.
//
// Injects between <!-- PACKS:BEGIN --> / <!-- PACKS:END --> in HARNESS.md.
//
// Usage:
//   node scripts/gen-harness.mjs           # write the generated block into HARNESS.md
//   node scripts/gen-harness.mjs --check    # verify only; exit 1 if HARNESS.md is stale
//
// No external dependencies (Node 20+).

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');
const PACKS_DIR = join(REPO, 'skills', 'project-packs');
const CATALOG = join(REPO, 'skills', 'global', 'catalog.json');
const TARGET = join(REPO, 'HARNESS.md');
const BEGIN = '<!-- PACKS:BEGIN -->';
const END = '<!-- PACKS:END -->';

// Preferred display order; any pack not listed is appended alphabetically.
const PACK_ORDER = [
  'dev-project', 'finance-project', 'research-project', 'data-analysis-project',
  'marketing-project', 'productivity-project', 'ios-project', 'craft-project',
];

const check = process.argv.includes('--check');

// --- recursively find SKILL.md files under a dir ---
function findSkillMd(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === '__pycache__') continue;
    const p = join(dir, name);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) findSkillMd(p, out);
    else if (name === 'SKILL.md') out.push(p);
  }
  return out;
}

// --- pull a one-line tagline from a SKILL.md ---
function tagline(file) {
  const src = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');  // tolerate CRLF
  const fm = src.match(/^---\n([\s\S]*?)\n---/);
  let desc = '';
  if (fm) {
    const body = fm[1];
    // description: possibly folded (>- / >) across indented lines, or inline.
    const m = body.match(/^description:\s*(.*)$/m);
    if (m) {
      if (/^[>|]/.test(m[1].trim()) || m[1].trim() === '') {
        // folded/block scalar: collect subsequent more-indented lines
        const lines = body.split('\n');
        const start = lines.findIndex((l) => /^description:/.test(l));
        const collected = [];
        for (let i = start + 1; i < lines.length; i++) {
          if (/^\s+\S/.test(lines[i])) collected.push(lines[i].trim());
          else break;
        }
        desc = collected.join(' ');
      } else {
        desc = m[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  if (!desc) {
    // last resort: first real title heading (must start with a letter — skips "# 1.")
    const h = src.match(/^#\s+([A-Za-z][^\n]+)$/m);
    desc = h ? h[1].trim() : '';
  }
  desc = desc.replace(/\s+/g, ' ').trim();
  // first sentence, capped
  const firstSentence = desc.split(/(?<=[.。!?])\s/)[0] || desc;
  const s = firstSentence.length > 140 ? firstSentence.slice(0, 137) + '...' : firstSentence;
  return s || '(no description)';
}

// --- build the pack -> subpack -> skills structure ---
function buildIndex() {
  const packs = readdirSync(PACKS_DIR).filter((n) => {
    try { return statSync(join(PACKS_DIR, n)).isDirectory(); } catch { return false; }
  });
  const ordered = [
    ...PACK_ORDER.filter((p) => packs.includes(p)),
    ...packs.filter((p) => !PACK_ORDER.includes(p)).sort(),
  ];
  const index = [];
  for (const pack of ordered) {
    const packRoot = join(PACKS_DIR, pack);
    const files = findSkillMd(packRoot);
    if (!files.length) continue;
    const bySub = new Map();
    for (const f of files) {
      const relPosix = '/' + f.slice(packRoot.length + 1).replace(/\\/g, '/'); // "/skills/x/SKILL.md"
      const cut = relPosix.lastIndexOf('/skills/');
      const sub = cut > 0 ? relPosix.slice(1, cut) : '(root)';
      const skill = relPosix.slice(cut + '/skills/'.length).replace(/\/SKILL\.md$/, '');
      if (!bySub.has(sub)) bySub.set(sub, []);
      bySub.get(sub).push({ skill, tag: tagline(f) });
    }
    index.push({ pack, count: files.length, bySub });
  }
  return index;
}

function globalSummary() {
  if (!existsSync(CATALOG)) return '';
  const cat = JSON.parse(readFileSync(CATALOG, 'utf8'));
  const counts = new Map();
  for (const meta of Object.values(cat.skills)) counts.set(meta.category, (counts.get(meta.category) || 0) + 1);
  const parts = cat.categories
    .filter((c) => counts.get(c.key))
    .map((c) => `${c.title} ${counts.get(c.key)}`);
  const total = Object.keys(cat.skills).length;
  return `**Global skills (${total}, auto-exposed at startup — no need to route):** ${parts.join(' · ')}.`;
}

function buildBlock() {
  const lines = [BEGIN, ''];
  lines.push('> Auto-generated from `skills/project-packs/` by `scripts/gen-harness.mjs`.');
  lines.push('> Do not edit between the PACKS markers by hand — run the generator.');
  lines.push('');
  const g = globalSummary();
  if (g) { lines.push(g); lines.push(''); }
  lines.push('### Local skill packs — index');
  lines.push('');
  for (const { pack, count, bySub } of buildIndex()) {
    lines.push(`#### ${pack} (${count})`);
    // (root) first, then sub-packs alphabetically
    const subs = [...bySub.keys()].sort((a, b) => (a === '(root)' ? -1 : b === '(root)' ? 1 : a.localeCompare(b)));
    for (const sub of subs) {
      if (sub !== '(root)') lines.push(`- **${sub}/**`);
      for (const { skill, tag } of bySub.get(sub)) {
        const indent = sub === '(root)' ? '' : '  ';
        lines.push(`${indent}- \`${skill}\` — ${tag}`);
      }
    }
    lines.push('');
  }
  lines.push(END);
  return lines.join('\n');
}

if (!existsSync(TARGET)) {
  console.error(`HARNESS.md not found at ${TARGET}. Create it with the PACKS markers first.`);
  process.exit(1);
}
const src = readFileSync(TARGET, 'utf8');
const i = src.indexOf(BEGIN), j = src.indexOf(END);
if (i === -1 || j === -1 || j < i) {
  console.error(`HARNESS.md has no PACKS markers ("${BEGIN}" / "${END}").`);
  process.exit(1);
}
const block = buildBlock();
const next = src.slice(0, i) + block + src.slice(j + END.length);

if (next === src) {
  console.log(check ? 'HARNESS.md up to date.' : 'unchanged: HARNESS.md');
  process.exit(0);
}
if (check) {
  console.error('OUT OF DATE: HARNESS.md — run: node scripts/gen-harness.mjs');
  process.exit(1);
}
writeFileSync(TARGET, next);
console.log('updated: HARNESS.md');
