import test from 'node:test';
import assert from 'node:assert/strict';
import { invokedSkill, compare } from '../evals/triggers/run.mjs';

const line = (o) => JSON.stringify(o);
const assistant = (...content) => line({ type: 'assistant', message: { content } });
test('the first tool call decides whether a skill was invoked', () => {
  assert.equal(invokedSkill([line({ type: 'system' }), assistant({ type: 'text', text: 'hi' })]), undefined);
  assert.equal(invokedSkill([assistant({ type: 'tool_use', name: 'Skill', input: { skill: 'pdf' } })]), 'pdf');
  assert.equal(invokedSkill([assistant({ type: 'tool_use', name: 'Read', input: {} }), assistant({ type: 'tool_use', name: 'Skill', input: { skill: 'pdf' } })]), null);
  assert.equal(invokedSkill(['not json', assistant({ type: 'tool_use', name: 'Skill', input: { skill: 'handoff' } })]), 'handoff');
});

const r = (h, f, runs = 1, extra = {}) => ({ results: { x: [{ should_trigger: true, hits: h, runs, ...extra }, { should_trigger: false, hits: f, runs }] } });
test('compare passes a skill only when the should-rate does not drop and the false-rate does not rise', () => {
  assert.equal(compare(r(1, 0), r(1, 0))[0].pass, true);
  assert.equal(compare(r(1, 0), r(0, 0))[0].pass, false);
  assert.equal(compare(r(1, 0), r(1, 1))[0].pass, false);
});
test('compare works on rates, so a 3-run file can be compared with a 1-run file', () => {
  assert.equal(compare(r(1, 0, 1), r(3, 0, 3))[0].pass, true);
  assert.deepEqual(compare(r(1, 0, 1), r(3, 0, 3))[0].should, [1, 1]);
  assert.equal(compare(r(1, 0, 1), r(2, 0, 3))[0].pass, false); // 100% -> 67%: raw counts would have passed
  assert.equal(compare(r(0, 0, 1), r(0, 1, 3))[0].pass, false);
  assert.equal(compare(r(0, 1, 1), r(0, 3, 3))[0].pass, true); // same false rate
});
test('compare reports a skill inconclusive when either file has errors or timeouts', () => {
  const a = compare(r(1, 0), r(1, 0, 1, { errors: 1 }))[0];
  assert.equal(a.inconclusive, true);
  assert.equal(a.pass, false);
  assert.equal(compare(r(1, 0, 1, { timeouts: 1 }), r(1, 0))[0].inconclusive, true);
  assert.equal(compare(r(1, 0), r(1, 0))[0].inconclusive, false);
});
