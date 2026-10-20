import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtureRepo, put } from './helpers.mjs';
import { routingProblems } from '../lib/routing.mjs';

// The fixture ships one pack, dev-project, with a frontend sub-pack.
const core = (table) => `# {{TITLE}}\n\n## Local Skill Packs\n\n${table}\n\n---\n\n{{SKILLS}}\n`;

test('a routing table that names every pack and only real folders passes', () => {
  const repo = fixtureRepo();
  put(repo, 'prompt/core.md', core('| Dev | `~/dev-project/` (start in `frontend/`) |'));
  put(repo, 'HARNESS.md', '| Dev | `~/dev-project/` | `frontend` |\n\n<!-- PACKS:BEGIN -->\n`~/gone-project/` is generated, not checked\n');
  put(repo, 'skills/global/skill-router/SKILL.md', '| Dev | `~/dev-project/<sub>/` |\n| | `~/dev-project/frontend/` |\n');
  assert.deepEqual(routingProblems(repo), []);
});

test('a pack missing from a table, or a folder that does not exist, is a problem', () => {
  const repo = fixtureRepo();
  put(repo, 'prompt/core.md', core('| Finance | `~/finance-project/` (start in `macro/`) |'));
  put(repo, 'HARNESS.md', '| Dev | `~/dev-project/<sub>/` | `frontend` `modeling` `advisory/{ib,pe}` |\n');
  put(repo, 'skills/global/skill-router/SKILL.md', '| Dev | `~/dev-project/backend/` |\n');
  assert.deepEqual(routingProblems(repo), [
    'prompt/core.md: no route to ~/dev-project/',
    'prompt/core.md: names ~/finance-project/, which is not a pack folder in skills/project-packs/',
    'HARNESS.md: names ~/dev-project/modeling/, which is not a pack folder in skills/project-packs/',
    'HARNESS.md: names ~/dev-project/advisory/, which is not a pack folder in skills/project-packs/',
    'skills/global/skill-router/SKILL.md: names ~/dev-project/backend/, which is not a pack folder in skills/project-packs/',
  ]);
});
