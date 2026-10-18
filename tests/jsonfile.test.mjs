import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tempDir, newRun } from './helpers.mjs';
import { applyJson, removeJson } from '../lib/jsonfile.mjs';

const read = (f) => JSON.parse(readFileSync(f, 'utf8'));
const memory = (args = ['-y', 'm']) => ({ id: 'claude:mcp:memory', path: ['mcpServers', 'memory'], value: { command: 'npx', args } });

test('sets owned entries and keeps everything else in the file', () => {
  const file = join(tempDir(), '.claude.json');
  writeFileSync(file, JSON.stringify({ numStartups: 3, mcpServers: { flaui: { command: 'x.exe' } } }));
  applyJson({ file, entries: [memory()] }, newRun());
  assert.deepEqual(read(file), { numStartups: 3, mcpServers: { flaui: { command: 'x.exe' }, memory: { command: 'npx', args: ['-y', 'm'] } } });
});

test('an untouched entry follows the repo; a machine edit is a conflict', () => {
  const file = join(tempDir(), 'mcp.json');
  const run = newRun();
  applyJson({ file, entries: [memory()] }, run);
  applyJson({ file, entries: [memory(['-y', 'm2'])] }, newRun({ state: run.state }));
  assert.deepEqual(read(file).mcpServers.memory.args, ['-y', 'm2']);
  const edited = read(file);
  edited.mcpServers.memory.args.push('--mine');
  writeFileSync(file, JSON.stringify(edited));
  const conflicted = newRun({ state: run.state });
  applyJson({ file, entries: [memory(['-y', 'm3'])] }, conflicted);
  assert.deepEqual(conflicted.report.conflicts.map((c) => c.id), ['claude:mcp:memory']);
  assert.ok(read(file).mcpServers.memory.args.includes('--mine'));
});

test('hooks: adds a group, follows a moved command, leaves other groups alone', () => {
  const file = join(tempDir(), 'settings.json');
  writeFileSync(file, JSON.stringify({ hooks: { SessionStart: [{ matcher: '', hooks: [{ type: 'command', command: 'any-buddy apply --silent' }] }] } }));
  const run = newRun();
  applyJson({ file, hooks: [{ id: 'g', event: 'PreToolUse', matcher: 'Bash', command: 'node "/old/guard.mjs"' }] }, run);
  applyJson({ file, hooks: [{ id: 'g', event: 'PreToolUse', matcher: 'Bash', command: 'node "/new/guard.mjs"' }] }, newRun({ state: run.state }));
  const obj = read(file);
  assert.deepEqual(obj.hooks.PreToolUse, [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'node "/new/guard.mjs"' }] }]);
  assert.equal(obj.hooks.SessionStart.length, 1);
});

test('removeJson drops untouched entries and hooks', () => {
  const file = join(tempDir(), 'settings.json');
  const run = newRun();
  applyJson({ file, entries: [memory()], hooks: [{ id: 'g', event: 'PreToolUse', matcher: 'Bash', command: 'node g.mjs' }] }, run);
  const items = Object.entries(run.state.entries).map(([id, e]) => ({ id, ...e }));
  removeJson(file, items, run);
  assert.deepEqual(read(file), { mcpServers: {}, hooks: { PreToolUse: [] } });
  assert.deepEqual(run.state.entries, {});
});

test('skip entries are marked seen and leave the file alone; dry run writes nothing', () => {
  const file = join(tempDir(), 'mcp.json');
  writeFileSync(file, '{"keep":1}');
  const run = newRun({ dryRun: true });
  applyJson({ file, entries: [{ id: 's', skip: true }, memory()] }, run);
  assert.ok(run.seen.has('s'));
  assert.equal(run.report.changes.length, 1);
  assert.deepEqual(read(file), { keep: 1 });
});

const guard = (command) => ({ id: 'g', event: 'PreToolUse', matcher: 'Bash', command });
const items = (run) => Object.entries(run.state.entries).map(([id, e]) => ({ id, ...e }));

