import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, writeFileSync, rmSync, mkdirSync, lstatSync, readlinkSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { fixtureRepo, tempDir, put } from './helpers.mjs';
import { makeContext, isLink, linkTarget, samePath, makeDirLink } from '../lib/platform.mjs';
import { runInstall } from '../lib/engine.mjs';
import { BEGIN } from '../lib/managed.mjs';

const ALL = ['claude', 'codex', 'cursor', 'opencode', 'pi'];
const json = (p) => JSON.parse(readFileSync(p, 'utf8'));
// The description v1's skills catalog.json carried (see lib/legacy.mjs).
const V1_CATALOG = 'Curated catalog of global skills: the single source for the generated skill tables in each agent\'s instruction file. The generator (scripts/gen-skill-table.mjs) reconciles this against the actual skills/global/*/ directories and fails if they disagree, so a new skill cannot silently drift out of the tables.';
const TRUST = 'Codex: open Codex and trust the updated hooks (until then they do not run)';
function setup() {
  const repo = fixtureRepo();
  const home = tempDir('harness-home-');
  return { repo, home, ctx: makeContext({ repo, home }) };
}
const install = (ctx, agents, opts = {}) => runInstall(ctx, { agents, packs: ['dev'], ...opts });

// Everything under root without following links: a link by its target, a file by its bytes and modification time
// (so a rewrite with the same text shows too).
function snapshot(root) {
  const out = {};
  const walk = (rel) => {
    for (const name of readdirSync(join(root, rel)).sort()) {
      const r = join(rel, name);
      const p = join(root, r);
      const st = lstatSync(p);
      if (st.isSymbolicLink()) out[r] = `link ${readlinkSync(p)}`;
      else if (st.isDirectory()) {
        out[r] = 'dir';
        walk(r);
      } else out[r] = `${st.mtimeMs} ${readFileSync(p, 'base64')}`;
    }
  };
  walk('');
  return out;
}

