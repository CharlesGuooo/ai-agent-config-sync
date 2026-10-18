// The MCP catalog (mcp/catalog.json) and its rendering into each agent's format.
import { join } from 'node:path';
import { readJson, isObj } from './util.mjs';
import { slash } from './platform.mjs';

const OSES = ['windows', 'mac', 'linux'];
const AGENTS = ['claude', 'codex', 'cursor', 'opencode', 'pi'];

export const loadCatalog = (repo) => readJson(join(repo, 'mcp', 'catalog.json'));

const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const SERVER_KEYS = ['npx', 'http', 'bearerEnv', 'env', 'on', 'os', 'agents', '$comment'];
const OVERRIDE_KEYS = ['on', 'skip', 'extra'];
// Fields the renderers set themselves; an "extra" must not overwrite them.
const RESERVED = ['type', 'url', 'headers', 'command', 'args', 'env', 'environment', 'enabled', 'env_vars', 'bearer_token_env_var', 'startup_timeout_sec'];

// True when a string holds "${" that is not part of a plain ${NAME}.
const badRef = (s) => s.replace(/\$\{[A-Za-z_][A-Za-z0-9_]*\}/g, '').includes('${');

// Messages name the server and field, never a value: catalog edits can sit next to secrets.
export function catalogProblems(catalog) {
  const out = [];
  if (!isObj(catalog) || !isObj(catalog.servers)) return ['mcp/catalog.json: needs a "servers" object'];
  for (const [name, s] of Object.entries(catalog.servers)) {
    const bad = (field, why) => out.push(`mcp/catalog.json ${name}: ${field} ${why}`);
    if (!isObj(s)) {
      bad('entry', 'must be an object');
      continue;
    }
    for (const k of Object.keys(s)) if (!SERVER_KEYS.includes(k)) bad(`"${k}"`, 'is not a known field');
    const isStrs = (v) => Array.isArray(v) && v.length > 0 && v.every((a) => typeof a === 'string');
    if (s.npx === undefined && s.http === undefined) bad('"npx"/"http"', 'needs exactly one of them');
    else if (s.npx !== undefined && s.http !== undefined) bad('"npx"/"http"', 'needs exactly one of them, not both');
    if (s.npx !== undefined) {
      if (!isStrs(s.npx)) bad('"npx"', 'must be a non-empty array of strings');
      else if (s.npx.some((a) => a.includes('${'))) bad('"npx"', 'must not contain ${...}: only Claude could expand it there');
    }
    if (s.http !== undefined) {
      if (typeof s.http !== 'string') bad('"http"', 'must be a string');
      else if (badRef(s.http)) bad('"http"', 'has a "${" that is not a plain ${NAME}');
    }
    if (s.bearerEnv !== undefined && !(typeof s.bearerEnv === 'string' && NAME.test(s.bearerEnv))) bad('"bearerEnv"', 'must be an environment variable name');
    if (typeof s.on !== 'boolean') bad('"on"', 'must be true or false');
    if (s.os !== undefined) {
      if (!isStrs(s.os)) bad('"os"', 'must be a non-empty array of strings');
      else for (const os of s.os) if (!OSES.includes(os)) bad('"os"', `has an unknown system "${os}"`);
    }
    if (s.env !== undefined) {
      if (!isObj(s.env)) bad('"env"', 'must be an object');
      else {
        for (const [k, v] of Object.entries(s.env)) {
          if (typeof v !== 'string') bad(`env.${k}`, 'must be a string');
          else if (badRef(v)) bad(`env.${k}`, 'has a "${" that is not a plain ${NAME}');
          // Codex can only pass a variable through under its own name, so that is the only form allowed.
          else if (v.includes('${') && v !== `\${${k}}`) bad(`env.${k}`, `must be exactly \${${k}} when it refers to a variable`);
        }
      }
    }
    if (s.agents !== undefined) {
      if (!isObj(s.agents)) bad('"agents"', 'must be an object');
      else {
        for (const [a, o] of Object.entries(s.agents)) {
          if (!AGENTS.includes(a)) bad('"agents"', `has an unknown agent "${a}"`);
          if (!isObj(o)) {
            bad(`agents.${a}`, 'must be an object');
            continue;
          }
          for (const k of Object.keys(o)) if (!OVERRIDE_KEYS.includes(k)) bad(`agents.${a}`, `has an unknown field "${k}"`);
          for (const k of ['on', 'skip']) if (o[k] !== undefined && typeof o[k] !== 'boolean') bad(`agents.${a}.${k}`, 'must be true or false');
          if (o.extra !== undefined) {
            if (!isObj(o.extra)) bad(`agents.${a}.extra`, 'must be an object');
            else {
              for (const k of Object.keys(o.extra)) if (RESERVED.includes(k)) bad(`agents.${a}.extra`, `must not set "${k}"`);
              if (JSON.stringify(o.extra).replace(/\$\{[A-Za-z_][A-Za-z0-9_]*\}/g, '').includes('${')) bad(`agents.${a}.extra`, 'has a "${" that is not a plain ${NAME}');
            }
          }
        }
      }
    }
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
// On Windows, Claude Code starts local servers through cmd so the npx shim resolves. Pi (cross-spawn) and the others find npx.cmd themselves, and cmd /c would re-parse &, %VAR% and ^ in arguments.
const viaCmd = (ctx, args) => (ctx.os === 'windows' ? { command: 'cmd', args: ['/c', 'npx', ...args] } : { command: 'npx', args });
const offFlag = (s) => (s.on ? undefined : false);

// A Codex env value is written into config.toml as text, so a variable reference must never be resolved here:
// that would copy a secret's value into the file. Pass-through under the variable's own name is env_vars.
const literalEnv = (server, key, v, ctx) => {
  if (String(v).includes('${')) throw new Error(`${server}: env.${key} refers to a variable other than a plain pass-through, which Codex cannot do`);
  return expand(v, 'claude', ctx);
};

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
    : { command: 'npx', args: npxArgs(s, ctx), env: envMap(s, 'pi', ctx), ...s.extra, enabled: offFlag(s) }),
  codex(s, ctx) {
    if (s.http) return strip({ enabled: offFlag(s), url: expand(s.http, 'resolve', ctx), bearer_token_env_var: s.bearerEnv, ...s.extra });
    // A variable passed through under its own name goes in env_vars; anything else is a literal.
    const passed = Object.keys(s.env).filter((k) => s.env[k] === `\${${k}}`);
    const literal = Object.fromEntries(Object.entries(s.env).filter(([k]) => !passed.includes(k)).map(([k, v]) => [k, literalEnv(s.name, k, v, ctx)]));
    return strip({ enabled: offFlag(s), command: 'npx', args: npxArgs(s, ctx), env_vars: passed.length ? passed : undefined, env: literal, startup_timeout_sec: 30, ...s.extra });
  },
};

export function mcpSection(servers, enableHint) {
  const names = (on) => servers.filter((s) => s.on === on).map((s) => `\`${s.name}\``).join(', ');
  const lines = ['## MCP servers', '', `On by default: ${names(true) || 'none'}.`];
  if (servers.some((s) => !s.on)) lines.push('', `Off by default: ${names(false)}. ${enableHint}`);
  return lines.join('\n');
}