test('unrelated keys keep their values and their order; an updated entry keeps its place', () => {
  const file = join(tempDir(), '.claude.json');
  const before = {
    zeta: { b: 1, a: [3, 1, 2] },
    model: 'opus',
    mcpServers: { zed: { command: 'z' }, memory: { command: 'npx', args: ['-y', 'm'] }, alpha: { command: 'a' } },
    permissions: { allow: ['Bash(ls)'], deny: [] },
    hooks: { SessionStart: [{ matcher: '', hooks: [{ type: 'command', command: 'mine' }] }] },
    last: null,
  };
  writeFileSync(file, JSON.stringify(before));
  const run = newRun();
  // The memory entry is already there and identical, so it is adopted; the hook is new.
  applyJson({ file, entries: [memory()], hooks: [guard('node g.mjs')] }, run);
  applyJson({ file, entries: [memory(['-y', 'm2'])], hooks: [guard('node g.mjs')] }, newRun({ state: run.state }));
  const after = read(file);
  assert.deepEqual(Object.keys(after), ['zeta', 'model', 'mcpServers', 'permissions', 'hooks', 'last']);
  assert.deepEqual(Object.keys(after.zeta), ['b', 'a']);
  assert.deepEqual(Object.keys(after.mcpServers), ['zed', 'memory', 'alpha']);
  assert.deepEqual(Object.keys(after.hooks), ['SessionStart', 'PreToolUse']);
  assert.deepEqual(after.mcpServers.memory.args, ['-y', 'm2']);
  // deepEqual ignores key order, so compare the text once the two managed items are back to what the file held.
  after.mcpServers.memory = before.mcpServers.memory;
  delete after.hooks.PreToolUse;
  assert.equal(JSON.stringify(after), JSON.stringify(before));
});

test('a dry run creates no file or folder and keeps the state, for apply and for remove', () => {
  const dir = tempDir();
  const file = join(dir, 'nested', 'settings.json');
  const spec = { file, entries: [memory()], hooks: [guard('node g.mjs')] };
  const dry = newRun({ dryRun: true });
  applyJson(spec, dry);
  assert.equal(dry.report.changes.length, 2);
  assert.ok(!existsSync(join(dir, 'nested')));
  assert.deepEqual(dry.state.entries, {});
  const run = newRun();
  applyJson(spec, run);
  const bytes = readFileSync(file);
  const state = structuredClone(run.state);
  const dryRemove = newRun({ state: run.state, dryRun: true });
  removeJson(file, items(run), dryRemove);
  assert.equal(dryRemove.report.changes.length, 2);
  assert.ok(readFileSync(file).equals(bytes));
  assert.deepEqual(run.state, state);
});

test('a missing file is created only when something is written to it', () => {
  const dir = tempDir();
  const at = (name) => join(dir, 'nested', name);
  const run = newRun();
  // The state remembers writes to a file that is no longer there.
  run.state.entries.x = { agent: null, kind: 'json', file: at('gone.json'), path: ['mcpServers', 'x'], hash: 'h' };
  run.state.entries.h = { agent: null, kind: 'hook', file: at('gone.json'), event: 'PreToolUse', command: 'c', hash: 'h' };
  applyJson({ file: at('empty.json') }, run);
  applyJson({ file: at('skip.json'), entries: [{ id: 's', skip: true }] }, run);
  removeJson(at('gone.json'), items(run), run);
  assert.ok(!existsSync(join(dir, 'nested')));
  assert.deepEqual(run.state.entries, {});
  applyJson({ file: at('real.json'), entries: [memory()] }, run);
  assert.deepEqual(read(at('real.json')), { mcpServers: { memory: { command: 'npx', args: ['-y', 'm'] } } });
});

