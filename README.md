# Agents Overview — Skills 使用手册

本机所有 AI agent 的 skill / MCP / 配置查询手册。**一看就知道用什么、去哪个目录、敲哪条命令。**

---

## 🤖 5 个 Agent

| Agent | 入口 | 配置文件 |
| --- | --- | --- |
| **Claude Code** | `claude` | `~/.claude/CLAUDE.md` |
| **Codex CLI** | `codex` | `~/.codex/AGENTS.md` + `config.toml` |
| **Cursor** | 打开目录 | `~/.cursor/rules/global-rules.md` |
| **OpenCode** | `opencode` | `~/.opencode/AGENTS.md` |
| **LM Studio** | 应用 | `~/.lmstudio/mcp.json`（仅 MCP） |

前 4 家**共享同一套 skill 和 MCP** —— `claude` / `codex` / `opencode` 任意切换 = 同样的工具。

---

## 📜 System-Level 配置（CLAUDE.md / AGENTS.md）

**所有 agent 的 7 条核心原则**（启动即载入，零 token 匹配开销）：

1. Think before acting
2. Multiple interpretations → present them, don't pick silently
3. Push back when a simpler approach exists
4. Surgical changes — only touch what the task requires
5. Exhaust reasonable options before saying "can't"
6. Verify results before claiming success
7. Preserve context and align with user's actual goal

> 等价于 andrej-karpathy-skills 的 `karpathy-guidelines` 框架，但装在 system-prompt 层，无须 skill 加载。

---

# Part A — Global Skills（30 个，4 agent 共享）

位置：`~/.{claude,cursor,opencode,codex}/skills/`。**每次启动自动可用，描述匹配触发**。

## 🧠 Process（流程纪律，10 个）

| Skill | 何时用 |
| --- | --- |
| `using-superpowers` | 动手前先判断要不要调用某个 skill |
| `brainstorming` | 写代码 / 设计前澄清意图、需求、设计（含 inline Spec Self-Review） |
| `writing-plans` | 多步任务先写实现计划再动手（含 No Placeholders 红旗 + Self-Review） |
| `executing-plans` | 按已有计划逐项落地 |
| `test-driven-development` | 实现 / 修复前先写测试 |
| `systematic-debugging` | 遇到 bug 用结构化排查根因 |
| `verification-before-completion` | 宣称完成前必须用证据验证 |
| `subagent-driven-development` | 派 subagent 跑 plan 每一步，带 spec / 质量 reviewer |
| `dispatching-parallel-agents` | 2+ 独立任务并行派 subagent + 合并协议 |
| `using-git-worktrees` | 隔离 worktree 跑并行 agent / 高风险重构 |

## 🔥 Escalation（动力 / 高压，2 个）

| Skill | 何时用 |
| --- | --- |
| `high-agency` | 复杂长任务保持主动 / ownership（常驻内驱） |
| `pua` | 反复失败 / 偷懒时高压逼自己重做（外部加压） |

## 🧭 Routing & Meta（路由 + skill 工具，3 个）

| Skill | 何时用 |
| --- | --- |
| `skill-router` | 把任务路由到正确的 local project pack |
| `skill-creator` | 创建 / 编辑 / 评估新 skill |
| `skill-scanner` | **装新社区 skill 前先扫安全**（prompt injection / 恶意脚本 / 凭证泄露） |

## 🔧 Workflow（外部协作，3 个）

| Skill | 何时用 |
| --- | --- |
| `playwright-interactive` | 持久浏览器 session 迭代调 UI |
| `gh-fix-ci` | 用 `gh` 排查并修复 GitHub Actions 失败 |
| `gh-address-comments` | 用 `gh` 处理 PR review 评论 |

## 👀 Code Review（3 个，obra/superpowers）

| Skill | 何时用 |
| --- | --- |
| `requesting-code-review` | 完成任务 / 合并前自查 |
| `receiving-code-review` | 收到 review 反馈如何技术化回应 |
| `finishing-a-development-branch` | 完成开发分支收尾（rebase / squash / PR） |

## 📋 OpenSpec（规格驱动开发，4 个）

| Skill | 何时用 |
| --- | --- |
| `openspec-explore` | 思考模式 —— 落规格前先想清楚 |
| `openspec-propose` | 一步生成完整 change proposal（设计 / 规格 / 任务） |
| `openspec-apply-change` | 按 OpenSpec change tasks 逐项实施 |
| `openspec-archive-change` | 完成后归档 change |

## 📄 Document（5 个，Anthropic 官方）

