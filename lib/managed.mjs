// Text the repo owns: whole files (commands, templates), and a marked block
// inside a file the machine also owns (agent instruction files). Text outside
// the markers is never touched.
import { existsSync, unlinkSync } from 'node:fs';
import { readText, writeText, hashText, lf } from './util.mjs';
import { isLink } from './platform.mjs';

export const BEGIN = '<!-- >>> ai-agent-config-sync (managed: edit the repo, not this block) -->';
export const END = '<!-- <<< ai-agent-config-sync -->';

// The v1 sync wrote whole instruction files with a generated table between these markers, each on a line of its
// own. A note or doc that only mentions them is not a v1 prompt, and replacing it would throw its text away.
export const isV1Prompt = (text) => /^<!-- SKILLS:BEGIN -->\r?$[\s\S]*^<!-- SKILLS:END -->\r?$/m.test(text);

// The block is the first END after the first BEGIN, opened by the nearest BEGIN before that END: a stray END or an
// orphan BEGIN above it stays the user's text. before and after come back exactly as they stand in the file; only
// the block's own text is normalized.
export function splitBlock(text) {
  const first = text.indexOf(BEGIN);
  if (first === -1) return null;
  const j = text.indexOf(END, first + BEGIN.length);
  if (j === -1) return null;
  const i = text.lastIndexOf(BEGIN, j - BEGIN.length);
  return { before: text.slice(0, i), inner: lf(text.slice(i + BEGIN.length, j)).replace(/^\n/, '').replace(/\n$/, ''), after: text.slice(j + END.length) };
}

// The block is written in the line ending the file already has (LF for a new file), so a CRLF file stays CRLF.
const eolOf = (text) => (text !== null && text.includes('\r\n') ? '\r\n' : '\n');
const block = (content, eol) => [BEGIN, ...lf(content).split('\n'), END].join(eol);

// A marker is there but the markers do not make a block (one was deleted, or they are out of order). Guessing which
// text is ours could destroy the user's, so the file is left for them to fix.
function markersDamaged(text, parts, file, run) {
  if (text === null || parts || !(text.includes(BEGIN) || text.includes(END))) return false;
  run.warn(`managed markers damaged in ${file}; fix them by hand`);
  return true;
}

export function applyBlock({ id, file, content }, run) {
  // Written back, such content would split the block in the wrong place: every run would conflict, and each resolve add another copy.
  if (content.includes(BEGIN) || content.includes(END)) {
    throw new Error(`managed block ${id} (${file}): its content contains a managed marker`);
  }
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
  // Damaged markers are something on the machine, so the file's own hash (never null) makes even a run with no
  // state a conflict instead of stacking a second block.
  const current = markersDamaged(text, parts, file, run) ? hashText(text) : null;
  const v1 = text !== null && isV1Prompt(text);
  if (!run.step(id, meta, current, hashText(content), v1 ? `replace-v1 ${file}` : `write ${file}`) || run.dryRun) return;
  // No block yet: a v1 file is replaced whole; anything else stays, below the block.
  writeText(file, text === null || v1 ? `${block(content, eol)}${eol}` : `${block(content, eol)}${eol}${eol}${text}`);
}

export function removeBlock({ id, file }, run) {
  const text = readText(file);
  const parts = text === null ? null : splitBlock(text);
  markersDamaged(text, parts, file, run);
  if (!run.step(id, { kind: 'block', file }, parts ? hashText(parts.inner) : null, null, `remove-block ${file}`) || !parts || run.dryRun) return;
  // applyBlock puts a line ending and a blank line between the block and the text below it. Take those back, not the user's own.
  const rest = parts.before + parts.after.replace(/^(\r?\n){0,2}/, '');
  if (rest.trim() !== '') writeText(file, rest);
  // A dotfile manager's link to this file has to survive, so it is emptied instead of deleted.
  else if (isLink(file)) writeText(file, '');
  else unlinkSync(file);
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
