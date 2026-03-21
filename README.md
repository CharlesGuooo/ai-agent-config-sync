# AI Agent Config Sync

跨设备同步 Claude Code、Codex、OpenCode、Cursor 的配置文件。

## 目录结构

```
.
├── core-skills/                # Core Skills (16个) - 全局每次启动加载
│   ├── brainstorming/
│   ├── systematic-debugging/
│   ├── pua/
│   ├── skill-router/
│   ├── using-superpowers/
│   └── ...
├── project-skills/             # 项目级 Skills - 按项目类型加载
│   ├── scientific-project/     # 46 个 (scanpy, rdkit, pytorch...)
│   ├── database-project/       # 23 个 (pubmed, openalex...)
│   ├── data-analysis-project/  # 24 个 (matplotlib, seaborn...)
│   ├── dev-project/            # 50 个 (frontend, backend...)
│   ├── marketing-project/      # 32 个 (copywriting, seo...)
│   ├── research-project/       # 24 个 (literature-review...)
│   ├── office-project/         # 7 个 (pdf, docx, xlsx...)
│   └── productivity-project/   # 24 个 (obsidian, jira...)
├── shared/
│   └── index/                  # 分类索引文件
├── claude-code/                # Claude Code 专属配置
│   ├── CLAUDE.md               # 全局指令
│   └── settings.json           # 权限+MCP配置 (17个)
├── codex/                      # Codex 专属配置
│   ├── AGENTS.md               # 全局指令
│   └── config.toml             # 权限+MCP配置 (17个)
├── opencode/                   # OpenCode 专属配置
│   ├── AGENTS.md               # 全局指令
│   ├── opencode.json           # 权限+MCP配置 (17个)
│   └── config.json             # Skills 目录配置
├── cursor/                     # Cursor IDE 专属配置
│   ├── mcp.json                # MCP配置 (17个)
│   └── global-rules.md         # 全局规则
├── install.sh                  # Linux/macOS 安装脚本
├── install.ps1                 # Windows 安装脚本
├── sync.sh                     # Linux/macOS 同步脚本
├── sync.ps1                    # Windows 同步脚本
└── .env.example                # API Keys 模板
```

## 架构说明

### 两层 Skills 架构

| 层级 | 位置 | 数量 | 加载时机 |
|------|------|------|---------|
| **Core Skills** | `~/.claude/skills/` | 16 个 | 全局，每次启动都加载 |
| **项目级 Skills** | `~/xxx-project/.claude/skills/` | 各不同 | 切换到对应目录时加载 |

### Core Skills (16个)

| 触发场景 | Skill | 用途 |
|----------|-------|------|
| 创意任务开始 | `/brainstorming` | 创意发想 |
| 编写代码 | `/test-driven-development` | TDD 开发 |
| 遇到 bug | `/systematic-debugging` | 系统调试 |
| 完成任务前 | `/verification-before-completion` | 结果验证 |
| 编写计划 | `/writing-plans` | 实现计划 |
| 执行计划 | `/executing-plans` | 执行已写计划 |
| 失败 2+ 次 | `/pua` | 穷尽方案 |
| 需要动力 | `/high-agency` | 高主动性 |
| 查询可用技能 | `/skill-router` | 路由到正确项目目录 |
| 开始对话 | `/using-superpowers` | 发现和使用 skills |
| 创建/修改技能 | `/skill-creator` | Skill 开发工具 |

### 项目级 Skills (8个启动目录)

| 领域 | 目录 | Skills 数量 | 包含 |
|------|------|-------------|------|
| 科学计算 | `~/scientific-project/` | 46 个 | scanpy, rdkit, pytorch, biopython... |
| 数据库查询 | `~/database-project/` | 23 个 | pubmed, openalex, chembl, uniprot... |
| 数据分析 | `~/data-analysis-project/` | 24 个 | matplotlib, seaborn, pandas, plotly... |
| 开发 | `~/dev-project/` | 50 个 | frontend, backend, docker, ci-cd... |
| 营销 | `~/marketing-project/` | 32 个 | copywriting, seo, marketing-reports... |
| 研究 | `~/research-project/` | 24 个 | literature-review, peer-review, grants... |
| Office | `~/office-project/` | 7 个 | pdf, docx, xlsx, pptx... |
| 生产力 | `~/productivity-project/` | 24 个 | obsidian, jira, notion... |

---

## 快速开始

### 1. Clone 仓库

```bash
git clone https://github.com/CharlesGuooo/ai-agent-config-sync.git
cd ai-agent-config-sync
```

### 2. 运行安装脚本

