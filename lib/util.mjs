// Small file and value helpers shared by the installer modules.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';

export const lf = (text) => text.replace(/\r\n/g, '\n');

// Strict, so a file that is not UTF-8 stops the run instead of being rewritten with replacement
// characters. The decoder also drops a leading UTF-8 BOM.
const utf8 = new TextDecoder('utf-8', { fatal: true });

export function readText(p) {
  if (!existsSync(p)) return null;
  try {
    return utf8.decode(readFileSync(p));
  } catch (e) {
    throw new Error(`${p}: ${e.message}`, { cause: e });
  }
}

// Writes in place on purpose: temp-file-and-rename would replace symlinked dotfiles and reset file modes.
export function writeText(p, text) {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text);
}

// V8 quotes a piece of the source in some JSON errors, and a config file can hold tokens, so the error says where the
// problem is and nothing of what is there: V8's own line and column, or worked out from its position (older V8 gives
// only that). Some errors give neither. The original error is not kept as a cause: Node prints a cause, and V8's holds the snippet.
export function parseJson(text, file) {
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`${file}: invalid JSON${jsonPlace(text, e.message)}`);
  }
}

// Anchored to the end of the message, where V8 puts it, so words inside a quoted piece of the source never count.
function jsonPlace(text, message) {
  const m = / at position (\d+)(?: \(line (\d+) column (\d+)\))?$/.exec(message);
  if (!m) return '';
  if (m[2]) return ` (line ${m[2]}, column ${m[3]})`;
  const before = text.slice(0, Number(m[1]));
  return ` (line ${before.split('\n').length}, column ${before.length - before.lastIndexOf('\n')})`;
}

export function readJson(p) {
  const text = readText(p);
  return text === null ? null : parseJson(text, p);
}

export function writeJson(p, value) {
  writeText(p, `${JSON.stringify(value, null, 2)}\n`);
}

export const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// JSON with object keys sorted at every level, so equal values serialize equally.
export function canon(v) {
  return JSON.stringify(v, (_k, x) => (isObj(x) ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])) : x));
}

const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

// Hash of a JSON-like value; null when the value is absent.
export const hashValue = (v) => (v === undefined ? null : sha(canon(v)));

// Hash of text with line endings normalized; null when the text is absent.
export const hashText = (t) => (t === null || t === undefined ? null : sha(lf(t)));

export const getPath = (obj, path) => path.reduce((o, k) => (isObj(o) ? o[k] : undefined), obj);

export function setPath(obj, path, value) {
  let o = obj;
  for (const k of path.slice(0, -1)) o = isObj(o[k]) ? o[k] : (o[k] = {});
  o[path[path.length - 1]] = value;
}

export function deletePath(obj, path) {
  const parent = getPath(obj, path.slice(0, -1));
  if (isObj(parent)) delete parent[path[path.length - 1]];
}
