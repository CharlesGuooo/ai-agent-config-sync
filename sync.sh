#!/bin/bash
# AI Agent Config Sync Script
# Sync shared config while preserving local provider/API settings.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
CODEX_DIR="$HOME/.codex"
OPENCODE_DIR="$HOME/.config/opencode"

sync_dir_contents() {
    local source="$1"
    local destination="$2"

    [ -d "$source" ] || return 0

    mkdir -p "$destination"
    rm -rf "$destination"/*
    cp -r "$source"/. "$destination/"
}

echo "=== AI Agent Config Sync ==="
echo "Repository: $REPO_DIR"
echo ""

echo "Syncing Claude Code config..."
mkdir -p "$CLAUDE_DIR"
cp "$REPO_DIR/claude-code/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"
sync_dir_contents "$REPO_DIR/shared/skills" "$CLAUDE_DIR/skills"
sync_dir_contents "$REPO_DIR/shared/index" "$CLAUDE_DIR/index"
echo "  - CLAUDE.md"
echo "  - shared skills"
echo "  - shared index"
echo "  - preserved existing settings.json/provider config"

if [ -f "$REPO_DIR/claude-code/mcp-servers/smart_search_mcp.py" ]; then
    mkdir -p "$CLAUDE_DIR/mcp-servers"
    cp "$REPO_DIR/claude-code/mcp-servers/smart_search_mcp.py" "$CLAUDE_DIR/mcp-servers/"
    echo "  - mcp-servers/smart_search_mcp.py"
fi

echo ""
echo "Syncing Codex config..."
mkdir -p "$CODEX_DIR"
cp "$REPO_DIR/codex/AGENTS.md" "$CODEX_DIR/AGENTS.md"
sync_dir_contents "$REPO_DIR/shared/skills" "$CODEX_DIR/skills"
sync_dir_contents "$REPO_DIR/shared/index" "$CODEX_DIR/index"
echo "  - AGENTS.md"
echo "  - shared skills"
echo "  - shared index"
echo "  - preserved existing config.toml/provider config"

echo ""
echo "Syncing OpenCode config..."
mkdir -p "$OPENCODE_DIR"
cp "$REPO_DIR/opencode/AGENTS.md" "$OPENCODE_DIR/AGENTS.md"
sync_dir_contents "$REPO_DIR/shared/skills" "$OPENCODE_DIR/skills"
echo "  - AGENTS.md"
echo "  - shared skills"
echo "  - preserved existing opencode.json/provider config"

echo ""
echo "=== Sync Complete ==="
echo "Note: provider/API config files were intentionally preserved to avoid breaking local setups."