test('installing only Claude touches only Claude paths', () => {
  const { ctx, home, repo } = setup();
  const r = install(ctx, ['claude']);
  assert.deepEqual(r.conflicts, []);
  assert.deepEqual(readdirSync(home).sort(), ['.claude', '.claude.json', 'dev-project']);
  assert.ok(samePath(linkTarget(join(home, '.claude', 'skills', 'alpha')), join(repo, 'skills', 'global', 'alpha')));
  assert.ok(isLink(join(home, 'dev-project', '.claude', 'skills', 'gamma')));
  assert.ok(isLink(join(home, 'dev-project', 'frontend', '.claude', 'skills', 'delta')));
  const prompt = readFileSync(join(home, '.claude', 'CLAUDE.md'), 'utf8');
  assert.ok(prompt.startsWith(BEGIN));
  assert.match(prompt, /`alpha` \| Alpha tagline/);
  assert.deepEqual(Object.keys(json(join(home, '.claude.json')).mcpServers), ['memory']);
  assert.ok(existsSync(join(home, '.claude', 'mcp-templates', 'remote.mcp.json')));
  const settings = json(join(home, '.claude', 'settings.json'));
  assert.match(settings.hooks.PreToolUse[0].hooks[0].command, /scripts\/hooks\/guard\.mjs"$/);
  assert.equal(settings.enabledPlugins['pyright-lsp@claude-plugins-official'], true);
  assert.equal(readFileSync(join(home, '.claude', 'commands', 'hello.md'), 'utf8'), 'hello command\n');
  assert.deepEqual(json(join(repo, '.local', 'state.json')).agents, ['claude']);
});

test('a second run has nothing to do', () => {
  const { ctx } = setup();
  install(ctx, ['claude']);
  const r = install(ctx, ['claude']);
  assert.deepEqual([r.changes, r.conflicts], [[], []]);
});

test('a machine edit to an owned entry is a conflict until resolved', () => {
  const { ctx, home } = setup();
  install(ctx, ['claude']);
  const file = join(home, '.claude.json');
  const obj = json(file);
  obj.mcpServers.memory.args.push('--extra');
  writeFileSync(file, JSON.stringify(obj));
  assert.deepEqual(install(ctx, ['claude']).conflicts.map((c) => c.id), ['claude:mcp:memory']);
  install(ctx, ['claude'], { resolutions: { 'claude:mcp:memory': 'repo' } });
  assert.ok(!json(file).mcpServers.memory.args.includes('--extra'));
});

test('what the repo stops shipping is removed from the machine', () => {
  const { ctx, home, repo } = setup();
  install(ctx, ['claude']);
  put(repo, 'mcp/catalog.json', JSON.stringify({ servers: { remote: { http: 'https://example.com/mcp', on: false } } }));
  rmSync(join(repo, 'skills', 'global', 'beta'), { recursive: true });
  const cat = json(join(repo, 'skills', 'global', 'catalog.json'));
  delete cat.skills.beta;
  writeFileSync(join(repo, 'skills', 'global', 'catalog.json'), JSON.stringify(cat));
  assert.deepEqual(install(ctx, ['claude']).conflicts, []);
  assert.deepEqual(json(join(home, '.claude.json')).mcpServers, {});
  assert.ok(!isLink(join(home, '.claude', 'skills', 'beta')));
});

test('uninstall removes what was installed and leaves the repo and your own text', () => {
  const { ctx, home, repo } = setup();
  install(ctx, ['claude']);
  const md = join(home, '.claude', 'CLAUDE.md');
  writeFileSync(md, `${readFileSync(md, 'utf8')}\nmy own note\n`);
  runInstall(ctx, { agents: ['claude'], packs: ['dev'], uninstall: true });
  assert.ok(!isLink(join(home, '.claude', 'skills', 'alpha')));
  assert.equal(readFileSync(md, 'utf8'), 'my own note\n');
  assert.ok(!existsSync(join(home, '.claude', 'commands', 'hello.md')));
  assert.deepEqual(json(join(home, '.claude.json')).mcpServers, {});
  assert.ok(existsSync(join(repo, 'skills', 'global', 'alpha', 'SKILL.md')));
  assert.deepEqual(json(join(repo, '.local', 'state.json')).agents, []);
});

test('all five agents install side by side, then have nothing to do', () => {
  const { ctx, home } = setup();
  assert.deepEqual(install(ctx, ALL).conflicts, []);
  const toml = readFileSync(join(home, '.codex', 'config.toml'), 'utf8');
  assert.match(toml, /\[mcp_servers\.memory\]/);
  assert.match(toml, /\[mcp_servers\.remote\]\nenabled = false/);
  assert.equal(json(join(home, '.codex', 'hooks.json')).hooks.PostToolUse.length, 1);
  assert.equal(json(join(home, '.cursor', 'mcp.json')).mcpServers.remote, undefined);
  const oc = json(join(home, '.config', 'opencode', 'opencode.json'));
  assert.equal(oc.lsp, true);
  assert.equal(oc.mcp.remote.enabled, false);
  assert.equal(json(join(home, '.pi', 'agent', 'mcp.json')).mcpServers.remote.enabled, false);
  assert.ok(isLink(join(home, '.pi', 'agent', 'skills', 'alpha')));
  assert.ok(isLink(join(home, 'dev-project', '.pi', 'skills', 'gamma')));
  assert.ok(existsSync(join(ctx.local, 'cursor-rules.md')));
  assert.deepEqual(install(ctx, ALL).changes, []);
});

test('v1 leftovers are cleaned up and everything else is kept', () => {
  const { ctx, home, repo } = setup();
  const v1 = '# old\n<!-- SKILLS:BEGIN -->\nx\n<!-- SKILLS:END -->\n';
  put(repo, 'HARNESS.md', '# Harness\nbody\n');
  put(home, 'HARNESS.md', '# Harness\nolder body\n');
  put(home, '.agent-hooks/guard.mjs', 'x');
  put(home, '.agent-hooks/format.mjs', 'x');
  put(home, 'AGENTS.md', v1);
  put(home, '.claude/CLAUDE.md', v1);
  put(home, '.claude/skills/catalog.json', JSON.stringify({ description: V1_CATALOG, skills: {} }));
  put(home, '.claude/settings.json', JSON.stringify({ model: 'opus', hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'node C:/Users/x/.agent-hooks/guard.mjs' }] }] } }));
  put(home, '.codex/config.toml', 'model = "m"\n\n[[hooks.PreToolUse]]\nmatcher = "Bash"\n[[hooks.PreToolUse.hooks]]\ntype = "command"\ncommand = "node C:/Users/x/.agent-hooks/guard.mjs"\n');
  put(home, '.cursor/mcp.json', JSON.stringify({ mcpServers: { remote: { url: 'u', enabled: false }, mine: { command: 'x' } } }));
  put(home, '.opencode/opencode.json', JSON.stringify({ lsp: true, mcp: { memory: {} } }));
  assert.deepEqual(install(ctx, ALL).conflicts, []);
  for (const p of ['HARNESS.md', '.agent-hooks', 'AGENTS.md', '.claude/skills/catalog.json', '.opencode/opencode.json']) assert.ok(!existsSync(join(home, p)), p);
  assert.ok(readFileSync(join(home, '.claude', 'CLAUDE.md'), 'utf8').startsWith(BEGIN));
  const settings = json(join(home, '.claude', 'settings.json'));
  assert.equal(settings.model, 'opus');
  assert.equal(settings.hooks.PreToolUse.length, 1);
  assert.doesNotMatch(readFileSync(join(home, '.codex', 'config.toml'), 'utf8'), /agent-hooks/);
  assert.deepEqual(Object.keys(json(join(home, '.cursor', 'mcp.json')).mcpServers).sort(), ['memory', 'mine']);
});

