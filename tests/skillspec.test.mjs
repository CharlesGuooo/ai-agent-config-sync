import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtureRepo, put } from './helpers.mjs';
import { frontMatterProblems, frontMatterValue, skillSpecProblems } from '../lib/skillspec.mjs';

const fm = (body) => `---\n${body}\n---\n# Body\n`;
const check = (body, dir = 'alpha') => frontMatterProblems(fm(body), dir);

test('plain, quoted and block-scalar descriptions pass', () => {
  assert.deepEqual(check('name: alpha\ndescription: Does alpha things.'), []);
  assert.deepEqual(check('name: "alpha"\ndescription: "Says: quoted colons are fine."'), []);
  assert.deepEqual(check("name: alpha\ndescription: 'It''s fine: single quotes.'"), []);
  assert.deepEqual(check('name: alpha\ndescription: >-\n  Folded: across\n  two lines.\nallowed-tools: Read'), []);
  assert.deepEqual(check('name: alpha\ndescription: |\n  Literal: text\n    - not a list\n'), []);
});

test('CRLF line endings parse like LF', () => {
  const text = '---\r\nname: alpha\r\ndescription: >-\r\n  Folded text.\r\nallowed-tools:\r\n  - Read\r\n---\r\nbody\r\n';
  assert.deepEqual(frontMatterProblems(text, 'alpha'), []);
});

test('nested keys and lists under an empty key pass', () => {
  assert.deepEqual(check('name: alpha\ndescription: x\nallowed-tools:\n  - Read\n  - Grep\nmetadata:\n  tags: [a, b]\n  source: >-\n    From upstream.'), []);
});

test('missing frontmatter, name or description is a problem', () => {
  assert.deepEqual(frontMatterProblems('# no frontmatter\n', 'alpha'), ['no frontmatter']);
  assert.deepEqual(check('description: x'), ['no name']);
  assert.deepEqual(check('name: alpha'), ['empty description']);
  assert.deepEqual(check('name: alpha\ndescription: >-\nlicense: MIT'), ['empty description']);
});

test('a name that differs from its directory or breaks the naming rule is a problem', () => {
  assert.deepEqual(check('name: design-taste-frontend\ndescription: x', 'taste-skill'), ['name "design-taste-frontend" does not match its directory "taste-skill"']);
  assert.deepEqual(check('name: Alpha_Skill\ndescription: x', 'Alpha_Skill'), ['name "Alpha_Skill" is not lowercase letters, digits and single hyphens']);
  assert.deepEqual(check('name: a--b\ndescription: x', 'a--b'), ['name "a--b" is not lowercase letters, digits and single hyphens']);
  const long = 'a'.repeat(65);
  assert.deepEqual(check(`name: ${long}\ndescription: x`, long), [`name is 65 characters (max 64)`]);
});

test('a description over 1024 characters is a problem, 1024 is not', () => {
  assert.deepEqual(check(`name: alpha\ndescription: ${'x'.repeat(1024)}`), []);
  assert.deepEqual(check(`name: alpha\ndescription: ${'x'.repeat(1025)}`), ['description is 1025 characters (max 1024)']);
  // A literal block keeps its newlines; they count.
  assert.deepEqual(check(`name: alpha\ndescription: |-\n  ${'x'.repeat(512)}\n  ${'y'.repeat(512)}`), ['description is 1025 characters (max 1024)']);
});

test('an unquoted description containing ": " is a problem', () => {
  assert.deepEqual(check('name: alpha\ndescription: Tests for overfitting: PBO and DSR.'), [
    'description is an unquoted scalar containing ": " — quote it or use a >- block',
  ]);
  // A colon not followed by a space is fine in a plain scalar.
  assert.deepEqual(check('name: alpha\ndescription: See https://example.com or a:b.'), []);
});

test('a key that lands inside another key\'s list is a problem', () => {
  assert.deepEqual(check('name: alpha\ndescription: x\nallowed-tools:\ncompatibility: "offline"\n  - Read\n  - Grep'), [
    'a list follows "compatibility", which already has a value — did it land inside the list of "allowed-tools"?',
  ]);
});

test('skillSpecProblems scans global and pack skills and names the file', () => {
  const repo = fixtureRepo();
  assert.deepEqual(skillSpecProblems(repo), []);
  put(repo, 'skills/project-packs/dev-project/frontend/skills/taste-skill/SKILL.md', fm('name: design-taste-frontend\ndescription: x'));
  put(repo, 'skills/global/beta/SKILL.md', fm('name: beta'));
  assert.deepEqual(skillSpecProblems(repo), [
    'skills/global/beta/SKILL.md: empty description',
    'skills/project-packs/dev-project/frontend/skills/taste-skill/SKILL.md: name "design-taste-frontend" does not match its directory "taste-skill"',
  ]);
});

test('frontMatterValue reads a plain, a quoted and a block value, and null for a missing key', () => {
  const t = '---\nname: x\ndisable-model-invocation: true\nq: "a: b"\ndescription: >-\n  one\n  two\n---\nbody\n';
  assert.equal(frontMatterValue(t, 'disable-model-invocation'), 'true');
  assert.equal(frontMatterValue(t, 'q'), 'a: b');
  assert.equal(frontMatterValue(t, 'description'), 'one two');
  assert.equal(frontMatterValue(t, 'missing'), null);
});

test('a named-only global skill must also be hidden from Codex', () => {
  const repo = fixtureRepo();
  put(repo, 'skills/global/beta/SKILL.md', '---\nname: beta\ndescription: beta skill\ndisable-model-invocation: true\n---\nbody\n');
  assert.deepEqual(skillSpecProblems(repo), ['skills/global/beta/SKILL.md: named-only, but Codex can still pick it: add agents/openai.yaml with policy.allow_implicit_invocation: false']);
  put(repo, 'skills/global/beta/agents/openai.yaml', 'policy:\n  allow_implicit_invocation: false\n');
  assert.deepEqual(skillSpecProblems(repo), []);
});
