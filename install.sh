#!/bin/bash
# AI Agent Config Sync - 一键安装脚本
# 用法: ./install.sh [claude|codex|opencode|all]
# 默认: all

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 目标目录
CLAUDE_DIR="$HOME/.claude"
CODEX_DIR="$HOME/.codex"
OPENCODE_DIR="$HOME/.config/opencode"

echo -e "${GREEN}=== AI Agent Config Sync Installer ===${NC}"
echo ""

# 安装 Claude Code 配置
install_claude() {
    echo -e "${YELLOW}Installing Claude Code config...${NC}"

    # 创建目录
    mkdir -p "$CLAUDE_DIR"
    mkdir -p "$CLAUDE_DIR/skills"
    mkdir -p "$CLAUDE_DIR/index"
    mkdir -p "$CLAUDE_DIR/mcp-servers"

    # 复制核心配置
    cp "$SCRIPT_DIR/claude-code/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"
    cp "$SCRIPT_DIR/claude-code/settings.json" "$CLAUDE_DIR/settings.json"

    # 复制 skills (使用符号链接或复制)
    if [ -d "$SCRIPT_DIR/shared/skills" ]; then
        # 删除旧的 skills 目录内容（保留目录本身）
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
    mkdir -p "$OPENCODE_DIR/skills"

    # 复制核心配置
    cp "$SCRIPT_DIR/opencode/AGENTS.md" "$OPENCODE_DIR/AGENTS.md"
    cp "$SCRIPT_DIR/opencode/opencode.json" "$OPENCODE_DIR/opencode.json"

    # OpenCode 使用符号链接指向 Claude 的 skills（共享）
    # 但也创建独立目录以支持自定义 skills
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

# 主安装逻辑
TARGET="${1:-all}"

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

echo ""
echo -e "${GREEN}=== Installation Complete ===${NC}"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to ~/.claude/.env and fill in your API keys"
echo "2. Restart your AI agent (Claude Code / Codex / OpenCode)"
echo ""
echo "Skills installed: $(find "$CLAUDE_DIR/skills" -maxdepth 1 -type d | wc -l) directories"
