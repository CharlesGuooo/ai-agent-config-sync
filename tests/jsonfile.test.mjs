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

test('the file\'s line ending is kept: CRLF stays CRLF everywhere, LF stays LF, and a new file is LF', () => {
  const dir = tempDir();
  const mine = { model: 'opus', note: 'a\nb', mcpServers: { flaui: { command: 'x.exe' }, memory: { command: 'npx', args: ['-y', 'm'] } } };
  const layout = (value, eol) => JSON.stringify(value, null, 2).replace(/\n/g, eol) + eol;
  const edited = structuredClone(mine);
  edited.mcpServers.memory.args = ['-y', 'm2'];
  edited.hooks = { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'node g.mjs' }] }] };
  const removed = structuredClone(mine);
  delete removed.mcpServers.memory;
  removed.hooks = { PreToolUse: [] };
  for (const eol of ['\r\n', '\n']) {
    const file = join(dir, eol === '\n' ? 'lf.json' : 'crlf.json');
    writeFileSync(file, layout(mine, eol));
    const run = newRun();
    // The memory entry is identical, so it is adopted; then one entry changes and a hook is added.
    applyJson({ file, entries: [memory()] }, run);
    applyJson({ file, entries: [memory(['-y', 'm2'])], hooks: [guard('node g.mjs')] }, newRun({ state: run.state }));
    // The user's layout with those changes and nothing else: no bare LF in a CRLF file, and the newline inside the note is still an escape.
    assert.equal(readFileSync(file, 'utf8'), layout(edited, eol), JSON.stringify(eol));
    removeJson(file, items(run), run);
    assert.equal(readFileSync(file, 'utf8'), layout(removed, eol), JSON.stringify(eol));
  }
  const created = join(dir, 'new', 'mcp.json');
  applyJson({ file: created, entries: [memory()] }, newRun());
  assert.equal(readFileSync(created, 'utf8'), layout({ mcpServers: { memory: { command: 'npx', args: ['-y', 'm'] } } }, '\n'));
});

test('a hook group from another clone of the repo is found by its script: a conflict with no state, replaced in place on repo, never a second group', () => {
  const mine = { matcher: 'Write', hooks: [{ type: 'command', command: 'cu-guard.exe' }] };
  const format = { matcher: 'Bash', hooks: [{ type: 'command', command: 'node "/old/clone/scripts/hooks/format.mjs"' }] };
  const fresh = guard('node "/new/clone/scripts/hooks/guard.mjs"');
  const written = { matcher: 'Bash', hooks: [{ type: 'command', command: fresh.command }] };
  // The old clone's command as a POSIX path, as a Windows path with forward slashes, and with backslashes.
  const forms = ['node "/old/clone/scripts/hooks/guard.mjs"', 'node "C:/old/clone/scripts/hooks/guard.mjs"', 'node "C:\\old\\clone\\scripts\\hooks\\guard.mjs"'];
  for (const old of forms) {
    const file = join(tempDir(), 'settings.json');
    const stale = { matcher: 'Bash', hooks: [{ type: 'command', command: old }] };
    writeFileSync(file, JSON.stringify({ hooks: { PreToolUse: [mine, stale, format] } }));
    const bytes = readFileSync(file);
    // The conflict and the change both name the command the group runs now, so it is clear what resolving to the repo replaces.
    const label = `hook PreToolUse ${fresh.command} in ${file} (in place of ${old})`;
    const first = newRun();
    applyJson({ file, hooks: [fresh] }, first);
    assert.deepEqual(first.report.conflicts, [{ id: 'g', msg: label }], old);
    assert.ok(readFileSync(file).equals(bytes), old);
    const resolved = newRun({ state: first.state, resolutions: { g: 'repo' } });
    applyJson({ file, hooks: [fresh] }, resolved);
    assert.deepEqual(resolved.report.changes, [label], old);
    assert.deepEqual(read(file).hooks.PreToolUse, [mine, written, format], old);
    const settled = newRun({ state: first.state });
    applyJson({ file, hooks: [fresh] }, settled);
    assert.deepEqual([settled.report.changes, settled.report.conflicts], [[], []], old);
    // Found by a command we know, there is nothing to name.
    const next = guard('node "/newer/clone/scripts/hooks/guard.mjs"');
    const moved = newRun({ state: first.state });
    applyJson({ file, hooks: [next] }, moved);
    assert.deepEqual(moved.report.changes, [`hook PreToolUse ${next.command} in ${file}`], old);
  }
});

