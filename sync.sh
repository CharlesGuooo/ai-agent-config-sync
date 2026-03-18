#!/bin/bash
# AI Agent Config Sync Script
# 将此仓库的配置同步到本地系统

set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== AI Agent Config Sync ==="
echo "Repository: $REPO_DIR"
echo ""

# Claude Code
echo "Syncing Claude Code config..."
cp "$REPO_DIR/claude-code/CLAUDE.md" ~/.claude/CLAUDE.md
cp "$REPO_DIR/claude-code/settings.json" ~/.claude/settings.json
cp "$REPO_DIR/claude-code/skills/skill-rules.json" ~/.claude/skills/skill-rules.json
echo "  - CLAUDE.md"
echo "  - settings.json"
echo "  - skill-rules.json"

# MCP Server (if exists)
if [ -f "$REPO_DIR/claude-code/mcp-servers/smart_search_mcp.py" ]; then
    mkdir -p ~/.claude/mcp-servers
    cp "$REPO_DIR/claude-code/mcp-servers/smart_search_mcp.py" ~/.claude/mcp-servers/
    echo "  - mcp-servers/smart_search_mcp.py"
fi

# Codex
if [ -d ~/.codex ]; then
    echo ""
    echo "Syncing Codex config..."
    cp "$REPO_DIR/codex/config.toml" ~/.codex/config.toml
    echo "  - config.toml"
fi

echo ""
echo "=== Sync Complete ==="
echo "Note: API keys need to be set separately via environment variables"