**Linux/macOS:**
```bash
chmod +x install.sh
./install.sh all        # 安装全部
./install.sh claude     # 只安装 Claude Code
```

**Windows (PowerShell):**
```powershell
.\install.ps1 all
.\install.ps1 claude
```

### 3. 配置 API Keys

```bash
# 复制模板
cp .env.example ~/.claude/.env

# 编辑填入你的 API keys
nano ~/.claude/.env
```

### 4. 创建项目目录

```bash
# 创建项目目录并复制对应的 skills
mkdir -p ~/scientific-project/.claude
mkdir -p ~/dev-project/.claude
# ... 其他项目

# 复制项目级 skills
cp -r project-skills/scientific-project/* ~/scientific-project/.claude/skills/
cp -r project-skills/dev-project/* ~/dev-project/.claude/skills/
# ... 其他项目
```

### 5. 使用方式

```bash
# 启动 Claude Code (加载 Core Skills)
claude

# 切换到科学计算项目 (加载 Core + 科学计算 Skills)
cd ~/scientific-project/ && claude

# 切换到开发项目 (加载 Core + 开发 Skills)
cd ~/dev-project/ && claude
```

---

## 四工具统一配置

Claude Code、Codex、OpenCode、Cursor 使用**相同的配置**：

```bash
# 四条命令等价，加载相同的 Core Skills + MCP
cd ~/dev-project/ && claude
cd ~/dev-project/ && codex
cd ~/dev-project/ && opencode
# Cursor: 打开 ~/dev-project/ 目录
```

---

## MCP 配置 (17个)

### 核心 MCP (4个)
| MCP | 功能 |
|-----|------|
| memory | 跨会话记忆存储 |
| filesystem | 文件系统操作 |
| github | GitHub API (PR, Issues, 搜索) |
| brave-search | 网页搜索 |

### 可选 MCP (13个)
| MCP | 功能 |
|-----|------|
| chroma | 向量数据库/RAG |
| context7 | 技术文档搜索 |
| sequential-thinking | 结构化思维链 |
| vercel | Vercel 部署管理 |
| railway | Railway 部署 |
| cloudflare-docs | Cloudflare 文档 |
| cloudflare-workers-builds | Cloudflare Workers 构建 |
| cloudflare-workers-bindings | Cloudflare Workers 绑定 |
| cloudflare-observability | Cloudflare 可观测性 |
| playwright | 浏览器自动化测试 |
| supabase | Supabase 数据库 |
| magic | UI 设计生成 |
| expo-mcp | Expo/React Native |

---

## API Keys 管理

**API keys 不会上传到此仓库。** 请在各设备上单独配置：

| Key | 用途 | 必需 |
|-----|------|------|
| `ANTHROPIC_AUTH_TOKEN` | Claude API | ✅ |
| `GITHUB_TOKEN` | GitHub MCP | ✅ |
| `BRAVE_API_KEY` | Brave Search MCP | ✅ |
| `SUPABASE_ACCESS_TOKEN` | Supabase MCP | 可选 |
| `EXPO_MCP_TOKEN` | Expo MCP | 可选 |

---

## 权限设置

所有四个工具都配置了 **bypass permissions** 模式：

- **Claude Code**: `defaultMode: "bypassPermissions"`
- **Codex**: `approval_policy = "never"`, `dangerously_bypass_approvals = true`
- **OpenCode**: `permission: { "*": "allow" }`
- **Cursor**: 继承 Claude Code 的 settings

---

## 配置文件位置

### Claude Code
| 文件 | 位置 |
|------|------|
| Core Skills | `~/.claude/skills/` |
| 全局指令 | `~/.claude/CLAUDE.md` |
| MCP 配置 | `~/.claude/settings.json` |

### 项目级 Skills
| 项目 | 位置 |
|------|------|
| 科学计算 | `~/scientific-project/.claude/skills/` |
| 数据库 | `~/database-project/.claude/skills/` |
| 数据分析 | `~/data-analysis-project/.claude/skills/` |
| 开发 | `~/dev-project/.claude/skills/` |
| 营销 | `~/marketing-project/.claude/skills/` |
| 研究 | `~/research-project/.claude/skills/` |
| Office | `~/office-project/.claude/skills/` |
| 生产力 | `~/productivity-project/.claude/skills/` |

---

## 注意事项

1. `settings.json` 里的 API keys 使用环境变量占位符，实际值在 `~/.claude/.env` 中配置
2. Core Skills 是全局的，每次启动都会加载
3. 项目级 Skills 只有在对应目录下启动时才会加载
4. 每个 skill 目录包含 `SKILL.md` 定义文件
