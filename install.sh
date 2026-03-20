#!/bin/bash
# AI Agent Config Sync - installer
# Usage: ./install.sh [claude|codex|opencode|cursor|all]
# Default: all

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
CODEX_DIR="$HOME/.codex"
OPENCODE_DIR="$HOME/.config/opencode"
CURSOR_DIR="$HOME/.cursor"

check_dependencies() {
    echo -e "${YELLOW}Checking dependencies...${NC}"

    local missing=()

    if ! command -v node >/dev/null 2>&1; then
        missing+=("Node.js")
    else
        echo -e "  ${GREEN}[ok]${NC} Node.js $(node --version)"
    fi

    if ! command -v npx >/dev/null 2>&1; then
        missing+=("npx")
    else
        echo -e "  ${GREEN}[ok]${NC} npx available"
    fi

    if command -v python3 >/dev/null 2>&1; then
        echo -e "  ${GREEN}[ok]${NC} $(python3 --version 2>&1)"
    elif command -v python >/dev/null 2>&1; then
        echo -e "  ${GREEN}[ok]${NC} $(python --version 2>&1)"
    else
        echo -e "  ${BLUE}[info]${NC} Python not found (optional)"
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        echo ""
        echo -e "${RED}Missing required dependencies:${NC}"
        for dep in "${missing[@]}"; do
            echo -e "  ${RED}[missing]${NC} $dep"
        done
        echo ""
        echo "Please install them first:"
        echo "  - Node.js: https://nodejs.org/"
        exit 1
    fi

    echo ""
}

replace_env_placeholders() {
    local file="$1"
    local home_path="$HOME"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|\${HOME}|$home_path|g" "$file"
    else
        sed -i "s|\${HOME}|$home_path|g" "$file"
    fi
}

copy_if_missing() {
    local source="$1"
    local destination="$2"
    local label="$3"

    if [ -e "$destination" ]; then
        echo -e "  ${BLUE}[preserved]${NC} $label"
        return
    fi

    cp "$source" "$destination"
    echo -e "  ${GREEN}[created]${NC} $label"
}