test('a repo whose catalogs have problems stops every kind of run before anything is written, listing them all', () => {
  const { ctx, home, repo } = setup();
  put(repo, 'skills/global/gamma/SKILL.md', 'x');
  put(repo, 'mcp/catalog.json', JSON.stringify({ servers: { memory: { npx: ['x'], on: 'yes' } } }));
  for (const opts of [{}, { dryRun: true }, { uninstall: true }]) {
    assert.throws(() => install(ctx, ['claude'], opts), (e) => e.message.includes('memory: "on" must be true or false') && e.message.includes('skills/global/gamma has no entry'));
  }
  // An MCP catalog that does not even parse is listed with the rest.
  put(repo, 'mcp/catalog.json', '{');
  assert.throws(() => install(ctx, ['claude']), (e) => e.message.includes('invalid JSON') && e.message.includes('skills/global/gamma has no entry'));
  assert.deepEqual(readdirSync(home), []);
  assert.ok(!existsSync(ctx.local));
});

test('a folder link that leads into the repo stops the run before anything is written', () => {
  const { ctx, home, repo } = setup();
  // A v1 copy the cleanup would remove, and Codex comes first: neither may happen.
  put(repo, 'HARNESS.md', '# Harness\nbody\n');
  put(home, 'HARNESS.md', '# Harness\nolder body\n');
  mkdirSync(join(repo, 'agents', 'claude-home'));
  makeDirLink(join(repo, 'agents', 'claude-home'), join(home, '.claude'));
  const before = [snapshot(home), snapshot(repo)];
  for (const opts of [{}, { dryRun: true }, { uninstall: true }]) {
    assert.throws(() => install(ctx, ['codex', 'claude'], opts), (e) => /lead into the repo/.test(e.message) && e.message.includes(join(ctx.home, '.claude', 'CLAUDE.md')));
  }
  assert.deepEqual([snapshot(home), snapshot(repo)], before);
});

test('a pack folder linked into the repo stops the run too, though the skills folder below it does not exist yet', () => {
  const { ctx, home, repo } = setup();
  makeDirLink(join(repo, 'skills', 'project-packs', 'dev-project', 'frontend'), join(home, 'dev-project', 'frontend'));
  const before = snapshot(repo);
  assert.throws(() => install(ctx, ['claude']), (e) => e.message.includes(join(ctx.home, 'dev-project', 'frontend', '.claude', 'skills')));
  assert.deepEqual(snapshot(repo), before);
  assert.deepEqual(readdirSync(home), ['dev-project']);
});

test('a pack folder linked into the repo is refused only when the run would write or prune through it', () => {
  const { ctx, home, repo } = setup();
  makeDirLink(join(repo, 'skills', 'project-packs', 'dev-project'), join(home, 'dev-project'));
  const before = snapshot(join(repo, 'skills'));
  assert.deepEqual(install(ctx, ['claude'], { packs: [] }).conflicts, []);
  assert.throws(() => install(ctx, ['claude']), (e) => /lead into the repo/.test(e.message) && e.message.includes(join(ctx.home, 'dev-project', '.claude', 'skills')));
  assert.deepEqual(snapshot(join(repo, 'skills')), before);
});

