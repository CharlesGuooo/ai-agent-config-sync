// Just enough TOML for Codex's config.toml: split the file into tables by
// header, read the [mcp_servers.<name>] tables this repo owns, and rewrite only
// those. Codex re-serializes the file itself (sorts tables, drops comments,
// writes 30 as 30.0), so ownership checks compare parsed values, never text.
// Every other line is carried over as it stands, with its own line ending.
// Errors say which line is at fault and never quote the file: a config can hold tokens, and an error ends up in a
// terminal or a log.
import { readText, writeText, hashValue, isObj, getPath, setPath, lf } from './util.mjs';

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
      const start = i + 1;
      for (i++; i < s.length && s[i] !== '"'; i += s[i] === '\\' ? 2 : 1);
      if (i >= s.length) throw new Error('bad TOML key');
      try {
        out.push(unescape(s.slice(start, i)));
      } catch {
        throw new Error('bad TOML key');
      }
      i++;
    } else if (s[i] === "'") {
      const j = s.indexOf("'", i + 1);
      if (j === -1) throw new Error('bad TOML key');
      out.push(s.slice(i + 1, j));
      i = j + 1;
    } else {
      const m = /^[A-Za-z0-9_-]+/.exec(s.slice(i));
      if (!m) throw new Error('bad TOML key');
      out.push(m[0]);
      i += m[0].length;
    }
    space();
    if (s[i] === '.') i++;
  }
  return out;
}

// Where a multi-line string ends, looking from `from` (just after its opening delimiter): { start, end } of the run of
// quotes that closes it, or null. In a """ string a backslash hides the next character, so \""" is content and does
// not close it. One or two quotes just inside the delimiter are content too, so the run is three to five long and the
// body ends three quotes before the run does.
function multiEnd(s, from, q) {
  let j = from;
  while (j < s.length && !s.startsWith(q, j)) j += q === '"""' && s[j] === '\\' ? 2 : 1;
  if (j >= s.length) return null;
  let end = j + 3;
  while (s[end] === q[0]) end++;
  return { start: end - 3, end };
}

