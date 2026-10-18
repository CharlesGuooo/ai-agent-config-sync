import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tempDir, newRun } from './helpers.mjs';
import { hashValue } from '../lib/util.mjs';
import { parseKey, segments, joinSegments, parseBody, readMcpTable, renderMcpTable, writeMcpTables, removeHookGroups, applyCodexMcp } from '../lib/toml.mjs';

const CODEX = [
  'model = "gpt-5.6-sol"',
  'notify = [ "C:\\\\x\\\\codex.exe", "turn-ended" ]',
  '',
  '[features]',
  'plugin_hooks = true',
  '',
  '[mcp_servers.memory]',
  'command = "npx"',
  'args = ["-y", "@modelcontextprotocol/server-memory@2026.1.26"]',
  'startup_timeout_sec = 30.0',
  '',
  '[mcp_servers.zai-mcp-server]',
  'command = "npx"',
  'args = ["-y", "@z_ai/mcp-server@0.1.4"]',
  'env_vars = ["Z_AI_API_KEY"]',
  'enabled = false',
  'startup_timeout_sec = 30.0',
  '',
  '[mcp_servers.zai-mcp-server.env]',
  'Z_AI_MODE = "ZAI"',
  '',
  "[projects.'C:\\Users\\PC']",
  'trust_level = "trusted"',
  '',
  "[hooks.state.'C:\\Users\\PC\\.codex\\config.toml:pre_tool_use:0:0']",
  'trusted_hash = "sha256:abc"',
  '# Shared safety guard (scripts installed at ~/.agent-hooks).',
  '[[hooks.PreToolUse]]',
  'matcher = "Bash|Read|Edit|Write|MultiEdit"',
  '[[hooks.PreToolUse.hooks]]',
  'type = "command"',
  'command = "node C:/Users/PC/.agent-hooks/guard.mjs"',
  '',
].join('\n');

const MEMORY = { command: 'npx', args: ['-y', '@modelcontextprotocol/server-memory@2026.1.26'], startup_timeout_sec: 30 };

test('segments and joinSegments round-trip the exact text', () => {
  assert.equal(joinSegments(segments(CODEX)), CODEX);
});

test('parseKey handles bare, double- and single-quoted parts', () => {
  assert.deepEqual(parseKey("hooks.state.'C:\\x:y'"), ['hooks', 'state', 'C:\\x:y']);
  assert.deepEqual(parseKey('a."b c".d'), ['a', 'b c', 'd']);
});

test('readMcpTable merges sub-tables and compares by value', () => {
  assert.deepEqual(readMcpTable(CODEX, 'zai-mcp-server'), {
    command: 'npx', args: ['-y', '@z_ai/mcp-server@0.1.4'], env_vars: ['Z_AI_API_KEY'], enabled: false, startup_timeout_sec: 30, env: { Z_AI_MODE: 'ZAI' },
  });
  assert.equal(readMcpTable(CODEX, 'nope'), undefined);
  assert.equal(hashValue(readMcpTable(CODEX, 'memory')), hashValue(MEMORY));
});

test('writeMcpTables replaces and removes only the named tables', () => {
  const out = writeMcpTables(CODEX, { memory: { ...MEMORY, args: ['-y', 'new'] }, 'zai-mcp-server': undefined });
  assert.deepEqual(readMcpTable(out, 'memory').args, ['-y', 'new']);
  assert.equal(readMcpTable(out, 'zai-mcp-server'), undefined);
  assert.ok(!out.includes('[mcp_servers.zai-mcp-server.env]'));
  assert.ok(out.includes("[projects.'C:\\Users\\PC']"));
  assert.ok(out.includes('notify = [ "C:\\\\x\\\\codex.exe", "turn-ended" ]'));
});

test('renderMcpTable output reads back to the same value', () => {
  const value = { enabled: false, command: 'npx', args: ['-y', 'z@1'], env_vars: ['K'], startup_timeout_sec: 30, env: { MODE: 'a "quoted" \\ value' } };
  assert.deepEqual(readMcpTable(renderMcpTable('srv', value), 'srv'), value);
});

