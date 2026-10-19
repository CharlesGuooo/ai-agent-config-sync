import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
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
  assert.match(r.stdout, /^kept on this machine, not managed: claude:mcp:memory$/m);
  const bogus = cli(['resolve', 'repo', 'claude:mcp:nope'], home);
  assert.equal(bogus.status, 2, bogus.stdout + bogus.stderr);
  assert.match(bogus.stderr, /no such conflict or managed item: claude:mcp:nope/);
});

test('flags are strict: a typo, a repeat, a missing value or an extra word is a usage error and touches nothing', () => {
  const home = tempDir('harness-cli-');
  for (const args of [
    ['install', '--agents', 'claude', '--dryrun'],
    ['install', '--agents', 'claude', '--agents', 'pi'],
    ['install', '--agents', 'claude', '--packs'],
    ['install', '--agents', 'claude', '--packs', ''],
    ['install', '--agents', 'claude', '--packs', '--dry-run'],
    ['install', '--agents', 'claude', 'now'],
    ['install', '--agents', 'claude', '-n'],
    ['update', '--agents', 'codex'],
    ['update', 'now'],
    ['uninstall', '--agents', 'claude', '--packs', 'dev'],
    ['resolve', 'repo'],
    ['resolve', 'repo', 'all', 'more'],
    ['doctor', '--dry-run'],
    ['check', '--deep'],
  ]) {
    const r = cli(args, home);
    assert.equal(r.status, 2, `${args.join(' ')}\n${r.stdout}${r.stderr}`);
    assert.match(r.stderr, /usage:/, args.join(' '));
  }
  assert.deepEqual(readdirSync(home), []);
});

test('help goes to stdout and succeeds; no command at all is a usage error', () => {
  for (const args of [['help'], ['--help'], ['-h'], ['install', '--help']]) {
    const r = cli(args);
    assert.equal(r.status, 0, args.join(' '));
    assert.match(r.stdout, /usage:/);
  }
  const none = cli([]);
  assert.equal(none.status, 2);
  assert.match(none.stderr, /usage:/);
});

test('--dry-run writes nothing for install, uninstall, update and resolve', () => {
  const home = tempDir('harness-cli-');
  const dry = cli(['install', '--agents', 'claude', '--packs', 'craft', '--dry-run'], home);
  assert.equal(dry.status, 0, dry.stdout + dry.stderr);
  assert.match(dry.stdout, /^dry run — nothing was written$/m);
  assert.match(dry.stdout, /^would change \(\d+\)/m);
  assert.deepEqual(readdirSync(home), []);

  assert.equal(cli(['install', '--agents', 'claude,claude', '--packs', 'craft,craft'], home).status, 0);
  const statePath = join(home, '.harness-local', 'state.json');
  assert.deepEqual(json(statePath).agents, ['claude']);
  assert.deepEqual(json(statePath).packs, ['craft']);
  const link = join(home, '.claude', 'skills', 'brainstorming');
  const un = cli(['uninstall', '--agents', 'claude', '--dry-run'], home);
  assert.equal(un.status, 0, un.stdout + un.stderr);
  assert.match(un.stdout, /^would change/m);
  assert.ok(isLink(link));
  assert.deepEqual(json(statePath).agents, ['claude']);

  const mcp = join(home, '.claude.json');
  const obj = json(mcp);
  obj.mcpServers.memory.args.push('--mine');
  writeFileSync(mcp, JSON.stringify(obj));
  const before = [readFileSync(mcp, 'utf8'), readFileSync(statePath, 'utf8')];
  const upd = cli(['update', '--dry-run'], home);
  assert.equal(upd.status, 1, upd.stdout + upd.stderr);
  assert.match(upd.stdout, /claude:mcp:memory/);
  const res = cli(['resolve', 'repo', 'all', '--dry-run'], home);
  assert.equal(res.status, 0, res.stdout + res.stderr);
  assert.match(res.stdout, /^dry run — nothing was written$/m);
  assert.match(res.stdout, /^would change/m);
  assert.deepEqual([readFileSync(mcp, 'utf8'), readFileSync(statePath, 'utf8')], before);
});