test('a kept skill directory of a pack no longer installed is only forgotten, and a dry run of that changes no state', () => {
  const { ctx } = setup();
  const gamma = join(ctx.home, 'dev-project', '.claude', 'skills', 'gamma');
  put(gamma, 'SKILL.md', 'my own gamma\n');
  const id = `link:${gamma}`;
  assert.deepEqual(install(ctx, ['claude']).conflicts.map((c) => c.id), [id]);
  install(ctx, ['claude'], { resolutions: { [id]: 'keep' } });
  const stateFile = join(ctx.local, 'state.json');
  assert.equal(json(stateFile).entries[id].pinned, true);
  const bytes = readFileSync(stateFile);
  const note = `no longer shipped, left as it is: ${id}`;
  const dry = install(ctx, ['claude'], { packs: [], dryRun: true });
  assert.ok(dry.notes.includes(note));
  assert.deepEqual(dry.changes, [`unlink ${join(ctx.home, 'dev-project', 'frontend', '.claude', 'skills', 'delta')}`]);
  assert.ok(readFileSync(stateFile).equals(bytes));
  const real = install(ctx, ['claude'], { packs: [] });
  assert.ok(real.notes.includes(note));
  assert.equal(json(stateFile).entries[id], undefined);
  assert.equal(readFileSync(join(gamma, 'SKILL.md'), 'utf8'), 'my own gamma\n');
});

test('uninstall keeps links you made into the repo and kept directories, and removes its own and dangling links', () => {
  const { ctx, repo } = setup();
  const skills = join(ctx.home, '.claude', 'skills');
  const mineTarget = join(repo, 'skills', 'project-packs', 'dev-project', 'skills', 'gamma');
  makeDirLink(mineTarget, join(skills, 'my-gamma'));
  const delta = join(ctx.home, 'dev-project', 'frontend', '.claude', 'skills', 'delta');
  put(delta, 'SKILL.md', 'my own delta\n');
  install(ctx, ['claude'], { resolutions: { [`link:${delta}`]: 'keep' } });
  // A link into the repo whose target has gone since.
  mkdirSync(join(repo, 'skills', 'old'));
  makeDirLink(join(repo, 'skills', 'old'), join(skills, 'old'));
  rmSync(join(repo, 'skills', 'old'), { recursive: true });
  const r = runInstall(ctx, { agents: ['claude'], packs: ['dev'], uninstall: true });
  assert.deepEqual(readdirSync(skills), ['my-gamma']);
  assert.ok(samePath(linkTarget(join(skills, 'my-gamma')), mineTarget));
  assert.ok(!isLink(join(ctx.home, 'dev-project', '.claude', 'skills', 'gamma')));
  assert.equal(readFileSync(join(delta, 'SKILL.md'), 'utf8'), 'my own delta\n');
  assert.ok(r.notes.includes(`no longer shipped, left as it is: link:${delta}`));
  assert.deepEqual(Object.keys(json(join(ctx.local, 'state.json')).entries), []);
});

test('Codex is told once per run to trust its hooks, and only when they are written', () => {
  const trust = (r) => r.notes.filter((n) => n === TRUST).length;
  assert.equal(trust(install(setup().ctx, ['claude'])), 0);
  const { ctx, home } = setup();
  assert.equal(trust(install(ctx, ALL, { dryRun: true })), 1);
  assert.equal(trust(install(ctx, ALL)), 1);
  assert.equal(trust(install(ctx, ALL)), 0);
  writeFileSync(join(home, '.codex', 'hooks.json'), '{}');
  assert.equal(trust(install(ctx, ['codex'], { resolutions: { all: 'repo' } })), 1);
});