test('removeHookGroups drops a matching group with its entries, or returns the text as is', () => {
  const out = removeHookGroups(CODEX, /\.agent-hooks/);
  assert.ok(!out.includes('[[hooks.PreToolUse]]'));
  assert.ok(out.includes("[hooks.state.'C:"));
  assert.equal(removeHookGroups(CODEX, /nothing-matches/), CODEX);
});

test('a multi-line array never produces a fake table header', () => {
  const text = 'args = [\n  "a",\n  ["b"],\n]\n[next]\nx = 1\n';
  const segs = segments(text);
  assert.deepEqual(segs.filter((s) => s.header).map((s) => s.header), ['[next]']);
  assert.deepEqual(parseBody(segs[0].lines.join('\n')), { args: ['a', ['b']] });
});

test('applyCodexMcp: equal is a no-op, a first-run difference is a conflict, skip is seen', () => {
  const file = join(tempDir(), 'config.toml');
  writeFileSync(file, CODEX);
  const same = newRun();
  applyCodexMcp({ file, servers: [{ id: 'codex:mcp:memory', name: 'memory', value: MEMORY }] }, same);
  assert.deepEqual([same.report.changes, same.report.conflicts], [[], []]);
  const differ = newRun();
  applyCodexMcp({ file, servers: [{ id: 'codex:mcp:memory', name: 'memory', value: { ...MEMORY, args: ['-y', 'x'] } }, { id: 'codex:mcp:gone', skip: true }] }, differ);
  assert.equal(differ.report.conflicts.length, 1);
  assert.ok(differ.seen.has('codex:mcp:gone'));
  applyCodexMcp({ file, servers: [{ id: 'codex:mcp:memory', name: 'memory', value: { ...MEMORY, args: ['-y', 'x'] } }] }, newRun({ resolutions: { all: 'repo' } }));
  assert.deepEqual(readMcpTable(readFileSync(file, 'utf8'), 'memory').args, ['-y', 'x']);
});

const crlf = (t) => t.replace(/\n/g, '\r\n');
const lines = (...l) => l.join('\n');
const configFile = (text) => {
  const file = join(tempDir(), 'config.toml');
  writeFileSync(file, text);
  return file;
};
const server = (name, value) => ({ id: `codex:mcp:${name}`, name, value });
const MEMORY_TABLE = '[mcp_servers.memory]\ncommand = "npx"\nargs = ["-y", "@modelcontextprotocol/server-memory@2026.1.26"]\nstartup_timeout_sec = 30\n';

test('a CRLF file stays CRLF: one table updated, one added, one removed, every other byte as it was', () => {
  assert.equal(joinSegments(segments(crlf(CODEX))), crlf(CODEX));
  assert.deepEqual(readMcpTable(crlf(CODEX), 'zai-mcp-server'), readMcpTable(CODEX, 'zai-mcp-server'));
  const file = configFile(crlf(CODEX));
  const run = newRun({ resolutions: { all: 'repo' } });
  applyCodexMcp({
    file,
    servers: [server('memory', { ...MEMORY, args: ['-y', 'new'] }), server('extra', { command: 'x', env: { MODE: 'a' } }), server('zai-mcp-server', undefined)],
  }, run);
  assert.equal(run.report.changes.length, 3);
  const out = readFileSync(file, 'utf8');
  assert.ok(!/(^|[^\r])\n/.test(out), 'a bare LF');
  // Before the memory table and from the projects table on, the text is the file's own.
  const head = CODEX.slice(0, CODEX.indexOf('[mcp_servers.memory]'));
  const rest = CODEX.slice(CODEX.indexOf("[projects.'C:"));
  const added = '\n[mcp_servers.memory]\ncommand = "npx"\nargs = ["-y", "new"]\nstartup_timeout_sec = 30\n\n[mcp_servers.extra]\ncommand = "x"\n\n[mcp_servers.extra.env]\nMODE = "a"\n';
  assert.equal(out, crlf(head + rest + added));
  // A table at the very end of the file leaves no stray "\r" behind when it goes.
  assert.equal(writeMcpTables(crlf('a = 1\n\n[mcp_servers.x]\ncommand = "x"\n'), { x: undefined }), 'a = 1\r\n');
});

