import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tempDir, put } from './helpers.mjs';
import { makeContext } from '../lib/platform.mjs';
import { runInstall } from '../lib/engine.mjs';
import { doctor, repoProblems } from '../lib/doctor.mjs';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
// An empty env, so Codex and Pi never resolve a real variable of this machine into the scratch home's files.
const scratch = () => ({ ...makeContext({ repo, home: tempDir('harness-dr-home-'), local: tempDir('harness-dr-local-') }), env: {} });
const msgs = (found) => found.map((f) => f.msg).join('\n');

test('repoProblems is empty for this repo', () => {
  assert.deepEqual(repoProblems(scratch()), []);
});

test('doctor: nothing installed, clean after install, a conflict after a hand edit', async () => {
  const ctx = scratch();
  assert.match((await doctor(ctx)).map((f) => f.msg).join('\n'), /nothing is installed/);
  runInstall(ctx, { agents: ['claude'], packs: ['craft'] });
  const clean = await doctor(ctx);
  assert.deepEqual(clean.filter((f) => f.level === 'fail'), []);
  assert.ok(!clean.some((f) => /would make/.test(f.msg)), JSON.stringify(clean, null, 2));
  const file = join(ctx.home, '.claude.json');
  const obj = JSON.parse(readFileSync(file, 'utf8'));
  obj.mcpServers.memory.args.push('--mine');
  writeFileSync(file, JSON.stringify(obj));
  assert.ok((await doctor(ctx)).some((f) => f.level === 'fail' && f.msg.includes('claude:mcp:memory')));
});

test('doctor: a config the dry run cannot read is a failure naming the file, and the other checks still run', async () => {
  const ctx = scratch();
  runInstall(ctx, { agents: ['claude'], packs: ['craft'] });
  const settings = join(ctx.home, '.claude', 'settings.json');
  const obj = JSON.parse(readFileSync(settings, 'utf8'));
  obj.enabledPlugins['pyright-lsp@claude-plugins-official'] = false;
  writeFileSync(settings, JSON.stringify(obj));
  runInstall(ctx, { agents: ['claude'], packs: ['craft'], resolutions: { 'claude:plugin:pyright-lsp@claude-plugins-official': 'keep' } });
  const file = join(ctx.home, '.claude.json');
  writeFileSync(file, '{"x": tok-SECRET-123}');
  const found = await doctor(ctx);
  assert.ok(found.some((f) => f.level === 'fail' && f.msg.includes(file)), JSON.stringify(found, null, 2));
  assert.ok(!msgs(found).includes('tok-SECRET'));
  assert.ok(found.some((f) => f.level === 'warn' && f.msg === 'kept on this machine, not managed: claude:plugin:pyright-lsp@claude-plugins-official'), JSON.stringify(found, null, 2));
});

test('doctor: a damaged state file is a failure, not a crash', async () => {
  const ctx = scratch();
  put(ctx.local, 'state.json', '{"agents": [');
  const found = await doctor(ctx);
  assert.ok(found.some((f) => f.level === 'fail' && f.msg.includes(join(ctx.local, 'state.json'))), JSON.stringify(found, null, 2));
});

test('doctor: warns about files that shadow or override what the harness wrote, for installed agents only', async () => {
  const shadows = (home) => [
    join(home, '.codex', 'AGENTS.override.md'),
    join(home, '.pi', 'agent', 'AGENTS.override.md'),
    join(home, '.config', 'opencode', 'opencode.jsonc'),
    join(home, '.config', 'opencode', 'config.json'),
  ];
  const only = scratch();
  runInstall(only, { agents: ['claude'], packs: ['craft'] });
  for (const p of shadows(only.home)) put(p, '', '{}\n');
  const quiet = msgs(await doctor(only));
  for (const p of shadows(only.home)) assert.ok(!quiet.includes(p), quiet);

  const ctx = scratch();
  runInstall(ctx, { agents: ['codex', 'opencode', 'pi'], packs: ['craft'] });
  for (const p of shadows(ctx.home)) put(p, '', '{}\n');
  const found = await doctor(ctx);
  for (const p of shadows(ctx.home)) assert.ok(found.some((f) => f.level === 'warn' && f.msg.includes(p)), `${p}\n${msgs(found)}`);
});
