# INSTALL — Step-by-step install guide

Audience: an AI agent (or a human) running this on a fresh machine.

## TL;DR

```bash
git clone <repo>
cd ai-agent-config-sync
cp .env.example .env             # fill in keys you have
./scripts/install.sh             # or with flags below
```

## Prerequisites

| Required | Why |
| --- | --- |
| `git` | Clone this repo. |
| `bash` or `pwsh` | Run install scripts. |
| `rsync` (Unix) / `robocopy` (Win) | Copy skill directories. |
| `jq` | Merge MCP JSON into existing configs. |
| Node 20+ | Required by some MCP servers (`npx -y`). |
| Python 3.10+ | Some Codex MCP servers and verification scripts. |

| Optional | When |
| --- | --- |
| 1Password CLI | If you want to inject secrets without writing `.env`. |

## Install flags

The single entry script `scripts/install.sh` (or `install.ps1`) supports:

```
--agents=claude,cursor,codex,opencode    # subset; default = all four
--packs=dev,finance,ios,data,marketing,research,productivity,craft   # subset; default = all
--skip-mcp                                # skip MCP server config (skills + system prompts only)
--global-only                             # 37 global skills only, no project packs
--dry-run                                 # print planned ops without writing
```

Examples:

```bash
# Full install
./scripts/install.sh

# Only Claude + Codex, no MCP
./scripts/install.sh --agents=claude,codex --skip-mcp

# Only dev + finance packs
./scripts/install.sh --packs=dev,finance

# Just the 37 global skills, nothing else
./scripts/install.sh --global-only
```

## What each step does

0. **Regenerate** — `node scripts/gen-skill-table.mjs` + `gen-harness.mjs` refresh the per-agent skill tables and `HARNESS.md` from the single source (`catalog.json` + the skill dirs) before anything is copied; a `--check` drift gate aborts a dirty dry-run.
1. **Validate env** — confirm required env vars from `.env` are present.
2. **Backup** — snapshot any existing target dirs to `~/.agent-config-backup/<timestamp>/`.
3. **Copy global skills** — `skills/global/*` → `~/.{claude,cursor,codex,opencode}/skills/` (per `--agents`).
4. **Copy Codex `.system`** — `skills/codex-system/*` → `~/.codex/skills/.system/` (Codex only).
5. **Copy project packs** — `skills/project-packs/<pack>/skills/` and any sub-pack `<pack>/<sub>/skills/` → corresponding `~/<pack>/[<sub>/].{claude,cursor,codex,opencode}/skills/` (per `--packs`).
6. **Copy agent system prompts** — `agents/<agent>/<prompt-file>` → live machine paths (see `INVENTORY.md`).
6b. **Hooks + Claude settings + HARNESS** — copy `scripts/hooks/{guard,format}.mjs` → `~/.agent-hooks/`; deep-merge `agents/claude/settings.fragment.json` (LSP plugins + guard/format hooks) into `~/.claude/settings.json` (preserving existing keys/hooks); resolve the Codex `{{HOOKS_DIR}}` placeholder in `config.toml`; copy `HARNESS.md` → `~/HARNESS.md`.
7. **Merge MCP configs** — unless `--skip-mcp`:
   - Claude → merge `mcp/always-on/claude.template.json` into `~/.claude.json` (and `~/.claude/settings.json` if present).
   - Cursor → write `~/.cursor/mcp.json` from `cursor.template.json`.
   - Codex → append `mcp/always-on/codex.template.toml` blocks to `~/.codex/config.toml`.
   - OpenCode → write `~/.opencode/opencode.json` from `opencode.template.json`.
8. **Copy opt-in MCP templates** — `mcp/opt-in/*` → `~/MCP-Templates/` (Windows: `C:\Users\<user>\MCP-Templates\`). Not enabled by default — users opt them in via `.mcp.json` per project, or `claude --mcp-config <template>`.
9. **Persist env vars** (Windows only, via `install.ps1`) — write `.env` keys to User-scope environment so Cursor / Codex / OpenCode can resolve `${env:VAR}`.

## Verification after install

```bash
# Skill counts
ls ~/.claude/skills/ | wc -l           # → 37 (+ agent-specific extras)
ls ~/.codex/skills/.system/ | wc -l    # → 5
ls ~/ios-project/.claude/skills/ | wc -l   # → 21

# Claude MCP
cat ~/.claude.json | jq '.mcpServers | keys'   # → 9 always-on

# Hooks + agent-facing manifest
ls ~/.agent-hooks/                     # guard.mjs, format.mjs
test -f ~/HARNESS.md && echo "HARNESS present"

# System prompt sanity
head -6 ~/.claude/CLAUDE.md   # should show the Core Principles
```

## Do not install

Read this before adding anything beyond what the scripts do.

- **`claude-mem` — do NOT install it.** Retired 2026-07 (unused in practice). It is
  gone from this repo on purpose: no `claude-mem/` directory, no MCP stanza in
  `agents/cursor/mcp.json`, no marketplace block in `agents/codex/config.toml`. If you
  find it referenced anywhere, that reference is stale — delete it, don't act on it.
  On a machine where a previous setup already installed it, leaving it alone is fine;
  just never re-add it to this repo or to a fresh machine.
- **Anything not listed in `INVENTORY.md`.** That table is the complete source→target
  map. If a step isn't there, it isn't part of this harness.

## Selective install for an agent

If you're a new-machine agent and the user only asked for partial setup, read `INVENTORY.md` — it's a table of every source→target mapping. You can either:

1. Run the install script with appropriate `--agents` / `--packs` flags, or
2. `cp` only the rows you need (the table is the source of truth).

Both produce the same result.

## Where things go (high-level)

| Repo location | Lands at |
| --- | --- |
| `skills/global/` | `~/.{agent}/skills/` for all 4 agents |
| `skills/codex-system/` | `~/.codex/skills/.system/` |
| `skills/project-packs/<pack>/skills/` | `~/<pack>/.{agent}/skills/` |
| `skills/project-packs/<pack>/<sub>/skills/` | `~/<pack>/<sub>/.{agent}/skills/` |
| `agents/claude/CLAUDE.md` | `~/.claude/CLAUDE.md` |
| `agents/cursor/rules/global-rules.md` | `~/.cursor/rules/global-rules.md` |
| `agents/codex/AGENTS.md` | `~/.codex/AGENTS.md` |
| `agents/opencode/AGENTS.md` | `~/.opencode/AGENTS.md` |
| `mcp/always-on/claude.template.json` | merged into `~/.claude.json` (mcpServers block) |
| `mcp/always-on/cursor.template.json` | written to `~/.cursor/mcp.json` |
| `mcp/always-on/codex.template.toml` | appended to `~/.codex/config.toml` |
| `mcp/always-on/opencode.template.json` | written to `~/.opencode/opencode.json` (mcp block) |
| `mcp/opt-in/*` | copied to `~/MCP-Templates/` |
