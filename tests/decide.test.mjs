import test from 'node:test';
import assert from 'node:assert/strict';
import { decide } from '../lib/decide.mjs';
import { loadState, saveState } from '../lib/state.mjs';
import { emptyState, newRun, tempDir } from './helpers.mjs';

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
  ['pinned but already equal is ok', { current: 'b', desired: 'b', last: 'a', written: true, pinned: true }, 'ok'],
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

test('a conflict leaves the recorded entry as it was', () => {
  const run = newRun();
  run.agent = 'claude';
  run.step('x', { kind: 'json' }, null, 'h1', 'set x');
  assert.equal(run.step('x', { kind: 'json' }, 'other', 'h2', 'set x'), false);
  assert.deepEqual(run.state.entries.x, { agent: 'claude', kind: 'json', hash: 'h1' });
});

test('run.resolution gives the choice for the id, else the one for all', () => {
  const run = newRun({ resolutions: { a: 'keep', all: 'repo' } });
  assert.equal(run.resolution('a'), 'keep');
  assert.equal(run.resolution('b'), 'repo');
  assert.equal(newRun().resolution('b'), undefined);
});

test('over several runs: conflict, keep, a skipped repo update, then repo lifts the pin', () => {
  const state = emptyState();
  const hook = (command) => ({ kind: 'hook', command });
  const pass = (resolutions, current, desired, meta) => {
    const run = newRun({ state, resolutions });
    run.agent = 'claude';
    return { wrote: run.step('x', meta, current, desired, 'set x'), report: run.report };
  };

  assert.equal(pass(undefined, null, 'h1', hook('old')).wrote, true);
  const written = { agent: 'claude', kind: 'hook', command: 'old', hash: 'h1' };
  assert.deepEqual(state.entries.x, written);

  // The user edits the machine copy while the repo moves on: a conflict, and nothing recorded.
  let r = pass(undefined, 'mine', 'h2', hook('old'));
  assert.equal(r.wrote, false);
  assert.deepEqual(r.report.conflicts, [{ id: 'x', msg: 'set x' }]);
  assert.deepEqual(state.entries.x, written);

  // Keep pins it. Hash and identity stay, though this run describes the hook with a new command.
  r = pass({ x: 'keep' }, 'mine', 'h2', hook('new'));
  assert.equal(r.wrote, false);
  assert.equal(r.report.notes.length, 1);
  assert.deepEqual(state.entries.x, { ...written, pinned: true });

  // A later repo change is skipped without a word.
  r = pass(undefined, 'mine', 'h3', hook('new'));
  assert.equal(r.wrote, false);
  assert.deepEqual(r.report, { changes: [], conflicts: [], warnings: [], notes: [] });
  assert.deepEqual(state.entries.x, { ...written, pinned: true });

  // A choice for this id lifts the pin and writes.
  r = pass({ x: 'repo' }, 'mine', 'h3', hook('new'));
  assert.equal(r.wrote, true);
  assert.deepEqual(r.report.changes, ['set x']);
  assert.deepEqual(state.entries.x, { agent: 'claude', kind: 'hook', command: 'new', hash: 'h3' });
});

test('resolve keep all pins only the conflicts; plain updates and fresh items still go through', () => {
  const run = newRun({ resolutions: { all: 'keep' } });
  run.agent = 'claude';
  const meta = { kind: 'json' };
  run.state.entries.update = { agent: 'claude', kind: 'json', hash: 'u1' };
  run.state.entries.edited = { agent: 'claude', kind: 'json', hash: 'e1' };
  assert.equal(run.step('update', meta, 'u1', 'u2', 'set update'), true);
  assert.equal(run.step('fresh', meta, null, 'f1', 'set fresh'), true);
  assert.equal(run.step('edited', meta, 'mine', 'e2', 'set edited'), false);
  assert.equal(run.step('first', meta, 'mine', 'n1', 'set first'), false);
  assert.deepEqual(run.state.entries.update, { agent: 'claude', kind: 'json', hash: 'u2' });
  assert.deepEqual(run.state.entries.fresh, { agent: 'claude', kind: 'json', hash: 'f1' });
  assert.deepEqual(run.state.entries.edited, { agent: 'claude', kind: 'json', hash: 'e1', pinned: true });
  assert.deepEqual(run.state.entries.first, { agent: 'claude', kind: 'json', hash: null, pinned: true });
  assert.deepEqual(run.report.changes, ['set update', 'set fresh']);
  assert.deepEqual(run.report.conflicts, []);
  assert.equal(run.report.notes.length, 2);
});