test('links of a pack no longer selected go, on install and on uninstall; your own links there stay', () => {
  const { ctx, repo } = setup();
  const gamma = join(ctx.home, 'dev-project', '.claude', 'skills', 'gamma');
  const delta = join(ctx.home, 'dev-project', 'frontend', '.claude', 'skills', 'delta');
  const mine = join(ctx.home, 'dev-project', '.claude', 'skills', 'my-alpha');
  makeDirLink(join(repo, 'skills', 'global', 'alpha'), mine);
  install(ctx, ['claude']);
  assert.deepEqual([isLink(gamma), isLink(delta)], [true, true]);
  install(ctx, ['claude'], { packs: [] });
  assert.deepEqual([isLink(gamma), isLink(delta), isLink(mine)], [false, false, true]);
  install(ctx, ['claude']);
  assert.deepEqual([isLink(gamma), isLink(delta)], [true, true]);
  runInstall(ctx, { agents: ['claude'], packs: [], uninstall: true });
  assert.deepEqual([isLink(gamma), isLink(delta), isLink(mine)], [false, false, true]);
});

test('an uninstall that meets a machine edit keeps it as it is and still finishes', () => {
  const { ctx, home } = setup();
  install(ctx, ['claude', 'pi']);
  const file = join(home, '.claude.json');
  const obj = json(file);
  obj.mcpServers.memory.args.push('--extra');
  writeFileSync(file, JSON.stringify(obj));
  const r = runInstall(ctx, { agents: ['claude'], packs: ['dev'], uninstall: true });
  assert.deepEqual(r.conflicts, []);
  assert.ok(r.notes.includes("kept this machine's version and stopped managing it: claude:mcp:memory"));
  assert.ok(json(file).mcpServers.memory.args.includes('--extra'));
  const state = json(join(ctx.local, 'state.json'));
  assert.deepEqual(Object.values(state.entries).filter((e) => e.agent === 'claude'), []);
  assert.ok(Object.values(state.entries).some((e) => e.agent === 'pi'));
  assert.deepEqual(state.agents, ['pi']);
});

// Whether a read-only file refuses writes on this host (it does not for root on POSIX).
const readOnlyBlocksWrites = (() => {
  const probe = put(tempDir(), 'probe', 'x');
  chmodSync(probe, 0o444);
  try {
    writeFileSync(probe, 'y');
    return false;
  } catch {
    return true;
  } finally {
    chmodSync(probe, 0o644);
  }
})();
const noReadOnly = { skip: !readOnlyBlocksWrites && 'a read-only file is still writable on this host' };

// The run records each item before writing it, so a run that fails partway must leave the state as it was.
function readOnlyClaudeJson(t, ctx) {
  const file = join(ctx.home, '.claude.json');
  chmodSync(file, 0o444);
  t.after(() => chmodSync(file, 0o644));
  return file;
}

test('an install that fails on a read-only file writes cleanly once the file is writable again', noReadOnly, (t) => {
  const { ctx, repo } = setup();
  install(ctx, ['claude']);
  const cat = json(join(repo, 'mcp', 'catalog.json'));
  cat.servers.memory.npx = ['@modelcontextprotocol/server-memory@1.0.1'];
  put(repo, 'mcp/catalog.json', JSON.stringify(cat));
  const file = readOnlyClaudeJson(t, ctx);
  assert.throws(() => install(ctx, ['claude']));
  chmodSync(file, 0o644);
  const r = install(ctx, ['claude']);
  assert.deepEqual(r.conflicts, []);
  assert.ok(r.changes.includes(`set mcpServers.memory in ${file}`));
  assert.ok(json(file).mcpServers.memory.args.includes('@modelcontextprotocol/server-memory@1.0.1'));
});

test('an uninstall that fails on a read-only file removes everything once the file is writable again', noReadOnly, (t) => {
  const { ctx } = setup();
  install(ctx, ['claude']);
  const file = readOnlyClaudeJson(t, ctx);
  assert.throws(() => runInstall(ctx, { agents: ['claude'], packs: ['dev'], uninstall: true }));
  chmodSync(file, 0o644);
  const r = runInstall(ctx, { agents: ['claude'], packs: ['dev'], uninstall: true });
  assert.deepEqual(r.conflicts, []);
  assert.deepEqual(json(file).mcpServers, {});
  const state = json(join(ctx.local, 'state.json'));
  assert.deepEqual([state.agents, Object.keys(state.entries)], [[], []]);
});

