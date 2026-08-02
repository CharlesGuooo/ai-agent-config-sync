# MCP — server configs

## Always-on (9)

Always installed across the 4 MCP-capable agents (Claude / Cursor / Codex / OpenCode — Pi has no MCP support):

| Server | Auth |
| --- | --- |
| `github` | `${GITHUB_PERSONAL_ACCESS_TOKEN}` |
| `memory` | none |
| `filesystem` | none |
| `context7` | none |
| `sequential-thinking` | none |
| `brave-search` | `${BRAVE_API_KEY}` |
| `playwright` | none |
| `chrome-devtools` | none |
| `web-reader` | `${Z_AI_API_KEY}` (disabled in Codex by upstream choice) |

## Opt-in (10)

Templates in `mcp/opt-in/`, copied to `~/MCP-Templates/`. Enable per project via `.mcp.json` (Claude Code) or `claude --mcp-config <file>`. Cursor/Codex/OpenCode keep them in their main config with `enabled: false` until needed.

| Server | Auth | Template file |
| --- | --- | --- |
| `supabase` | `${SUPABASE_ACCESS_TOKEN}`, `SUPABASE_PROJECT_REF` | `supabase.mcp.json` |
| `vercel` | OAuth | `vercel.mcp.json` |
| `railway` | none | `railway.mcp.json` |
| `cloudflare-docs` | none | (part of `cloudflare.mcp.json`) |
| `cloudflare-workers-builds` | none | (part of `cloudflare.mcp.json`) |
| `cloudflare-workers-bindings` | none | (part of `cloudflare.mcp.json`) |
| `cloudflare-observability` | none | (part of `cloudflare.mcp.json`) |
| `expo-mcp` | `${EXPO_TOKEN}` | `mobile.mcp.json` |
| `magic` | none | `magic.mcp.json` |
| `zai-mcp-server` | `${Z_AI_API_KEY}` | `zai.mcp.json` |

Scenario bundles (also in `mcp/opt-in/`):

- `deploy.mcp.json` — vercel + railway
- `fullstack.mcp.json` — supabase + vercel
- `everything.mcp.json` — all 10 at once (uses more tokens)

## Env-var syntax per agent

| Agent | Syntax | Example |
| --- | --- | --- |
| Claude (`.claude.json`) | `${VAR}` | `"env": {"GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"}` |
| Cursor (`.cursor/mcp.json`) | `${env:VAR}` | `"env": {"GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_PERSONAL_ACCESS_TOKEN}"}` |
| Codex (`.codex/config.toml`) | `bearer_token_env_var` / `env_vars[]` | `bearer_token_env_var = "SUPABASE_ACCESS_TOKEN"` |
| OpenCode (`.opencode/opencode.json`) | `{env:VAR}` | `"environment": {"GITHUB_PERSONAL_ACCESS_TOKEN": "{env:GITHUB_PERSONAL_ACCESS_TOKEN}"}` |

All four templates in `mcp/always-on/` use the correct syntax for their agent. **No plaintext secrets.**

## Codex Supabase note

In `mcp/always-on/codex.template.toml`, the Supabase MCP `url` field hard-codes `project_ref=<id>`. This is **not a secret** — `project_ref` is a public Supabase project identifier visible in URLs. Codex's TOML does not support env interpolation in the `url` field (only in `bearer_token_env_var`, `http_headers`, `env_vars`). On a new machine, edit the template to set your own `project_ref` before applying.
