// Instruction text for each agent: prompt/core.md with the generated skill
// table, the agent's MCP section and its own notes filled in.
import { join } from 'node:path';
import { readJson, readText, lf } from './util.mjs';
import { skillNames } from './skills.mjs';
import { slash } from './platform.mjs';

const catalogPath = (repo) => join(repo, 'skills', 'global', 'catalog.json');

// Every global skill directory is catalogued, and every catalog entry has one.
export function catalogErrors(repo) {
  const cat = readJson(catalogPath(repo));
  const dirs = skillNames(join(repo, 'skills', 'global'));
  const errors = [];
  for (const d of dirs) if (!cat.skills[d]) errors.push(`skills/global/${d} has no entry in skills/global/catalog.json`);
  for (const n of Object.keys(cat.skills)) if (!dirs.includes(n)) errors.push(`skills/global/catalog.json lists "${n}" but skills/global/${n}/SKILL.md does not exist`);
  for (const [n, m] of Object.entries(cat.skills)) {
    if (!cat.categories.some((c) => c.key === m.category)) errors.push(`skills/global/catalog.json: "${n}" has unknown category "${m.category}"`);
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
  const fill = {
    TITLE: title,
    SKILLS: skillTable(ctx.repo),
    MCP: mcp,
    NOTES: lf(readText(join(ctx.repo, 'agents', agent, 'notes.md')) ?? '').trim(),
    REPO: slash(ctx.repo),
  };
  // A replacer function, so "$&" or "${X}" in the filled text stays literal.
  return lf(readText(join(ctx.repo, 'prompt', 'core.md')))
    .replace(/\{\{(TITLE|SKILLS|MCP|NOTES|REPO)\}\}/g, (_, k) => fill[k])
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
