# AI Agent Config Sync

Clean source-of-truth repo for reproducing the same shared skill and MCP layout across:

- Codex
- Claude Code
- OpenCode
- Cursor

This repo is rebuilt around the current machine's clean architecture, not around old exported snapshots.

## Design

The setup uses three layers:

1. Global process skills
2. Local project skill packs
3. Shared global MCP inventory

### Global skills

Stored in:

- `skills/global/common/`
- `skills/global/codex-system/` for Codex-only built-in system skills

### Local project packs

Stored in:

- `skills/project-packs/scientific-project/skills/`
- `skills/project-packs/database-project/skills/`
- `skills/project-packs/data-analysis-project/skills/`
- `skills/project-packs/dev-project/skills/`
- `skills/project-packs/marketing-project/skills/`
- `skills/project-packs/research-project/skills/`
- `skills/project-packs/office-project/skills/`
- `skills/project-packs/productivity-project/skills/`

### Agent-specific files

Stored in:

- `agents/codex/`
- `agents/claude/`
- `agents/cursor/`
- `agents/opencode/`

## MCP Inventory

Shared canonical inventory:

- `github`
- `memory`
- `web-reader`
- `zai-mcp-server`
- `context7`
- `sequential-thinking`
- `vercel`
- `railway`
- `cloudflare-docs`
- `cloudflare-workers-builds`
- `cloudflare-workers-bindings`
- `cloudflare-observability`
- `playwright`
- `supabase`
- `magic`
- `expo-mcp`
- `brave-search`
- `firecrawl` when keyed

`firecrawl` is intentionally optional. Codex keeps it disabled by default until `FIRECRAWL_API_KEY` exists. The sync scripts only materialize it for the JSON-based clients when that key is present.

## Required Secrets

Create a local `.env` file from `.env.example` and fill:

- `GITHUB_PERSONAL_ACCESS_TOKEN`
- `Z_AI_API_KEY`
- `SUPABASE_ACCESS_TOKEN`
- `EXPO_TOKEN`
- `BRAVE_API_KEY`

Optional:

- `FIRECRAWL_API_KEY`

This repo does not store model-provider auth, Claude auth, Cursor auth, or OpenCode account auth. Those stay machine-local.

## Windows Install

Verified path:

```powershell
cd D:\Projects2\ai-agent-config-sync
Copy-Item .env.example .env
# fill .env
.\install.ps1
```

`install.ps1` will:

- load `.env`
- persist required MCP secrets into user environment variables
- sync global skills to each tool's global skill location
- sync local project packs into `~/*-project/.claude/skills`
- install Codex, Claude Code, Cursor, and OpenCode config files
- merge Claude MCP entries into both `~/.claude.json` and `~/.claude/settings.json`

## Unix Install

Best-effort path:

```bash
cd /path/to/ai-agent-config-sync
cp .env.example .env
# fill .env
./install.sh
```

The shell scripts require `jq` for Claude JSON merging and `rsync` for directory sync.

## Notes

- Claude Code and OpenCode use the same MCP inventory, but remote MCP compatibility can still vary by client.
- On the current machine, OpenCode still has unresolved compatibility issues with `web-reader` and `expo-mcp`.
- Some remote servers may show auth-required status until their own login flow is completed, for example Vercel or Cloudflare account-scoped MCPs.
