import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { tempDir, put, fixtureRepo } from './helpers.mjs';
import { makeContext, makeDirLink } from '../lib/platform.mjs';
import { runInstall } from '../lib/engine.mjs';
import { doctor, repoProblems, opencodeNotLoaded, codexNotLoaded, missingLspPlugins } from '../lib/doctor.mjs';

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

test('repoProblems names a missing and an unknown placeholder, and skips the HARNESS.md check without its script', () => {
  const fixture = fixtureRepo();
  const ctx = makeContext({ repo: fixture, home: tempDir('harness-dr-home-'), local: tempDir('harness-dr-local-') });
  assert.deepEqual(repoProblems(ctx), []);
  put(fixture, 'prompt/core.md', '# {{TITLE}}\n\n{{SKILLS}}\n\n{{MCP}}\n\n{{NOTES}}\n\n{{REPOS}}\n');
  assert.deepEqual(repoProblems(ctx), ['prompt/core.md is missing {{REPO}}', 'prompt/core.md has an unknown placeholder {{REPOS}}']);
});

test('doctor --deep runs no agent against a home that is not the real one', async () => {
  const ctx = scratch();
  runInstall(ctx, { agents: ['claude', 'codex', 'opencode'], packs: ['craft'] });
  const found = await doctor(ctx, { deep: true });
  assert.ok(found.some((f) => f.level === 'warn' && /deep checks skipped: they run the real agents and only make sense for the real home/.test(f.msg)), msgs(found));
  assert.ok(!/is (opencode|codex) installed|does not load|plugin is enabled/.test(msgs(found)), msgs(found));
});

test('opencodeNotLoaded reads the JSON list after any log lines', () => {
  const names = ['alpha', 'beta'];
  assert.deepEqual(opencodeNotLoaded('INFO starting [svc=skill]\n[\n  {"name": "alpha", "location": "/x/alpha/SKILL.md"}\n]\n', names), ['beta']);
  assert.deepEqual(opencodeNotLoaded('[opencode] log line\n[{"name":"alpha"},{"name":"beta"}]\nINFO done\n', names), []);
  assert.deepEqual(opencodeNotLoaded('[]\n', names), names);
  assert.equal(opencodeNotLoaded('Error: no config\n', names), null);
  assert.equal(opencodeNotLoaded('', names), null);
});

// What `codex debug prompt-input` prints: the prompt as a JSON list of messages.
const codexOut = (...texts) => JSON.stringify(texts.map((t) => ({ type: 'message', role: 'developer', content: [{ type: 'input_text', text: t }] })), null, 2);

test('codexNotLoaded reads the JSON prompt and counts only its skills section', () => {
  const out = JSON.stringify([{ type: 'message', role: 'developer', content: [{ type: 'input_text', text: '<skills_instructions>\n### Available skills\n- beta: x\n</skills_instructions>' }] }], null, 2);
  assert.deepEqual(codexNotLoaded(out, ['beta', 'gamma']), ['gamma']);
  const agents = ['# Codex Global Instructions', '| `alpha` | Alpha tagline |', '- alpha: named in our instructions only'].join('\n');
  const skills = [
    '<skills_instructions>',
    '## Skills',
    '### Available skills',
    '- beta: Beta skill (file: /home/u/.codex/skills/beta/SKILL.md)',
    '- axb: a name that a.b must not match',
    '### How to use skills',
    '- Discovery: the list above is what this session has',
    '</skills_instructions>',
  ].join('\n');
  assert.deepEqual(codexNotLoaded(codexOut(agents, skills), ['alpha', 'beta', 'a.b']), ['alpha', 'a.b']);
  assert.deepEqual(codexNotLoaded(codexOut('no skills section here\n- beta: x'), ['beta']), ['beta']);
  assert.equal(codexNotLoaded('<skills_instructions>\n- beta: x\n</skills_instructions>', ['beta']), null);
  assert.equal(codexNotLoaded('{"not": "a list"}', ['beta']), null);
  assert.equal(codexNotLoaded('', ['beta']), null);
});

