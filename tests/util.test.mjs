import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inspect } from 'node:util';
import { canon, hashValue, hashText, getPath, setPath, deletePath, lf, readText, readJson, parseJson, writeText, writeJson } from '../lib/util.mjs';
import { tempDir, put } from './helpers.mjs';

test('canon sorts object keys at every level', () => {
  assert.equal(canon({ b: 1, a: { d: 1, c: [2, { z: 1, y: 2 }] } }), '{"a":{"c":[2,{"y":2,"z":1}],"d":1},"b":1}');
});

test('hashValue ignores key order and is null for undefined', () => {
  assert.equal(hashValue({ a: 1, b: 2 }), hashValue({ b: 2, a: 1 }));
  assert.notEqual(hashValue({ a: 1 }), hashValue({ a: 2 }));
  assert.equal(hashValue(undefined), null);
});

test('hashText ignores CRLF vs LF and is null for null', () => {
  assert.equal(hashText('a\r\nb'), hashText('a\nb'));
  assert.equal(hashText(null), null);
  assert.equal(lf('a\r\nb\r\n'), 'a\nb\n');
});

test('setPath creates parents; getPath and deletePath use the same path', () => {
  const o = {};
  setPath(o, ['mcpServers', 'x'], { k: 1 });
  assert.deepEqual(getPath(o, ['mcpServers', 'x']), { k: 1 });
  assert.equal(getPath(o, ['nope', 'x']), undefined);
  deletePath(o, ['mcpServers', 'x']);
  assert.deepEqual(o, { mcpServers: {} });
});

test('readText and readJson drop a leading BOM', () => {
  const p = put(tempDir(), 'bom.json', '\uFEFF{"a":1}');
  assert.equal(readText(p), '{"a":1}');
  assert.deepEqual(readJson(p), { a: 1 });
});

test('readText refuses a file that is not UTF-8 and names it', () => {
  // "{" as UTF-16LE with a byte order mark, the way Windows PowerShell 5.1 writes files.
  const p = put(tempDir(), 'utf16.txt', Buffer.from([0xff, 0xfe, 0x7b, 0x00]));
  assert.throws(() => readText(p), (e) => e.message.includes(p));
});

test('readJson names the file when its content is not valid JSON', () => {
  const p = put(tempDir(), 'broken.json', '{"a":');
  assert.throws(() => readJson(p), (e) => e.message.includes(p));
});

test('a JSON syntax error names the file and the place but never quotes the source', () => {
  const secret = 'sk-live-abc123';
  // V8 quotes a piece of the source in this error and gives no position: the message holds neither.
  const quoted = put(tempDir(), 'quoted.json', `{"TOKEN": ${secret}}`);
  assert.throws(() => readJson(quoted), (e) => {
    assert.match(e.message.slice(quoted.length), /^: invalid JSON( \(line \d+, column \d+\))?$/);
    assert.ok(e.message.startsWith(quoted) && !e.message.includes(secret) && !e.message.includes('TOKEN'));
    // Node prints a cause when an error goes uncaught, and V8's carries a piece of the source.
    assert.equal(e.cause, undefined);
    assert.ok(!inspect(e).includes(secret) && !inspect(e).includes('sk-live'));
    return true;
  });
  const placed = put(tempDir(), 'placed.json', `{\n  "a": 1,\n  "TOKEN" "${secret}"\n}`);
  assert.throws(() => readJson(placed), (e) => e.message === `${placed}: invalid JSON (line 3, column 11)` && e.cause === undefined && !inspect(e).includes(secret));
  const ended = put(tempDir(), 'ended.json', '{"a":');
  assert.throws(() => readJson(ended), (e) => e.message === `${ended}: invalid JSON`);
});

test('where V8 gives only a position, parseJson works out the line and column from it', () => {
  const real = JSON.parse;
  JSON.parse = () => {
    throw new SyntaxError('Unexpected token } in JSON at position 14');
  };
  try {
    assert.throws(() => parseJson('{\n  "a": 1,\n  }', 'f.json'), (e) => e.message === 'f.json: invalid JSON (line 3, column 3)');
  } finally {
    JSON.parse = real;
  }
});

test('readText and readJson return null for a missing file', () => {
  const p = join(tempDir(), 'missing.json');
  assert.equal(readText(p), null);
  assert.equal(readJson(p), null);
});

test('writeText creates missing parent directories', () => {
  const p = join(tempDir(), 'a', 'b', 'c.txt');
  writeText(p, 'x');
  assert.equal(readText(p), 'x');
});

test('writeJson writes two-space JSON with a trailing newline', () => {
  const p = join(tempDir(), 'out.json');
  writeJson(p, { a: 1 });
  assert.equal(readFileSync(p, 'utf8'), '{\n  "a": 1\n}\n');
});

test('hashText treats undefined as absent and hashValue treats null as a value', () => {
  assert.equal(hashText(undefined), null);
  assert.notEqual(hashValue(null), null);
});
