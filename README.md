# AI Agent Config Sync

跨设备同步 Claude Code、Codex、OpenCode、Cursor 的配置文件。

## 目录结构

```
.
├── shared/                    # 四个工具共享的配置
│   ├── skills/                # 244 共享 skills
│   └── index/                 # 分类索引文件
├── claude-code/               # Claude Code 专属配置
│   ├── CLAUDE.md              # 全局指令
│   └── settings.json          # 权限+MCP配置 (17个)
├── codex/                     # Codex 专属配置
│   ├── AGENTS.md              # 全局指令
│   └── config.toml            # 权限+MCP配置 (17个)
├── opencode/                  # OpenCode 专属配置
│   ├── AGENTS.md              # 全局指令
│   └── opencode.json          # 权限+MCP配置 (17个)
├── cursor/                    # Cursor IDE 专属配置
│   ├── mcp.json               # MCP配置 (17个)
│   └── global-rules.md        # 全局规则
├── openclaw/                  # OpenClaw Skills 集合
│   ├── 00-reference/          # 参考资料
│   ├── 01-meta/               # 元技能
│   ├── 02-search/             # 搜索相关
│   ├── ...                    # 更多分类
│   └── video-skills-pack/     # 视频制作技能包
├── install.sh                 # Linux/macOS 安装脚本
├── install.ps1                # Windows 安装脚本
└── .env.example               # API Keys 模板
```

## 快速开始

### 1. Clone 仓库

```bash
git clone https://github.com/CharlesGuooo/ai-agent-config-sync.git
cd ai-agent-config-sync
```

### 2. 先选路径

这个 repo 现在有两种使用方式，请先判断你属于哪一种：

#### 路径 A: 新电脑首次安装

适用场景：

- 刚装好 Claude Code / Codex / OpenCode / Cursor
- 本机还没有稳定可用的 provider/API 配置
- 你接受先用 repo 模板初始化，再按本机情况调整

建议做法：

1. 运行安装脚本，或按 [AI-SETUP.md](./AI-SETUP.md) 手动复制配置
2. 首次创建 `settings.json` / `config.toml` / `opencode.json` / `mcp.json`
3. 再根据本机 provider/API 需求修改这些配置文件

#### 路径 B: 已有本机配置，做环境同步

适用场景：

- 这台机器上的 CLI 已经能正常使用
- 你已经配置了特殊 provider / base URL / API key 接入
- 你只想同步 shared skills、index、全局指令

建议做法：

1. 运行同步脚本，或按 [AI-SETUP.md](./AI-SETUP.md) 只复制共享内容
2. 保留本机已有的配置文件（见下方列表）

### 3. 配置 API Keys

```bash
# 复制模板
cp .env.example ~/.claude/.env

# 编辑填入你的 API keys
nano ~/.claude/.env
```

### 4. 运行安装脚本

安装脚本现在只负责同步共享工作环境，不会覆盖本机已经可用的 provider/API 配置：

- 会同步: `CLAUDE.md` / `AGENTS.md` / `global-rules.md`、`shared/skills`、`shared/index`
- 会保留: `~/.claude/settings.json`、`~/.codex/config.toml`、`~/.config/opencode/opencode.json`、`~/.cursor/mcp.json`

如果你是通过 AI CLI 手动配置，这些脚本是可选的，不是必需的。

**Linux/macOS:**
```bash
chmod +x install.sh
./install.sh all        # 安装全部
./install.sh claude     # 只安装 Claude Code
./install.sh codex      # 只安装 Codex
./install.sh opencode   # 只安装 OpenCode
./install.sh cursor     # 只安装 Cursor
```

**Windows (PowerShell):**
```powershell
.\install.ps1 all        # 安装全部
.\install.ps1 claude     # 只安装 Claude Code
.\install.ps1 codex      # 只安装 Codex
.\install.ps1 opencode   # 只安装 OpenCode
.\install.ps1 cursor     # 只安装 Cursor
```

### 5. 重启 AI Agent

安装完成后，重启你的 AI agent 即可生效。

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

## MCP 配置 (17个)

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
| cloudflare-docs | Cloudflare 文档 |
| cloudflare-workers-builds | Cloudflare Workers 构建 |
| cloudflare-workers-bindings | Cloudflare Workers 绑定 |
| cloudflare-observability | Cloudflare 可观测性 |
| playwright | 浏览器自动化测试 |
| supabase | Supabase 数据库 |
| magic | UI 设计生成 |
| expo-mcp | Expo/React Native |

---

## 三层渐进式 Skills 架构

```
Layer 1: CLAUDE.md/AGENTS.md 核心表 (~100 tokens) → 常用 skills 快速发现
Layer 2: index/*.md 分类索引 → 领域 skills 按需查阅
Layer 3: skills/*/SKILL.md → 完整 skill 按需加载
```

