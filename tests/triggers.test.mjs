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
test('compare passes a skill only when hits do not drop and false triggers do not rise', () => {
  const r = (h, f) => ({ results: { x: [{ should_trigger: true, hits: h, runs: 1 }, { should_trigger: false, hits: f, runs: 1 }] } });
  assert.equal(compare(r(1, 0), r(1, 0))[0].pass, true);
  assert.equal(compare(r(1, 0), r(0, 0))[0].pass, false);
  assert.equal(compare(r(1, 0), r(1, 1))[0].pass, false);
});
