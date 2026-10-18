import { join } from 'node:path';
import { render } from '../mcp.mjs';
import { serverEntry } from './shared.mjs';

export default {
  title: 'Pi Global Instructions',
  enableHint: "To use one in a project, copy its entry from `~/.pi/agent/mcp.json` into the project's `.pi/mcp.json` with `\"enabled\": true` (trusted projects only).",
  plan(ctx, servers, warn) {
    const dir = join(ctx.home, '.pi', 'agent');
    return {
      // Pi is the one agent whose project skill path differs from its global one.
      skills: { global: join(dir, 'skills'), pack: (root) => join(root, '.pi', 'skills') },
      prompt: { id: 'pi:prompt', file: join(dir, 'AGENTS.md') },
      files: [],
      json: [{
        file: join(dir, 'mcp.json'),
        entries: servers.map((s) => serverEntry(`pi:mcp:${s.name}`, () => render.pi(s, ctx), warn, (value) => ({ id: `pi:mcp:${s.name}`, path: ['mcpServers', s.name], value }))),
      }],
      toml: [],
    };
  },
};