test('an empty or blank file counts as an empty config', () => {
  for (const text of ['', ' \n']) {
    const file = join(tempDir(), 'mcp.json');
    writeFileSync(file, text);
    applyJson({ file, entries: [memory()] }, newRun());
    assert.deepEqual(read(file), { mcpServers: { memory: { command: 'npx', args: ['-y', 'm'] } } }, JSON.stringify(text));
  }
});

test('a run with nothing to change leaves the file\'s bytes alone', () => {
  const file = join(tempDir(), 'settings.json');
  const run = newRun();
  const spec = { file, entries: [memory()], hooks: [guard('node g.mjs')] };
  applyJson(spec, run);
  // Saved again by an editor in its own layout: CRLF and a four-space indent.
  const mine = JSON.stringify(read(file), null, 4).replace(/\n/g, '\r\n');
  writeFileSync(file, mine);
  const again = newRun({ state: run.state });
  applyJson(spec, again);
  assert.deepEqual([again.report.changes, again.report.conflicts], [[], []]);
  assert.equal(readFileSync(file, 'utf8'), mine);
});

test('removing the last managed entry and hook leaves the machine\'s own entries and hooks', () => {
  const file = join(tempDir(), 'settings.json');
  const mine = { matcher: 'Write', hooks: [{ type: 'command', command: 'cu-guard.exe' }] };
  const start = { matcher: '', hooks: [{ type: 'command', command: 'any-buddy apply --silent' }] };
  writeFileSync(file, JSON.stringify({ model: 'opus', mcpServers: { flaui: { command: 'x.exe' } }, hooks: { PreToolUse: [mine], SessionStart: [start] } }));
  const run = newRun();
  applyJson({ file, entries: [memory()], hooks: [guard('node g.mjs')] }, run);
  assert.equal(read(file).hooks.PreToolUse.length, 2);
  removeJson(file, items(run), run);
  assert.deepEqual(read(file), { model: 'opus', mcpServers: { flaui: { command: 'x.exe' } }, hooks: { PreToolUse: [mine], SessionStart: [start] } });
  assert.deepEqual(run.state.entries, {});
});

test('a hook group the machine added its own hook to is a conflict, not a replacement, on update and on removal', () => {
  const file = join(tempDir(), 'settings.json');
  const run = newRun();
  applyJson({ file, hooks: [guard('node "/old/guard.mjs"')] }, run);
  const extended = read(file);
  extended.hooks.PreToolUse[0].hooks.push({ type: 'command', command: 'my-own-hook' });
  writeFileSync(file, JSON.stringify(extended));
  const bytes = readFileSync(file);
  // Whether the repo moved or not, the group is no longer what was written.
  for (const command of ['node "/old/guard.mjs"', 'node "/new/guard.mjs"']) {
    const update = newRun({ state: run.state });
    applyJson({ file, hooks: [guard(command)] }, update);
    assert.deepEqual(update.report.conflicts.map((c) => c.id), ['g'], command);
    assert.deepEqual(update.report.changes, [], command);
    assert.ok(readFileSync(file).equals(bytes), command);
  }
  const removal = newRun({ state: run.state });
  removeJson(file, items(run), removal);
  assert.deepEqual(removal.report.conflicts.map((c) => c.id), ['g']);
  assert.ok(readFileSync(file).equals(bytes));
  assert.equal(run.state.entries.g.command, 'node "/old/guard.mjs"');
});

test('keep pins a changed hook group under the command recorded for it; repo replaces the whole group', () => {
  const file = join(tempDir(), 'settings.json');
  const run = newRun();
  applyJson({ file, hooks: [guard('node "/old/guard.mjs"')] }, run);
  const extended = read(file);
  extended.hooks.PreToolUse[0].hooks.push({ type: 'command', command: 'my-own-hook' });
  writeFileSync(file, JSON.stringify(extended));
  applyJson({ file, hooks: [guard('node "/new/guard.mjs"')] }, newRun({ state: run.state, resolutions: { g: 'keep' } }));
  assert.equal(run.state.entries.g.pinned, true);
  // The repo moves again: still the one group, still left alone, and nothing to report.
  const later = newRun({ state: run.state });
  applyJson({ file, hooks: [guard('node "/newer/guard.mjs"')] }, later);
  assert.deepEqual(later.report, { changes: [], conflicts: [], warnings: [], notes: [] });
  assert.deepEqual(read(file), extended);
  applyJson({ file, hooks: [guard('node "/newer/guard.mjs"')] }, newRun({ state: run.state, resolutions: { g: 'repo' } }));
  assert.deepEqual(read(file).hooks.PreToolUse, [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'node "/newer/guard.mjs"' }] }]);
  assert.equal(run.state.entries.g.pinned, undefined);
});

