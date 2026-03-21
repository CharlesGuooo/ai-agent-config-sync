#!/bin/bash
# AI Agent Config Sync - installer
# Usage: ./install.sh [claude|codex|opencode|cursor|all|projects]
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

# 项目目录
PROJECTS=(
    "scientific-project"
    "database-project"
    "data-analysis-project"
    "dev-project"
    "marketing-project"
    "research-project"
    "office-project"
    "productivity-project"
)

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

    if [ ${#missing[@]} -gt 0 ]; then
        echo ""
        echo -e "${RED}Missing required dependencies:${NC}"
        for dep in "${missing[@]}"; do
            echo -e "  ${RED}[missing]${NC} $dep"
        done
        exit 1
    fi

    echo ""
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

install_core_skills() {
    local target_dir="$1"
    local tool_name="$2"

    echo -e "${YELLOW}Installing Core Skills for $tool_name...${NC}"

    mkdir -p "$target_dir/skills"

    if [ -d "$SCRIPT_DIR/core-skills" ]; then
        rm -rf "$target_dir/skills"/*
        cp -r "$SCRIPT_DIR/core-skills"/. "$target_dir/skills/"
        local count=$(ls "$target_dir/skills" | wc -l | tr -d ' ')
        echo -e "  ${GREEN}[synced]${NC} Core Skills ($count items)"
    fi
}

install_project_skills() {
    echo -e "${YELLOW}Installing Project-level Skills...${NC}"

    for project in "${PROJECTS[@]}"; do
        local project_dir="$HOME/$project/.claude"
        local source_dir="$SCRIPT_DIR/project-skills/$project"

        if [ -d "$source_dir" ]; then
            mkdir -p "$project_dir"
            rm -rf "$project_dir/skills" 2>/dev/null || true
            cp -r "$source_dir" "$project_dir/skills"
            local count=$(ls "$project_dir/skills" 2>/dev/null | wc -l | tr -d ' ')
            echo -e "  ${GREEN}[synced]${NC} ~/$project/.claude/skills/ ($count skills)"
        fi
    done
}

install_claude() {
    echo -e "${YELLOW}Installing Claude Code config...${NC}"

    mkdir -p "$CLAUDE_DIR" "$CLAUDE_DIR/index" "$CLAUDE_DIR/mcp-servers"

    cp "$SCRIPT_DIR/claude-code/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"
    copy_if_missing "$SCRIPT_DIR/claude-code/settings.json" "$CLAUDE_DIR/settings.json" "~/.claude/settings.json"

    # 安装 Core Skills
    install_core_skills "$CLAUDE_DIR" "Claude Code"

    # 安装索引
    if [ -d "$SCRIPT_DIR/shared/index" ]; then
        rm -rf "$CLAUDE_DIR/index"/*
        cp -r "$SCRIPT_DIR/shared/index"/. "$CLAUDE_DIR/index/"
        echo -e "  ${GREEN}[synced]${NC} ~/.claude/index/"
    fi

    if [ ! -f "$CLAUDE_DIR/.env" ]; then
        cp "$SCRIPT_DIR/.env.example" "$CLAUDE_DIR/.env"
        echo -e "  ${BLUE}[created]${NC} ~/.claude/.env - please fill in your API keys"
    fi

    echo -e "${GREEN}[ok]${NC} Claude Code config installed"
}

install_codex() {
    echo -e "${YELLOW}Installing Codex config...${NC}"

    mkdir -p "$CODEX_DIR" "$CODEX_DIR/index"

    cp "$SCRIPT_DIR/codex/AGENTS.md" "$CODEX_DIR/AGENTS.md"
    copy_if_missing "$SCRIPT_DIR/codex/config.toml" "$CODEX_DIR/config.toml" "~/.codex/config.toml"

    # 安装 Core Skills
    install_core_skills "$CODEX_DIR" "Codex"

    # 安装索引
    if [ -d "$SCRIPT_DIR/shared/index" ]; then
        rm -rf "$CODEX_DIR/index"/*
        cp -r "$SCRIPT_DIR/shared/index"/. "$CODEX_DIR/index/"
        echo -e "  ${GREEN}[synced]${NC} ~/.codex/index/"
    fi

    echo -e "${GREEN}[ok]${NC} Codex config installed"
}

install_opencode() {
    echo -e "${YELLOW}Installing OpenCode config...${NC}"

    mkdir -p "$OPENCODE_DIR"

    cp "$SCRIPT_DIR/opencode/AGENTS.md" "$OPENCODE_DIR/AGENTS.md"
    copy_if_missing "$SCRIPT_DIR/opencode/opencode.json" "$OPENCODE_DIR/opencode.json" "~/.config/opencode/opencode.json"

    # 复制 config.json (skills 目录配置)
    if [ -f "$SCRIPT_DIR/opencode/config.json" ]; then
        cp "$SCRIPT_DIR/opencode/config.json" "$HOME/.opencode/config.json"
        echo -e "  ${GREEN}[synced]${NC} ~/.opencode/config.json"
    fi

    # 安装 Core Skills 到 ~/.opencode/skills/
    mkdir -p "$HOME/.opencode/skills"
    install_core_skills "$HOME/.opencode" "OpenCode"

    echo -e "${GREEN}[ok]${NC} OpenCode config installed"
}

install_cursor() {
    echo -e "${YELLOW}Installing Cursor IDE config...${NC}"

    mkdir -p "$CURSOR_DIR/rules" "$CURSOR_DIR/skills"

    cp "$SCRIPT_DIR/cursor/global-rules.md" "$CURSOR_DIR/rules/global-rules.md"
    copy_if_missing "$SCRIPT_DIR/cursor/mcp.json" "$CURSOR_DIR/mcp.json" "~/.cursor/mcp.json"

    # 安装 Core Skills
    install_core_skills "$CURSOR_DIR" "Cursor"

    echo -e "${GREEN}[ok]${NC} Cursor IDE config installed"
}

show_post_install() {
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}Installation Complete!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo -e "${YELLOW}Architecture:${NC}"
    echo "  Core Skills (16):    ~/.claude/skills/ - loaded every session"
    echo "  Project Skills:      ~/xxx-project/.claude/skills/ - loaded per project"
    echo ""
    echo -e "${YELLOW}Four tools configured:${NC}"
    echo "  - Claude Code: ~/.claude/"
    echo "  - Codex CLI:   ~/.codex/"
    echo "  - OpenCode:    ~/.opencode/"
    echo "  - Cursor IDE:  ~/.cursor/"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo "  claude                          # Load Core Skills only"
    echo "  cd ~/dev-project && claude      # Load Core + Dev Skills"
    echo "  cd ~/scientific-project && claude  # Load Core + Scientific Skills"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Configure API keys in ~/.claude/.env"
    echo "  2. Run './install.sh projects' to install project-level skills"
}

TARGET="${1:-all}"

check_dependencies

case "$TARGET" in
    claude) install_claude ;;
    codex) install_codex ;;
    opencode) install_opencode ;;
    cursor) install_cursor ;;
    projects) install_project_skills ;;
    all)
        install_claude
        install_codex
        install_opencode
        install_cursor
        ;;
    *)
        echo -e "${RED}Unknown target: $TARGET${NC}"
        echo "Usage: $0 [claude|codex|opencode|cursor|all|projects]"
        exit 1
        ;;
esac

show_post_install
