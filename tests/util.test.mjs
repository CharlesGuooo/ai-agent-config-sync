import test from 'node:test';
import assert from 'node:assert/strict';
import { canon, hashValue, hashText, getPath, setPath, deletePath, lf } from '../lib/util.mjs';

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
