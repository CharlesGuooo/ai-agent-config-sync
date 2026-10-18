// Just enough TOML for Codex's config.toml: split the file into tables by
// header, read the [mcp_servers.<name>] tables this repo owns, and rewrite only
// those. Codex re-serializes the file itself (sorts tables, drops comments,
// writes 30 as 30.0), so ownership checks compare parsed values, never text.
// Every other line is carried over as it stands, with its own line ending.
import { readText, writeText, hashValue, isObj, setPath, lf } from './util.mjs';

// "a.'b c'.\"d\"" -> ['a', 'b c', 'd']
export function parseKey(s) {
  const out = [];
  let i = 0;
  const space = () => {
    while (s[i] === ' ' || s[i] === '\t') i++;
  };
  while (i < s.length) {
    space();
    if (s[i] === '"') {
      let v = '';
      for (i++; i < s.length && s[i] !== '"'; i++) v += s[i] === '\\' ? s[++i] : s[i];
      out.push(v);
      i++;
    } else if (s[i] === "'") {
      const j = s.indexOf("'", i + 1);
      if (j === -1) throw new Error(`bad TOML key: ${s}`);
      out.push(s.slice(i + 1, j));
      i = j + 1;
    } else {
      const m = /^[A-Za-z0-9_-]+/.exec(s.slice(i));
      if (!m) throw new Error(`bad TOML key: ${s}`);
      out.push(m[0]);
      i += m[0].length;
    }
    space();
    if (s[i] === '.') i++;
  }
  return out;
}

// Tracks strings and brackets across lines, so the "[" that opens a continuation
// line inside a multi-line array is never taken for a table header.
function scan(line, st) {
  let i = 0;
  while (i < line.length) {
    if (st.multi) {
      const j = line.indexOf(st.multi, i);
      if (j === -1) return;
      i = j + 3;
      st.multi = null;
      continue;
    }
    const c = line[i];
    if (c === '#') return;
    if (line.startsWith('"""', i) || line.startsWith("'''", i)) {
      st.multi = line.slice(i, i + 3);
      i += 3;
      continue;
    }
    if (c === '"') {
      for (i++; i < line.length && line[i] !== '"'; i += line[i] === '\\' ? 2 : 1);
      i++;
      continue;
    }
    if (c === "'") {
      const j = line.indexOf("'", i + 1);
      i = j === -1 ? line.length : j + 1;
      continue;
    }
    if (c === '[') st.depth++;
    else if (c === ']') st.depth = Math.max(0, st.depth - 1);
    i++;
  }
}

