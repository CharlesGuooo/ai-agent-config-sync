// SKILL.md frontmatter rules the agents' skill loaders rely on (the Agent Skills spec: a name that matches its
// directory, lowercase-hyphen, at most 64 characters; a description of at most 1024). A skill that breaks one is
// skipped, or listed without its description, by some agent and nobody is told, so `check` fails on it instead.
// This reads only what those rules need, not YAML in general: top-level keys with plain, quoted or block scalars.
import { join, relative } from 'node:path';
import { readText, lf } from './util.mjs';
import { PACKS, globalSkills, packSkillSets } from './skills.mjs';

const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const KEY = /^([A-Za-z0-9_-]+):(?:[ \t]+(.*?))?[ \t]*$/;
const isListItem = (line) => /^\s*-(\s|$)/.test(line);

// Each top-level key with its inline value and the lines under it.
function entries(block) {
  const out = [];
  for (const line of block.split('\n')) {
    const m = KEY.exec(line);
    if (m) out.push({ key: m[1], inline: m[2] ?? '', lines: [] });
    else if (out.length && !/^#/.test(line)) out.at(-1).lines.push(line);
  }
  return out;
}

// The value of a block scalar (| or >, with its chomping indicator) from the lines under its key.
function blockScalar(header, lines) {
  const body = [...lines];
  while (body.length && !body.at(-1).trim()) body.pop();
  const indent = Math.min(...body.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  const text = body.map((l) => l.slice(indent));
  let value = '';
  if (header.startsWith('|')) value = text.join('\n');
  else {
    // Folded: lines join with a space; each blank line between them becomes a newline.
    let blank = 0;
    for (const l of text) {
      if (!l.trim()) { blank++; continue; }
      value += value ? (blank ? '\n'.repeat(blank) : ' ') + l : l;
      blank = 0;
    }
  }
  if (!value.trim()) return '';
  return header.includes('-') ? value : `${value}\n`;
}

// The value of a quoted scalar, and the lines left after its closing quote.
function quotedScalar(inline, lines) {
  const quote = inline[0];
  const all = [inline, ...lines];
  const flat = all.join('\n');
  let i = 1;
  for (; i < flat.length; i++) {
    if (quote === '"' && flat[i] === '\\') { i++; continue; }
    if (flat[i] === quote) {
      if (quote === "'" && flat[i + 1] === "'") { i++; continue; }
      break;
    }
  }
  const raw = flat.slice(1, i).replace(/\s*\n\s*/g, ' ');
  const value = quote === '"' ? raw.replace(/\\(.)/g, '$1') : raw.replace(/''/g, "'");
  const consumed = flat.slice(0, i + 1).split('\n').length;
  return { value, after: all.slice(consumed) };
}

function scalar(entry) {
  const { inline, lines } = entry;
  if (/^[|>]/.test(inline)) return { value: blockScalar(inline, lines), after: [], kind: 'block' };
  if (/^["']/.test(inline)) return { ...quotedScalar(inline, lines), kind: 'quoted' };
  const value = [inline, ...lines.map((l) => l.trim())].filter(Boolean).join(' ');
  return { value, after: lines, kind: 'plain' };
}

// The value of a top-level frontmatter key, trimmed; null when the key is not there.
export function frontMatterValue(text, key) {
  const t = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const m = /^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/.exec(t);
  const entry = m && entries(m[1]).find((e) => e.key === key);
  return entry ? scalar(entry).value.trim() : null;
}

// Problems with one SKILL.md's frontmatter; `dir` is the name of the directory it sits in.
export function frontMatterProblems(text, dir) {
  const t = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const m = /^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/.exec(t);
  if (!m) return ['no frontmatter'];
  const keys = entries(m[1]);
  const out = [];
  const get = (k) => keys.find((e) => e.key === k);

  const nameEntry = get('name');
  const name = nameEntry ? scalar(nameEntry).value.trim() : '';
  if (!name) out.push('no name');
  else if (!NAME.test(name)) out.push(`name "${name}" is not lowercase letters, digits and single hyphens`);
  else if (name.length > 64) out.push(`name is ${name.length} characters (max 64)`);
  else if (name !== dir) out.push(`name "${name}" does not match its directory "${dir}"`);

  const descEntry = get('description');
  const desc = descEntry ? scalar(descEntry) : null;
  if (!desc || !desc.value.trim()) out.push('empty description');
  else {
    if (desc.value.length > 1024) out.push(`description is ${desc.value.length} characters (max 1024)`);
    if (desc.kind === 'plain' && desc.value.includes(': ')) out.push('description is an unquoted scalar containing ": " — quote it or use a >- block');
  }

  // A key with a value of its own cannot also own a list: a list under it means it was dropped into another key's list.
  keys.forEach((e, i) => {
    if (!e.inline || /^[|>]/.test(e.inline) || !scalar(e).after.some(isListItem)) return;
    const prev = keys[i - 1];
    const owner = prev && !prev.inline && !prev.lines.some((l) => l.trim()) ? ` — did it land inside the list of "${prev.key}"?` : '';
    out.push(`a list follows "${e.key}", which already has a value${owner}`);
  });
  return out;
}

// A skill whose agents/openai.yaml sets policy.allow_implicit_invocation: false is one the user calls by name: Codex
// leaves it out of the prompt's skill list on purpose, so its absence there is not a fault.
export function codexHidden(skillDir) {
  const yaml = lf(readText(join(skillDir, 'agents', 'openai.yaml')) ?? '');
  const policy = /^policy:[ \t]*\n((?:[ \t]+.*(?:\n|$))*)/m.exec(yaml)?.[1] ?? '';
  return /^[ \t]+allow_implicit_invocation:[ \t]*false[ \t]*(#.*)?$/m.test(policy);
}

// Every session lists each global skill that loads on its own with its description, and Claude Code caps that list
// at about 1% of the context window: past it, descriptions are cut and only names are left (docs/skill-find.md E).
// The total after shortening was 4033 on 2026-11-19; the budget is that × 1.2, rounded up to the hundred.
export const GLOBAL_DESC_BUDGET = 4900;

// Description characters of the global skills that load on their own (named-only ones are not listed), longest first.
export function globalDescriptionChars(repo) {
  const { src, names } = globalSkills(repo);
  const bySkill = [];
  for (const name of names) {
    const text = readText(join(src, name, 'SKILL.md')) ?? '';
    if (frontMatterValue(text, 'disable-model-invocation') === 'true') continue;
    bySkill.push([name, (frontMatterValue(text, 'description') ?? '').length]);
  }
  bySkill.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return { total: bySkill.reduce((n, [, c]) => n + c, 0), bySkill };
}

export function budgetProblems(repo, limit = GLOBAL_DESC_BUDGET) {
  const { total, bySkill } = globalDescriptionChars(repo);
  if (total <= limit) return [];
  const longest = bySkill.slice(0, 3).map(([n, c]) => `${n} (${c})`).join(', ');
  return [`global skill descriptions total ${total} characters, over the budget of ${limit}; the longest: ${longest}`];
}

// Every global and pack skill the repo ships, as "<path>: <problem>" lines.
export function skillSpecProblems(repo) {
  const global = globalSkills(repo);
  const sets = [global, ...packSkillSets(repo, Object.keys(PACKS))];
  const out = [];
  for (const { src, names } of sets) {
    for (const name of names) {
      const file = join(src, name, 'SKILL.md');
      const rel = relative(repo, file).replaceAll('\\', '/');
      const text = readText(file) ?? '';
      for (const p of frontMatterProblems(text, name)) out.push(`${rel}: ${p}`);
      if (src === global.src && frontMatterValue(text, 'disable-model-invocation') === 'true' && !codexHidden(join(src, name))) {
        out.push(`${rel}: named-only, but Codex can still pick it: add agents/openai.yaml with policy.allow_implicit_invocation: false`);
      }
    }
  }
  return out.sort();
}
