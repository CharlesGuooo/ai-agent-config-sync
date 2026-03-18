#!/bin/bash
# AI Agent Config Sync - 一键安装脚本
# 用法: ./install.sh [claude|codex|opencode|all]
# 默认: all

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 目标目录
CLAUDE_DIR="$HOME/.claude"
CODEX_DIR="$HOME/.codex"
OPENCODE_DIR="$HOME/.config/opencode"

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       AI Agent Config Sync - Installer v2.0           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查前置依赖
check_dependencies() {
    echo -e "${YELLOW}Checking dependencies...${NC}"

    local missing=()

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        missing+=("Node.js (required for MCP servers)")
    else
        echo -e "  ${GREEN}✓${NC} Node.js $(node --version)"
    fi

    # 检查 npm
    if ! command -v npm &> /dev/null; then
        missing+=("npm (required for MCP servers)")
    else
        echo -e "  ${GREEN}✓${NC} npm $(npm --version)"
    fi

    # 检查 npx
    if ! command -v npx &> /dev/null; then
        missing+=("npx (required for MCP servers)")
    else
        echo -e "  ${GREEN}✓${NC} npx available"
    fi

    # 检查 Python (可选)
    if command -v python3 &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} Python3 $(python3 --version 2>&1 | cut -d' ' -f2)"
    elif command -v python &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} Python $(python --version 2>&1 | cut -d' ' -f2)"
    else
        echo -e "  ${BLUE}ℹ${NC} Python not found (optional, some skills may not work)"
    fi

    if [ ${#missing[@]} -ne 0 ]; then
        echo ""
        echo -e "${RED}Missing required dependencies:${NC}"
        for dep in "${missing[@]}"; do
            echo -e "  ${RED}✗${NC} $dep"
        done
        echo ""
        echo "Please install them first:"
        echo "  - Node.js: https://nodejs.org/"
        echo ""
        exit 1
    fi

    echo ""
}

# 替换环境变量占位符
replace_env_placeholders() {
    local file="$1"

    # 获取实际路径
    local home_path="$HOME"
    local projects_path="${PROJECTS_DIR:-$HOME/projects}"

    # 创建 projects 目录如果不存在
    mkdir -p "$projects_path" 2>/dev/null || true

    # 替换占位符 (macOS 和 Linux 兼容)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|\${HOME}|$home_path|g" "$file"
        sed -i '' "s|\${PROJECTS_DIR:-~/projects}|$projects_path|g" "$file"
    else
        sed -i "s|\${HOME}|$home_path|g" "$file"
        sed -i "s|\${PROJECTS_DIR:-~/projects}|$projects_path|g" "$file"
    fi
}

# 安装 Claude Code 配置
install_claude() {
    echo -e "${YELLOW}Installing Claude Code config...${NC}"

    # 创建目录
    mkdir -p "$CLAUDE_DIR"
    mkdir -p "$CLAUDE_DIR/skills"
    mkdir -p "$CLAUDE_DIR/index"
    mkdir -p "$CLAUDE_DIR/mcp-servers"
    mkdir -p "$HOME/projects"

    # 复制核心配置
    cp "$SCRIPT_DIR/claude-code/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"
    cp "$SCRIPT_DIR/claude-code/settings.json" "$CLAUDE_DIR/settings.json"

    # 替换环境变量占位符
    replace_env_placeholders "$CLAUDE_DIR/settings.json"

    # 复制 skills
    if [ -d "$SCRIPT_DIR/shared/skills" ]; then
        rm -rf "$CLAUDE_DIR/skills"/*
        cp -r "$SCRIPT_DIR/shared/skills"/* "$CLAUDE_DIR/skills/"
    fi

    # 复制 index
    if [ -d "$SCRIPT_DIR/shared/index" ]; then
        rm -rf "$CLAUDE_DIR/index"/*
        cp -r "$SCRIPT_DIR/shared/index"/* "$CLAUDE_DIR/index/"
    fi

    # 复制 MCP servers
    if [ -d "$SCRIPT_DIR/claude-code/mcp-servers" ]; then
        cp -r "$SCRIPT_DIR/claude-code/mcp-servers"/* "$CLAUDE_DIR/mcp-servers/" 2>/dev/null || true
    fi

    # 创建 .env 文件如果不存在
    if [ ! -f "$CLAUDE_DIR/.env" ]; then
        cp "$SCRIPT_DIR/.env.example" "$CLAUDE_DIR/.env"
        echo -e "  ${BLUE}ℹ${NC} Created ~/.claude/.env - please fill in your API keys"
    fi

    echo -e "${GREEN}✓ Claude Code config installed${NC}"
}

# 安装 Codex 配置
install_codex() {
    echo -e "${YELLOW}Installing Codex config...${NC}"

    # 创建目录
    mkdir -p "$CODEX_DIR"
    mkdir -p "$CODEX_DIR/skills"
    mkdir -p "$CODEX_DIR/index"

    # 复制核心配置
    cp "$SCRIPT_DIR/codex/AGENTS.md" "$CODEX_DIR/AGENTS.md"
    cp "$SCRIPT_DIR/codex/config.toml" "$CODEX_DIR/config.toml"

    # 复制 skills
    if [ -d "$SCRIPT_DIR/shared/skills" ]; then
        rm -rf "$CODEX_DIR/skills"/*
        cp -r "$SCRIPT_DIR/shared/skills"/* "$CODEX_DIR/skills/"
    fi

    # 复制 index
    if [ -d "$SCRIPT_DIR/shared/index" ]; then
        rm -rf "$CODEX_DIR/index"/*
        cp -r "$SCRIPT_DIR/shared/index"/* "$CODEX_DIR/index/"
    fi

    echo -e "${GREEN}✓ Codex config installed${NC}"
}

# 安装 OpenCode 配置
install_opencode() {
    echo -e "${YELLOW}Installing OpenCode config...${NC}"

    # 创建目录
    mkdir -p "$OPENCODE_DIR"

    # 复制核心配置
    cp "$SCRIPT_DIR/opencode/AGENTS.md" "$OPENCODE_DIR/AGENTS.md"
    cp "$SCRIPT_DIR/opencode/opencode.json" "$OPENCODE_DIR/opencode.json"

    # 替换环境变量占位符
    replace_env_placeholders "$OPENCODE_DIR/opencode.json"

    # OpenCode 使用符号链接指向 Claude 的 skills（共享）
    if [ -d "$OPENCODE_DIR/skills" ]; then
        rm -rf "$OPENCODE_DIR/skills"
    fi

    # 创建符号链接到 Claude skills（共享）
    ln -s "$CLAUDE_DIR/skills" "$OPENCODE_DIR/skills" 2>/dev/null || {
        # 如果符号链接失败，则复制
        mkdir -p "$OPENCODE_DIR/skills"
        cp -r "$SCRIPT_DIR/shared/skills"/* "$OPENCODE_DIR/skills/"
    }

    echo -e "${GREEN}✓ OpenCode config installed${NC}"
}

# 显示安装后说明
show_post_install() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              Installation Complete!                    ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # 统计 skills
    local skill_count=$(find "$CLAUDE_DIR/skills" -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
    echo -e "Skills installed: ${GREEN}$skill_count${NC} directories"
    echo ""

    echo -e "${YELLOW}Next Steps:${NC}"
    echo ""
    echo -e "  ${BLUE}1.${NC} Configure API Keys:"
    echo -e "     ${GREEN}nano ~/.claude/.env${NC}"
    echo ""
    echo -e "     Required keys:"
    echo -e "       - ANTHROPIC_AUTH_TOKEN (Claude Code)"
    echo -e "       - GITHUB_TOKEN (GitHub MCP)"
    echo ""
    echo -e "     Optional keys:"
    echo -e "       - OPENAI_API_KEY (Codex)"
    echo -e "       - FIRECRAWL_API_KEY (Web scraping)"
    echo ""
    echo -e "  ${BLUE}2.${NC} Restart your AI agents:"
    echo -e "     - Claude Code: ${GREEN}claude${NC}"
    echo -e "     - Codex: ${GREEN}codex${NC}"
    echo -e "     - OpenCode: ${GREEN}opencode${NC}"
    echo ""
    echo -e "  ${BLUE}3.${NC} Verify bypass permissions:"
    echo -e "     - Claude Code: Check ${GREEN}~/.claude/settings.json${NC}"
    echo -e "       Should have: ${BLUE}\"defaultMode\": \"bypassPermissions\"${NC}"
    echo ""
    echo -e "${BLUE}Documentation:${NC} https://github.com/CharlesGuooo/ai-agent-config-sync"
    echo ""
}

# 主安装逻辑
TARGET="${1:-all}"

# 先检查依赖
check_dependencies

case "$TARGET" in
    claude)
        install_claude
        ;;
    codex)
        install_codex
        ;;
    opencode)
        install_opencode
        ;;
    all)
        install_claude
        install_codex
        install_opencode
        ;;
    *)
        echo -e "${RED}Unknown target: $TARGET${NC}"
        echo "Usage: $0 [claude|codex|opencode|all]"
        exit 1
        ;;
esac

show_post_install