test('in a file that mixes line endings, each untouched line keeps its own', () => {
  const text = 'model = "m"\r\n\r\n[features]\nplugin_hooks = true\n\n[mcp_servers.memory]\r\ncommand = "old"\r\n\r\n[projects.x]\r\na = 1\n';
  const out = writeMcpTables(text, { memory: { command: 'npx' } });
  assert.equal(out, 'model = "m"\r\n\r\n[features]\nplugin_hooks = true\n\n[projects.x]\r\na = 1\n\r\n[mcp_servers.memory]\r\ncommand = "npx"\r\n');
});

test('the user\'s comments and tables around a server table survive its rewrite and its removal', () => {
  const text = lines(
    '# top note',
    '[features]',
    'plugin_hooks = true',
    '',
    '# my memory server',
    '[mcp_servers.memory]',
    'command = "npx"',
    'args = ["-y", "old"]',
    '',
    '# notes about the projects table',
    '[projects.x]',
    'trust_level = "trusted"',
    '',
    '[mcp_servers.zai]',
    'command = "z"',
    '# last words',
    '',
  );
  // What follows a table's last key sits above whatever comes next, so it is the user's.
  const kept = lines('# top note', '[features]', 'plugin_hooks = true', '', '# my memory server', '# notes about the projects table', '[projects.x]', 'trust_level = "trusted"', '');
  assert.equal(
    writeMcpTables(text, { memory: { command: 'npx', args: ['-y', 'new'] } }),
    lines(kept, '[mcp_servers.zai]', 'command = "z"', '# last words', '', '[mcp_servers.memory]', 'command = "npx"', 'args = ["-y", "new"]', ''),
  );
  assert.equal(writeMcpTables(text, { memory: undefined, zai: undefined }), lines(kept, '# last words', ''));
});

test('the last line of the file is left as it is when tables are appended', () => {
  const table = '[mcp_servers.m]\ncommand = "npx"\n';
  const value = { command: 'npx' };
  assert.equal(writeMcpTables('a = 1   ', { m: value }), `a = 1   \n\n${table}`);
  assert.equal(writeMcpTables('a = 1   \n\n\n', { m: value }), `a = 1   \n\n${table}`);
  assert.equal(writeMcpTables('a = 1\r\n', { m: value }), `a = 1\r\n\r\n${crlf(table)}`);
});

test('a server the repo writes that already stands as an inline table, dotted keys or an array of tables stops the run, naming the file', () => {
  const forms = {
    'an inline table under [mcp_servers]': '[mcp_servers]\nmemory = { command = "npx" }\n',
    'dotted keys under [mcp_servers]': '[mcp_servers]\nmemory.command = "npx"\n',
    'dotted keys at the top of the file': 'mcp_servers.memory.command = "npx"\n\n[projects.x]\na = 1\n',
    'an inline table at the top of the file': 'mcp_servers = { memory = { command = "npx" } }\n',
    'an array of tables': '[[mcp_servers.memory]]\ncommand = "npx"\n',
  };
  const servers = [server('other', { command: 'o' }), server('memory', MEMORY)];
  for (const [what, text] of Object.entries(forms)) {
    for (const dryRun of [false, true]) {
      const file = configFile(text);
      const run = newRun({ dryRun });
      assert.throws(() => applyCodexMcp({ file, servers }, run), (e) => e.message.includes(file) && /mcp_servers/.test(e.message), what);
      // Nothing is written or recorded, not even for the server listed first.
      assert.equal(readFileSync(file, 'utf8'), text, what);
      assert.deepEqual(run.state.entries, {}, what);
    }
  }
  // Another server's inline table does not stand in the way of a table, and removing what cannot be seen is nothing to do.
  const beside = '[mcp_servers]\nflaui = { command = "f" }\n';
  const file = configFile(beside);
  applyCodexMcp({ file, servers: [server('memory', MEMORY)] }, newRun());
  assert.equal(readFileSync(file, 'utf8'), `${beside}\n${MEMORY_TABLE}`);
  const inline = forms['an inline table under [mcp_servers]'];
  const odd = configFile(inline);
  const removal = newRun();
  applyCodexMcp({ file: odd, servers: [server('memory', undefined)] }, removal);
  assert.deepEqual([removal.report.changes, removal.report.conflicts], [[], []]);
  assert.equal(readFileSync(odd, 'utf8'), inline);
  // A line inside a multi-line string that only starts like a definition is not one.
  const prose = lines('notes = """', 'mcp_servers.memory is the one to keep', '"""', '');
  const note = configFile(prose);
  applyCodexMcp({ file: note, servers: [server('memory', MEMORY)] }, newRun());
  assert.equal(readFileSync(note, 'utf8'), `${prose}\n${MEMORY_TABLE}`);
});