const HEADER = /^\s*(\[\[?)\s*(.+?)\s*\]\]?\s*(?:#.*)?$/;

// The file as a list of tables { header, path, array, lines }; the first entry
// (header null) holds the lines before any table. joinSegments() restores the text.
// A line keeps its "\r", so the text comes back byte for byte whatever line endings the file mixes.
export function segments(text) {
  const segs = [{ header: null, path: [], array: false, lines: [] }];
  const st = { multi: null, depth: 0 };
  for (const line of text.split('\n')) {
    const code = line.replace(/\r$/, '');
    const m = !st.multi && st.depth === 0 ? HEADER.exec(code) : null;
    if (m) {
      segs.push({ header: line, path: parseKey(m[2]), array: m[1] === '[[', lines: [] });
      continue;
    }
    segs[segs.length - 1].lines.push(line);
    scan(code, st);
  }
  return segs;
}

export const joinSegments = (segs) => segs.flatMap((s) => (s.header === null ? s.lines : [s.header, ...s.lines])).join('\n');

const blankOrComment = (line) => /^\s*(?:#.*)?$/.test(line.trimEnd());

// What a dropped table leaves behind. Comments after its last key sit above whatever table comes next, so they are
// the user's and stay; the blank lines before them go with the table.
function leftover(s) {
  const last = s.lines.findLastIndex((l) => !blankOrComment(l));
  const first = s.lines.findIndex((l, i) => i > last && l.trimStart().startsWith('#'));
  return first === -1 ? [] : [{ header: null, path: [], array: false, lines: s.lines.slice(first) }];
}

const eolOf = (text) => (text.includes('\r\n') ? '\r\n' : '\n');

// Ends the text with one line break, however the last dropped table left it (no break, or a lone "\r"). The last
// line keeps its own spaces and its own line break; blank lines after it go.
function closed(text, eol) {
  const t = text.replace(/\r$/, '');
  let end = t.length;
  while (end > 0 && ' \t\r\n'.includes(t[end - 1])) end--;
  const br = t.indexOf('\n', end);
  return br === -1 ? t + eol : t.slice(0, br + 1);
}

function unescape(s) {
  const map = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', '"': '"', '\\': '\\' };
  return s.replace(/\\(u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|.)/g, (_, e) => (e.length > 1 ? String.fromCodePoint(parseInt(e.slice(1), 16)) : map[e] ?? e));
}

// key = value lines: strings, numbers, booleans, arrays and inline tables.
export function parseBody(text) {
  let i = 0;
  const out = {};
  const fail = () => {
    throw new Error(`unsupported TOML near: ${text.slice(i, i + 40)}`);
  };
  const skip = (newlines) => {
    for (;;) {
      while (i < text.length && (text[i] === ' ' || text[i] === '\t' || text[i] === '\r' || (newlines && text[i] === '\n'))) i++;
      if (text[i] !== '#') return;
      while (i < text.length && text[i] !== '\n') i++;
    }
  };
  const pair = (obj) => {
    const eq = text.indexOf('=', i);
    if (eq === -1) fail();
    const key = parseKey(text.slice(i, eq).trim());
    i = eq + 1;
    setPath(obj, key, value());
  };
  const value = () => {
    skip(true);
    if (text.startsWith('"""', i) || text.startsWith("'''", i)) {
      const q = text.slice(i, i + 3);
      const j = text.indexOf(q, i + 3);
      if (j === -1) fail();
      const raw = text.slice(i + 3, j).replace(/^\n/, '');
      i = j + 3;
      return q === '"""' ? unescape(raw) : raw;
    }
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') j += text[j] === '\\' ? 2 : 1;
      if (j >= text.length) fail();
      const s = unescape(text.slice(i + 1, j));
      i = j + 1;
      return s;
    }
    if (c === "'") {
      const j = text.indexOf("'", i + 1);
      if (j === -1) fail();
      const s = text.slice(i + 1, j);
      i = j + 1;
      return s;
    }
    if (c === '[') {
      i++;
      const arr = [];
      for (;;) {
        skip(true);
        if (text[i] === ']') {
          i++;
          return arr;
        }
        if (i >= text.length) fail();
        arr.push(value());
        skip(true);
        if (text[i] === ',') i++;
      }
    }
    if (c === '{') {
      i++;
      const obj = {};
      for (;;) {
        skip(false);
        if (text[i] === '}') {
          i++;
          return obj;
        }
        if (i >= text.length) fail();
        pair(obj);
        skip(false);
        if (text[i] === ',') i++;
      }
    }
    if (text.startsWith('true', i)) {
      i += 4;
      return true;
    }
    if (text.startsWith('false', i)) {
      i += 5;
      return false;
    }
    const m = /^[+-]?\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?/.exec(text.slice(i));
    if (!m) fail();
    i += m[0].length;
    return Number(m[0].replace(/_/g, ''));
  };
  for (;;) {
    skip(true);
    if (i >= text.length) return out;
    pair(out);
  }
}

// A multi-line string is read with LF, as TOML allows, so a CRLF file means the same as an LF one.
const tableBody = (s) => parseBody(lf(s.lines.join('\n')));

const ownTable = (s, name) => !s.array && s.path[0] === 'mcp_servers' && s.path[1] === name;

// [mcp_servers.<name>] together with its sub-tables, or undefined.
export function readMcpTable(text, name) {
  let value;
  for (const s of segments(text)) {
    if (!ownTable(s, name)) continue;
    value ??= {};
    const body = tableBody(s);
    if (s.path.length === 2) Object.assign(value, body);
    else setPath(value, s.path.slice(2), body);
  }
  return value;
}

const bare = (k) => (/^[A-Za-z0-9_-]+$/.test(k) ? k : JSON.stringify(k));

function tomlValue(v) {
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return `[${v.map(tomlValue).join(', ')}]`;
  throw new Error(`cannot write TOML value ${JSON.stringify(v)}`);
}

export function renderMcpTable(name, value) {
  const head = `mcp_servers.${bare(name)}`;
  const lines = [`[${head}]`];
  for (const [k, v] of Object.entries(value)) if (!isObj(v)) lines.push(`${bare(k)} = ${tomlValue(v)}`);
  for (const [k, v] of Object.entries(value)) {
    if (!isObj(v)) continue;
    lines.push('', `[${head}.${bare(k)}]`);
    for (const [kk, vv] of Object.entries(v)) lines.push(`${bare(kk)} = ${tomlValue(vv)}`);
  }
  return lines.join('\n');
}

// Replaces the named [mcp_servers.*] tables (undefined removes one); every other
// line of the file stays exactly as it was. New tables go at the end, in the file's line ending.
export function writeMcpTables(text, tables) {
  const names = Object.keys(tables);
  const eol = eolOf(text);
  const kept = segments(text).flatMap((s) => (names.some((n) => ownTable(s, n)) ? leftover(s) : [s]));
  let out = closed(joinSegments(kept), eol);
  // JSON.stringify escapes the newlines inside strings, so every raw newline in a rendering is layout.
  for (const [name, value] of Object.entries(tables)) if (value !== undefined) out += `${eol}${renderMcpTable(name, value).replace(/\n/g, eol)}${eol}`;
  return out;
}

// Drops [[hooks.<Event>]] groups, with their [[hooks.<Event>.hooks]] entries,
// when one of those entries runs a command matching `re`.
export function removeHookGroups(text, re) {
  const segs = segments(text);
  const drop = new Set();
  segs.forEach((s, i) => {
    if (!s.array || s.path.length !== 2 || s.path[0] !== 'hooks') return;
    const kids = [];
    for (let j = i + 1; j < segs.length && segs[j].array && segs[j].path.length === 3 && segs[j].path[0] === 'hooks' && segs[j].path[1] === s.path[1] && segs[j].path[2] === 'hooks'; j++) kids.push(j);
    if (kids.some((j) => re.test(String(tableBody(segs[j]).command ?? '')))) for (const k of [i, ...kids]) drop.add(k);
  });
  if (!drop.size) return text;
  const out = joinSegments(segs.flatMap((s, k) => (drop.has(k) ? leftover(s) : [s])));
  return drop.has(segs.length - 1) ? closed(out, eolOf(text)) : out;
}

// A server the repo writes must not already stand in a shape that rewriting does not reach: dotted keys or an inline
// table (at the top of the file or under [mcp_servers]), or an array of tables. A [mcp_servers.<name>] table added
// next to it would declare the server twice and Codex would refuse the whole file, so the run stops instead.
function refuseOtherShapes(text, names) {
  if (!names.length) return;
  const segs = segments(text);
  const refuse = (what) => {
    throw new Error(`${what}; this installer edits [mcp_servers.<name>] tables only, so write the server as one first`);
  };
  // The pattern only decides whether the top of the file is worth reading; a line of a multi-line string can look the same.
  if (/^[ \t]*["']?mcp_servers["']?[ \t]*[.=]/m.test(segs[0].lines.join('\n')) && Object.hasOwn(tableBody(segs[0]), 'mcp_servers')) {
    refuse('mcp_servers is written as dotted keys or an inline table at the top of the file');
  }
  for (const s of segs) {
    if (s.path[0] !== 'mcp_servers') continue;
    if (s.array) {
      if (s.path.length === 1 || names.includes(s.path[1])) refuse(`[[${s.path.join('.')}]] is an array of tables`);
    } else if (s.path.length === 1) {
      const have = tableBody(s);
      const name = names.find((n) => Object.hasOwn(have, n));
      if (name !== undefined) refuse(`mcp_servers.${name} is written as an inline table or dotted keys under [mcp_servers]`);
    }
  }
}

// servers: [{ id, name, value }] (value undefined removes it) or [{ id, skip: true }].
export function applyCodexMcp({ file, servers }, run) {
  const text = readText(file) ?? '';
  // Read and checked before anything is recorded, so a file this code cannot handle leaves the state alone.
  const current = {};
  try {
    refuseOtherShapes(text, servers.filter((s) => !s.skip && s.value !== undefined).map((s) => s.name));
    for (const s of servers) if (!s.skip) current[s.name] = readMcpTable(text, s.name);
  } catch (e) {
    throw new Error(`${file}: ${e.message}`, { cause: e });
  }
  const changes = {};
  for (const s of servers) {
    if (s.skip) {
      run.seen.add(s.id);
      continue;
    }
    const label = `${s.value === undefined ? 'remove' : 'set'} [mcp_servers.${s.name}] in ${file}`;
    if (run.step(s.id, { kind: 'toml', file, name: s.name }, hashValue(current[s.name]), hashValue(s.value), label)) changes[s.name] = s.value;
  }
  if (Object.keys(changes).length && !run.dryRun) writeText(file, writeMcpTables(text, changes));
}
