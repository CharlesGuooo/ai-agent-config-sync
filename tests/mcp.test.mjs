import test from 'node:test';
import assert from 'node:assert/strict';
import { serversFor, render, expand, MissingEnv, catalogProblems, mcpSection, envRefs, loadCatalog } from '../lib/mcp.mjs';
import { fileURLToPath } from 'node:url';

const catalog = { servers: {
  mem: { npx: ['pkg@1', '{HOME}'], env: { KEY: '${KEY}', MODE: 'Z' }, on: true },
  web: { http: 'https://x.dev/mcp?ref=${REF}', bearerEnv: 'TOKEN', on: true, agents: { codex: { on: false }, opencode: { extra: { oauth: false } } } },
  mac: { npx: ['macpkg'], on: false, os: ['mac'] },
} };
const win = { repo: 'C:/repo', home: 'C:\\Users\\me', os: 'windows', env: { REF: 'r1', KEY: 'k' } };
const mac = { repo: '/repo', home: '/Users/me', os: 'mac', env: { REF: 'r1' } };
const pick = (agent, ctx) => Object.fromEntries(serversFor(catalog, agent, ctx.os).map((s) => [s.name, s]));

test('serversFor filters by OS and applies per-agent overrides', () => {
  assert.deepEqual(Object.keys(pick('claude', win)), ['mem', 'web']);
  assert.deepEqual(Object.keys(pick('claude', mac)), ['mem', 'web', 'mac']);
  assert.equal(pick('codex', win).web.on, false);
  assert.deepEqual(pick('opencode', win).web.extra, { oauth: false });
});

test('claude: cmd wrapper on Windows, plain npx elsewhere, http with a bearer header', () => {
  assert.deepEqual(render.claude(pick('claude', win).mem, win), { command: 'cmd', args: ['/c', 'npx', '-y', 'pkg@1', 'C:/Users/me'], env: { KEY: '${KEY}', MODE: 'Z' } });
  assert.deepEqual(render.claude(pick('claude', mac).mem, mac), { command: 'npx', args: ['-y', 'pkg@1', '/Users/me'], env: { KEY: '${KEY}', MODE: 'Z' } });
  assert.deepEqual(render.claude(pick('claude', win).web, win), { type: 'http', url: 'https://x.dev/mcp?ref=${REF}', headers: { Authorization: 'Bearer ${TOKEN}' } });
});

test('cursor uses ${env:VAR}', () => {
  assert.deepEqual(render.cursor(pick('cursor', win).web, win).headers, { Authorization: 'Bearer ${env:TOKEN}' });
  assert.deepEqual(render.cursor(pick('cursor', win).mem, win).env, { KEY: '${env:KEY}', MODE: 'Z' });
});

test('opencode: command array, {env:VAR}, extra fields, enabled false when off', () => {
  const s = pick('opencode', win);
  assert.deepEqual(render.opencode(s.mem, win), { type: 'local', command: ['npx', '-y', 'pkg@1', 'C:/Users/me'], environment: { KEY: '{env:KEY}', MODE: 'Z' } });
  assert.deepEqual(render.opencode(s.web, win), { type: 'remote', url: 'https://x.dev/mcp?ref={env:REF}', headers: { Authorization: 'Bearer {env:TOKEN}' }, oauth: false });
  assert.equal(render.opencode({ ...s.mem, on: false }, win).enabled, false);
});

test('codex: env_vars for pass-through, literal env table, url resolved now, enabled false when off', () => {
  const s = pick('codex', win);
  assert.deepEqual(render.codex(s.mem, win), { command: 'npx', args: ['-y', 'pkg@1', 'C:/Users/me'], env_vars: ['KEY'], env: { MODE: 'Z' }, startup_timeout_sec: 30 });
  assert.deepEqual(render.codex(s.web, win), { enabled: false, url: 'https://x.dev/mcp?ref=r1', bearer_token_env_var: 'TOKEN' });
  assert.throws(() => render.codex(s.web, { ...win, env: {} }), MissingEnv);
});

test('pi: plain npx on every OS, ${VAR} in headers, url resolved now', () => {
  const s = pick('pi', win);
  assert.deepEqual(render.pi(s.mem, win), { command: 'npx', args: ['-y', 'pkg@1', 'C:/Users/me'], env: { KEY: '${KEY}', MODE: 'Z' } });
  assert.deepEqual(render.pi(s.web, win), { url: 'https://x.dev/mcp?ref=r1', headers: { Authorization: 'Bearer ${TOKEN}' } });
});

test('expand, envRefs and catalogProblems', () => {
  assert.equal(expand('{HOME}/x ${A}', 'opencode', win), 'C:/Users/me/x {env:A}');
  assert.deepEqual(envRefs('a ${B} ${C}'), ['B', 'C']);
  assert.deepEqual(catalogProblems(catalog), []);
  assert.equal(catalogProblems({ servers: { bad: { on: 'yes', os: ['bsd'] } } }).length, 3);
});

test('mcpSection lists on and off servers with the hint', () => {
  const text = mcpSection(serversFor(catalog, 'codex', 'windows'), 'Use -c.');
  assert.match(text, /On by default: `mem`\./);
  assert.match(text, /Off by default: `web`\. Use -c\./);
});

const linux = { repo: '/repo', home: '/home/me', os: 'linux', env: { REF: 'r1', KEY: 'k' } };
const one = (server) => catalogProblems({ servers: { s: { on: true, npx: ['p'], ...server } } });
const mentions = (problems, ...words) => problems.some((p) => words.every((w) => p.includes(w)));

