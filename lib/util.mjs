// Small file and value helpers shared by the installer modules.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';

export const lf = (text) => text.replace(/\r\n/g, '\n');

export function readText(p) {
  return existsSync(p) ? readFileSync(p, 'utf8').replace(/^﻿/, '') : null;
}

export function writeText(p, text) {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text);
}

export function readJson(p) {
  const text = readText(p);
  return text === null ? null : JSON.parse(text);
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
