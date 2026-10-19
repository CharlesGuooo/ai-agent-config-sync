import { join } from 'node:path';
import { render } from '../mcp.mjs';
import { hookSpecs, serverEntry } from './shared.mjs';

export default {
  title: 'Codex Global Instructions',
  enableHint: 'Turn one on for a session with `codex -c mcp_servers.<name>.enabled=true`.',
  plan(ctx, servers, warn) {
    const dir = join(ctx.home, '.codex');
    return {
      skills: { global: join(dir, 'skills'), pack: (root) => join(root, '.codex', 'skills') },
      prompt: { id: 'codex:prompt', file: join(dir, 'AGENTS.md') },
      files: [],
      // Codex reads hooks.json with Claude's schema, which keeps the hooks out of the TOML.
      json: [{ file: join(dir, 'hooks.json'), entries: [], hooks: hookSpecs(ctx, 'codex') }],
      toml: [{
        file: join(dir, 'config.toml'),
        servers: servers.map((s) => {
          const id = `codex:mcp:${s.name}`;
          return serverEntry(id, () => render.codex(s, ctx), warn, (value) => ({ id, name: s.name, value }));
        }),
      }],
    };
  },
};