**Token 节省**: 正确使用三层架构可节省 98% tokens（相比一次性加载所有 skills）

### 核心工作流 Skills

| 触发场景 | Skill | 用途 |
|----------|-------|------|
| 开始实现任务 | `/brainstorming` | 创意发想 |
| 编写代码 | `/test-driven-development` | 测试驱动开发 |
| 遇到 bug | `/systematic-debugging` | 系统调试 |
| 完成任务前 | `/verification-before-completion` | 结果验证 |
| 编写计划 | `/writing-plans` | 实现计划 |
| 执行计划 | `/executing-plans` | 执行已写计划 |

### 触发关键词

索引文件中的「触发关键词」列专为语义匹配优化。在需求中提及关键词即可激活对应 skill：

```
"用 pubmed 搜索 Alzheimer 文献"  → pubmed-database
"分析这个分子的 drug-likeness"   → rdkit / medchem
"生成 market research 报告"      → market-research-reports
"用 seaborn 画个 heatmap"        → seaborn
```

---

## 配置文件说明

### Claude Code

| 文件 | 用途 |
|------|------|
| `CLAUDE.md` | 全局指令，三层架构第一层 |
| `settings.json` | 权限设置 + MCP 服务器配置 (17个) |
| `skills/` | Skills 库 |
| `index/` | 分类索引 |

### Codex

| 文件 | 用途 |
|------|------|
| `AGENTS.md` | 全局指令 |
| `config.toml` | 模型 + 权限 + MCP配置 (17个) |
| `skills/` | Skills 库（与 Claude 共享） |
| `index/` | 分类索引（与 Claude 共享） |

### OpenCode

| 文件 | 用途 |
|------|------|
| `AGENTS.md` | 全局指令 |
| `opencode.json` | 模型 + MCP + 权限配置 (17个) |
| `skills/` | Skills 库（与 Claude 共享） |

### Cursor

| 文件 | 用途 |
|------|------|
| `global-rules.md` | 全局规则 |
| `mcp.json` | MCP 配置 (17个) |
| `skills/` | 项目级 symlink |

---

## 权限设置

所有四个工具都配置了 **bypass permissions** 模式：

- **Claude Code**: `defaultMode: "bypassPermissions"`
- **Codex**: `approval_policy = "never"`, `dangerously_bypass_approvals = true`
- **OpenCode**: `permission: { "*": "allow" }`
- **Cursor**: 继承 Claude Code 的 settings

---

## API Keys 管理

**API keys 不会上传到此仓库。** 请在各设备上单独配置：

1. 复制 `.env.example` 到 `~/.claude/.env`
2. 填入实际的 API keys
3. 安装脚本只会自动复制共享配置，不会覆盖本机 provider/API 接入配置

### 必需的 Keys

| Key | 用途 |
|-----|------|
| `ANTHROPIC_AUTH_TOKEN` | Claude API |
| `GITHUB_TOKEN` | GitHub MCP |

### 可选的 Keys

| Key | 用途 |
|-----|------|
| `OPENAI_API_KEY` | OpenAI API (Codex) |
| `FIRECRAWL_API_KEY` | 网页抓取 |
| `SUPABASE_PROJECT_REF` | Supabase MCP |

---

## 注意事项

1. `settings.local.json` 和敏感信息不会同步
2. `settings.json` / `config.toml` / `opencode.json` / `mcp.json` 里的 provider、base URL、特殊 API 接入应视为机器本地配置，默认不覆盖
3. 每个 skill 目录包含 `SKILL.md` 定义文件
4. 使用三层架构按需加载 skills，避免 token 浪费

---

## OpenClaw Skills

`openclaw/` 目录包含来自 ai-skills-collection 的所有技能：

- **01-meta**: 代理自我改进、代理守护、自动更新等元技能
- **02-search**: 网页搜索、学术搜索、代码搜索
- **03-coding**: 代码生成、重构、调试、测试
- **04-devops**: CI/CD、Docker、Kubernetes、云服务
- **05-research**: 文献综述、数据分析、实验设计
- **06-writing**: 文档写作、博客、技术文档
- **07-productivity**: 任务管理、自动化、工作流优化
- **08-documents**: PDF、Word、Excel 处理
- **09-media**: 图像、音频、视频处理
- **10-mcp**: MCP 服务器集成
- **11-data**: 数据处理、数据库、ETL
- **12-misc**: 其他杂项技能
- **director-studio**: 三阶段交互式视频制作工作流
- **video-skills-pack**: FFmpeg、Remotion、Kling、HeyGen 等视频工具
