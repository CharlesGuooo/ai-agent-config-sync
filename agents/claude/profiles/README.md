# Claude Profiles

This repo does not store live Claude profile snapshots because those files can carry local machine state and secrets.

Instead:

1. `agents/claude/CLAUDE.md` is the shared instruction file.
2. `agents/claude/mcp-servers.template.json` is the MCP template.
3. `install.ps1` and `sync.ps1` merge the MCP template into:
   - `~/.claude.json`
   - `~/.claude/settings.json`

That keeps the repo clean while still reproducing the live MCP setup on a new machine.
