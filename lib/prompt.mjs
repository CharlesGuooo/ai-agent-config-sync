// Instruction text for each agent: prompt/core.md with the generated skill
// table, the agent's MCP section and its own notes filled in.
import { join } from 'node:path';
import { readJson, parseJson, readText, lf, isObj } from './util.mjs';
import { skillNames } from './skills.mjs';
import { slash } from './platform.mjs';

const PLACEHOLDERS = ['TITLE', 'SKILLS', 'MCP', 'NOTES', 'REPO'];
const catalogPath = (repo) => join(repo, 'skills', 'global', 'catalog.json');

// Every global skill directory is catalogued, and every catalog entry has one.
// Returns messages and never throws, so a broken catalog is reported, not crashed on.
export function catalogErrors(repo) {
  const file = 'skills/global/catalog.json';
  let cat;
  try {
    const text = readText(catalogPath(repo));
    if (text === null) return [`${file} does not exist`];
    cat = parseJson(text, catalogPath(repo));
  } catch (e) {
    return [e.message];
  }
  if (!Array.isArray(cat?.categories)) return [`${file}: "categories" must be an array`];
  if (!isObj(cat.skills)) return [`${file}: "skills" must be an object`];
  const errors = [];
  for (const [i, c] of cat.categories.entries()) {
    if (!isObj(c) || ['key', 'title', 'blurb'].some((f) => typeof c[f] !== 'string')) errors.push(`${file}: categories[${i}] needs string "key", "title" and "blurb"`);
  }
  const keys = cat.categories.filter(isObj).map((c) => c.key);
  for (const k of new Set(keys.filter((k, i) => keys.indexOf(k) !== i))) errors.push(`${file}: category key "${k}" is used more than once`);
  const dirs = skillNames(join(repo, 'skills', 'global'));
  for (const d of dirs) if (!Object.hasOwn(cat.skills, d)) errors.push(`skills/global/${d} has no entry in ${file}`);
  for (const [n, m] of Object.entries(cat.skills)) {
    if (!dirs.includes(n)) errors.push(`${file} lists "${n}" but skills/global/${n}/SKILL.md does not exist`);
    if (!isObj(m)) {
      errors.push(`${file}: "${n}" must be an object`);
      continue;
    }
    if (typeof m.tagline !== 'string' || !m.tagline.trim()) errors.push(`${file}: "${n}" needs a non-empty "tagline"`);
    else if (/[|\r\n]/.test(m.tagline)) errors.push(`${file}: "${n}" tagline must not contain "|" or a line break (it sits in a Markdown table)`);
    if (!cat.categories.some((c) => isObj(c) && c.key === m.category)) errors.push(`${file}: "${n}" has unknown category "${m.category}"`);
  }
  return errors;
}

export function skillTable(repo) {
  const errors = catalogErrors(repo);
  if (errors.length) throw new Error(`global skill catalog is out of sync:\n  ${errors.join('\n  ')}`);
  const cat = readJson(catalogPath(repo));
  const lines = [`## Global Skills (${Object.keys(cat.skills).length})`];
  for (const c of cat.categories) {
    const names = Object.keys(cat.skills).filter((n) => cat.skills[n].category === c.key);
    if (!names.length) continue;
    lines.push('', `### ${c.title} (${names.length}) — ${c.blurb}`, '', '| Skill | When to use |', '| --- | --- |');
    for (const n of names) lines.push(`| \`${n}\` | ${cat.skills[n].tagline} |`);
  }
  return lines.join('\n');
}

export function renderPrompt(ctx, { title, agent, mcp }) {
  const corePath = join(ctx.repo, 'prompt', 'core.md');
  const core = readText(corePath);
  if (core === null) throw new Error(`${corePath} does not exist`);
  // A misspelled placeholder must fail here, not ship as literal "{{...}}" text.
  const unknown = [...core.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).filter((k) => !PLACEHOLDERS.includes(k));
  if (unknown.length) throw new Error(`${corePath}: unknown placeholder {{${unknown[0]}}} — known: ${PLACEHOLDERS.join(', ')}`);
  const fill = {
    TITLE: title,
    SKILLS: skillTable(ctx.repo),
    MCP: mcp,
    NOTES: lf(readText(join(ctx.repo, 'agents', agent, 'notes.md')) ?? '').trim(),
    REPO: slash(ctx.repo),
  };
  // A replacer function, so "$&" or "${X}" in the filled text stays literal.
  return lf(core)
    .replace(/\{\{(\w+)\}\}/g, (_, k) => fill[k])
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
