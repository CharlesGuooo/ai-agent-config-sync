import { join } from 'node:path';
import { render } from '../mcp.mjs';
import { serverEntry } from './shared.mjs';

export default {
  title: 'Pi Global Instructions',
  enableHint: "To use one in a project, copy its entry from `~/.pi/agent/mcp.json` into the project's `.pi/mcp.json` with `\"enabled\": true` (trusted projects only).",
  plan(ctx, servers, warn) {
    const dir = join(ctx.home, '.pi', 'agent');
    return {
      // Pi's global skills live under agent/, its project ones under .pi/skills.
      skills: { global: join(dir, 'skills'), pack: (root) => join(root, '.pi', 'skills') },
      prompt: { id: 'pi:prompt', file: join(dir, 'AGENTS.md') },
      files: [],
      json: [{
        file: join(dir, 'mcp.json'),
        entries: servers.map((s) => {
          const id = `pi:mcp:${s.name}`;
          return serverEntry(id, () => render.pi(s, ctx), warn, (value) => ({ id, path: ['mcpServers', s.name], value }));
        }),
      }],
      toml: [],
    };
  },
};
