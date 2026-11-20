import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtureRepo, put } from './helpers.mjs';
import { routingProblems } from '../lib/routing.mjs';

// The fixture ships one pack, dev-project, with a frontend sub-pack.
test('a routing table that names every pack and only real folders passes', () => {
  const repo = fixtureRepo();
  put(repo, 'HARNESS.md', '| Dev | `~/dev-project/` | `frontend` |\n\n<!-- PACKS:BEGIN -->\n`~/gone-project/` is generated, not checked\n');
  assert.deepEqual(routingProblems(repo), []);
});

test('a pack missing from the table, or a folder that does not exist, is a problem', () => {
  const repo = fixtureRepo();
  put(repo, 'prompt/core.md', '| Finance | `~/finance-project/` (start in `macro/`) |');
  put(repo, 'HARNESS.md', '| Dev | `~/dev-project/<sub>/` | `frontend` `modeling` `advisory/{ib,pe}` |\n');
  assert.deepEqual(routingProblems(repo), [
    'HARNESS.md: names ~/dev-project/modeling/, which is not a pack folder in skills/project-packs/',
    'HARNESS.md: names ~/dev-project/advisory/, which is not a pack folder in skills/project-packs/',
  ]);
});
