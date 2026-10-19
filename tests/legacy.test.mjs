import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fixtureRepo, tempDir, put, newRun } from './helpers.mjs';
import { makeContext, makeDirLink } from '../lib/platform.mjs';
import { cleanHome, cleanSkillDir, cleanAgent } from '../lib/legacy.mjs';

const V1 = '# old\n<!-- SKILLS:BEGIN -->\nx\n<!-- SKILLS:END -->\n';
const json = (p) => JSON.parse(readFileSync(p, 'utf8'));
function setup() {
  const repo = fixtureRepo();
  put(repo, 'HARNESS.md', '\n# Harness\nbody\n');
  put(repo, 'PLAYBOOK.md', '# Playbook\nbody\n');
  const home = tempDir();
  return { repo, home, ctx: makeContext({ repo, home }) };
}

test('cleanHome removes v1 copies and leaves files that are not v1 output', () => {
  const { home, ctx } = setup();
  put(home, 'HARNESS.md', '# Harness\r\nbody\r\n');
  put(home, 'PLAYBOOK.md', '# Playbook\nolder body\n');
  put(home, '.agent-hooks/guard.mjs', 'x');
  put(home, '.agent-hooks/format.mjs', 'x');
  put(home, 'MCP-Templates/supabase.mcp.json', '{}');
  put(home, 'MCP-Templates/README.md', 'x');
  put(home, 'AGENTS.md', 'my own notes\n');
  cleanHome(ctx, newRun());
  for (const p of ['HARNESS.md', 'PLAYBOOK.md', '.agent-hooks', 'MCP-Templates']) assert.ok(!existsSync(join(home, p)), p);
  assert.ok(existsSync(join(home, 'AGENTS.md')));
  put(home, 'AGENTS.md', V1);
  cleanHome(ctx, newRun());
  assert.ok(!existsSync(join(home, 'AGENTS.md')));
});

test('cleanHome leaves a HARNESS.md and PLAYBOOK.md that are the users own', () => {
  const { home, ctx } = setup();
  put(home, 'HARNESS.md', '# My own harness notes\n');
  put(home, 'PLAYBOOK.md', 'something else\n');
  const run = newRun();
  cleanHome(ctx, run);
  assert.ok(existsSync(join(home, 'HARNESS.md')));
  assert.ok(existsSync(join(home, 'PLAYBOOK.md')));
  assert.equal(run.report.changes.length, 0);
});

test('cleanSkillDir removes the two data files v1 mirrored', () => {
  const { ctx } = setup();
  const dir = tempDir();
  put(dir, 'catalog.json', '{}');
  put(dir, 'skill-rules.json', '{}');
  put(dir, 'keep/SKILL.md', 'x');
  cleanSkillDir(ctx, dir, newRun());
  assert.deepEqual([existsSync(join(dir, 'catalog.json')), existsSync(join(dir, 'skill-rules.json')), existsSync(join(dir, 'keep'))], [false, false, true]);
});

test('cleanSkillDir never deletes through a skills dir linked to the repo', () => {
  const { repo, home, ctx } = setup();
  const dir = join(home, '.claude', 'skills');
  makeDirLink(join(repo, 'skills', 'global'), dir);
  assert.throws(() => cleanSkillDir(ctx, dir, newRun()), /resolves into|link/);
  assert.ok(existsSync(join(repo, 'skills', 'global', 'catalog.json')));
});

test('claude: drops v1 hooks and the stray mcpServers key, keeps the rest', () => {
  const { home, ctx } = setup();
  const file = put(home, '.claude/settings.json', JSON.stringify({ model: 'opus', mcpServers: { memory: {} }, hooks: {
    PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'node C:/Users/x/.agent-hooks/guard.mjs' }] }],
    SessionStart: [{ matcher: '', hooks: [{ type: 'command', command: 'any-buddy apply --silent' }] }],
  } }));
  cleanAgent(ctx, 'claude', ['memory', 'remote'], newRun());
  assert.deepEqual(json(file), { model: 'opus', hooks: { SessionStart: [{ matcher: '', hooks: [{ type: 'command', command: 'any-buddy apply --silent' }] }] } });
});

test('claude: a v1 hook with a Windows backslash path is recognised', () => {
  const { home, ctx } = setup();
  const file = put(home, '.claude/settings.json', JSON.stringify({ model: 'opus', hooks: {
    PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'node C:\\Users\\x\\.agent-hooks\\guard.mjs' }] }],
  } }));
  cleanAgent(ctx, 'claude', [], newRun());
  assert.deepEqual(json(file), { model: 'opus', hooks: {} });
});

