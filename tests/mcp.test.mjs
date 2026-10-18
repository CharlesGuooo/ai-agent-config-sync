import test from 'node:test';
import assert from 'node:assert/strict';
import { serversFor, render, expand, MissingEnv, catalogProblems, mcpSection, envRefs } from '../lib/mcp.mjs';

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

test('pi: cmd wrapper on Windows, ${VAR} in headers, url resolved now', () => {
  const s = pick('pi', win);
  assert.deepEqual(render.pi(s.mem, win).args.slice(0, 3), ['/c', 'npx', '-y']);
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