test('a v1 Cursor entry for a server v2 now manages is left to the conflict rule, the same in a dry run and a real one', () => {
  const { ctx, home } = setup();
  const file = join(ctx.home, '.cursor', 'mcp.json');
  // v1 wrote this server off; the repo now ships it on for Cursor.
  put(home, '.cursor/mcp.json', JSON.stringify({ mcpServers: { memory: { command: 'npx', enabled: false } } }));
  const dry = install(ctx, ['cursor'], { dryRun: true });
  const real = install(ctx, ['cursor']);
  assert.deepEqual(dry, real);
  assert.deepEqual(real.conflicts.map((c) => c.id), ['cursor:mcp:memory']);
  assert.ok(!real.changes.some((c) => c.startsWith('remove-v1')));
  assert.equal(json(file).mcpServers.memory.enabled, false);
  const resolutions = { 'cursor:mcp:memory': 'repo' };
  const dryResolved = install(ctx, ['cursor'], { dryRun: true, resolutions });
  const resolved = install(ctx, ['cursor'], { resolutions });
  assert.deepEqual(dryResolved, resolved);
  assert.deepEqual([resolved.changes, resolved.conflicts], [[`set mcpServers.memory in ${file}`], []]);
  assert.equal(json(file).mcpServers.memory.enabled, undefined);
  assert.deepEqual(install(ctx, ['cursor']).changes, []);
});

test('an empty agent list and an unknown pack are refused before anything is written', () => {
  const { ctx, home } = setup();
  assert.throws(() => install(ctx, []), /no agents/);
  assert.throws(() => install(ctx, ['claude'], { packs: ['dev', 'nope'] }), (e) => e.message.includes('unknown pack "nope"') && e.message.includes('dev'));
  assert.deepEqual(readdirSync(home), []);
  assert.ok(!existsSync(ctx.local));
});

test('a dangling folder link into the repo on the way is refused before anything is written', () => {
  const { ctx, home, repo } = setup();
  mkdirSync(join(repo, 'agents', 'claude-home'));
  makeDirLink(join(repo, 'agents', 'claude-home'), join(home, '.claude'));
  rmSync(join(repo, 'agents', 'claude-home'), { recursive: true });
  const before = [snapshot(home), snapshot(repo)];
  for (const opts of [{}, { dryRun: true }]) {
    assert.throws(() => install(ctx, ['claude'], opts), (e) => /lead into the repo/.test(e.message) && e.message.includes(join(ctx.home, '.claude', 'CLAUDE.md')));
  }
  assert.deepEqual([snapshot(home), snapshot(repo)], before);
});

test('uninstalling Cursor removes its rules file and says to remove the pasted rules', () => {
  const { ctx } = setup();
  const rules = join(ctx.local, 'cursor-rules.md');
  const note = 'remove the pasted harness rules from Cursor Settings → Rules → User Rules';
  install(ctx, ['cursor']);
  const dry = runInstall(ctx, { agents: ['cursor'], packs: ['dev'], uninstall: true, dryRun: true });
  assert.ok(dry.changes.includes(`remove ${rules}`) && dry.notes.includes(note));
  assert.ok(existsSync(rules));
  const real = runInstall(ctx, { agents: ['cursor'], packs: ['dev'], uninstall: true });
  assert.ok(real.changes.includes(`remove ${rules}`) && real.notes.includes(note));
  assert.ok(!existsSync(rules));
});

test('a Codex or Pi server whose URL variable goes missing is warned about and left in place, on disk and in the state', () => {
  const { ctx, home, repo } = setup();
  put(repo, 'mcp/catalog.json', JSON.stringify({ servers: { remote: { http: 'https://${REMOTE_HOST}/mcp', on: true } } }));
  ctx.env = { REMOTE_HOST: 'example.com' };
  install(ctx, ['codex', 'pi']);
  ctx.env = {};
  const r = install(ctx, ['codex', 'pi']);
  assert.deepEqual([r.changes, r.conflicts], [[], []]);
  assert.deepEqual(r.warnings, ['codex:mcp:remote left as it is: environment variable REMOTE_HOST is not set', 'pi:mcp:remote left as it is: environment variable REMOTE_HOST is not set']);
  assert.match(readFileSync(join(home, '.codex', 'config.toml'), 'utf8'), /url = "https:\/\/example\.com\/mcp"/);
  assert.equal(json(join(home, '.pi', 'agent', 'mcp.json')).mcpServers.remote.url, 'https://example.com/mcp');
  const entries = json(join(ctx.local, 'state.json')).entries;
  assert.ok(entries['codex:mcp:remote'] && entries['pi:mcp:remote']);
  // Uninstalling needs no URL: nothing to warn about, and the servers go.
  const u = runInstall(ctx, { agents: ['codex', 'pi'], packs: ['dev'], uninstall: true });
  assert.deepEqual([u.warnings, u.conflicts], [[], []]);
  assert.doesNotMatch(readFileSync(join(home, '.codex', 'config.toml'), 'utf8'), /mcp_servers\.remote/);
  assert.deepEqual(json(join(home, '.pi', 'agent', 'mcp.json')).mcpServers, {});
});

