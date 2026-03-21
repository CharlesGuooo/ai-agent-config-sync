# AI Agent Config Sync

一个 repo 搞定四个 AI 编码助手的 Skills、MCP 和路由配置。克隆到新电脑，填 `.env`，跑一行命令，四个工具立刻可用。

支持的工具：

- **Claude Code** — Anthropic CLI
- **Codex** — OpenAI CLI
- **OpenCode** — 开源 CLI
- **Cursor** — VSCode-based AI IDE

## 架构

```
┌───────────────────────────────────────────────────────┐
│                  全局层 (始终加载)                      │
│  18 个流程 Skills + 17 个 MCP + 10 个 Skill Index     │
└───────────────────┬───────────────────────────────────┘
                    │ skill-router 路由
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐  ...共 8 个项目
│dev (50)  │ │sci (46)  │ │data (24) │
│.claude/  │ │.claude/  │ │.claude/  │
│.codex/   │ │.codex/   │ │.codex/   │
│.opencode/│ │.opencode/│ │.opencode/│
│.cursor/  │ │.cursor/  │ │.cursor/  │
└──────────┘ └──────────┘ └──────────┘
```

### 省 Token 路由

每个项目目录只包含自己领域的 Skills。Agent 在 `~/dev-project/` 启动时只加载 50 个开发 Skills，而非全部 230 个。经实测，20 轮对话节省约 355K tokens（68%）。

### 两层 Skill 模型

| 层 | 位置 | 内容 |
|----|------|------|
| 全局 | `~/.{claude,codex,opencode,cursor}/skills/` | 18 个流程/路由/升级 Skills，四工具共享 |
| 项目 | `~/*-project/.{claude,codex,opencode,cursor}/skills/` | 230 个领域 Skills，按项目目录隔离 |

### 项目目录

| 领域 | 目录 | Skills |
|------|------|--------|
| 开发 | `~/dev-project/` | 50 (前端、后端、架构、DevOps、AI Agent) |
| 科学计算 | `~/scientific-project/` | 46 (单细胞、分子、ML、生信) |
| 数据分析 | `~/data-analysis-project/` | 24 (EDA、统计、可视化) |
| 数据库查询 | `~/database-project/` | 23 (PubMed、UniProt、金融) |
| 营销 | `~/marketing-project/` | 32 (SEO、文案、广告) |
| 研究 | `~/research-project/` | 24 (论文、综述、基金) |
| 生产力 | `~/productivity-project/` | 24 (Obsidian、Jira、PM) |
| Office | `~/office-project/` | 7 (PDF、Word、Excel、PPT) |

### 使用方式

```bash
# 四条命令等价，加载相同的 Skills + MCP
cd ~/dev-project/ && claude
cd ~/dev-project/ && codex
cd ~/dev-project/ && opencode
# Cursor: 打开 ~/dev-project/ 目录
```

## Repo 结构

```
ai-agent-config-sync/
├── agents/
│   ├── claude/
│   │   ├── CLAUDE.md                  # 全局指令
│   │   ├── commands/research.md       # /research 命令
│   │   └── mcp-servers.template.json  # MCP 模板 (__TOKEN__ 占位符)
│   ├── codex/
│   │   ├── AGENTS.md                  # 全局指令 (英文)
│   │   ├── AGENTS.local.md            # 全局指令 (中文) → ~/.codex/AGENTS.md
│   │   ├── config.toml                # Codex 主配置
│   │   └── profiles/                  # full/development/minimal 配置
│   ├── cursor/
│   │   ├── global-rules.md            # 全局规则 (英文)
│   │   ├── rules/global-rules.md      # 全局规则 (中文) → ~/.cursor/rules/
│   │   ├── mcp.json                   # MCP 配置
│   │   └── skills-cursor/             # Cursor 专属 Skills (5个)
│   └── opencode/
│       ├── AGENTS.md                  # 全局指令
│       ├── opencode.json              # MCP 配置
│       └── command/                   # OpenCode 专属命令
├── skills/
│   ├── global/
│   │   ├── common/                    # 18 个全局 Skills (四工具共享)
│   │   └── codex-system/              # Codex 专属系统 Skills
│   ├── index/                         # 10 个 Skill 索引文件 (四工具共享)
│   └── project-packs/
│       ├── dev-project/
│       │   ├── skills/                # 50 个领域 Skills
│       │   └── instructions.md        # 项目指令文件模板
│       ├── scientific-project/        # 同上
│       └── ...                        # 共 8 个项目
├── sync.ps1                           # Windows 同步脚本
├── sync.sh                            # Unix 同步脚本
├── install.ps1                        # Windows 安装 (sync + 持久化环境变量)
├── install.sh                         # Unix 安装
├── .env.example                       # API Key 模板
└── .env                               # 本地密钥 (不入库)
```

