import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fixtureRepo, tempDir, put, newRun } from './helpers.mjs';
import { makeContext, makeDirLink } from '../lib/platform.mjs';
import { cleanHome, cleanSkillDir, cleanAgent } from '../lib/legacy.mjs';

// The descriptions v1's two data files carried, copied from git history.
const V1_CATALOG = 'Curated catalog of global skills: the single source for the generated skill tables in each agent\'s instruction file. The generator (scripts/gen-skill-table.mjs) reconciles this against the actual skills/global/*/ directories and fails if they disagree, so a new skill cannot silently drift out of the tables.';
const V1_RULES = 'Global skill activation rules for Claude Code. Global rules should cover process discipline and routing only. Domain-specific guidance belongs in local project skill packs.';
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
  put(dir, 'catalog.json', JSON.stringify({ description: V1_CATALOG, skills: {} }));
  put(dir, 'skill-rules.json', JSON.stringify({ description: V1_RULES, rules: [] }));
  put(dir, 'keep/SKILL.md', 'x');
  cleanSkillDir(ctx, dir, newRun());
  assert.deepEqual([existsSync(join(dir, 'catalog.json')), existsSync(join(dir, 'skill-rules.json')), existsSync(join(dir, 'keep'))], [false, false, true]);
});

test('cleanSkillDir removes the README v1 mirrored and keeps one the user wrote', () => {
  const { ctx } = setup();
  const dir = tempDir();
  put(dir, 'README.md', '\n# Skills\r\nbody\r\n');
  cleanSkillDir(ctx, dir, newRun());
  assert.ok(!existsSync(join(dir, 'README.md')));
  put(dir, 'README.md', '# My notes\n');
  const run = newRun();
  cleanSkillDir(ctx, dir, run);
  assert.ok(existsSync(join(dir, 'README.md')));
  assert.deepEqual([run.report.changes, run.report.warnings], [[], []]);
});

test('cleanSkillDir keeps data files that are not v1 output', () => {
  const { ctx } = setup();
  const dir = tempDir();
  put(dir, 'catalog.json', JSON.stringify({ description: 'my own catalog' }));
  put(dir, 'skill-rules.json', '{ broken');
  const run = newRun();
  cleanSkillDir(ctx, dir, run);
  assert.ok(existsSync(join(dir, 'catalog.json')));
  assert.ok(existsSync(join(dir, 'skill-rules.json')));
  assert.equal(run.report.changes.length, 0);
});

test('cleanSkillDir never deletes through a skills dir linked to the repo', () => {
  const { repo, home, ctx } = setup();
  put(repo, 'skills/global/catalog.json', JSON.stringify({ description: V1_CATALOG, skills: {} }));
  const dir = join(home, '.claude', 'skills');
  makeDirLink(join(repo, 'skills', 'global'), dir);
  const run = newRun();
  cleanSkillDir(ctx, dir, run);
  assert.ok(existsSync(join(repo, 'skills', 'global', 'catalog.json')));
  assert.equal(run.report.warnings.length, 1);
  assert.match(run.report.warnings[0], /resolves into/);
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
  assert.equal(readFileSync(file, 'utf8'), 'model = "m"\r\n');
  const mine = `model = "m"\n${comment} mine\n# ${comment}\n`;
  put(home, '.codex/config.toml', mine);
  const run = newRun();
  cleanAgent(ctx, 'codex', [], run);
  assert.equal(readFileSync(file, 'utf8'), mine);
  assert.equal(run.report.changes.length, 0);
});