| Skill | 何时用 |
| --- | --- |
| `pdf` | PDF 读 / 合并 / 拆分 / OCR / 表单 |
| `docx` | Word 文档创建编辑 |
| `xlsx` | Excel / CSV 创建编辑 |
| `pptx` | PowerPoint 创建编辑 |
| `markitdown` | PDF / Office / 图像 / 音视频 → Markdown |

---

## 🎁 Agent 专属 Skills（不跨家）

- **Claude Code 内置 slash skills**（10 个）：`update-config`, `keybindings-help`, `simplify`, `less-permission-prompts`, `loop`, `schedule`, `claude-api`, `init`, `review`, `security-review`
- **Cursor 专属 skills** `~/.cursor/skills-cursor/`（13 个）：`canvas`, `create-hook`, `create-rule`, `create-skill`, `create-subagent`, `migrate-to-skills`, `sdk`, `shell`, `split-to-prs`, `statusline`, `update-cli-config`, `update-cursor-settings`, `babysit`
- **Codex 厂商 skills** `~/.codex/skills/.system/`（5 个）：`imagegen`, `openai-docs`, `plugin-creator`, `skill-creator`, `skill-installer`

---

# Part B — Local Project Packs（256 skills）

按"动作 / 领域"组织。**`cd` 进项目目录，agent 自动加载该 pack 的 skills**（token 成本最低）。

## 🍎 ios-project（14 skills）— iOS / SwiftUI 开发