## Sync 做了什么

`sync.ps1` / `sync.sh` 执行以下操作：

| 操作 | 源 | 目标 |
|------|---|------|
| 全局 Skills | `skills/global/common/` | `~/.{claude,codex,opencode,cursor}/skills/` |
| Skill Index | `skills/index/` | `~/.{claude,codex,opencode,cursor}/index/` |
| 项目 Skills | `skills/project-packs/*/skills/` | `~/*-project/.{claude,codex,opencode,cursor}/skills/` |
| 项目指令 | `skills/project-packs/*/instructions.md` | `.claude/CLAUDE.md` + `AGENTS.md` + `.cursor/rules/project.md` |
| Claude 指令 | `agents/claude/CLAUDE.md` | `~/.claude/CLAUDE.md` |
| Claude 命令 | `agents/claude/commands/` | `~/.claude/commands/` |
| Claude MCP | `agents/claude/mcp-servers.template.json` | `~/.claude.json` + `~/.claude/settings.json` (合并) |
| Codex 配置 | `agents/codex/config.toml` | `~/.codex/config.toml` |
| Codex 指令 | `agents/codex/AGENTS.md` + `AGENTS.local.md` | `~/AGENTS.md` + `~/.codex/AGENTS.md` |
| Cursor MCP | `agents/cursor/mcp.json` | `~/.cursor/mcp.json` |
| Cursor 规则 | `agents/cursor/global-rules.md` + `rules/` | `~/.cursor/global-rules.md` + `~/.cursor/rules/` |
| OpenCode 配置 | `agents/opencode/opencode.json` + `AGENTS.md` | `~/.opencode/` + `~/.config/opencode/` |

## MCP 清单

17 个全局 MCP，四工具共享：

| 类型 | 名称 | 认证 |
|------|------|------|
| 核心 | `github` | GITHUB_PERSONAL_ACCESS_TOKEN |
| 核心 | `memory` | 无 |
| 核心 | `web-reader` | Z_AI_API_KEY |
| 核心 | `zai-mcp-server` | Z_AI_API_KEY |
| 可选 | `context7` | 无 |
| 可选 | `sequential-thinking` | 无 |
| 可选 | `vercel` | 无 (OAuth) |
| 可选 | `railway` | 无 |
| 可选 | `cloudflare-docs` | 无 |
| 可选 | `cloudflare-workers-builds` | 无 |
| 可选 | `cloudflare-workers-bindings` | 无 |
| 可选 | `cloudflare-observability` | 无 |
| 可选 | `playwright` | 无 |
| 可选 | `supabase` | SUPABASE_ACCESS_TOKEN |
| 可选 | `magic` | 无 |
| 可选 | `expo-mcp` | EXPO_TOKEN |
| 可选 | `brave-search` | BRAVE_API_KEY |
| 可选 | `firecrawl` | FIRECRAWL_API_KEY (有 key 才启用) |

## 新电脑安装

### Windows

```powershell
git clone https://github.com/CharlesGuooo/ai-agent-config-sync.git
cd ai-agent-config-sync
Copy-Item .env.example .env
# 编辑 .env 填入 API Keys
.\install.ps1
```

### Unix/macOS

```bash
git clone https://github.com/CharlesGuooo/ai-agent-config-sync.git
cd ai-agent-config-sync
cp .env.example .env
# 编辑 .env 填入 API Keys
./install.sh
```

依赖：`jq`（JSON 处理）、`rsync`（目录同步）。Windows 使用 `robocopy` 无需额外依赖。

## 必需的 API Keys

在 `.env` 中填写：

```
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...
Z_AI_API_KEY=...
SUPABASE_ACCESS_TOKEN=sbp_...
EXPO_TOKEN=Expo_...
BRAVE_API_KEY=BSA...
FIRECRAWL_API_KEY=           # 可选，留空则 firecrawl 不启用
```

本 repo 不存储模型提供商认证（Claude/OpenAI/Cursor 账号）。这些留在各机器本地。

## 注意事项

- `install.ps1` 会将 API Keys 持久化到 Windows User 环境变量，供 Cursor/Codex/OpenCode 的 `${env:VAR}` 引用
- Claude Code 的 MCP 配置直接内嵌 key 到 `settings.json`；其他三个工具通过环境变量引用
- 部分远程 MCP（Vercel、Cloudflare）首次使用需要完成各自的 OAuth 登录流程
- `firecrawl` 默认禁用，仅当 `.env` 中填了 `FIRECRAWL_API_KEY` 时才启用