test('only a whole command of the shape the repo writes is taken over; the machine\'s own commands that merely look similar stay, and ours is added', () => {
  const fresh = guard('node "/new/clone/scripts/hooks/guard.mjs"');
  const ours = { matcher: 'Bash', hooks: [{ type: 'command', command: fresh.command }] };
  const foreign = [
    'node "$CLAUDE_PROJECT_DIR/scripts/hooks/guard.mjs"',
    'bun run ./scripts/hooks/guard.mjs --strict',
    'node C:/Users/me/my-scripts/hooks/guard.mjs',
    'node "/old/clone/scripts/hooks/guard.mjs" --strict',
    'node "./scripts/hooks/guard.mjs"',
    'node "/old/my-scripts/hooks/guard.mjs"',
    'cmd /c node "C:/old/clone/scripts/hooks/guard.mjs"',
  ];
  for (const command of foreign) {
    const file = join(tempDir(), 'settings.json');
    const theirs = { matcher: 'Bash', hooks: [{ type: 'command', command }] };
    writeFileSync(file, JSON.stringify({ hooks: { PreToolUse: [theirs] } }));
    const run = newRun();
    applyJson({ file, hooks: [fresh] }, run);
    assert.deepEqual(run.report.conflicts, [], command);
    assert.deepEqual(run.report.changes, [`hook PreToolUse ${fresh.command} in ${file}`], command);
    assert.deepEqual(read(file).hooks.PreToolUse, [theirs, ours], command);
  }
  // The same the other way round: a command of ours in another shape never goes looking for a group to take over.
  const file = join(tempDir(), 'settings.json');
  const stale = { matcher: 'Bash', hooks: [{ type: 'command', command: 'node "/old/clone/scripts/hooks/guard.mjs"' }] };
  writeFileSync(file, JSON.stringify({ hooks: { PreToolUse: [stale] } }));
  const run = newRun();
  applyJson({ file, hooks: [guard('node "$CLAUDE_PROJECT_DIR/scripts/hooks/guard.mjs"')] }, run);
  assert.deepEqual(run.report.conflicts, []);
  assert.equal(read(file).hooks.PreToolUse.length, 2);
});

test('the command named as being replaced is the one that matched, not the machine\'s own hook in the same group', () => {
  const old = 'node "/old/clone/scripts/hooks/guard.mjs"';
  const file = join(tempDir(), 'settings.json');
  const stale = { matcher: 'Bash', hooks: [{ type: 'command', command: 'my-own-hook' }, { type: 'command', command: old }] };
  writeFileSync(file, JSON.stringify({ hooks: { PreToolUse: [stale] } }));
  const fresh = guard('node "/new/clone/scripts/hooks/guard.mjs"');
  const run = newRun();
  applyJson({ file, hooks: [fresh] }, run);
  assert.deepEqual(run.report.conflicts, [{ id: 'g', msg: `hook PreToolUse ${fresh.command} in ${file} (in place of ${old})` }]);
});

test('with several groups running the guard from other clones, only other scripts, or the guard under another event, nothing is guessed and ours is added', () => {
  const at = (clone, name) => ({ matcher: 'Bash', hooks: [{ type: 'command', command: `node "/${clone}/scripts/hooks/${name}.mjs"` }] });
  const fresh = guard('node "/new/clone/scripts/hooks/guard.mjs"');
  const ours = { matcher: 'Bash', hooks: [{ type: 'command', command: fresh.command }] };
  const cases = {
    'two other clones': { PreToolUse: [at('old1', 'guard'), at('old2', 'guard')] },
    'another script only': { PreToolUse: [at('old1', 'format')] },
    'the guard under another event': { PostToolUse: [at('old1', 'guard')] },
  };
  for (const [what, hooks] of Object.entries(cases)) {
    const file = join(tempDir(), 'settings.json');
    writeFileSync(file, JSON.stringify({ hooks }));
    const run = newRun();
    applyJson({ file, hooks: [fresh] }, run);
    assert.deepEqual(run.report.conflicts, [], what);
    assert.deepEqual(read(file).hooks, { ...hooks, PreToolUse: [...(hooks.PreToolUse ?? []), ours] }, what);
  }
});

test('a container of another shape on an entry\'s path or under hooks stops a write, naming the file and the key path, before anything is recorded', () => {
  const mcpEntry = { id: 'o', path: ['mcp', 'memory'], value: { type: 'local' } };
  const hook = { hooks: [guard('node g.mjs')] };
  const noBrackets = { hooks: { PreToolUse: { matcher: 'Bash', hooks: [{ type: 'command', command: 'mine' }] } } };
  const cases = [
    ['an array where the entry\'s object should be', { mcp: ['x'] }, { entries: [mcpEntry] }, 'mcp'],
    ['a string', { mcp: 'x' }, { entries: [mcpEntry] }, 'mcp'],
    ['null', { mcp: null }, { entries: [mcpEntry] }, 'mcp'],
    ['a container further down the path', { a: { b: [] } }, { entries: [{ id: 'n', path: ['a', 'b', 'c'], value: 1 }] }, 'a.b'],
    ['a bad container after a good entry', { mcp: ['x'] }, { entries: [memory(), mcpEntry] }, 'mcp'],
    ['hooks that is not an object', { hooks: [] }, hook, 'hooks'],
    ['an event whose array lost its brackets', noBrackets, hook, 'hooks.PreToolUse'],
  ];
  for (const [what, content, spec, keyPath] of cases) {
    const file = join(tempDir(), 'cfg.json');
    writeFileSync(file, JSON.stringify(content));
    const bytes = readFileSync(file);
    const run = newRun();
    assert.throws(() => applyJson({ file, ...spec }, run), (e) => e.message.includes(file) && e.message.includes(`${keyPath} is not`), what);
    assert.ok(readFileSync(file).equals(bytes), what);
    assert.deepEqual(run.state.entries, {}, what);
  }
});