install_claude() {
    echo -e "${YELLOW}Installing Claude Code config...${NC}"

    mkdir -p "$CLAUDE_DIR" "$CLAUDE_DIR/skills" "$CLAUDE_DIR/index" "$CLAUDE_DIR/mcp-servers"

    cp "$SCRIPT_DIR/claude-code/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"
    copy_if_missing "$SCRIPT_DIR/claude-code/settings.json" "$CLAUDE_DIR/settings.json" "~/.claude/settings.json"

    if [ -d "$SCRIPT_DIR/shared/skills" ]; then
        rm -rf "$CLAUDE_DIR/skills"/*
        cp -r "$SCRIPT_DIR/shared/skills"/. "$CLAUDE_DIR/skills/"
        echo -e "  ${GREEN}[synced]${NC} ~/.claude/skills/ ($(ls "$CLAUDE_DIR/skills" | wc -l | tr -d ' ') skills)"
    fi

    if [ -d "$SCRIPT_DIR/shared/index" ]; then
        rm -rf "$CLAUDE_DIR/index"/*
        cp -r "$SCRIPT_DIR/shared/index"/. "$CLAUDE_DIR/index/"
        echo -e "  ${GREEN}[synced]${NC} ~/.claude/index/"
    fi

    if [ -d "$SCRIPT_DIR/claude-code/mcp-servers" ]; then
        cp -r "$SCRIPT_DIR/claude-code/mcp-servers"/. "$CLAUDE_DIR/mcp-servers/" 2>/dev/null || true
    fi

    if [ ! -f "$CLAUDE_DIR/.env" ]; then
        cp "$SCRIPT_DIR/.env.example" "$CLAUDE_DIR/.env"
        echo -e "  ${BLUE}[created]${NC} ~/.claude/.env - please fill in your API keys"
    fi

    echo -e "${GREEN}[ok]${NC} Claude Code config installed"
}

install_codex() {
    echo -e "${YELLOW}Installing Codex config...${NC}"

    mkdir -p "$CODEX_DIR" "$CODEX_DIR/skills" "$CODEX_DIR/index"

    cp "$SCRIPT_DIR/codex/AGENTS.md" "$CODEX_DIR/AGENTS.md"
    copy_if_missing "$SCRIPT_DIR/codex/config.toml" "$CODEX_DIR/config.toml" "~/.codex/config.toml"

    if [ -d "$SCRIPT_DIR/shared/skills" ]; then
        rm -rf "$CODEX_DIR/skills"/*
        cp -r "$SCRIPT_DIR/shared/skills"/. "$CODEX_DIR/skills/"
        echo -e "  ${GREEN}[synced]${NC} ~/.codex/skills/"
    fi

    if [ -d "$SCRIPT_DIR/shared/index" ]; then
        rm -rf "$CODEX_DIR/index"/*
        cp -r "$SCRIPT_DIR/shared/index"/. "$CODEX_DIR/index/"
        echo -e "  ${GREEN}[synced]${NC} ~/.codex/index/"
    fi

    echo -e "${GREEN}[ok]${NC} Codex config installed"
}

install_opencode() {
    echo -e "${YELLOW}Installing OpenCode config...${NC}"

    mkdir -p "$OPENCODE_DIR" "$OPENCODE_DIR/skills"

    cp "$SCRIPT_DIR/opencode/AGENTS.md" "$OPENCODE_DIR/AGENTS.md"
    copy_if_missing "$SCRIPT_DIR/opencode/opencode.json" "$OPENCODE_DIR/opencode.json" "~/.config/opencode/opencode.json"

    if [ -d "$SCRIPT_DIR/shared/skills" ]; then
        rm -rf "$OPENCODE_DIR/skills"/*
        cp -r "$SCRIPT_DIR/shared/skills"/. "$OPENCODE_DIR/skills/"
        echo -e "  ${GREEN}[synced]${NC} ~/.config/opencode/skills/"
    fi

    echo -e "${GREEN}[ok]${NC} OpenCode config installed"
}

install_cursor() {
    echo -e "${YELLOW}Installing Cursor IDE config...${NC}"

    mkdir -p "$CURSOR_DIR/rules"

    cp "$SCRIPT_DIR/cursor/global-rules.md" "$CURSOR_DIR/rules/global-rules.md"
    copy_if_missing "$SCRIPT_DIR/cursor/mcp.json" "$CURSOR_DIR/mcp.json" "~/.cursor/mcp.json"

    echo -e "${GREEN}[ok]${NC} Cursor IDE config installed"
    echo -e "${BLUE}[note]${NC} For project-level skills, create symlinks in each project:"
    echo "  ln -s ~/.claude/skills ~/your-project/.cursor/skills"
}

show_post_install() {
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}Installation Complete!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo -e "${YELLOW}Four tools configured:${NC}"
    echo "  - Claude Code: ~/.claude/"
    echo "  - Codex CLI:   ~/.codex/"
    echo "  - OpenCode:    ~/.config/opencode/"
    echo "  - Cursor IDE:  ~/.cursor/"
    echo ""
    echo -e "${YELLOW}Note:${NC} provider/API config files were preserved if they already existed."
    echo -e "${YELLOW}Note:${NC} Please configure your API keys in ~/.claude/.env"
}

TARGET="${1:-all}"

check_dependencies

case "$TARGET" in
    claude) install_claude ;;
    codex) install_codex ;;
    opencode) install_opencode ;;
    cursor) install_cursor ;;
    all)
        install_claude
        install_codex
        install_opencode
        install_cursor
        ;;
    *)
        echo -e "${RED}Unknown target: $TARGET${NC}"
        echo "Usage: $0 [claude|codex|opencode|cursor|all]"
        exit 1
        ;;
esac

show_post_install
