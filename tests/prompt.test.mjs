import test from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { fixtureRepo, put, tempDir } from './helpers.mjs';
import { makeContext, slash } from '../lib/platform.mjs';
import { catalogErrors, renderPrompt } from '../lib/prompt.mjs';

test('catalogErrors catches a skill directory missing from the catalog', () => {
  const repo = fixtureRepo();
  put(repo, 'skills/global/gamma/SKILL.md', 'x');
  const errors = catalogErrors(repo);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /gamma/);
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

const cats = [{ key: 'process', title: 'Process', blurb: 'Process discipline' }];
const catalog = (repo, skills, categories = cats) => put(repo, 'skills/global/catalog.json', JSON.stringify({ categories, skills }));
const both = { alpha: { category: 'process', tagline: 'A' }, beta: { category: 'process', tagline: 'B' } };

test('catalogErrors reports an entry without a directory', () => {
  const repo = fixtureRepo();
  catalog(repo, { ...both, ghost: { category: 'process', tagline: 'G' } });
  const errors = catalogErrors(repo);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /lists "ghost" but skills\/global\/ghost\/SKILL\.md does not exist/);
});

test('catalogErrors reports an unknown category, a missing tagline and a tagline that breaks the table', () => {
  const repo = fixtureRepo();
  catalog(repo, { alpha: { category: 'nope', tagline: 'A' }, beta: { category: 'process' } });
  assert.match(catalogErrors(repo).join('\n'), /"alpha" has unknown category "nope"/);
  assert.match(catalogErrors(repo).join('\n'), /"beta" needs a non-empty "tagline"/);
  catalog(repo, { alpha: { category: 'process', tagline: 'a | b' }, beta: { category: 'process', tagline: 'x\ny' } });
  const errors = catalogErrors(repo);
  assert.equal(errors.length, 2);
  assert.match(errors[0], /"alpha" tagline must not contain/);
  assert.match(errors[1], /"beta" tagline must not contain/);
});

test('catalogErrors returns a message for a missing or malformed catalog instead of throwing', () => {
  const repo = fixtureRepo();
  put(repo, 'skills/global/catalog.json', JSON.stringify({ skills: both }));
  assert.match(catalogErrors(repo)[0], /"categories" must be an array/);
  put(repo, 'skills/global/catalog.json', JSON.stringify({ categories: cats, skills: [] }));
  assert.match(catalogErrors(repo)[0], /"skills" must be an object/);
  catalog(repo, both, [{ key: 'process', title: 'Process' }]);
  assert.match(catalogErrors(repo)[0], /categories\[0\] needs string/);
  put(repo, 'skills/global/catalog.json', '{ nope');
  assert.match(catalogErrors(repo)[0], /catalog\.json: invalid JSON/);
  const bare = fixtureRepo();
  put(bare, 'skills/global/catalog.json', 'null');
  assert.match(catalogErrors(bare)[0], /"categories" must be an array/);
});

test('catalogErrors reports a duplicate category key once', () => {
  const repo = fixtureRepo();
  catalog(repo, both, [...cats, { key: 'process', title: 'Again', blurb: 'b' }]);
  const errors = catalogErrors(repo);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /category key "process" is used more than once/);
});

test('catalogErrors reports a missing catalog.json by name', () => {
  const repo = fixtureRepo();
  rmSync(`${repo}/skills/global/catalog.json`);
  assert.match(catalogErrors(repo)[0], /skills\/global\/catalog\.json does not exist/);
});

test('a skill directory named like an Object property still counts as uncatalogued', () => {
  const repo = fixtureRepo();
  put(repo, 'skills/global/constructor/SKILL.md', 'x');
  const errors = catalogErrors(repo);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /skills\/global\/constructor has no entry/);
});

test('renderPrompt rejects an unknown placeholder and a missing core.md', () => {
  const repo = fixtureRepo();
  const ctx = makeContext({ repo, home: repo });
  put(repo, 'prompt/core.md', '# {{TITLE}}\n\n{{SKILLS}}\n');
  assert.throws(() => renderPrompt(ctx, { title: 'T', agent: 'pi', mcp: 'm' }), /unknown placeholder \{\{SKILLS\}\}/);
  rmSync(`${repo}/prompt/core.md`);
  assert.throws(() => renderPrompt(ctx, { title: 'T', agent: 'pi', mcp: 'm' }), /prompt[\\/]core\.md does not exist/);
});

test('named-only global skills are listed with their catalog tagline', () => {
  const repo = fixtureRepo();
  put(repo, 'skills/global/beta/SKILL.md', '---\nname: beta\ndescription: beta skill\ndisable-model-invocation: true\n---\nbody\n');
  const text = renderPrompt(makeContext({ repo, home: tempDir() }), { title: 'T', agent: 'claude', mcp: '' });
  assert.ok(text.includes('- `beta` — Beta tagline'));
  assert.ok(!text.includes('`alpha` —'));
});

test('the real prompt/core.md has no leftover pack paths and no repeated paragraph', () => {
  const repo = fileURLToPath(new URL('..', import.meta.url));
  const ctx = makeContext({ repo, home: tempDir('harness-core-home-') });
  const text = renderPrompt(ctx, { title: 'T', agent: 'claude', mcp: 'm' });
  assert.doesNotMatch(text, /~\/[a-z0-9-]+-project/);
  const paras = text.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
  const dup = paras.filter((p, i) => paras.indexOf(p) !== i);
  assert.deepEqual(dup, []);
});