// What the v1 sync left on a machine that ran it for every agent.
function v1Home(home, repo) {
  const v1 = '# old\n<!-- SKILLS:BEGIN -->\nx\n<!-- SKILLS:END -->\n';
  const copy = (rel, dst) => put(home, `${dst}/SKILL.md`, readFileSync(join(repo, rel, 'SKILL.md'), 'utf8'));
  put(repo, 'HARNESS.md', '# Harness\nbody\n');
  put(home, 'HARNESS.md', '# Harness\nolder body\n');
  put(home, '.agent-hooks/guard.mjs', 'x');
  put(home, '.agent-hooks/format.mjs', 'x');
  put(home, 'MCP-Templates/README.md', 'x');
  put(home, 'AGENTS.md', v1);
  for (const dir of ['.claude/skills', '.codex/skills', '.cursor/skills', '.pi/agent/skills']) {
    put(home, `${dir}/catalog.json`, JSON.stringify({ description: V1_CATALOG, skills: {} }));
    copy('skills/global/alpha', `${dir}/alpha`);
  }
  copy('skills/project-packs/dev-project/skills/gamma', 'dev-project/.claude/skills/gamma');
  put(home, '.claude/CLAUDE.md', v1);
  put(home, '.claude/settings.json', JSON.stringify({ model: 'opus', mcpServers: { memory: {} }, hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'node C:/Users/x/.agent-hooks/guard.mjs' }] }] } }));
  put(home, '.codex/AGENTS.md', v1);
  put(home, '.codex/profiles/full.toml', 'x');
  put(home, '.codex/config.toml', 'model = "m"\n\n[[hooks.PreToolUse]]\nmatcher = "Bash"\n[[hooks.PreToolUse.hooks]]\ntype = "command"\ncommand = "node C:/Users/x/.agent-hooks/guard.mjs"\n');
  put(home, '.cursor/global-rules.md', v1);
  put(home, '.cursor/mcp.json', JSON.stringify({ mcpServers: { remote: { url: 'u', enabled: false }, mine: { command: 'x' } } }));
  put(home, '.opencode/AGENTS.md', v1);
  put(home, '.opencode/opencode.json', JSON.stringify({ lsp: true, mcp: { memory: {} } }));
  put(home, '.opencode/skills/catalog.json', JSON.stringify({ description: V1_CATALOG, skills: { alpha: {} } }));
  copy('skills/global/alpha', '.opencode/skills/alpha');
  put(home, '.opencode/command/opsx-x.md', 'opsx command\n');
  put(home, '.pi/agent/AGENTS.md', v1);
}

test('a dry run over a v1 machine lists exactly what the real run then does, and touches nothing', () => {
  const { ctx, home, repo } = setup();
  v1Home(home, repo);
  const before = [snapshot(home), snapshot(repo)];
  const dry = install(ctx, ALL, { dryRun: true });
  assert.deepEqual([snapshot(home), snapshot(repo)], before);
  assert.ok(!existsSync(join(ctx.local, 'state.json')));
  const real = install(ctx, ALL);
  assert.deepEqual(real.conflicts, []);
  assert.ok(real.changes.length > 40, `${real.changes.length} changes`);
  assert.deepEqual([dry.changes, dry.conflicts, dry.warnings], [real.changes, real.conflicts, real.warnings]);
  assert.deepEqual(install(ctx, ALL).changes, []);
});
