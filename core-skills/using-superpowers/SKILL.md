---
name: using-superpowers
description: Use when starting any conversation - establishes how to find and use skills, requiring Skill tool invocation before ANY response including clarifying questions
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## Instruction Priority

Superpowers skills override default system prompt behavior, but **user instructions always take precedence**:

1. **User's explicit instructions** (CLAUDE.md, AGENTS.md, direct requests) — highest priority
2. **Superpowers skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority

If CLAUDE.md or AGENTS.md says "don't use TDD" and a skill says "always use TDD," follow the user's instructions. The user is in control.

## How to Access Skills

**In Claude Code:** Use the `Skill` tool. When you invoke a skill, its content is loaded and presented to you—follow it directly. Never use the Read tool on skill files.

**In other environments:** Check your platform's documentation for how skills are loaded.

## Platform Adaptation

Skills use Claude Code tool names. Non-CC platforms: see `references/codex-tools.md` for tool equivalents.

# Using Skills

## The Rule

**Invoke relevant or requested skills BEFORE any response or action.** Even a 1% chance a skill might apply means that you should invoke the skill to check. If an invoked skill turns out to be wrong for the situation, you don't need to use it.

## Red Flags

These thoughts mean STOP—you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "This doesn't count as a task" | Action = task. Check for skills. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
| "I know what that means" | Knowing the concept ≠ using the skill. Invoke it. |

## Skill Priority

When multiple skills could apply, use this order:

1. **Process skills first** (brainstorming, debugging) - these determine HOW to approach the task
2. **Implementation skills second** (frontend-design, mcp-builder) - these guide execution

## Skill Types

**Rigid** (TDD, debugging): Follow exactly. Don't adapt away discipline.

**Flexible** (patterns): Adapt principles to context.

The skill itself tells you which.

## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.

---

# Skills & MCP 架构

## 四工具统一配置

Claude Code、Codex、OpenCode、Cursor 使用**相同的配置**：

| 工具 | Skills | MCP |
|------|--------|-----|
| Claude Code | 全局 18 + 项目级 symlink | 全局 17 个 |
| Codex CLI | symlink → `.claude/skills/` | 全局 17 个 |
| OpenCode | symlink → `.claude/skills/` | 全局 17 个 |
| Cursor IDE | symlink → `.claude/skills/` | 全局 17 个 |

### 使用方式

```bash
# 四条命令等价，加载相同的 Skills + MCP
cd ~/dev-project/ && claude
cd ~/dev-project/ && codex
cd ~/dev-project/ && opencode
# Cursor: 打开 ~/dev-project/ 目录
```

---

## 项目级 Skills (8个启动目录)

| 领域 | 目录 | Skills 数量 |
|------|------|-------------|
| 科学计算 | `~/scientific-project/` | 46 |
| 数据库查询 | `~/database-project/` | 23 |
| 数据分析 | `~/data-analysis-project/` | 24 |
| 开发 | `~/dev-project/` | 50 |
| 营销 | `~/marketing-project/` | 32 |
| 研究 | `~/research-project/` | 24 |
| Office | `~/office-project/` | 7 |
| 生产力 | `~/productivity-project/` | 24 |

### 领域关键词

| 关键词 | 项目目录 |
|--------|----------|
| 单细胞, RNA-seq, 基因, 蛋白质, 分子, ML, 深度学习 | `~/scientific-project/` |
| 文献, PubMed, OpenAlex, 化合物, 蛋白质查询 | `~/database-project/` |
| DataFrame, 统计, 可视化, 图表, EDA | `~/data-analysis-project/` |
| 前端, 后端, Docker, CI/CD, API, React, LangChain | `~/dev-project/` |
| 文案, SEO, 广告, 社交媒体 | `~/marketing-project/` |
| 论文, 综述, 基金, 同行评审 | `~/research-project/` |
| PDF, Word, Excel, PPT | `~/office-project/` |
| Obsidian, Jira, Google Workspace | `~/productivity-project/` |

---

## 全局 MCP (17个)

所有工具共享相同的全局 MCP 配置，启动不耗 token，按需调用。

### 核心 MCP (4个)
| MCP | 功能 |
|-----|------|
| memory | 跨会话记忆存储 |
| github | GitHub API (PR, Issues, 搜索) |
| web-reader | 读取网页内容转 Markdown |
| zai-mcp-server | 图像分析、视频分析、OCR、UI 转 code |

### 可选 MCP (13个)
| MCP | 功能 |
|-----|------|
| context7 | 搜索技术文档 |
| firecrawl | 网页爬取 |
| sequential-thinking | 结构化思维链 |
| vercel | Vercel 部署管理 |
| railway | Railway 部署 |
| cloudflare-* | Cloudflare Workers/Docs (4个) |
| playwright | 浏览器自动化测试 |
| supabase | Supabase 数据库 |
| magic | UI 设计生成 |
| expo-mcp | Expo/React Native |

---

## Cursor IDE 配置

Cursor 已配置为与其他工具统一：

- **MCP**: `~/.cursor/mcp.json` (17个)
- **Skills**: 项目级 `.cursor/skills/` → symlink → `.claude/skills/`
- **兼容**: 自动加载 `.claude/skills/` 和 `~/.claude/skills/`
- **Rules**: `~/.cursor/rules/global-rules.md`
