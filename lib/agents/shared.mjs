// Pieces every agent adapter uses.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { readText, lf } from '../util.mjs';
import { slash } from '../platform.mjs';
import { MissingEnv } from '../mcp.mjs';

export const jsonText = (v) => `${JSON.stringify(v, null, 2)}\n`;

// agents/<agent>/commands/*.md, as managed files in the agent's command directory.
export function commandFiles(ctx, agent, dst) {
  const src = join(ctx.repo, 'agents', agent, 'commands');
  if (!existsSync(src)) return [];
  return readdirSync(src)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => ({ id: `${agent}:command:${f}`, file: join(dst, f), content: lf(readText(join(src, f))) }));
}

// guard runs before tool calls and format after edits, both straight from the repo.
export function hookSpecs(ctx, agent) {
  const node = (script) => `node "${slash(join(ctx.repo, 'scripts', 'hooks', script))}"`;
  return [
    { id: `${agent}:hook:guard`, event: 'PreToolUse', matcher: 'Bash|PowerShell|Read|Edit|Write|MultiEdit', command: node('guard.mjs') },
    { id: `${agent}:hook:format`, event: 'PostToolUse', matcher: 'Edit|Write|MultiEdit', command: node('format.mjs') },
  ];
}

// The entry for one server, or a skip marker when a variable it needs right now
// is missing — the machine's existing entry is then left as it is. Only a server that is
// on by default is warned about: one that is off would repeat the warning on every update.
export function serverEntry(id, render, warn, entry, on = true) {
  try {
    return entry(render());
  } catch (e) {
    if (!(e instanceof MissingEnv)) throw e;
    if (on) warn(`${id} left as it is: ${e.message}`);
    return { id, skip: true };
  }
}
