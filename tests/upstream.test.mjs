import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtureRepo, put } from './helpers.mjs';
import { loadSources, sourcesProblems, upstreamStatus } from '../lib/upstream.mjs';

const entry = (over = {}) => ({ repo: 'acme/skills', path: 'skills/gamma', commit: 'aaa111', date: '2026-01-02', license: 'MIT', ...over });

// A stand-in for GitHub's "latest commit touching this path" endpoint.
function fakeFetch(latest, seen = []) {
  return async (url, opts) => {
    seen.push({ url, auth: opts?.headers?.authorization });
    const u = new URL(url);
    const key = `${u.pathname.split('/').slice(2, 4).join('/')}:${u.searchParams.get('path')}`;
    const hit = latest[key];
    if (hit === 404) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => (hit ? [{ sha: hit.sha, commit: { committer: { date: `${hit.date}T00:00:00Z` } } }] : []) };
  };
}

test('no sources file means no sources', () => {
  assert.deepEqual(loadSources(fixtureRepo()), {});
});

test('a source must name an existing skill folder, an owner/name repo, a path and a commit', () => {
  const repo = fixtureRepo();
  put(repo, 'skills/sources.json', JSON.stringify({
    'project-packs/dev-project/skills/gamma': entry(),
    'project-packs/dev-project/skills/gone': entry(),
    'global/alpha': entry({ repo: 'not a repo', commit: '' }),
  }));
  assert.deepEqual(sourcesProblems(repo, loadSources(repo)), [
    'skills/sources.json: project-packs/dev-project/skills/gone is not a skill folder',
    'skills/sources.json: global/alpha: repo must be owner/name',
    'skills/sources.json: global/alpha: commit is missing',
  ]);
});

test('a malformed sources file is one problem, named by file', () => {
  const repo = fixtureRepo();
  put(repo, 'skills/sources.json', '{ nope');
  assert.throws(() => loadSources(repo), /skills[\\/]sources\.json: invalid JSON/);
});

test('upstream status: current when the last commit on the path is the recorded one, newer otherwise', async () => {
  const sources = { 'a/one': entry(), 'a/two': entry({ path: 'skills/two', commit: 'old222' }), 'a/three': entry({ path: 'skills/three' }) };
  const seen = [];
  const fetch = fakeFetch({ 'acme/skills:skills/gamma': { sha: 'aaa111', date: '2026-01-02' }, 'acme/skills:skills/two': { sha: 'new333', date: '2026-09-09' }, 'acme/skills:skills/three': 404 }, seen);
  const out = await upstreamStatus(sources, { fetch, token: 't0ken' });
  assert.deepEqual(out.map((r) => [r.dir, r.status]), [['a/one', 'current'], ['a/two', 'newer'], ['a/three', 'error']]);
  assert.equal(out[1].latest.date, '2026-09-09');
  assert.match(out[2].msg, /404/);
  assert.ok(seen.every((s) => s.auth === 'Bearer t0ken'));
});

test('a skill that is a whole repository is checked against the repository\'s newest commit', async () => {
  const seen = [];
  const out = await upstreamStatus({ 'a/root': entry({ path: '.', commit: 'r00t' }) }, { fetch: fakeFetch({ 'acme/skills:null': { sha: 'r00t', date: '2026-02-02' } }, seen) });
  assert.equal(out[0].status, 'current');
  assert.ok(!seen[0].url.includes('path='));
});

test('a path upstream no longer has (no commits) is reported as gone', async () => {
  const out = await upstreamStatus({ 'a/x': entry({ path: 'skills/renamed' }) }, { fetch: fakeFetch({}) });
  assert.equal(out[0].status, 'gone');
});

test('a skill drawn from several upstreams lists one entry per upstream, each checked', () => {
  const repo = fixtureRepo();
  put(repo, 'skills/sources.json', JSON.stringify({ 'global/alpha': [entry(), entry({ repo: 'not a repo' })] }));
  assert.deepEqual(sourcesProblems(repo, loadSources(repo)), ['skills/sources.json: global/alpha: repo must be owner/name']);
});

test('upstream status covers every upstream of a skill that lists several', async () => {
  const sources = { 'a/both': [entry(), entry({ repo: 'other/kit', path: 'docs/guide', commit: 'old444' })] };
  const fetch = fakeFetch({ 'acme/skills:skills/gamma': { sha: 'aaa111', date: '2026-01-02' }, 'other/kit:docs/guide': { sha: 'new555', date: '2026-10-10' } });
  const out = await upstreamStatus(sources, { fetch });
  assert.deepEqual(out.map((r) => [r.dir, r.repo, r.status]), [['a/both', 'acme/skills', 'current'], ['a/both', 'other/kit', 'newer']]);
});