test('resolve repo all overwrites conflicts but leaves a pinned item alone', () => {
  const run = newRun({ resolutions: { all: 'repo' } });
  run.agent = 'claude';
  const meta = { kind: 'json' };
  run.state.entries.pinned = { agent: 'claude', kind: 'json', hash: 'p1', pinned: true };
  run.state.entries.edited = { agent: 'claude', kind: 'json', hash: 'e1' };
  assert.equal(run.step('pinned', meta, 'mine', 'p2', 'set pinned'), false);
  assert.equal(run.step('edited', meta, 'mine', 'e2', 'set edited'), true);
  assert.equal(run.step('first', meta, 'mine', 'n1', 'set first'), true);
  assert.deepEqual(run.state.entries.pinned, { agent: 'claude', kind: 'json', hash: 'p1', pinned: true });
  assert.deepEqual(run.state.entries.edited, { agent: 'claude', kind: 'json', hash: 'e2' });
  assert.deepEqual(run.state.entries.first, { agent: 'claude', kind: 'json', hash: 'n1' });
  assert.deepEqual(run.report.changes, ['set edited', 'set first']);
  assert.deepEqual(run.report.conflicts, []);
});

test('a pinned item whose machine copy now equals the repo is managed again', () => {
  const state = emptyState();
  state.entries.x = { agent: 'claude', kind: 'json', hash: 'old', pinned: true };
  state.entries.gone = { agent: 'claude', kind: 'json', hash: 'old', pinned: true };
  const run = newRun({ state });
  run.agent = 'claude';
  assert.equal(run.step('x', { kind: 'json' }, 'same', 'same', 'set x'), false);
  assert.equal(run.step('gone', { kind: 'json' }, null, null, 'remove gone'), false);
  assert.deepEqual(state.entries.x, { agent: 'claude', kind: 'json', hash: 'same' });
  assert.equal(state.entries.gone, undefined);
  assert.deepEqual(run.report, { changes: [], conflicts: [], warnings: [], notes: [] });
  // No longer pinned: the next repo change is applied.
  const next = newRun({ state });
  next.agent = 'claude';
  assert.equal(next.step('x', { kind: 'json' }, 'same', 'newer', 'set x'), true);
});

test('a dry run reports and returns what a real run would but leaves the state alone', () => {
  const state = emptyState();
  for (const id of ['w', 'r', 'k']) state.entries[id] = { agent: 'claude', kind: 'json', hash: `${id}1` };
  const before = structuredClone(state.entries);
  const run = newRun({ state, dryRun: true, resolutions: { k: 'keep' } });
  run.agent = 'claude';
  const meta = { kind: 'json' };
  assert.equal(run.step('w', meta, 'w1', 'w2', 'set w'), true);
  assert.equal(run.step('r', meta, 'r1', null, 'remove r'), true);
  assert.equal(run.step('k', meta, 'mine', 'k2', 'set k'), false);
  assert.equal(run.step('n', meta, null, 'n1', 'set n'), true);
  assert.deepEqual(state.entries, before);
  assert.deepEqual(run.report.changes, ['set w', 'remove r', 'set n']);
  assert.equal(run.report.notes.length, 1);
  assert.deepEqual([...run.seen], ['w', 'r', 'k', 'n']);
});

test('state round-trips through <local>/state.json', () => {
  const local = tempDir();
  assert.deepEqual(loadState(local), { version: 1, agents: [], packs: [], entries: {} });
  saveState(local, { version: 1, agents: ['pi'], packs: ['dev'], entries: {} });
  assert.deepEqual(loadState(local).agents, ['pi']);
});