test('codex: a config.toml the hook remover cannot read is a warning, not a crash', () => {
  const { home, ctx } = setup();
  const text = '[[hooks.PreToolUse]]\n[[hooks.PreToolUse.hooks]]\ncommand = = "/h/.agent-hooks/guard.mjs"\n';
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
  put(home, '.opencode/opencode.json', JSON.stringify({ $schema: 's', lsp: true, mcp: { memory: {} } }));
  put(home, '.opencode/skills/catalog.json', JSON.stringify({ description: V1_CATALOG, skills: { alpha: {} } }));
  put(home, '.opencode/skills/alpha/SKILL.md', readFileSync(join(ctx.repo, 'skills/global/alpha/SKILL.md'), 'utf8'));
  put(home, '.opencode/command/opsx-x.md', 'opsx command\n');
  put(home, '.opencode/package.json', '{}');
  put(home, '.config/opencode/command/opsx-x.md', 'opsx command\r\n');
  cleanAgent(ctx, 'opencode', ['memory'], newRun());
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
  put(home, '.opencode/skills/catalog.json', JSON.stringify({ description: V1_CATALOG, skills: { alpha: {}, beta: {}, gone: {} } }));
  put(home, '.opencode/skills/skill-rules.json', JSON.stringify({ description: V1_RULES }));
  put(home, '.opencode/skills/alpha/SKILL.md', readFileSync(join(ctx.repo, 'skills/global/alpha/SKILL.md'), 'utf8'));
  extra();
}

test('opencode skills: only the skills v1 mirrored go, the users own stay', () => {
  const { home, ctx } = setup();
  v1Skills(home, ctx, () => put(home, '.opencode/skills/mine/SKILL.md', 'mine'));
  const run = newRun();
  cleanAgent(ctx, 'opencode', [], run);
  assert.deepEqual(readdirSync(join(home, '.opencode', 'skills')), ['mine']);
  assert.equal(run.report.notes.length, 1);
  assert.match(run.report.notes[0], /mine/);
});

test('opencode skills: labels say whether a v1 copy differs or the repo dropped it, also in a dry run', () => {
  const { home, ctx } = setup();
  v1Skills(home, ctx, () => put(home, '.opencode/skills/beta/SKILL.md', 'edited by hand'));
  put(home, '.opencode/skills/gone/SKILL.md', 'x');
  const run = newRun({ dryRun: true });
  cleanAgent(ctx, 'opencode', [], run);
  const labels = run.report.changes;
  assert.ok(labels.some((c) => c.startsWith("remove-v1 (differs from the repo's copy) ") && c.endsWith('beta')));
  assert.ok(labels.some((c) => c.startsWith('remove-v1 (the repo no longer ships it) ') && c.endsWith('gone')));
  assert.ok(labels.some((c) => c.startsWith('remove-v1 ') && c.endsWith('alpha')));
  assert.ok(existsSync(join(home, '.opencode', 'skills', 'beta')));
});

test('opencode skills: the directory itself goes once it is empty', () => {
  const { home, ctx } = setup();
  v1Skills(home, ctx);
  cleanAgent(ctx, 'opencode', [], newRun());
  assert.ok(!existsSync(join(home, '.opencode', 'skills')));
});

test('opencode skills: an unreadable catalog.json is skipped silently and nothing is removed', () => {
  const { home, ctx } = setup();
  v1Skills(home, ctx);
  put(home, '.opencode/skills/catalog.json', '{ not json');
  const run = newRun();
  cleanAgent(ctx, 'opencode', [], run);
  assert.deepEqual([run.report.warnings, run.report.changes], [[], []]);
  assert.ok(existsSync(join(home, '.opencode', 'skills', 'alpha', 'SKILL.md')));
  assert.ok(existsSync(join(home, '.opencode', 'skills', 'skill-rules.json')));
});

test('opencode skills: a catalog that is not v1 output, an empty name and a git clone are left alone', () => {
  const { home, ctx } = setup();
  put(home, '.opencode/skills/catalog.json', JSON.stringify({ description: 'mine', skills: { alpha: {} } }));
  put(home, '.opencode/skills/alpha/SKILL.md', 'mine');
  cleanAgent(ctx, 'opencode', [], newRun());
  assert.ok(existsSync(join(home, '.opencode', 'skills', 'alpha')));
  put(home, '.opencode/skills/catalog.json', JSON.stringify({ description: V1_CATALOG, skills: { '': {}, alpha: {} } }));
  put(home, '.opencode/skills/alpha/.git/HEAD', 'ref');
  const run = newRun();
  cleanAgent(ctx, 'opencode', [], run);
  assert.ok(existsSync(join(home, '.opencode', 'skills', 'alpha', '.git')));
  assert.ok(run.report.notes.some((n) => n.includes('git clone')));
});

test('opencode skills: a skills dir that is a link is left alone with a warning', () => {
  const { repo, home, ctx } = setup();
  put(repo, 'skills/global/catalog.json', JSON.stringify({ description: V1_CATALOG, skills: { alpha: {} } }));
  makeDirLink(join(repo, 'skills', 'global'), join(home, '.opencode', 'skills'));
  const run = newRun();
  cleanAgent(ctx, 'opencode', [], run);
  assert.ok(existsSync(join(repo, 'skills', 'global', 'alpha', 'SKILL.md')));
  assert.equal(run.report.changes.length, 0);
  assert.equal(run.report.warnings.length, 1);
});

test('opencode: v1-looking files that hold anything of the users are kept', () => {
  const { home, ctx } = setup();
  put(home, '.opencode/opencode.json', JSON.stringify({ lsp: true, theme: 'x' }));
  put(home, '.opencode/command/opsx-x.md', 'edited command\n');
  put(home, '.config/opencode/command/opsx-x.md', 'edited command\n');
  const run = newRun();
  cleanAgent(ctx, 'opencode', ['memory'], run);
  put(home, '.opencode/opencode.json', JSON.stringify({ mcp: { mine: {} } }));
  cleanAgent(ctx, 'opencode', ['memory'], run);
  assert.equal(run.report.changes.length, 0);
  assert.ok(existsSync(join(home, '.opencode', 'opencode.json')));
  assert.ok(existsSync(join(home, '.opencode', 'command', 'opsx-x.md')));
  assert.ok(existsSync(join(home, '.config', 'opencode', 'command', 'opsx-x.md')));
});

test('opencode: an opencode.json is removed only when it is exactly what v1 wrote', () => {
  const { home, ctx } = setup();
  const file = join(home, '.opencode', 'opencode.json');
  for (const cfg of [{ $schema: 's', lsp: { rust: { disabled: true } } }, { lsp: false, mcp: { memory: {} } }, { lsp: true }, { lsp: true, mcp: {} }]) {
    put(home, '.opencode/opencode.json', JSON.stringify(cfg));
    const run = newRun();
    cleanAgent(ctx, 'opencode', ['memory'], run);
    assert.ok(existsSync(file), JSON.stringify(cfg));
    assert.equal(run.report.changes.length, 0);
  }
  put(home, '.opencode/opencode.json', JSON.stringify({ $schema: 's', mcp: { memory: {} } }));
  cleanAgent(ctx, 'opencode', ['memory'], newRun());
  assert.ok(!existsSync(file));
});

test('opencode: a command file that is the repos is removed, one that was edited stays', () => {
  const { home, ctx } = setup();
  put(home, '.opencode/command/opsx-x.md', 'opsx command\n');
  put(home, '.opencode/command/mine.md', 'mine\n');
  cleanAgent(ctx, 'opencode', [], newRun());
  assert.ok(!existsSync(join(home, '.opencode', 'command', 'opsx-x.md')));
  assert.ok(existsSync(join(home, '.opencode', 'command', 'mine.md')));
});

test('home: only what v1 shipped leaves MCP-Templates, and a hand-made file keeps the folder', () => {
  const { home, ctx } = setup();
  put(home, 'MCP-Templates/supabase.mcp.json', '{}');
  put(home, 'MCP-Templates/README.md', 'x');
  put(home, 'MCP-Templates/.mcp.json', '{}');
  const run = newRun();
  cleanHome(ctx, run);
  assert.deepEqual(readdirSync(join(home, 'MCP-Templates')), ['.mcp.json']);
  assert.ok(run.report.notes.some((n) => n.includes('.mcp.json')));
});

test('home: folders with an extra file are kept, and a file in place of a folder does not throw', () => {
  const { home, ctx } = setup();
  put(home, '.agent-hooks/guard.mjs', 'x');
  put(home, '.agent-hooks/mine.mjs', 'x');
  put(home, '.codex/profiles/full.toml', 'x');
  put(home, '.codex/profiles/mine.toml', 'x');
  const run = newRun();
  cleanHome(ctx, run);
  cleanAgent(ctx, 'codex', [], run);
  assert.equal(run.report.changes.length, 0);
  const second = tempDir();
  put(second, '.agent-hooks', 'a file');
  put(second, 'MCP-Templates', 'a file');
  const run2 = newRun();
  cleanHome(makeContext({ repo: ctx.repo, home: second }), run2);
  assert.equal(run2.report.changes.length + run2.report.warnings.length, 0);
});

test('home: a link that leads to something else is left alone silently', () => {
  const { home, ctx } = setup();
  const target = tempDir();
  put(target, 'mine.txt', 'x');
  makeDirLink(target, join(home, '.agent-hooks'));
  makeDirLink(target, join(home, 'MCP-Templates'));
  const run = newRun();
  cleanHome(ctx, run);
  assert.deepEqual([run.report.changes, run.report.warnings], [[], []]);
});

test('home: a link at a v1 path that leads to v1 content is a warning and its target stays', () => {
  const { repo, home, ctx } = setup();
  const target = tempDir();
  put(target, 'guard.mjs', 'x');
  makeDirLink(target, join(home, '.agent-hooks'));
  const run = newRun();
  cleanHome(ctx, run);
  assert.ok(existsSync(join(target, 'guard.mjs')));
  assert.equal(run.report.changes.length, 0);
  assert.equal(run.report.warnings.length, 1);
  assert.ok(existsSync(repo));
});

test('a file that is not UTF-8 is skipped silently, never an abort', () => {
  const { home, ctx } = setup();
  const file = join(home, 'AGENTS.md');
  put(home, 'AGENTS.md', '');
  const utf16 = (s) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(s, 'utf16le')]);
  writeFileSync(file, utf16('secret-content'));
  put(home, '.claude/settings.json', '');
  writeFileSync(join(home, '.claude', 'settings.json'), utf16('{"a":1}'));
  const run = newRun();
  cleanHome(ctx, run);
  cleanAgent(ctx, 'claude', [], run);
  assert.ok(existsSync(file));
  assert.deepEqual([run.report.warnings, run.report.changes], [[], []]);
});

