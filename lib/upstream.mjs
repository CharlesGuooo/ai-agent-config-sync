// Where each vendored skill came from (skills/sources.json), and whether its upstream has moved on since.
// An entry: "<path under skills/>": { repo: "owner/name", path: "<skill folder in that repo>",
// commit: "<the last upstream commit on that path that the repo's copy reflects>", date, license }, or a list of
// them when the skill draws on several upstreams. Skills written in this repo have no entry.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJson } from './util.mjs';

const file = (repo) => join(repo, 'skills', 'sources.json');

export const loadSources = (repo) => readJson(file(repo)) ?? {};

export function sourcesProblems(repo, sources) {
  const out = [];
  for (const [dir, list] of Object.entries(sources)) {
    const at = `skills/sources.json: ${dir}`;
    if (!existsSync(join(repo, 'skills', dir, 'SKILL.md'))) { out.push(`${at} is not a skill folder`); continue; }
    for (const e of [].concat(list)) {
      if (typeof e?.repo !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(e.repo)) out.push(`${at}: repo must be owner/name`);
      if (typeof e?.path !== 'string') out.push(`${at}: path is missing`);
      if (typeof e?.commit !== 'string' || !e.commit) out.push(`${at}: commit is missing`);
    }
  }
  return out;
}

// One GitHub API call per upstream: the newest commit touching its path on the default branch. A token raises the limit
// from 60 to 5000 calls an hour; it is sent only to api.github.com and never printed.
export async function upstreamStatus(sources, { fetch = globalThis.fetch, token, concurrency = 8 } = {}) {
  const items = Object.entries(sources).flatMap(([dir, list]) => [].concat(list).map((e) => [dir, e]));
  const out = new Array(items.length);
  const headers = { accept: 'application/vnd.github+json', 'user-agent': 'ai-agent-config-sync', ...(token ? { authorization: `Bearer ${token}` } : {}) };
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      const [dir, e] = items[i];
      // A skill that is the whole repository (path ".") moves with any commit.
      const where = e.path === '.' ? '' : `&path=${encodeURIComponent(e.path)}`;
      const url = `https://api.github.com/repos/${e.repo}/commits?per_page=1${where}`;
      try {
        const res = await fetch(url, { headers });
        if (!res.ok) { out[i] = { dir, repo: e.repo, status: 'error', msg: `GitHub answered ${res.status}` }; continue; }
        const [c] = await res.json();
        if (!c) { out[i] = { dir, repo: e.repo, status: 'gone', msg: `${e.path} has no commits on the default branch (moved or deleted upstream)` }; continue; }
        const latest = { sha: c.sha, date: String(c.commit?.committer?.date ?? '').slice(0, 10) };
        out[i] = { dir, repo: e.repo, status: c.sha === e.commit ? 'current' : 'newer', since: e.date, latest };
      } catch (err) {
        out[i] = { dir, repo: e.repo, status: 'error', msg: err.code ?? err.name ?? 'request failed' };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return out;
}