// Tracks strings and brackets across lines, so the "[" that opens a continuation
// line inside a multi-line array is never taken for a table header.
function scan(line, st) {
  let i = 0;
  while (i < line.length) {
    if (st.multi) {
      const e = multiEnd(line, i, st.multi);
      if (!e) return;
      i = e.end;
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

// The file as a list of tables { header, path, array, lines, from }; the first entry
// (header null) holds the lines before any table. joinSegments() restores the text, and `from` is the file's line
// number of lines[0], for error messages.
// A line keeps its "\r", so the text comes back byte for byte whatever line endings the file mixes.
export function segments(text) {
  const segs = [{ header: null, path: [], array: false, lines: [], from: 1 }];
  const st = { multi: null, depth: 0 };
  let n = 0;
  for (const line of text.split('\n')) {
    n++;
    const code = line.replace(/\r$/, '');
    const m = !st.multi && st.depth === 0 ? HEADER.exec(code) : null;
    if (m) {
      let path;
      try {
        path = parseKey(m[2]);
      } catch {
        throw new Error(`line ${n}: bad TOML table name`);
      }
      segs.push({ header: line, path, array: m[1] === '[[', lines: [], from: n + 1 });
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
// line keeps its own spaces and its own line break; blank lines after it go. Text that is only whitespace becomes
// empty, so a new or emptied file never starts with blank lines.
function closed(text, eol) {
  const t = text.replace(/\r$/, '');
  let end = t.length;
  while (end > 0 && ' \t\r\n'.includes(t[end - 1])) end--;
  if (end === 0) return '';
  const br = t.indexOf('\n', end);
  return br === -1 ? t + eol : t.slice(0, br + 1);
}

function unescape(s) {
  const map = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', '"': '"', '\\': '\\' };
  return s.replace(/\\(u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|.)/g, (_, e) => (e.length > 1 ? String.fromCodePoint(parseInt(e.slice(1), 16)) : map[e] ?? e));
}

// Names that would reach into Object.prototype when a dotted key or a table name is stored as a path in a plain object.
const UNSAFE = new Set(['__proto__', 'constructor', 'prototype']);

// key = value lines: strings, numbers, booleans, arrays and inline tables. `first` is the file's line number of the
// text's first line, so a failure can say which line it is on; it never quotes the text.
export function parseBody(text, first = 1) {
  let i = 0;
  const out = {};
  const fail = (what = 'unsupported TOML') => {
    throw new Error(`line ${first + text.slice(0, i).split('\n').length - 1}: ${what}`);
  };
  // A \U escape can name something that is not a character.
  const unescapeAt = (s) => {
    try {
      return unescape(s);
    } catch {
      return fail('bad TOML escape');
    }
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
    let key;
    try {
      key = parseKey(text.slice(i, eq).trim());
    } catch {
      fail('bad TOML key');
    }
    const unsafe = key.find((k) => UNSAFE.has(k));
    if (unsafe !== undefined) fail(`a key named ${unsafe} is not allowed`);
    i = eq + 1;
    setPath(obj, key, value());
  };
  const value = () => {
    skip(true);
    if (text.startsWith('"""', i) || text.startsWith("'''", i)) {
      const q = text.slice(i, i + 3);
      const e = multiEnd(text, i + 3, q);
      if (!e) fail();
      const raw = text.slice(i + 3, e.start).replace(/^\n/, '');
      i = e.end;
      return q === '"""' ? unescapeAt(raw) : raw;
    }
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') j += text[j] === '\\' ? 2 : 1;
      if (j >= text.length) fail();
      const s = unescapeAt(text.slice(i + 1, j));
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
const tableBody = (s) => parseBody(lf(s.lines.join('\n')), s.from);

const ownTable = (s, name) => !s.array && s.path[0] === 'mcp_servers' && s.path[1] === name;

// [mcp_servers.<name>] together with its sub-tables, or undefined.
export function readMcpTable(text, name) {
  let value;
  for (const s of segments(text)) {
    if (!ownTable(s, name)) continue;
    const sub = s.path.slice(2);
    const unsafe = sub.find((k) => UNSAFE.has(k));
    if (unsafe !== undefined) throw new Error(`line ${s.from - 1}: a table named ${unsafe} is not allowed`);
    value ??= {};
    const body = tableBody(s);
    if (!sub.length) Object.assign(value, body);
    else {
      // [a.b.c] may come before [a.b], so what an earlier sub-table put there is added to, not replaced.
      if (!isObj(getPath(value, sub))) setPath(value, sub, {});
      Object.assign(getPath(value, sub), body);
    }
  }
  return value;
}

// A basic string. JSON leaves DEL as it is, which TOML does not allow, and a lone surrogate has no UTF-8 form.
// `what` says which key to blame without showing the text.
function quote(s, what) {
  if (!s.isWellFormed()) throw new Error(`cannot write ${what} as TOML (text that is not well-formed Unicode)`);
  return JSON.stringify(s).replace(/\x7f/g, String.fromCharCode(92) + 'u007f');
}

const bare = (k, what) => (/^[A-Za-z0-9_-]+$/.test(k) ? k : quote(k, `a key of ${what}`));

// `where` names the key being written, so an error can say which one without showing its value.
function tomlValue(v, where) {
  if (typeof v === 'string') return quote(v, where);
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return `[${v.map((x, i) => tomlValue(x, `${where}[${i}]`)).join(', ')}]`;
  throw new Error(`cannot write ${where} as TOML (${v === null ? 'null' : typeof v})`);
}

// A key whose value is undefined is left out, as hashValue leaves it out, so what is written reads back equal.
export function renderMcpTable(name, value) {
  const head = `mcp_servers.${bare(name, 'mcp_servers')}`;
  const at = `mcp_servers.${name}`;
  const lines = [`[${head}]`];
  for (const [k, v] of Object.entries(value)) if (v !== undefined && !isObj(v)) lines.push(`${bare(k, at)} = ${tomlValue(v, `${at}.${k}`)}`);
  for (const [k, v] of Object.entries(value)) {
    if (!isObj(v)) continue;
    lines.push('', `[${head}.${bare(k, at)}]`);
    for (const [kk, vv] of Object.entries(v)) if (vv !== undefined) lines.push(`${bare(kk, `${at}.${k}`)} = ${tomlValue(vv, `${at}.${k}.${kk}`)}`);
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
  for (const [name, value] of Object.entries(tables)) {
    if (value !== undefined) out += `${out === '' ? '' : eol}${renderMcpTable(name, value).replace(/\n/g, eol)}${eol}`;
  }
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
  const refuse = (line, what) => {
    throw new Error(`line ${line}: ${what}; this installer edits [mcp_servers.<name>] tables only, so write the server as one first`);
  };
  // The pattern only decides whether the top of the file is worth reading; a line of a multi-line string can look the same.
  const top = segs[0].lines.join('\n');
  const hit = /^[ \t]*["']?mcp_servers["']?[ \t]*[.=]/m.exec(top);
  if (hit && Object.hasOwn(tableBody(segs[0]), 'mcp_servers')) {
    refuse(top.slice(0, hit.index).split('\n').length, 'mcp_servers is written as dotted keys or an inline table');
  }
  for (const s of segs) {
    if (s.path[0] !== 'mcp_servers') continue;
    if (s.array) {
      const own = names.find((n) => n === s.path[1]);
      if (s.path.length === 1) refuse(s.from - 1, 'mcp_servers is an array of tables');
      if (own !== undefined) refuse(s.from - 1, `mcp_servers.${own} is written with an array of tables`);
    } else if (s.path.length === 1) {
      const have = tableBody(s);
      const name = names.find((n) => Object.hasOwn(have, n));
      if (name !== undefined) refuse(s.from - 1, `mcp_servers.${name} is written as an inline table or dotted keys under [mcp_servers]`);
    }
  }
}

// servers: [{ id, name, value }] (value undefined removes it) or [{ id, skip: true }].
export function applyCodexMcp({ file, servers }, run) {
  const text = readText(file) ?? '';
  // Everything that can fail is done before anything is recorded, so a dry run fails the same way and the state stays
  // as it was: the file is checked and read, and each value is rendered (the text is thrown away) to see it can be written.
  const current = {};
  try {
    refuseOtherShapes(text, servers.filter((s) => !s.skip && s.value !== undefined).map((s) => s.name));
    for (const s of servers) {
      if (s.skip) continue;
      current[s.name] = readMcpTable(text, s.name);
      if (s.value !== undefined) renderMcpTable(s.name, s.value);
    }
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