test('with no state, an identical entry is adopted and a different one is a conflict', () => {
  const file = join(tempDir(), 'mcp.json');
  writeFileSync(file, JSON.stringify({ mcpServers: { memory: { command: 'npx', args: ['-y', 'm'] }, other: { command: 'mine' } } }));
  const bytes = readFileSync(file);
  const same = newRun();
  applyJson({ file, entries: [memory()] }, same);
  assert.deepEqual([same.report.changes, same.report.conflicts], [[], []]);
  assert.ok('claude:mcp:memory' in same.state.entries);
  const differs = newRun();
  applyJson({ file, entries: [memory(['-y', 'different'])] }, differs);
  assert.deepEqual(differs.report.conflicts.map((c) => c.id), ['claude:mcp:memory']);
  assert.deepEqual(differs.state.entries, {});
  assert.ok(readFileSync(file).equals(bytes));
});

test('plugin switches: a flipped value is a conflict, and false is a value rather than an absence', () => {
  const file = join(tempDir(), 'settings.json');
  const plugin = (value) => ({ id: 'claude:plugin:pyright', path: ['enabledPlugins', 'pyright-lsp@official'], value });
  const switchOf = () => read(file).enabledPlugins['pyright-lsp@official'];
  writeFileSync(file, JSON.stringify({ enabledPlugins: { mine: true } }));
  const run = newRun();
  applyJson({ file, entries: [plugin(true)] }, run);
  assert.deepEqual(read(file).enabledPlugins, { mine: true, 'pyright-lsp@official': true });
  const edited = read(file);
  edited.enabledPlugins['pyright-lsp@official'] = false;
  writeFileSync(file, JSON.stringify(edited));
  const flipped = newRun({ state: run.state });
  applyJson({ file, entries: [plugin(true)] }, flipped);
  assert.deepEqual(flipped.report.conflicts.map((c) => c.id), ['claude:plugin:pyright']);
  assert.equal(switchOf(), false);
  // The repo comes round to the machine's choice: nothing to do. Then it flips and the untouched value follows.
  const agreed = newRun({ state: run.state });
  applyJson({ file, entries: [plugin(false)] }, agreed);
  assert.deepEqual([agreed.report.changes, agreed.report.conflicts], [[], []]);
  applyJson({ file, entries: [plugin(true)] }, newRun({ state: run.state }));
  assert.equal(switchOf(), true);
});

test('a config that is not valid JSON or not UTF-8 stops the run, names the file and is left as it was', () => {
  const dir = tempDir();
  const broken = join(dir, 'opencode.json');
  writeFileSync(broken, '{ // a comment\n  "model": "x"\n}');
  const utf16 = join(dir, 'mcp.json');
  writeFileSync(utf16, Buffer.from([0xff, 0xfe, 0x7b, 0x00, 0x7d, 0x00]));
  const x = { id: 'x', kind: 'json', path: ['mcpServers', 'x'] };
  for (const file of [broken, utf16]) {
    const bytes = readFileSync(file);
    const names = (e) => e.message.includes(file);
    assert.throws(() => applyJson({ file, entries: [memory()] }, newRun()), names, file);
    assert.throws(() => removeJson(file, [x], newRun()), names, file);
    assert.ok(readFileSync(file).equals(bytes), file);
  }
});
