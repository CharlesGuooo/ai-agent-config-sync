// Throwaway directories and a minimal repo with every input the installer reads.
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { makeRun } from '../lib/run.mjs';

export const tempDir = (prefix = 'harness-') => mkdtempSync(join(tmpdir(), prefix));

export function put(root, rel, content) {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
  return p;
}

export const emptyState = () => ({ version: 1, agents: [], packs: [], entries: {} });

export function fixtureRepo() {
  const repo = tempDir('harness-repo-');
  const skill = (dir, name) => put(repo, `${dir}/${name}/SKILL.md`, `---\nname: ${name}\ndescription: ${name} skill\n---\nbody\n`);
  skill('skills/global', 'alpha');
  skill('skills/global', 'beta');
  put(repo, 'skills/global/catalog.json', JSON.stringify({
    categories: [{ key: 'process', title: 'Process', blurb: 'Process discipline' }],
    skills: { alpha: { category: 'process', tagline: 'Alpha tagline' }, beta: { category: 'process', tagline: 'Beta tagline' } },
  }));
  skill('skills/project-packs/dev-project/skills', 'gamma');
  skill('skills/project-packs/dev-project/frontend/skills', 'delta');
  put(repo, 'mcp/catalog.json', JSON.stringify({ servers: {
    memory: { npx: ['@modelcontextprotocol/server-memory@1.0.0'], on: true },
    remote: { http: 'https://example.com/mcp', bearerEnv: 'REMOTE_TOKEN', on: false },
  } }));
  put(repo, 'prompt/core.md', '# {{TITLE}}\n\n| Dev | `~/dev-project/` |\n\n{{MCP}}\n\n{{NOTES}}\n\n{{NAMED}}\n\nRepo: {{REPO}}\n');
  put(repo, 'agents/pi/notes.md', '## Pi notes\n');
  put(repo, 'agents/claude/commands/hello.md', 'hello command\n');
  put(repo, 'agents/opencode/commands/opsx-x.md', 'opsx command\n');
  put(repo, 'scripts/hooks/guard.mjs', '// guard\n');
  put(repo, 'scripts/hooks/format.mjs', '// format\n');
  return repo;
}

export const newRun = ({ state = emptyState(), resolutions, dryRun } = {}) => makeRun({ state, resolutions, dryRun });
