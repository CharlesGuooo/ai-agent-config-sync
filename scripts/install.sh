#!/usr/bin/env bash
# install.sh — single-entry installer for ai-agent-config-sync
# Usage:
#   ./scripts/install.sh                          # full install (all 5 agents, all packs, MCP)
#   ./scripts/install.sh --agents=claude,codex    # subset
#   ./scripts/install.sh --packs=dev,finance      # subset of project packs
#   ./scripts/install.sh --skip-mcp               # skills + system prompts only
#   ./scripts/install.sh --global-only            # 39 global skills only
#   ./scripts/install.sh --dry-run                # plan but don't write
#
# Do NOT install claude-mem (retired 2026-07) — see INSTALL.md "Do not install".
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec "$repo_root/scripts/sync.sh" "$@"