test('claude: a hook the user added to one of v1s groups survives, and odd shapes never crash', () => {
  const { home, ctx } = setup();
  const mine = { type: 'command', command: 'my-own-hook' };
  const odd = { PreToolUse: [null, { matcher: 'x', hooks: null }, { hooks: [null, { command: 5 }] }, 'text'], Stop: 'nope' };
  const file = put(home, '.claude/settings.json', JSON.stringify({ hooks: {
    PostToolUse: [{ matcher: 'Edit', hooks: [{ type: 'command', command: 'node /h/.agent-hooks/format.mjs' }, mine] }],
    ...odd,
  } }));
  const run = newRun();
  cleanAgent(ctx, 'claude', [], run);
  assert.deepEqual(json(file).hooks, { PostToolUse: [{ matcher: 'Edit', hooks: [mine] }], ...odd });
  assert.equal(run.report.warnings.length, 0);
});

test('codex: v1s four-line comment block goes with the hooks; an edited block or one not above them stays', () => {
  const { home, ctx } = setup();
  const block = [
    '# Shared safety guard + defensive formatter (same scripts as the other agents).',
    '# C:/Users/x/.agent-hooks is replaced with the absolute ~/.agent-hooks path by sync after',
    '# this file is copied. Codex uses the same PreToolUse/PostToolUse schema as',
    "# Claude's hooks.json, so guard.mjs / format.mjs are reused verbatim.",
  ];
  const hooks = '[[hooks.PreToolUse]]\nmatcher = "Bash"\n[[hooks.PreToolUse.hooks]]\ntype = "command"\ncommand = "node C:/Users/x/.agent-hooks/guard.mjs"\n';
  const file = put(home, '.codex/config.toml', `model = "m"\n\n${block.join('\n')}\n${hooks}`);
  cleanAgent(ctx, 'codex', [], newRun());
  assert.equal(readFileSync(file, 'utf8'), 'model = "m"\n');
  const edited = `model = "m"\n\n${[block[0], block[1], 'my own line', block[3]].join('\n')}\n${hooks}`;
  put(home, '.codex/config.toml', edited);
  cleanAgent(ctx, 'codex', [], newRun());
  assert.equal(readFileSync(file, 'utf8'), edited.replace(hooks, ''));
  const apart = `${block.join('\n')}\nmodel = "m"\n`;
  put(home, '.codex/config.toml', apart);
  const run = newRun();
  cleanAgent(ctx, 'codex', [], run);
  assert.equal(readFileSync(file, 'utf8'), apart);
  assert.equal(run.report.changes.length, 0);
});