test('codex: a v1 hook with a backslash path in a TOML literal string is removed', () => {
  const { home, ctx } = setup();
  const file = put(home, '.codex/config.toml', 'model = "m"\n\n[[hooks.PostToolUse]]\nmatcher = "Edit"\n[[hooks.PostToolUse.hooks]]\ntype = "command"\ncommand = \'node C:\\Users\\x\\.agent-hooks\\format.mjs\'\n');
  cleanAgent(ctx, 'codex', [], newRun());
  assert.equal(readFileSync(file, 'utf8'), 'model = "m"\n');
});

test('claude: an mcpServers key naming servers outside the catalog is left alone', () => {
  const { home, ctx } = setup();
  const file = put(home, '.claude/settings.json', JSON.stringify({ mcpServers: { mine: {} } }));
  cleanAgent(ctx, 'claude', ['memory'], newRun());
  assert.deepEqual(json(file), { mcpServers: { mine: {} } });
});

test('codex: removes the v1 profiles and the v1 hooks in config.toml', () => {
  const { home, ctx } = setup();
  for (const f of ['development.toml', 'full.toml', 'minimal.toml', 'switch.ps1', 'switch.sh']) put(home, `.codex/profiles/${f}`, 'x');
  const file = put(home, '.codex/config.toml', 'model = "m"\n\n[[hooks.PreToolUse]]\nmatcher = "Bash"\n[[hooks.PreToolUse.hooks]]\ntype = "command"\ncommand = "node C:/Users/x/.agent-hooks/guard.mjs"\n');
  cleanAgent(ctx, 'codex', [], newRun());
  assert.ok(!existsSync(join(home, '.codex', 'profiles')));
  assert.equal(readFileSync(file, 'utf8'), 'model = "m"\n');
});

test('codex: the v1 comment line goes with the hooks, in the files line ending; a changed comment stays', () => {
  const { home, ctx } = setup();
  const comment = '# Shared safety guard + defensive formatter (scripts installed at ~/.agent-hooks).';
  const hooks = (eol) => ['[[hooks.PreToolUse]]', 'matcher = "Bash"', '[[hooks.PreToolUse.hooks]]', 'type = "command"', 'command = "node C:/Users/x/.agent-hooks/guard.mjs"'].join(eol) + eol;
  const file = put(home, '.codex/config.toml', `model = "m"\r\n\r\n${comment}\r\n${hooks('\r\n')}`);
  cleanAgent(ctx, 'codex', [], newRun());
  assert.equal(readFileSync(file, 'utf8'), 'model = "m"\r\n\r\n');
  const mine = `model = "m"\n${comment} mine\n# ${comment}\n`;
  put(home, '.codex/config.toml', mine);
  const run = newRun();
  cleanAgent(ctx, 'codex', [], run);
  assert.equal(readFileSync(file, 'utf8'), mine);
  assert.equal(run.report.changes.length, 0);
});

test('codex: a config.toml the hook remover cannot read is a warning, not a crash', () => {
  const { home, ctx } = setup();
  const text = '[[hooks.PreToolUse]]\n[[hooks.PreToolUse.hooks]]\ncommand = = broken\n';
  const file = put(home, '.codex/config.toml', text);
  const run = newRun();
  cleanAgent(ctx, 'codex', [], run);
  assert.equal(readFileSync(file, 'utf8'), text);
  assert.equal(run.report.warnings.length, 1);
  assert.match(run.report.warnings[0], /could not read the v1 hooks in .*config\.toml/);
});

test('cursor: removes v1 rule files and the v1 off-by-default entries', () => {
  const { home, ctx } = setup();
  put(home, '.cursor/global-rules.md', V1);
  put(home, '.cursor/rules/global-rules.md', V1);
  const file = put(home, '.cursor/mcp.json', JSON.stringify({ mcpServers: { remote: { url: 'u', enabled: false }, memory: { command: 'npx' }, mine: { command: 'x', enabled: false } } }));
  cleanAgent(ctx, 'cursor', ['memory', 'remote'], newRun());
  assert.ok(!existsSync(join(home, '.cursor', 'global-rules.md')));
  assert.ok(!existsSync(join(home, '.cursor', 'rules', 'global-rules.md')));
  assert.deepEqual(Object.keys(json(file).mcpServers), ['memory', 'mine']);
});

