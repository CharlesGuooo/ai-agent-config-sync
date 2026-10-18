import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtureRepo, put } from './helpers.mjs';
import { makeContext, slash } from '../lib/platform.mjs';
import { skillTable, catalogErrors, renderPrompt } from '../lib/prompt.mjs';

test('skillTable renders the catalog by category', () => {
  const t = skillTable(fixtureRepo());
  assert.match(t, /^## Global Skills \(2\)/);
  assert.match(t, /### Process \(2\) — Process discipline/);
  assert.match(t, /\| `beta` \| Beta tagline \|/);
});

test('catalogErrors catches a skill directory missing from the catalog', () => {
  const repo = fixtureRepo();
  put(repo, 'skills/global/gamma/SKILL.md', 'x');
  const errors = catalogErrors(repo);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /gamma/);
  assert.throws(() => skillTable(repo), /out of sync/);
});

test('renderPrompt fills every placeholder and keeps $ sequences literal', () => {
  const repo = fixtureRepo();
  put(repo, 'agents/pi/notes.md', 'Use $& and ${X} literally.\r\n');
  const ctx = makeContext({ repo, home: repo });
  const text = renderPrompt(ctx, { title: 'Pi Global Instructions', agent: 'pi', mcp: '## MCP servers\n\ncost $1' });
  assert.match(text, /^# Pi Global Instructions/);
  assert.ok(text.includes('Use $& and ${X} literally.'));
  assert.ok(text.includes('cost $1'));
  assert.ok(text.includes(`Repo: ${slash(ctx.repo)}`));
  assert.ok(!text.includes('{{') && !text.includes('\r'));
  assert.ok(!renderPrompt(ctx, { title: 'T', agent: 'claude', mcp: 'm' }).includes('literally'));
});