`C:\Users\PC\ios-project\`

| 类 | Skills |
| --- | --- |
| Build / 工具 | `app-store-changelog`, `github-issue-fix`, `ios-debugger`, `native-profiling` |
| 架构 / 测试 | `ios-architecture`, `ios-testing`, `ios-foundation-models`（iOS 26） |
| Swift 语言 | `swift-concurrency`, `swift-style` |
| SwiftUI | `swiftui-components`, `swiftui-liquid-glass`（iOS 26+）, `swiftui-performance`, `swiftui-ui-patterns`, `swiftui-view-refactor` |

## 💰 finance-project（128 skills，多层路由）— 金融 / 投资 / 交易

`C:\Users\PC\finance-project\` 是**容器**，cd 进子目录用。

| 子目录 | 数 | 何时去 |
| --- | --- | --- |
| `trading/` | 14 | 主动交易、选股（VCP / CANSLIM / PEAD / Kanchi 股息） |
| `research/` | 21 | 个股 / 行业研报、立题、catalyst tracking |
| `macro/` | 16 | 市场环境 / 顶底信号 / 宏观 regime / Druckenmiller |
| `modeling/` | 15 | DCF / LBO / comps / 3-statement / merger 模型 |
| `portfolio/` | 21 | 仓位 sizing / 期权 / 回测 / 再平衡 / 固收 RV |
| `advisory/ib/` | 8 | 投行：CIM / teaser / pitch deck / buyer list |
| `advisory/pe/` | 8 | PE：deal sourcing / DD / IC memo / value-creation |
| `advisory/wealth/` | 3 | 财富管理：client review / report / proposal |
| `advisory/fund-admin/` | 6 | 基金后台：GL / NAV / accruals / roll-forward |
| `advisory/compliance/` | 2 | KYC：doc-parse / rules |
| **`quant-methods/`** ⭐ | 15 | López de Prado AFML：PBO / 防泄漏 CV / Triple Barrier / 因子 / GARCH / 组合优化 / 回测框架选型 / 执行成本 |

## 💻 dev-project（87 skills，8 层路由）— 软件开发

`C:\Users\PC\dev-project\`

| 子目录 | 数 | 何时去 |
| --- | --- | --- |
| `(top)` | 11 | 仓库工作流（changelog / tech-debt / release）、跨切（find-bugs / drawio）、安全 |
| `frontend/` | 4 | React / Next / Tailwind / web-artifacts + frontend-design（Anthropic ⭐） |
| `backend/` | 4 | senior-backend / architect / fullstack / guidelines |
| `cloud-platform/` | 18 | AWS / Cloudflare（5）/ Stripe（4）/ Supabase（2）/ PostHog（7） |
| `testing-qa/` | 4 | api-test / route-tester / senior-qa / webapp-testing |
| `devops-sre/` | 9 | CI/CD / Docker / Terraform / 5 个可观测 SRE |
| `agent-dev/` | 15 | LLM 编排：LangChain / LangGraph / Deep / MCP / Claude SDK / prompt-optimizer / CF agents-sdk |
| `ml/` | 22 | ML 训练：sklearn / PyTorch / transformers / RL + **HuggingFace 13 件套** + 资源检测 |

## 📢 marketing-project（38 skills）— 营销 / SEO / 增长 / 音频

`C:\Users\PC\marketing-project\`

| 类 | Skills |
| --- | --- |
| 文案 | copywriting, copy-editing, ad-creative, cold-email, email-sequence |
| SEO | ai-seo, seo-audit, programmatic-seo, schema-markup, competitor-alternatives |
| 策略 | content-strategy, launch-strategy, pricing-strategy, marketing-ideas, marketing-psychology |
| 付费 / 分析 | paid-ads, analytics-tracking, revops |
| 增长 | churn-prevention, referral-program, free-tool-strategy |
| 视觉 | canvas-design, generate-image, theme-factory |
| 销售 | sales-enablement, product-marketing-context |
| 社交 | social-content |
| 报告 | market-research-reports |
| 中文 | wechat-ai-publisher |
| **音频** ⭐ | ElevenLabs 9 件套（agents / music / TTS / STT / 转录 / 声效 / voice-changer / voice-isolator / api-key） |

## 📚 research-project（18 skills）— 学术研究 / 写作

`C:\Users\PC\research-project\`

| 类 | Skills |
| --- | --- |
| 文献 | citation-management, literature-review, pyzotero, research-lookup |
| 写作 / 评议 | scientific-writing, peer-review, scholar-evaluation |
| 立题 | scientific-brainstorming, scientific-critical-thinking, hypothesis-generation |
| 基金 / 投稿 | research-grants, venue-templates |
| 演示 / 海报 | scientific-slides, scientific-schematics, scientific-visualization, latex-posters, pptx-posters |
| 转换 | paper-2-web |

## 📊 data-analysis-project（18 skills）— 数据分析 / EDA / 统计

`C:\Users\PC\data-analysis-project\`

| 类 | Skills |
| --- | --- |
| DataFrame | polars, dask, vaex, zarr-python |
| 可视化 | matplotlib, seaborn, plotly, infographics |
| 统计 | exploratory-data-analysis, statistical-analysis, statsmodels |
| 数学 | sympy, pymc |
| 时序 / 图 | timesfm-forecasting, networkx |
| Web 抓取 | defuddle, parallel-web, perplexity-search |

## ⏰ productivity-project（20 skills）— 工作流 / PM / 协作

`C:\Users\PC\productivity-project\`

| 类 | Skills |
| --- | --- |
| Obsidian | obsidian-bases, obsidian-cli, obsidian-markdown |
| Google Workspace | gws |
| PM / Jira | jira-expert, scrum-master, senior-pm |
| **Atlassian 官方** ⭐ | spec-to-backlog, triage-issue, generate-status-report, capture-tasks-from-meeting-notes, search-company-knowledge |
| **Notion 官方** ⭐ | notion-cli |
| 决策 / 规划 | planning-with-files, what-if-oracle, markdown-mermaid-writing |
| 写作 / 协作 | doc-coauthoring, internal-comms, json-canvas |
| Notebook | open-notebook |

---

# Part C — MCP Servers（19 个）

四家 agent 跑同一套，**API key 全部走 Windows User-scope env var**（`${VAR}` / `${env:VAR}` / `bearer_token_env_var`）。

## ✅ Always-on（9 个，启动自动加载）

| MCP | 用处 |
| --- | --- |
| `github` | GitHub 仓库 / issue / PR（HTTP @ `api.githubcopilot.com/mcp` + Bearer PAT） |
| `memory` | 跨会话 entity-relation 持久化记忆 |
| `filesystem` | 跨项目本地文件读写（root: `C:/Users/PC`） |
| `context7` | 任意开源库实时文档与代码示例 |
| `sequential-thinking` | 强制结构化分步推理 |
| `brave-search` | Brave 搜索（web / image / news / 本地 POI） |
| `playwright` | 跨浏览器自动化 |
| `chrome-devtools` | Chrome 运行时观测：console / network / Lighthouse |
| `web-reader` | Z.AI URL → markdown（Codex 禁用，兼容性问题） |

## 💤 Opt-in（10 个，按项目启用）

| MCP | 何时启用 |
| --- | --- |
| `supabase` | Supabase 项目 |
| `vercel` | Vercel 部署 |
| `railway` | Railway 部署 |
| `expo-mcp` | Expo / EAS 移动 |
| `magic` | MagicUI 组件代码生成 |
| `zai-mcp-server` | Z.AI 综合搜索 / 抓取 |
| `cloudflare-docs` | CF 官方文档 |
| `cloudflare-workers-builds` | CF Worker 构建状态 |
| `cloudflare-workers-bindings` | CF Worker bindings |
| `cloudflare-observability` | CF Worker 日志 |

### 如何启用 opt-in MCP

| Agent | 方法 |
| --- | --- |
| **Codex** | `codex -c mcp_servers.<name>.enabled=true` （无须重启）|
| **Cursor** | 编辑 `~/.cursor/mcp.json` 改 `"enabled": true` + reload window |
| **OpenCode** | 编辑 `~/.opencode/opencode.json` 改 `"enabled": true` + restart |
| **Claude Code** | Opt-in 已从全局移除；用项目级 `.mcp.json` 或 `claude mcp add --scope user ...` |

### 📦 MCP 模板库

`C:\Users\PC\MCP-Templates\` 有 10 个预制 `.mcp.json` 模板（supabase / vercel / cloudflare / mobile / magic / zai / deploy / fullstack / everything）。**长期项目 `copy <template>.mcp.json <project>\.mcp.json` 完事**。

---

# Part D — claude-mem 记忆层

**自动跨 session 记忆系统**。每次 tool use 自动压缩成 observations，用 SQLite + Chroma 向量库存 `~/.claude-mem/`。新 session 自动注入相关历史。

| Agent | 集成 | 文件 |
| --- | --- | --- |
| **Claude Code** | ✅ Plugin marketplace | `~/.claude/plugins/marketplaces/thedotmack/` |
| **Cursor** | ✅ 5 hooks | `~/.cursor/hooks.json` |
| **Codex** | ✅ marketplace + plugin_hooks | `~/.codex/config.toml` 中 `[marketplaces.claude-mem-local]` |
| **OpenCode** | ✅ plugin file | `~/.config/opencode/plugins/claude-mem.js` |
| **LM Studio** | ❌ 无 hook 系统 | — |

**特点**：
- Worker 通过 SessionStart hook 自动启动（idempotent，已跑就跳过）
- **不需要手动启动、不需要开机自启、重启电脑无影响**
- web viewer: http://localhost:37777
- Auth: Claude Code OAuth subscription，零 API 配额消耗

---

# Part E — 常用命令速查

## 启动 agent

```powershell
cd C:\Users\PC\<project>\<sub>     # 进对应 pack
claude                              # 或 codex / opencode
# Cursor: 直接打开目录
```

## 看激活的 skill / MCP

```powershell
claude  →  /mcp          # interactive 模式，列 MCP
codex mcp list           # Codex
```

## 项目级 MCP 模板

```powershell
# 拷模板进项目
copy "C:\Users\PC\MCP-Templates\cloudflare.mcp.json" ".mcp.json"
# 临时一次性
claude --mcp-config "C:\Users\PC\MCP-Templates\supabase.mcp.json"
```

## 装新社区 skill 前

```
先调 skill-scanner 扫一遍安全（prompt injection / 凭证泄露）
```

---

# Part F — 配置位置一览

| 项 | 位置 |
| --- | --- |
| 全局 skill | `~/.{claude,cursor,opencode,codex}/skills/` |
| 项目 skill | `~/<project>/<sub>/.{agent}/skills/` |
| System prompt（7 原则） | `~/.claude/CLAUDE.md` / `~/.{codex,opencode}/AGENTS.md` / `~/.cursor/rules/global-rules.md` |
| Claude MCP | `~/.claude.json`（`mcpServers` 块） |
| Cursor MCP | `~/.cursor/mcp.json` |
| OpenCode MCP | `~/.opencode/opencode.json`（`mcp` 块） |
| Codex MCP | `~/.codex/config.toml`（`[mcp_servers.*]`） |
| LM Studio MCP | `~/.lmstudio/mcp.json`（子集） |
| MCP 模板 | `C:\Users\PC\MCP-Templates\` |
| Opt-in MCP env vars | Windows User scope（`HKCU\Environment`） |

---

# Part G — 全栈数据

| 维度 | 数量 |
| --- | --- |
| 主 agent | 4（Claude / Cursor / Codex / OpenCode）+ 1（LM Studio，仅 MCP） |
| 全局 skills | 30 |
| 项目本地 skills | 256（ios 14 + finance 128 + dev 87 + marketing 38 + research 18 + data 18 + productivity 20，去重） |
| MCP 服务器 | 19（9 always-on + 10 opt-in） |
| 4 agent 完全 parity | ✅ |
