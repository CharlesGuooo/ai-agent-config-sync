import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tempDir } from './helpers.mjs';
import { isLink, linkTarget, samePath } from '../lib/platform.mjs';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
// Every run gets a scratch home, so even a command that should not touch one can never reach the real home.
const cli = (args, home = tempDir('harness-cli-')) => spawnSync(process.execPath, [join(repo, 'harness.mjs'), ...args], { encoding: 'utf8', env: { ...process.env, HARNESS_HOME: home } });
const json = (p) => JSON.parse(readFileSync(p, 'utf8'));

test('check passes on this repo', () => {
  const r = cli(['check']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('install, update and uninstall Claude and Pi into a scratch home', () => {
  const home = tempDir('harness-cli-');
  const install = cli(['install', '--agents', 'claude,pi', '--packs', 'dev'], home);
  assert.equal(install.status, 0, install.stdout + install.stderr);
  assert.ok(samePath(linkTarget(join(home, '.claude', 'skills', 'brainstorming')), join(repo, 'skills', 'global', 'brainstorming')));
  assert.ok(isLink(join(home, 'dev-project', '.pi', 'skills', 'find-bugs')));
  assert.ok(existsSync(join(home, '.pi', 'agent', 'mcp.json')));
  assert.ok(existsSync(join(home, '.harness-local', 'state.json')));
  const update = cli(['update'], home);
  assert.equal(update.status, 0, update.stdout + update.stderr);
  assert.match(update.stdout, /no changes/);
  const uninstall = cli(['uninstall', '--agents', 'claude,pi'], home);
  assert.equal(uninstall.status, 0, uninstall.stdout + uninstall.stderr);
  assert.ok(!existsSync(join(home, '.claude', 'skills', 'brainstorming')));
});

test('an unknown command prints usage and fails', () => {
  const r = cli(['bogus']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /usage:/);
  assert.match(r.stderr, /settles the current conflicts only/);
});

test('an error prints only its message, never the text of the file', () => {
  const home = tempDir('harness-cli-');
  const file = join(home, '.claude.json');
  writeFileSync(file, '{"x": tok-SECRET-123}');
  const r = cli(['install', '--agents', 'claude', '--packs', 'craft'], home);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /^error: /);
  assert.ok(r.stderr.includes(file), r.stderr);
  assert.ok(!(r.stdout + r.stderr).includes('tok-SECRET'), r.stdout + r.stderr);
});

test('install without --packs keeps the installed packs; an empty --agents is a usage error', () => {
  const home = tempDir('harness-cli-');
  for (const agents of [[], ['']]) {
    const r = cli(['install', '--agents', ...agents], home);
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.match(r.stderr, /usage:/);
  }
  assert.equal(cli(['install', '--agents', 'claude', '--packs', 'craft'], home).status, 0);
  const r = cli(['install', '--agents', 'pi'], home);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const state = json(join(home, '.harness-local', 'state.json'));
  assert.deepEqual(state.packs, ['craft']);
  assert.deepEqual(state.agents, ['claude', 'pi']);
  assert.ok(!existsSync(join(home, 'dev-project')));
});

test('resolve with nothing installed says so and does nothing', () => {
  const home = tempDir('harness-cli-');
  for (const args of [['resolve'], ['resolve', 'repo', 'all']]) {
    const r = cli(args, home);
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.match(r.stderr, /nothing installed yet/);
  }
  assert.ok(!existsSync(join(home, '.harness-local')));
});

test('resolve with no arguments lists the conflicts and the kept items', () => {
  const home = tempDir('harness-cli-');
  assert.equal(cli(['install', '--agents', 'claude', '--packs', 'craft'], home).status, 0);
  const mcp = join(home, '.claude.json');
  const obj = json(mcp);
  obj.mcpServers.memory.args.push('--mine');
  writeFileSync(mcp, JSON.stringify(obj));
  const keep = cli(['resolve', 'keep', 'claude:mcp:memory'], home);
  assert.equal(keep.status, 0, keep.stdout + keep.stderr);
  const settings = join(home, '.claude', 'settings.json');
  const s = json(settings);
  s.enabledPlugins['pyright-lsp@claude-plugins-official'] = false;
  writeFileSync(settings, JSON.stringify(s));
  const r = cli(['resolve'], home);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^claude:plugin:pyright-lsp@claude-plugins-official$/m);
  assert.match(r.stdout, /^kept local, not managed: claude:mcp:memory$/m);
});