test('linux renders plain npx for claude', () => {
  assert.deepEqual(render.claude(pick('claude', linux).mem, linux), { command: 'npx', args: ['-y', 'pkg@1', '/home/me'], env: { KEY: '${KEY}', MODE: 'Z' } });
});

test('skip override drops the server for that agent only', () => {
  const c = { servers: { a: { npx: ['p'], on: true, agents: { cursor: { skip: true } } } } };
  assert.equal(serversFor(c, 'cursor', 'linux').length, 0);
  assert.equal(serversFor(c, 'claude', 'linux').length, 1);
});

test('pi: a URL variable that is not set throws MissingEnv', () => {
  assert.throws(() => render.pi(pick('pi', win).web, { ...win, env: {} }), MissingEnv);
});

test('the real catalog is clean and renders for every agent on every OS', () => {
  const repo = fileURLToPath(new URL('..', import.meta.url));
  const real = loadCatalog(repo);
  assert.deepEqual(catalogProblems(real), []);
  const env = Object.fromEntries(Object.values(real.servers).flatMap((s) => envRefs(s.http ?? '')).map((v) => [v, 'x']));
  for (const os of ['windows', 'mac', 'linux']) {
    for (const agent of ['claude', 'codex', 'cursor', 'opencode', 'pi']) {
      const ctx = { repo: '/r', home: '/h', os, env };
      for (const s of serversFor(real, agent, os)) assert.doesNotThrow(() => render[agent](s, ctx), `${agent} ${os} ${s.name}`);
    }
  }
});

test('catalogProblems: shape of the catalog and of each entry', () => {
  assert.equal(catalogProblems(undefined).length, 1);
  assert.equal(catalogProblems({}).length, 1);
  assert.equal(catalogProblems({ servers: [] }).length, 1);
  assert.ok(mentions(catalogProblems({ servers: { n: null } }), 'n', 'entry'));
  assert.ok(mentions(one({ npx: [] }), 's', '"npx"'));
  assert.ok(mentions(one({ npx: 'pkg' }), 's', '"npx"'));
  assert.ok(mentions(one({ npx: [1] }), 's', '"npx"'));
  assert.ok(mentions(one({ npx: ['a-${X}'] }), 's', '"npx"'));
  assert.ok(mentions(one({ http: 5 }), 's', '"http"'));
  assert.ok(mentions(one({ http: 'https://x/${A', npx: undefined }), 's', '"http"'));
  assert.ok(mentions(one({ http: 'https://x/${A-B}', npx: undefined }), 's', '"http"'));
  assert.ok(mentions(one({ bearerEnv: 'A B' }), 's', '"bearerEnv"'));
  assert.ok(mentions(one({ bearerEnv: 5 }), 's', '"bearerEnv"'));
  assert.ok(mentions(one({ on: 'yes' }), 's', '"on"'));
  assert.ok(mentions(one({ extraField: 1 }), 's', '"extraField"'));
  assert.deepEqual(one({ $comment: 'ok' }), []);
});

test('catalogProblems: os, env, overrides and extra', () => {
    assert.equal(one({ os: 'mac' }).filter((p) => p.includes('"os"')).length, 1);
  assert.ok(mentions(one({ os: [] }), 's', '"os"'));
  assert.ok(mentions(one({ os: ['bsd'] }), 's', '"os"', 'bsd'));
  assert.ok(mentions(one({ env: 'x' }), 's', '"env"'));
  assert.ok(mentions(one({ env: { K: 5 } }), 's', 'env.K'));
  assert.ok(mentions(one({ env: { K: 'x-${K}' } }), 's', 'env.K'));
  assert.ok(mentions(one({ env: { K: '${OTHER}' } }), 's', 'env.K'));
  assert.ok(mentions(one({ env: { K: '${K' } }), 's', 'env.K'));
  assert.deepEqual(one({ env: { K: '${K}', M: 'lit' } }), []);
  assert.ok(mentions(one({ agents: { nope: {} } }), 's', 'nope'));
  assert.ok(mentions(one({ agents: { codex: null } }), 's', 'agents.codex'));
  assert.ok(mentions(one({ agents: { codex: { on: 1 } } }), 's', 'agents.codex.on'));
  assert.ok(mentions(one({ agents: { codex: { skip: 'y' } } }), 's', 'agents.codex.skip'));
  assert.ok(mentions(one({ agents: { codex: { enabled: true } } }), 's', 'agents.codex', 'enabled'));
  assert.ok(mentions(one({ agents: { codex: { extra: 5 } } }), 's', 'agents.codex.extra'));
  assert.ok(mentions(one({ agents: { codex: { extra: { url: 'x' } } } }), 's', 'agents.codex.extra', 'url'));
  assert.ok(mentions(one({ agents: { codex: { extra: { a: { b: '${bad' } } } } }), 's', 'agents.codex.extra'));
  assert.deepEqual(one({ agents: { codex: { on: false, skip: false, extra: { oauth: false } } } }), []);
});

test('codex refuses to resolve an env reference, and never shows a value', () => {
  const secret = 'sk-fake-secret-value';
  const c = { servers: { x: { npx: ['p'], env: { GH: '${OTHER}', T: 'a-${T}' }, on: true } } };
  assert.ok(mentions(catalogProblems(c), 'x', 'env.GH'));
  assert.ok(mentions(catalogProblems(c), 'x', 'env.T'));
  const s = serversFor(c, 'codex', 'linux')[0];
  assert.throws(() => render.codex(s, { ...linux, env: { OTHER: secret, T: secret } }), (e) => e.message.includes('x') && e.message.includes('env.GH') && !e.message.includes(secret));
});
