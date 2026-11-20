// Instruction text for each agent: prompt/core.md with the agent's MCP section
// and its own notes filled in. Every agent lists the global skills itself, so the
// instructions carry no skill table; skills/global/catalog.json feeds HARNESS.md.
import { join } from 'node:path';
import { parseJson, readText, lf, isObj } from './util.mjs';
import { skillNames } from './skills.mjs';
import { frontMatterValue } from './skillspec.mjs';
import { slash } from './platform.mjs';

export const PLACEHOLDERS = ['TITLE', 'MCP', 'NOTES', 'REPO', 'NAMED'];
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

// Global skills that load only when the user names them (the agents' skill lists leave them out), with their catalog tagline.
export function namedSkills(repo) {
  const dir = join(repo, 'skills', 'global');
  let skills = {};
  try { skills = parseJson(readText(catalogPath(repo)) ?? '{}', catalogPath(repo)).skills ?? {}; } catch {}
  return skillNames(dir)
    .filter((name) => frontMatterValue(readText(join(dir, name, 'SKILL.md')) ?? '', 'disable-model-invocation') === 'true')
    .sort()
    .map((name) => ({ name, tagline: skills[name]?.tagline ?? '' }));
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
    MCP: mcp,
    NOTES: lf(readText(join(ctx.repo, 'agents', agent, 'notes.md')) ?? '').trim(),
    REPO: slash(ctx.repo),
    NAMED: namedSkills(ctx.repo).map((s) => `- \`${s.name}\` — ${s.tagline}`).join('\n'),
  };
  // A replacer function, so "$&" or "${X}" in the filled text stays literal.
  return lf(core)
    .replace(/\{\{(\w+)\}\}/g, (_, k) => fill[k])
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