test('removal replaces nothing, so containers of another shape are left as they are and the entries forgotten', () => {
  const file = join(tempDir(), 'cfg.json');
  writeFileSync(file, JSON.stringify({ mcp: ['x'], hooks: { PreToolUse: 'oops' } }));
  const bytes = readFileSync(file);
  const run = newRun();
  run.state.entries.o = { agent: null, kind: 'json', file, path: ['mcp', 'memory'], hash: 'h' };
  run.state.entries.g = { agent: null, kind: 'hook', file, event: 'PreToolUse', command: 'node g.mjs', hash: 'h' };
  removeJson(file, items(run), run);
  assert.ok(readFileSync(file).equals(bytes));
  assert.deepEqual(run.state.entries, {});
});

test('hooks with no state: an identical group is adopted; the same command under another matcher is a conflict and no second group is added', () => {
  const ours = { matcher: 'Bash', hooks: [{ type: 'command', command: 'node g.mjs' }] };
  const file = join(tempDir(), 'settings.json');
  writeFileSync(file, JSON.stringify({ hooks: { PreToolUse: [ours] } }));
  const bytes = readFileSync(file);
  const same = newRun();
  applyJson({ file, hooks: [guard('node g.mjs')] }, same);
  assert.deepEqual([same.report.changes, same.report.conflicts], [[], []]);
  assert.equal(same.state.entries.g.command, 'node g.mjs');
  assert.ok(readFileSync(file).equals(bytes));
  const elsewhere = join(tempDir(), 'settings.json');
  writeFileSync(elsewhere, JSON.stringify({ hooks: { PreToolUse: [{ ...ours, matcher: 'Write' }] } }));
  const before = readFileSync(elsewhere);
  const other = newRun();
  applyJson({ file: elsewhere, hooks: [guard('node g.mjs')] }, other);
  assert.deepEqual(other.report.conflicts.map((c) => c.id), ['g']);
  assert.deepEqual(other.state.entries, {});
  assert.ok(readFileSync(elsewhere).equals(before));
});

test('after a write, a hook group the machine deleted is a conflict and is not added back until the repo is chosen', () => {
  const mine = { matcher: 'Write', hooks: [{ type: 'command', command: 'cu-guard.exe' }] };
  const file = join(tempDir(), 'settings.json');
  writeFileSync(file, JSON.stringify({ hooks: { PreToolUse: [mine] } }));
  const run = newRun();
  applyJson({ file, hooks: [guard('node g.mjs')] }, run);
  assert.equal(read(file).hooks.PreToolUse.length, 2);
  // The machine takes our group out again and keeps its own.
  writeFileSync(file, JSON.stringify({ hooks: { PreToolUse: [mine] } }));
  const bytes = readFileSync(file);
  const again = newRun({ state: run.state });
  applyJson({ file, hooks: [guard('node g.mjs')] }, again);
  assert.deepEqual(again.report.conflicts.map((c) => c.id), ['g']);
  assert.deepEqual(again.report.changes, []);
  assert.ok(readFileSync(file).equals(bytes));
  applyJson({ file, hooks: [guard('node g.mjs')] }, newRun({ state: run.state, resolutions: { g: 'repo' } }));
  assert.deepEqual(read(file).hooks.PreToolUse, [mine, { matcher: 'Bash', hooks: [{ type: 'command', command: 'node g.mjs' }] }]);
});

test('a top level that is not an object stops a write, dry run or not, naming the file, before anything is recorded', () => {
  for (const text of ['[]', 'null', '"text"', '5']) {
    for (const dryRun of [false, true]) {
      const what = `${text}${dryRun ? ' (dry run)' : ''}`;
      const file = join(tempDir(), 'cfg.json');
      writeFileSync(file, text);
      const bytes = readFileSync(file);
      const run = newRun({ dryRun });
      const state = structuredClone(run.state);
      const names = (e) => e.message.includes(file) && e.message.includes('the top level is not an object');
      assert.throws(() => applyJson({ file, entries: [memory()], hooks: [guard('node g.mjs')] }, run), names, what);
      // The file is broken whatever the run would have written to it.
      assert.throws(() => applyJson({ file }, newRun({ dryRun })), names, what);
      assert.ok(readFileSync(file).equals(bytes), what);
      assert.deepEqual(run.state, state, what);
    }
  }
});
