import { join } from 'node:path';
import { render } from '../mcp.mjs';
import { jsonText, commandFiles, hookSpecs } from './shared.mjs';

export const LSP_PLUGINS = ['pyright-lsp', 'typescript-lsp', 'gopls-lsp', 'rust-analyzer-lsp'].map((p) => `${p}@claude-plugins-official`);

export default {
  title: 'Claude Code Global Instructions',
  enableHint: 'To use one in a project, copy `~/.claude/mcp-templates/<name>.mcp.json` into the project as `.mcp.json`.',
  plan(ctx, servers) {
    const dir = join(ctx.home, '.claude');
    // Claude has no per-server off switch, so off servers become per-project templates.
    const off = servers.filter((s) => !s.on);
    const template = (name, list) => ({
      id: `claude:mcp-template:${name}`,
      file: join(dir, 'mcp-templates', `${name}.mcp.json`),
      content: jsonText({ mcpServers: Object.fromEntries(list.map((s) => [s.name, render.claude(s, ctx)])) }),
    });
    return {
      skills: { global: join(dir, 'skills'), pack: (root) => join(root, '.claude', 'skills') },
      prompt: { id: 'claude:prompt', file: join(dir, 'CLAUDE.md') },
      files: [
        ...commandFiles(ctx, 'claude', join(dir, 'commands')),
        ...off.map((s) => template(s.name, [s])),
        ...(off.length ? [template('everything', off)] : []),
      ],
      json: [
        {
          file: join(ctx.home, '.claude.json'),
          entries: servers.filter((s) => s.on).map((s) => ({ id: `claude:mcp:${s.name}`, path: ['mcpServers', s.name], value: render.claude(s, ctx) })),
        },
        {
          file: join(dir, 'settings.json'),
          entries: LSP_PLUGINS.map((p) => ({ id: `claude:plugin:${p}`, path: ['enabledPlugins', p], value: true })),
          hooks: hookSpecs(ctx, 'claude'),
        },
      ],
      toml: [],
    };
  },
};
