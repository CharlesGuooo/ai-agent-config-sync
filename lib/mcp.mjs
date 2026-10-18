// The MCP catalog (mcp/catalog.json) and its rendering into each agent's format.
import { join } from 'node:path';
import { readJson, isObj } from './util.mjs';
import { slash } from './platform.mjs';

const OSES = ['windows', 'mac', 'linux'];
const AGENTS = ['claude', 'codex', 'cursor', 'opencode', 'pi'];

export const loadCatalog = (repo) => readJson(join(repo, 'mcp', 'catalog.json'));

export function catalogProblems(catalog) {
  const out = [];
  for (const [name, s] of Object.entries(catalog?.servers ?? {})) {
    if (!s.npx === !s.http) out.push(`mcp/catalog.json ${name}: needs exactly one of "npx" or "http"`);
    if (typeof s.on !== 'boolean') out.push(`mcp/catalog.json ${name}: "on" must be true or false`);
    for (const os of s.os ?? []) if (!OSES.includes(os)) out.push(`mcp/catalog.json ${name}: unknown os "${os}"`);
    for (const a of Object.keys(s.agents ?? {})) if (!AGENTS.includes(a)) out.push(`mcp/catalog.json ${name}: unknown agent "${a}"`);
  }
  return out;
}

// The servers an agent gets on an OS, with that agent's overrides applied.
export function serversFor(catalog, agent, os) {
  const out = [];
  for (const [name, s] of Object.entries(catalog.servers)) {
    const o = s.agents?.[agent] ?? {};
    if ((s.os && !s.os.includes(os)) || o.skip) continue;
    out.push({ name, npx: s.npx, http: s.http, bearerEnv: s.bearerEnv, env: s.env ?? {}, on: o.on ?? s.on, extra: o.extra ?? {} });
  }
  return out;
}

export class MissingEnv extends Error {
  constructor(name) {
    super(`environment variable ${name} is not set`);
    this.envName = name;
  }
}

const REF = /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

export const envRefs = (s) => [...String(s).matchAll(REF)].map((m) => m[1]);

// {HOME} becomes this machine's home. ${VAR} becomes the agent's own syntax, or,
// with style 'resolve', the variable's value now — for fields an agent cannot
// interpolate (Codex and Pi URLs).
export function expand(s, style, ctx) {
  const env = ctx.env ?? process.env;
  return String(s).replaceAll('{HOME}', () => slash(ctx.home)).replace(REF, (_, v) => {
    if (style === 'cursor') return `\${env:${v}}`;
    if (style === 'opencode') return `{env:${v}}`;
    if (style === 'resolve') {
      if (!env[v]) throw new MissingEnv(v);
      return env[v];
    }
    return `\${${v}}`;
  });
}

const strip = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && !(isObj(v) && !Object.keys(v).length)));
const envMap = (s, style, ctx) => Object.fromEntries(Object.entries(s.env).map(([k, v]) => [k, expand(v, style, ctx)]));
const bearer = (s, style, ctx) => (s.bearerEnv ? { Authorization: expand(`Bearer \${${s.bearerEnv}}`, style, ctx) } : undefined);
const npxArgs = (s, ctx) => ['-y', ...s.npx.map((a) => expand(a, 'claude', ctx))];
// On Windows, Claude Code and Pi start local servers through cmd so the npx shim resolves.
const viaCmd = (ctx, args) => (ctx.os === 'windows' ? { command: 'cmd', args: ['/c', 'npx', ...args] } : { command: 'npx', args });
const offFlag = (s) => (s.on ? undefined : false);

export const render = {
  claude: (s, ctx) => strip(s.http
    ? { type: 'http', url: expand(s.http, 'claude', ctx), headers: bearer(s, 'claude', ctx), ...s.extra }
    : { ...viaCmd(ctx, npxArgs(s, ctx)), env: envMap(s, 'claude', ctx), ...s.extra }),
  cursor: (s, ctx) => strip(s.http
    ? { type: 'http', url: expand(s.http, 'cursor', ctx), headers: bearer(s, 'cursor', ctx), ...s.extra }
    : { command: 'npx', args: npxArgs(s, ctx), env: envMap(s, 'cursor', ctx), ...s.extra }),
  opencode: (s, ctx) => strip(s.http
    ? { type: 'remote', url: expand(s.http, 'opencode', ctx), headers: bearer(s, 'opencode', ctx), ...s.extra, enabled: offFlag(s) }
    : { type: 'local', command: ['npx', ...npxArgs(s, ctx)], environment: envMap(s, 'opencode', ctx), ...s.extra, enabled: offFlag(s) }),
  pi: (s, ctx) => strip(s.http
    ? { url: expand(s.http, 'resolve', ctx), headers: bearer(s, 'pi', ctx), ...s.extra, enabled: offFlag(s) }
    : { ...viaCmd(ctx, npxArgs(s, ctx)), env: envMap(s, 'pi', ctx), ...s.extra, enabled: offFlag(s) }),
  codex(s, ctx) {
    if (s.http) return strip({ enabled: offFlag(s), url: expand(s.http, 'resolve', ctx), bearer_token_env_var: s.bearerEnv, ...s.extra });
    // A variable passed through under its own name goes in env_vars; anything else is a literal.
    const passed = Object.keys(s.env).filter((k) => s.env[k] === `\${${k}}`);
    const literal = Object.fromEntries(Object.entries(s.env).filter(([k]) => !passed.includes(k)).map(([k, v]) => [k, expand(v, 'resolve', ctx)]));
    return strip({ enabled: offFlag(s), command: 'npx', args: npxArgs(s, ctx), env_vars: passed.length ? passed : undefined, env: literal, startup_timeout_sec: 30, ...s.extra });
  },
};

export function mcpSection(servers, enableHint) {
  const names = (on) => servers.filter((s) => s.on === on).map((s) => `\`${s.name}\``).join(', ');
  const lines = ['## MCP servers', '', `On by default: ${names(true) || 'none'}.`];
  if (servers.some((s) => !s.on)) lines.push('', `Off by default: ${names(false)}. ${enableHint}`);
  return lines.join('\n');
}