test('repoProblems tells a stale HARNESS.md from a generator that fails for another reason', () => {
  const fixture = fixtureRepo();
  const ctx = makeContext({ repo: fixture, home: tempDir('harness-dr-home-'), local: tempDir('harness-dr-local-') });
  const gen = (stderr) => put(fixture, 'scripts/gen-harness.mjs', `console.error(${JSON.stringify(stderr)});\nprocess.exit(1);\n`);
  gen('OUT OF DATE: HARNESS.md — run: node scripts/gen-harness.mjs');
  assert.deepEqual(repoProblems(ctx), ['HARNESS.md is out of date — run: node scripts/gen-harness.mjs']);
  gen('\nHARNESS.md has no PACKS markers.\nsecond line');
  assert.deepEqual(repoProblems(ctx), ['scripts/gen-harness.mjs --check failed: HARNESS.md has no PACKS markers.']);
});

test('missingLspPlugins reads installed_plugins.json and leaves out the ones kept on this machine', () => {
  const installed = { version: 2, plugins: { 'pyright-lsp@claude-plugins-official': [{ scope: 'user' }], 'typescript-lsp@claude-plugins-official': [{ scope: 'user' }] } };
  const entries = { 'claude:plugin:gopls-lsp@claude-plugins-official': { agent: 'claude', kind: 'json', hash: null, pinned: true } };
  assert.deepEqual(missingLspPlugins(installed, entries), ['rust-analyzer-lsp@claude-plugins-official']);
  assert.equal(missingLspPlugins(null, {}).length, 4);
});

test('doctor reports only skills folders the harness left behind under a pack, never a project\'s own', async () => {
  const ctx = scratch();
  runInstall(ctx, { agents: ['claude'], packs: ['craft'] });
  const pack = join(ctx.home, 'dev-project');
  put(pack, 'my-app/.claude/skills/my-skill/SKILL.md', '---\nname: my-skill\ndescription: mine\n---\n');
  makeDirLink(tempDir('harness-dr-elsewhere-'), join(pack, 'my-tools', '.claude', 'skills', 'shared'));
  makeDirLink(join(repo, 'skills', 'global', 'brainstorming'), join(pack, 'old', '.claude', 'skills', 'brainstorming'));
  const gone = tempDir('harness-dr-gone-');
  makeDirLink(gone, join(pack, 'gone', '.claude', 'skills', 'x'));
  rmSync(gone, { recursive: true });
  const found = msgs(await doctor(ctx));
  assert.ok(!found.includes(join(pack, 'my-app')), found);
  assert.ok(!found.includes(join(pack, 'my-tools')), found);
  assert.ok(found.includes(join(pack, 'old', '.claude', 'skills')), found);
  assert.ok(found.includes(join(pack, 'gone', '.claude', 'skills')), found);
});

const hasGit = spawnSync('git', ['--version']).status === 0;

test('doctor lists uncommitted shipped files as git prints them, the first one included', { skip: !hasGit && 'git is not installed' }, async () => {
  const fixture = fixtureRepo();
  const git = (...args) => spawnSync('git', ['-C', fixture, '-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'core.autocrlf=false', ...args], { encoding: 'utf8' });
  git('init', '-q');
  git('add', '-A');
  git('commit', '-q', '-m', 'fixture');
  const ctx = { ...makeContext({ repo: fixture, home: tempDir('harness-dr-home-'), local: tempDir('harness-dr-local-') }), env: {} };
  runInstall(ctx, { agents: ['pi'], packs: ['dev'] });
  writeFileSync(join(fixture, 'skills', 'global', 'alpha', 'SKILL.md'), 'edited\n');
  writeFileSync(join(fixture, 'skills', 'global', 'beta', 'SKILL.md'), 'edited\n');
  const dirty = (await doctor(ctx)).find((f) => f.msg.startsWith('uncommitted changes'));
  assert.ok(dirty?.msg.endsWith(':\n     M skills/global/alpha/SKILL.md\n     M skills/global/beta/SKILL.md'), dirty?.msg);
});

test('doctor names a missing variable once, even when the dry run warns about it too', async () => {
  const fixture = fixtureRepo();
  put(fixture, 'mcp/catalog.json', JSON.stringify({ servers: { remote: { http: 'https://example.com/${REMOTE_REF}/mcp', bearerEnv: 'REMOTE_TOKEN', on: true } } }));
  const ctx = { ...makeContext({ repo: fixture, home: tempDir('harness-dr-home-'), local: tempDir('harness-dr-local-') }), env: {} };
  runInstall(ctx, { agents: ['pi'], packs: ['dev'] });
  const found = await doctor(ctx);
  assert.equal(found.filter((f) => f.msg.includes('REMOTE_REF')).length, 1, msgs(found));
  assert.ok(found.some((f) => f.msg === 'environment variable REMOTE_TOKEN is not set, but a server that is on by default needs it'), msgs(found));
});
