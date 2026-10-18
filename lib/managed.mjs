// Text the repo owns: whole files (commands, templates), and a marked block
// inside a file the machine also owns (agent instruction files). Text outside
// the markers is never touched.
import { existsSync, unlinkSync } from 'node:fs';
import { readText, writeText, hashText, lf } from './util.mjs';

export const BEGIN = '<!-- >>> ai-agent-config-sync (managed: edit the repo, not this block) -->';
export const END = '<!-- <<< ai-agent-config-sync -->';

// The v1 sync wrote whole instruction files with a generated table between these markers.
export const isV1Prompt = (text) => text.includes('<!-- SKILLS:BEGIN -->') && text.includes('<!-- SKILLS:END -->');

// before and after come back exactly as they stand in the file: only the block's own text is normalized.
export function splitBlock(text) {
  const i = text.indexOf(BEGIN);
  const j = text.indexOf(END);
  if (i === -1 || j < i) return null;
  return { before: text.slice(0, i), inner: lf(text.slice(i + BEGIN.length, j)).replace(/^\n/, '').replace(/\n$/, ''), after: text.slice(j + END.length) };
}

// The block is written in the line ending the file already has (LF for a new file), so a CRLF file stays CRLF.
const eolOf = (text) => (text !== null && text.includes('\r\n') ? '\r\n' : '\n');
const block = (content, eol) => [BEGIN, ...lf(content).split('\n'), END].join(eol);

export function applyBlock({ id, file, content }, run) {
  const text = readText(file);
  const parts = text === null ? null : splitBlock(text);
  const meta = { kind: 'block', file };
  const eol = eolOf(text);
  if (parts) {
    if (run.step(id, meta, hashText(parts.inner), hashText(content), `update ${file}`) && !run.dryRun) {
      writeText(file, parts.before + block(content, eol) + parts.after);
    }
    return;
  }
  if (!run.step(id, meta, null, hashText(content), `write ${file}`) || run.dryRun) return;
  // No block yet: a v1 file is replaced whole; anything else stays, below the block.
  writeText(file, text === null || isV1Prompt(text) ? `${block(content, eol)}${eol}` : `${block(content, eol)}${eol}${eol}${text}`);
}

export function removeBlock({ id, file }, run) {
  const text = readText(file);
  const parts = text === null ? null : splitBlock(text);
  if (!run.step(id, { kind: 'block', file }, parts ? hashText(parts.inner) : null, null, `remove-block ${file}`) || !parts || run.dryRun) return;
  const rest = (parts.before + parts.after).replace(/^(\r?\n)+/, '');
  if (rest.trim() === '') unlinkSync(file);
  else writeText(file, rest);
}

export function applyFile({ id, file, content }, run) {
  if (run.step(id, { kind: 'file', file }, hashText(readText(file)), hashText(content), `write ${file}`) && !run.dryRun) {
    writeText(file, content);
  }
}

export function removeFile({ id, file }, run) {
  if (run.step(id, { kind: 'file', file }, hashText(readText(file)), null, `remove ${file}`) && !run.dryRun && existsSync(file)) {
    unlinkSync(file);
  }
}