test('codex: a config.toml without .agent-hooks is not parsed at all', () => {
  const { home, ctx } = setup();
  const run = newRun();
  put(home, '.codex/config.toml', '[[hooks.PreToolUse]]\n[[hooks.PreToolUse.hooks]]\ncommand = = broken\n');
  cleanAgent(ctx, 'codex', [], run);
  assert.equal(run.report.warnings.length + run.report.changes.length, 0);
});

test('cursor: an entry v2 manages is not removed, even when it looks like v1s', () => {
  const { home, ctx } = setup();
  const file = put(home, '.cursor/mcp.json', JSON.stringify({ mcpServers: { remote: { url: 'u', enabled: false }, memory: { url: 'u', enabled: false } } }));
  const state = { version: 1, agents: [], packs: [], entries: { 'cursor:mcp:remote': { hash: 'h' } } };
  cleanAgent(ctx, 'cursor', ['memory', 'remote'], newRun({ state }));
  assert.deepEqual(Object.keys(json(file).mcpServers), ['remote']);
});

function v1Machine(home, ctx) {
  put(home, 'HARNESS.md', '# Harness\nbody\n');
  put(home, 'PLAYBOOK.md', '# Playbook\nbody\n');
  put(home, '.agent-hooks/guard.mjs', 'x');
  put(home, 'MCP-Templates/README.md', 'x');
  put(home, 'AGENTS.md', V1);
  put(home, '.claude/settings.json', JSON.stringify({ model: 'opus', mcpServers: { memory: {} }, hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'node /h/.agent-hooks/guard.mjs' }] }] } }));
  put(home, '.codex/profiles/full.toml', 'x');
  put(home, '.codex/config.toml', '# Shared safety guard + defensive formatter (scripts installed at ~/.agent-hooks).\n[[hooks.PreToolUse]]\n[[hooks.PreToolUse.hooks]]\ncommand = "node /h/.agent-hooks/guard.mjs"\n');
  put(home, '.cursor/global-rules.md', V1);
  put(home, '.cursor/mcp.json', JSON.stringify({ mcpServers: { remote: { enabled: false } } }));
  put(home, '.opencode/AGENTS.md', V1);
  put(home, '.opencode/opencode.json', JSON.stringify({ lsp: true, mcp: { memory: {} } }));
  put(home, '.opencode/command/opsx-x.md', 'opsx command\n');
  put(home, '.config/opencode/command/opsx-x.md', 'opsx command\n');
  v1Skills(home, ctx);
  put(home, '.opencode/skills/beta/SKILL.md', 'x');
  put(home, '.opencode/skills/gone/SKILL.md', 'x');
}

const AGENTS = ['claude', 'codex', 'cursor', 'opencode', 'pi'];
const sweep = (ctx, run) => {
  cleanHome(ctx, run);
  for (const a of AGENTS) cleanAgent(ctx, a, ['memory', 'remote'], run);
};

test('an empty home: nothing changes and nothing is reported', () => {
  const { ctx } = setup();
  const run = newRun();
  sweep(ctx, run);
  cleanSkillDir(ctx, tempDir(), run);
  cleanSkillDir(ctx, join(ctx.home, 'missing'), run);
  assert.deepEqual([run.report.changes, run.report.warnings, run.report.notes], [[], [], []]);
});

test('a v1 machine is cleaned once and a second pass finds nothing', () => {
  const { home, ctx } = setup();
  v1Machine(home, ctx);
  const first = newRun();
  sweep(ctx, first);
  assert.ok(first.report.changes.length > 10);
  assert.equal(first.report.warnings.length, 0);
  const second = newRun();
  sweep(ctx, second);
  assert.deepEqual([second.report.changes, second.report.warnings], [[], []]);
});
