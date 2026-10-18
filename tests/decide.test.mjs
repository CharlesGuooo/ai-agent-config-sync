import test from 'node:test';
import assert from 'node:assert/strict';
import { decide } from '../lib/decide.mjs';
import { loadState, saveState } from '../lib/state.mjs';
import { newRun, tempDir } from './helpers.mjs';

const cases = [
  ['fresh install writes', { current: null, desired: 'a', last: null, written: false }, 'write'],
  ['first run with different content is a conflict', { current: 'b', desired: 'a', last: null, written: false }, 'conflict'],
  ['equal is ok', { current: 'a', desired: 'a', last: null, written: false }, 'ok'],
  ['untouched since last write follows the repo', { current: 'a', desired: 'b', last: 'a', written: true }, 'write'],
  ['changed on the machine is a conflict', { current: 'c', desired: 'b', last: 'a', written: true }, 'conflict'],
  ['deleted on the machine is a conflict', { current: null, desired: 'b', last: 'a', written: true }, 'conflict'],
  ['removing an untouched entry writes', { current: 'a', desired: null, last: 'a', written: true }, 'write'],
  ['removing a changed entry is a conflict', { current: 'c', desired: null, last: 'a', written: true }, 'conflict'],
  ['already gone is ok', { current: null, desired: null, last: 'a', written: true }, 'ok'],
  ['resolution repo writes over anything', { current: 'c', desired: 'b', last: 'a', written: true, resolution: 'repo' }, 'write'],
  ['resolution keep skips', { current: 'c', desired: 'b', last: 'a', written: true, resolution: 'keep' }, 'skip'],
  ['pinned skips', { current: 'c', desired: 'b', last: 'a', written: true, pinned: true }, 'skip'],
  ['pinned yields to resolution repo', { current: 'c', desired: 'b', last: 'a', written: true, pinned: true, resolution: 'repo' }, 'write'],
];

for (const [name, input, expected] of cases) {
  test(`decide: ${name}`, () => assert.equal(decide(input), expected));
}

test('run.step records what it wrote and reports conflicts', () => {
  const run = newRun();
  run.agent = 'claude';
  assert.equal(run.step('x', { kind: 'json' }, null, 'h1', 'set x'), true);
  assert.deepEqual(run.state.entries.x, { agent: 'claude', kind: 'json', hash: 'h1' });
  assert.equal(run.step('x', { kind: 'json' }, 'other', 'h2', 'set x'), false);
  assert.deepEqual(run.report.conflicts, [{ id: 'x', msg: 'set x' }]);
  assert.ok(run.seen.has('x'));
});

test('run.step with keep pins the entry; with desired null it forgets it', () => {
  const run = newRun({ resolutions: { y: 'keep' } });
  run.agent = 'pi';
  run.state.entries.y = { agent: 'pi', kind: 'json', hash: 'old' };
  assert.equal(run.step('y', { kind: 'json' }, 'mine', 'new', 'set y'), false);
  assert.equal(run.state.entries.y.pinned, true);
  const gone = newRun();
  gone.state.entries.z = { agent: 'pi', kind: 'json', hash: 'h' };
  assert.equal(gone.step('z', { kind: 'json' }, 'h', null, 'remove z'), true);
  assert.equal(gone.state.entries.z, undefined);
});

test('state round-trips through <local>/state.json', () => {
  const local = tempDir();
  assert.deepEqual(loadState(local), { version: 1, agents: [], packs: [], entries: {} });
  saveState(local, { version: 1, agents: ['pi'], packs: ['dev'], entries: {} });
  assert.deepEqual(loadState(local).agents, ['pi']);
});
