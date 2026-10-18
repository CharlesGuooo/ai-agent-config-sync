import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fixtureRepo, tempDir, put } from './helpers.mjs';
import { makeContext, slash } from '../lib/platform.mjs';
import { loadCatalog, serversFor } from '../lib/mcp.mjs';
import claude, { LSP_PLUGINS } from '../lib/agents/claude.mjs';
import codex from '../lib/agents/codex.mjs';
import cursor from '../lib/agents/cursor.mjs';
import opencode from '../lib/agents/opencode.mjs';
import pi from '../lib/agents/pi.mjs';

function plan(adapter, name, { env = {}, catalog } = {}) {
  const repo = fixtureRepo();
  if (catalog) put(repo, 'mcp/catalog.json', JSON.stringify(catalog));
  const home = tempDir();
  const ctx = { ...makeContext({ repo, home }), env };
  const warnings = [];
  const p = adapter.plan(ctx, serversFor(loadCatalog(repo), name, ctx.os), (w) => warnings.push(w));
  return { ctx, home, repo, warnings, p };
}

test('claude: on servers in .claude.json, off servers as templates, LSP plugins and hooks', () => {
  const { p, home, repo } = plan(claude, 'claude');
  assert.equal(p.skills.global, join(home, '.claude', 'skills'));
  assert.equal(p.skills.pack(join(home, 'dev-project')), join(home, 'dev-project', '.claude', 'skills'));
  assert.deepEqual(p.json[0].entries.map((e) => e.id), ['claude:mcp:memory']);
  assert.deepEqual(p.files.map((f) => f.id), ['claude:command:hello.md', 'claude:mcp-template:remote', 'claude:mcp-template:everything']);
  assert.equal(p.files[1].file, join(home, '.claude', 'mcp-templates', 'remote.mcp.json'));
  assert.equal(JSON.parse(p.files[1].content).mcpServers.remote.url, 'https://example.com/mcp');
  assert.deepEqual(p.json[1].entries.map((e) => e.path[1]), LSP_PLUGINS);
  assert.equal(p.json[1].hooks[0].command, `node "${slash(join(repo, 'scripts', 'hooks', 'guard.mjs'))}"`);
});

test('codex: every server as a TOML table, hooks in hooks.json', () => {
  const { p, home } = plan(codex, 'codex');
  assert.deepEqual(p.toml[0].servers.map((s) => s.name), ['memory', 'remote']);
  assert.equal(p.toml[0].servers[1].value.enabled, false);
  assert.equal(p.json[0].file, join(home, '.codex', 'hooks.json'));
  assert.equal(p.json[0].hooks.length, 2);
});

test('codex and pi skip a server whose URL needs a variable that is not set', () => {
  const catalog = { servers: { sb: { http: 'https://x/mcp?ref=${NOPE_REF}', on: false } } };
  for (const [adapter, name] of [[codex, 'codex'], [pi, 'pi']]) {
    const { p, warnings } = plan(adapter, name, { catalog });
    const entries = name === 'codex' ? p.toml[0].servers : p.json[0].entries;
    assert.deepEqual(entries, [{ id: `${name}:mcp:sb`, skip: true }]);
    assert.match(warnings[0], /NOPE_REF/);
  }
});

test('cursor: on servers only; rules go to <local>/cursor-rules.md for pasting', () => {
  const { p, ctx } = plan(cursor, 'cursor');
  assert.deepEqual(p.json[0].entries.map((e) => e.id), ['cursor:mcp:memory']);
  assert.equal(p.prompt.manual, join(ctx.local, 'cursor-rules.md'));
});

test('opencode: schema, lsp and every server; commands go to commands/', () => {
  const { p, home } = plan(opencode, 'opencode');
  assert.deepEqual(p.json[0].entries.map((e) => e.id), ['opencode:schema', 'opencode:lsp', 'opencode:mcp:memory', 'opencode:mcp:remote']);
  assert.deepEqual(p.files.map((f) => f.file), [join(home, '.config', 'opencode', 'commands', 'opsx-x.md')]);
  assert.equal(p.skills.pack(join(home, 'dev-project')), join(home, 'dev-project', '.opencode', 'skills'));
});

test('pi: global skills under agent/, pack skills under .pi/skills, every server in mcp.json', () => {
  const { p, home } = plan(pi, 'pi');
  assert.equal(p.skills.global, join(home, '.pi', 'agent', 'skills'));
  assert.equal(p.skills.pack(join(home, 'dev-project')), join(home, 'dev-project', '.pi', 'skills'));
  assert.deepEqual(p.json[0].entries.map((e) => e.id), ['pi:mcp:memory', 'pi:mcp:remote']);
  assert.equal(p.json[0].entries[1].value.enabled, false);
});
