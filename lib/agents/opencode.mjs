import { join } from 'node:path';
import { render } from '../mcp.mjs';
import { commandFiles } from './shared.mjs';

export default {
  title: 'OpenCode Global Instructions',
  enableHint: "To use one in a project, set `\"enabled\": true` for it under `mcp` in the project's `opencode.json`.",
  plan(ctx, servers) {
    const dir = join(ctx.home, '.config', 'opencode');
    return {
      skills: { global: join(dir, 'skills'), pack: (root) => join(root, '.opencode', 'skills') },
      prompt: { id: 'opencode:prompt', file: join(dir, 'AGENTS.md') },
      files: commandFiles(ctx, 'opencode', join(dir, 'commands')),
      json: [{
        file: join(dir, 'opencode.json'),
        entries: [
          { id: 'opencode:schema', path: ['$schema'], value: 'https://opencode.ai/config.json' },
          { id: 'opencode:lsp', path: ['lsp'], value: true },
          ...servers.map((s) => ({ id: `opencode:mcp:${s.name}`, path: ['mcp', s.name], value: render.opencode(s, ctx) })),
        ],
      }],
      toml: [],
    };
  },
};
