import { join } from 'node:path';
import { render } from '../mcp.mjs';

export default {
  title: 'Cursor Global Rules',
  enableHint: "To use one in a project, add it to the project's `.cursor/mcp.json`.",
  plan(ctx, servers) {
    const dir = join(ctx.home, '.cursor');
    return {
      skills: { global: join(dir, 'skills'), pack: (root) => join(root, '.cursor', 'skills') },
      // Cursor takes user rules only from its settings UI; this file is what gets pasted there.
      prompt: { manual: join(ctx.local, 'cursor-rules.md') },
      files: [],
      // Cursor's mcp.json has no off switch, so only servers that are on by default go in.
      json: [{
        file: join(dir, 'mcp.json'),
        entries: servers.filter((s) => s.on).map((s) => ({ id: `cursor:mcp:${s.name}`, path: ['mcpServers', s.name], value: render.cursor(s, ctx) })),
      }],
      toml: [],
    };
  },
};