test('a server table in TOML the parser cannot read stops the run, naming the file, before anything is recorded', () => {
  for (const line of ['since = 1979-05-27T07:32:00Z', 'mask = 0xFF', 'weird = inf']) {
    const text = lines('[mcp_servers.memory]', 'command = "npx"', line, '');
    const file = configFile(text);
    const run = newRun();
    const servers = [server('other', { command: 'o' }), server('memory', MEMORY)];
    assert.throws(() => applyCodexMcp({ file, servers }, run), (e) => e.message.includes(file) && /unsupported TOML/.test(e.message), line);
    assert.equal(readFileSync(file, 'utf8'), text, line);
    assert.deepEqual(run.state.entries, {}, line);
  }
});

test('TOML the parser does not read, outside the tables it owns, is carried over untouched', () => {
  const before = lines(
    'created = 1979-05-27T07:32:00Z',
    'dotted.key.here = 1',
    'inline = { a = 1, b = [1, 2] }',
    'mask = 0xFF',
    'weird = inf',
    'multi = """',
    '[not_a_table]',
    '"""',
    '',
    '[[plugins]]',
    'name = "x"',
    '',
    '',
  );
  const owned = lines('[mcp_servers.memory]', 'command = "npx"', '', '');
  const after = lines('[[plugins]]', 'name = "y"', '');
  const file = configFile(before + owned + after);
  applyCodexMcp({ file, servers: [server('memory', MEMORY)] }, newRun({ resolutions: { all: 'repo' } }));
  assert.equal(readFileSync(file, 'utf8'), `${before}${after}\n${MEMORY_TABLE}`);
});

test('a dry run reports the change and writes nothing: not the file, not a missing folder, not the state', () => {
  const dir = tempDir();
  const file = join(dir, 'config.toml');
  writeFileSync(file, 'model = "m"\n\n[mcp_servers.memory]\ncommand = "old"\n');
  const bytes = readFileSync(file);
  const dry = newRun({ dryRun: true, resolutions: { all: 'repo' } });
  applyCodexMcp({ file, servers: [server('memory', MEMORY), server('extra', { command: 'x' })] }, dry);
  assert.equal(dry.report.changes.length, 2);
  assert.ok(readFileSync(file).equals(bytes));
  assert.deepEqual(dry.state.entries, {});
  const fresh = newRun({ dryRun: true });
  applyCodexMcp({ file: join(dir, 'nested', 'config.toml'), servers: [server('memory', MEMORY)] }, fresh);
  assert.equal(fresh.report.changes.length, 1);
  assert.ok(!existsSync(join(dir, 'nested')));
});