test('cursor: mcp.json keeps its CRLF line endings when edited', () => {
  const { home, ctx } = setup();
  const file = put(home, '.cursor/mcp.json', JSON.stringify({ mcpServers: { remote: { url: 'u', enabled: false }, mine: { command: 'x' } } }, null, 2).replace(/\n/g, '\r\n') + '\r\n');
  cleanAgent(ctx, 'cursor', ['remote'], newRun());
  const text = readFileSync(file, 'utf8');
  assert.deepEqual(Object.keys(JSON.parse(text).mcpServers), ['mine']);
  assert.ok(text.endsWith('}\r\n'));
  assert.equal(text.replace(/\r\n/g, '').includes('\n'), false);
});

test('opencode: removes what v1 put in ~/.opencode and the old command copies', () => {
  const { home, ctx } = setup();
  put(home, '.opencode/AGENTS.md', V1);
  put(home, '.opencode/opencode.json', JSON.stringify({ $schema: 's', lsp: true, mcp: {} }));
  put(home, '.opencode/skills/catalog.json', JSON.stringify({ skills: { alpha: {} } }));
  put(home, '.opencode/skills/alpha/SKILL.md', readFileSync(join(ctx.repo, 'skills/global/alpha/SKILL.md'), 'utf8'));
  put(home, '.opencode/command/opsx-x.md', 'opsx command\n');
  put(home, '.opencode/package.json', '{}');
  put(home, '.config/opencode/command/opsx-x.md', 'opsx command\r\n');
  cleanAgent(ctx, 'opencode', [], newRun());
  for (const p of ['.opencode/AGENTS.md', '.opencode/opencode.json', '.opencode/skills', '.opencode/command', '.config/opencode/command']) assert.ok(!existsSync(join(home, p)), p);
  assert.ok(existsSync(join(home, '.opencode', 'package.json')));
});

test('dry run removes nothing', () => {
  const { home, ctx } = setup();
  put(home, 'HARNESS.md', '# Harness\n');
  const run = newRun({ dryRun: true });
  cleanHome(ctx, run);
  assert.ok(existsSync(join(home, 'HARNESS.md')));
  assert.equal(run.report.changes.length, 1);
});

function v1Skills(home, ctx, extra = () => {}) {
  put(home, '.opencode/skills/catalog.json', JSON.stringify({ skills: { alpha: {}, beta: {}, gone: {} } }));
  put(home, '.opencode/skills/skill-rules.json', '{}');
  put(home, '.opencode/skills/alpha/SKILL.md', readFileSync(join(ctx.repo, 'skills/global/alpha/SKILL.md'), 'utf8'));
  extra();
}

test('opencode skills: only the skills v1 mirrored go, the users own stay', () => {
  const { home, ctx } = setup();
  v1Skills(home, ctx, () => put(home, '.opencode/skills/mine/SKILL.md', 'mine'));
  const run = newRun();
  cleanAgent(ctx, 'opencode', [], run);
  const d = join(home, '.opencode', 'skills');
  assert.deepEqual(readdirSync(d), ['mine']);
  assert.equal(run.report.notes.length, 1);
  assert.match(run.report.notes[0], /mine/);
});

test('opencode skills: a v1-named skill that differs from the repo is labelled, also in a dry run', () => {
  const { home, ctx } = setup();
  v1Skills(home, ctx, () => put(home, '.opencode/skills/beta/SKILL.md', 'edited by hand'));
  put(home, '.opencode/skills/gone/SKILL.md', 'x');
  const run = newRun({ dryRun: true });
  cleanAgent(ctx, 'opencode', [], run);
  const labels = run.report.changes;
  assert.ok(labels.some((c) => c.startsWith('remove-v1 (differs from the repo) ') && c.endsWith('beta')));
  assert.ok(labels.some((c) => c.startsWith('remove-v1 (differs from the repo) ') && c.endsWith('gone')));
  assert.ok(labels.some((c) => c.startsWith('remove-v1 ') && c.endsWith('alpha')));
  assert.ok(existsSync(join(home, '.opencode', 'skills', 'beta')));
});

test('opencode skills: the directory itself goes once it is empty', () => {
  const { home, ctx } = setup();
  v1Skills(home, ctx);
  cleanAgent(ctx, 'opencode', [], newRun());
  assert.ok(!existsSync(join(home, '.opencode', 'skills')));
});

test('opencode skills: an unreadable catalog.json is a warning and nothing is removed', () => {
  const { home, ctx } = setup();
  v1Skills(home, ctx);
  put(home, '.opencode/skills/catalog.json', '{ not json');
  const run = newRun();
  cleanAgent(ctx, 'opencode', [], run);
  assert.equal(run.report.warnings.length, 1);
  assert.ok(existsSync(join(home, '.opencode', 'skills', 'alpha', 'SKILL.md')));
  assert.ok(existsSync(join(home, '.opencode', 'skills', 'skill-rules.json')));
});