test('a second run has nothing to report, also after Codex wrote the file its own way', () => {
  const value = { command: 'npx', args: ['-y', 'z@1'], env_vars: ['K'], enabled: false, startup_timeout_sec: 30, env: { MODE: 'ZAI' } };
  const file = configFile('model = "m"\n');
  const first = newRun();
  applyCodexMcp({ file, servers: [server('memory', value)] }, first);
  assert.equal(first.report.changes.length, 1);
  const bytes = readFileSync(file);
  const again = newRun({ state: first.state });
  applyCodexMcp({ file, servers: [server('memory', value)] }, again);
  assert.deepEqual([again.report.changes, again.report.conflicts], [[], []]);
  assert.ok(readFileSync(file).equals(bytes));
  const rewrites = [
    // Sorted keys, a float, a wrapped array and the env moved into a sub-table.
    lines('model = "m"', '', '[mcp_servers.memory]', 'args = [', '  "-y",', '  "z@1",', ']', 'command = "npx"', 'enabled = false', 'env_vars = ["K"]', 'startup_timeout_sec = 30.0', '', '[mcp_servers.memory.env]', 'MODE = "ZAI"', ''),
    // Another spelling of the same table: comments, literal strings, an inline env.
    lines('model = "m"', '', '[mcp_servers.memory]', 'command = "npx" # mine', "args = ['-y', 'z@1']", 'env = { MODE = "ZAI" }', 'env_vars = ["K"]', 'enabled = false', 'startup_timeout_sec = 3e1', ''),
  ];
  for (const text of rewrites) {
    writeFileSync(file, text);
    const run = newRun({ state: first.state });
    applyCodexMcp({ file, servers: [server('memory', value)] }, run);
    assert.deepEqual([run.report.changes, run.report.conflicts], [[], []], text);
    assert.equal(readFileSync(file, 'utf8'), text);
  }
});

test('removing a server follows the same rule: an untouched table goes, an edited one is a conflict', () => {
  const file = configFile('model = "m"\n');
  const run = newRun();
  applyCodexMcp({ file, servers: [server('memory', MEMORY), server('zai', { command: 'z', env: { MODE: 'a' } })] }, run);
  const removal = newRun({ state: run.state });
  applyCodexMcp({ file, servers: [server('memory', MEMORY), server('zai', undefined)] }, removal);
  assert.deepEqual(removal.report.changes, [`remove [mcp_servers.zai] in ${file}`]);
  assert.equal(readMcpTable(readFileSync(file, 'utf8'), 'zai'), undefined);
  assert.deepEqual(readMcpTable(readFileSync(file, 'utf8'), 'memory'), MEMORY);
  assert.equal(removal.state.entries['codex:mcp:zai'], undefined);
  writeFileSync(file, readFileSync(file, 'utf8').replace('args = ["-y", ', 'args = ["-y", "--mine", '));
  const bytes = readFileSync(file);
  const conflicted = newRun({ state: removal.state });
  applyCodexMcp({ file, servers: [server('memory', undefined)] }, conflicted);
  assert.deepEqual(conflicted.report.conflicts.map((c) => c.id), ['codex:mcp:memory']);
  assert.ok(readFileSync(file).equals(bytes));
});

test('removeHookGroups keeps the line endings, the final line break and the comments around a dropped group', () => {
  const v1 = /\.agent-hooks/;
  const group = ['[[hooks.PreToolUse]]', 'matcher = "Bash"', '[[hooks.PreToolUse.hooks]]', 'type = "command"', 'command = "node C:/Users/x/.agent-hooks/guard.mjs"'];
  const mine = ['[[hooks.PostToolUse]]', 'matcher = "Write"', '[[hooks.PostToolUse.hooks]]', 'type = "command"', 'command = "my-own.exe"'];
  // The last group, right under the file's last line: that line keeps its line break.
  assert.equal(removeHookGroups(lines('model = "m"', ...group, ''), v1), 'model = "m"\n');
  assert.ok(removeHookGroups(CODEX, v1).endsWith('\n'));
  assert.equal(removeHookGroups(crlf(lines('model = "m"', '', ...group, '')), v1), 'model = "m"\r\n');
  // A group in the middle: the user's comment and group after it are not part of it.
  assert.equal(removeHookGroups(lines('model = "m"', '', ...group, '', '# my own hook', ...mine, ''), v1), lines('model = "m"', '', '# my own hook', ...mine, ''));
});
