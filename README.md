# Agents Overview — 人看的总览手册

本仓库把**一套** skill / harness 配置同步给本机 5 个 AI agent(Claude Code · Codex ·
Cursor · OpenCode · Pi)。这份 README 是**给人看的概览**:是什么、怎么组织、怎么用。

> **👉 怎么用这些 skill(流程 + 该说什么话)在 `PLAYBOOK.md`** —— 装了不会用等于没装,先读它。
> **给 agent 看的运行时路由**在 `HARNESS.md`(自动生成,权威、不漂移)。
> **装机指南**在 `INSTALL.md`,**精确文件映射**在 `INVENTORY.md`。
> 本文刻意**不逐个枚举** ~365 个 skill —— 那份清单在 `HARNESS.md`,改一个 skill 就自动更新。

---

## 🤖 Agents

| Agent | 入口 | 主配置 |
| --- | --- | --- |
| **Claude Code** | `claude` | `~/.claude/CLAUDE.md` + `settings.json` |
| **Codex CLI** | `codex` | `~/.codex/AGENTS.md` + `config.toml` |
| **Cursor** | 打开目录 | `~/.cursor/rules/global-rules.md` |
| **OpenCode** | `opencode` | `~/.opencode/AGENTS.md` |
| **Pi** | `pi` | `~/.pi/agent/AGENTS.md` |
| **LM Studio** | 应用 | `~/.lmstudio/mcp.json`(仅 MCP) |

### 📋 配几个 agent?——**由指令决定,不是写死的**

**支持 5 个,默认全配。** 配几个由**当次的指令**决定 —— 每次配置 harness 的都是一个 agent
在执行,它应当照指令办,而不是假设"就是那 4 个"。

```powershell
.\scripts\sync.ps1                                  # 默认:全部 5 个
.\scripts\sync.ps1 -Agents claude,pi                # 只配这两个
./scripts/install.sh --agents=claude,cursor,codex   # 只配这三个
```

**能力矩阵(诚实版,不是 parity 宣传)** —— Pi 是 *"minimal agent harness"*,官方**刻意**
不做 MCP / hooks / 子 agent,不是配置遗漏:

| | Claude Code | Codex | Cursor | OpenCode | **Pi** |
| --- | :-: | :-: | :-: | :-: | :-: |
| 6 条核心原则 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 39 个全局 skill | ✅ | ✅ | ✅ | ✅ | ✅ |
| 本地 pack skill | ✅ | ✅ | ✅ | ✅ | ✅ |
| MCP(9 always-on) | ✅ | ✅ | ✅ | ✅ | ❌ 官方不支持 |
| guard/format hooks | ✅ | ✅ | ❌ | ❌ | ❌ 无声明式 hooks |
| 子 agent(并行扇出) | ✅ | ✅ | ✅ | ✅ | ❌ 官方不做 |
| LSP | ✅ 4 语言 | ❌ | ✅ 内建 | ✅ 原生 40+ | ❌ |

Pi 上有 5 个 skill 会降级为顺序执行(`requesting-code-review` 双轴、`codebase-design`
DESIGN-IT-TWICE、`improve-codebase-architecture`、`dispatching-parallel-agents`、
`subagent-driven-development`)—— 处理办法写在 `agents/pi/AGENTS.md` 里,它会照做并**主动
声明自己是顺序跑的**,不会假装并行过。

5 家**共享同一套 skill + 指令**;MCP 与 hooks 只有前 4 家有(Pi 官方不支持,见下方能力矩阵)。仓库是 source of truth,`scripts/sync.ps1`
/ `sync.sh` 下发到本机。

---

## 📜 Core Principles(6 条,启动即载入)

每个 agent 的 system prompt 顶部是 6 条**可执行**原则(不是抽象口号,带自检):

1. **Think before acting** — 说清假设;多种解释都摆出来,不默默选一个。
2. **Simplicity first** — 最小可行代码;200 行能 50 行做完就重写。
3. **Surgical changes** — 只碰任务需要的;每一行改动都能追溯到需求。
4. **Exhaust options before giving up** — "不行"是待验证的假设,不是结论。
5. **Verify before claiming success** — 用证据(跑/测/看)证明,再说"完成"。
6. **Preserve context and align with the goal** — 不为子任务牺牲真实目标。

> 对齐 andrej-karpathy-skills 的 `karpathy-guidelines`,装在 system-prompt 层,零 skill-match 开销。

---

## 🏗️ Harness 架构(5 扩展点 + 2 补充)

按 Anthropic 的框架,harness = 围绕模型的整套脚手架。本仓库配了:

- **CLAUDE.md / AGENTS.md** — 分层上下文,每会话自动加载(6 原则 + 路由)。
- **Hooks** — `guard.mjs`(PreToolUse:拦密钥文件 / 危险命令)+ `format.mjs`(PostToolUse:
  项目 opt-in 才格式化),跑在 **Claude + Codex**。(Cursor/OpenCode 走各自机制,待补。)
- **Skills** — 渐进式披露:39 个全局 skill 描述匹配自动触发;~365 个 local pack skill 进目录才加载。
- **LSP** — Claude:pyright / typescript / gopls / rust-analyzer;OpenCode:原生(`lsp:true`,40+ 语言);
  Cursor:编辑器内建;Codex:无。
- **MCP** — 9 always-on + 10 opt-in(见下),API key 全走 Windows env var。
- **Subagents** — Explore(只读搜索)/ Plan(设计)/ general-purpose 等,委托探索不挤占主上下文。

**防漂移基建(本仓库的关键工程)**:skill 表和 HARNESS.md 都从**单一源头生成** ——
`scripts/gen-skill-table.mjs`(从 `skills/global/catalog.json`)和 `scripts/gen-harness.mjs`
(扫 `skills/project-packs/`),各带 `--check` 漂移门,接进 sync。**手抄清单一律不留**。

---

## 🌐 Global Skills(38 个,5 agent 共享,启动自动可用)

位置 `~/.{claude,cursor,codex,opencode}/skills/`。按分类(权威清单见 `HARNESS.md` / `catalog.json`):

| 分类 | 数 | 是什么 |
| --- | --- | --- |
| Process | 13 | 流程纪律:using-superpowers / **brainstorming**(盘问引擎)/ writing-plans / TDD / systematic-debugging / verification / **handoff** / **action-first** / **`no-ai-slop`**(去 AI 味)… |
| Thinking | 1 | `first-principles-thinking` —— 从第一性原理推理 |
| Escalation | 1 | `high-agency` —— 常驻内驱 + 失败时自救 |
| Routing & Meta | 4 | `skill-router` / **`skill-creator`**(写 skill + 审 skill,含标尺与 eval 工具)/ `skill-scanner` / `book-to-skill`(书→技能) |
| Workflow | 4 | `playwright-interactive` / `gh-fix-ci` / `gh-address-comments` / **`github-gold`**(挖 GitHub 宝藏) |
| Code Review | 3 | requesting(**双轴并行**)/ receiving / finishing-a-development-branch |
| **Design & Architecture** | 4 | `codebase-design`(深模块)/ `domain-modeling`(CONTEXT.md+ADR)/ `prototype` / `improve-codebase-architecture` |
| OpenSpec | 4 | explore / propose / apply-change / archive-change |
| Document | 3 | pdf / **officecli**(Word/Excel/PPT 引擎,取代旧 docx/xlsx/pptx)/ markitdown |
| Learning | 1 | `teach` —— 多轮互动式辅导 |

---

## 📦 Local Project Packs(8 个,~365 skills)

按领域组织。**`cd` 进目录,agent 自动加载该 pack 的 skills**(token 成本最低)。
**每个 pack 的完整 skill 清单见 `HARNESS.md`**(生成、不漂移)——下表只给领域和规模:

| Pack | 规模 | 领域 / 何时进 |
| --- | --- | --- |
| `~/dev-project/` | 87 | 软件开发(8 层:frontend / backend / cloud-platform / testing-qa / devops-sre / agent-dev / ml + 根) |
| `~/finance-project/` | 129 | 金融/投资/交易(容器:trading / research / macro / modeling / portfolio / quant-methods / advisory) |
| `~/research-project/` | 45 | 学术/科研(AI/CS 取向:文献 / 写作 / latex / 图表 / paper-library / repro-pack / 深度检索管线) |
| `~/marketing-project/` | 39 | 营销/SEO/增长/音频(ElevenLabs 套件)/ 小红书 · WeChat |
| `~/productivity-project/` | 22 | 工作流/PM(Jira / Notion / Obsidian / Google Workspace) |
| `~/data-analysis-project/` | 18 | 数据分析/EDA/统计/可视化 |
| `~/ios-project/` | 21 | iOS/SwiftUI(widget/Live Activity / Rive / 动画 / HIG 设计 / Mac 构建 runbook) |
| `~/craft-project/` | 3 | 跨领域「功力」(writing:去 AI 味;design:审美/anti-slop) |

新开一个任意项目时:让 agent 读 `C:\Users\PC\HARNESS.md`,它据此决定 cd 进哪个 pack。

---

## 🔌 MCP Servers

**前四家**跑同一套(Pi 无 MCP),API key 全走 Windows User-scope env var(`${VAR}` / `${env:VAR}` / `bearer_token_env_var`)。

**✅ Always-on(9,启动自动)**:`github` · `memory` · `filesystem` · `context7` ·
`sequential-thinking` · `brave-search` · `playwright` · `chrome-devtools` ·
`web-reader`(Codex 禁用)。

**💤 Opt-in(10,按项目启用)**:`supabase` · `vercel` · `railway` · `expo-mcp` · `magic` ·
`zai-mcp-server` · `cloudflare-{docs,workers-builds,workers-bindings,observability}`。

**🍎 iOS/macOS opt-in 模板(3,仅 Mac)**:`xcodebuildmcp` · `ios-simulator` · `revenuecat`。

### 启用 opt-in
| Agent | 方法 |
| --- | --- |
| Claude Code | 项目级 `.mcp.json`,或 `claude --mcp-config <template>` |
| Codex | `codex -c mcp_servers.<name>.enabled=true` |
| Cursor | 编辑 `~/.cursor/mcp.json` 改 `"enabled": true` + reload |
| OpenCode | 编辑 `~/.opencode/opencode.json` 改 `"enabled": true` + restart |

**模板库** `C:\Users\PC\MCP-Templates\`(13 个 `.mcp.json`)。长期项目:`copy <template>.mcp.json <project>\.mcp.json`。

---

## 🪝 Hooks

- **Hooks**:`~/.agent-hooks/{guard,format}.mjs` —— guard 拦密钥文件 + `rm -rf /`/`curl|sh`/force-push
  等危险命令;format 仅当项目有 formatter 配置才格式化。装在 Claude + Codex(additive merge,保留
  机器上已有的其它 hooks)。

---

## ⌨️ 常用命令

```powershell
cd C:\Users\PC\<project>\<sub> && claude    # 进 pack(或 codex / opencode;Cursor 打开目录)
claude  →  /mcp                              # 看激活的 MCP
copy "C:\Users\PC\MCP-Templates\<x>.mcp.json" ".mcp.json"   # 项目级 opt-in MCP
.\scripts\sync.ps1 -DryRun                   # 从仓库下发到本机(先 dry-run)
```
装新社区 skill 前:先用 `skill-scanner` 扫安全(injection / 凭证泄露)。

---

## 📁 配置位置

| 项 | 位置 |
| --- | --- |
| 全局 skill | `~/.{claude,cursor,opencode,codex}/skills/` |
| 项目 skill | `~/<project>/<sub>/.{agent}/skills/` |
| System prompt | `~/.claude/CLAUDE.md` · `~/.{codex,opencode}/AGENTS.md` · `~/.cursor/rules/global-rules.md` |
| Hooks | `~/.agent-hooks/` + Claude `settings.json` / Codex `config.toml` |
| MCP | Claude `~/.claude.json` · Cursor `~/.cursor/mcp.json` · OpenCode `opencode.json` · Codex `config.toml` |
| MCP 模板 | `C:\Users\PC\MCP-Templates\` |
| Agent 路由清单 | `C:\Users\PC\HARNESS.md` |

---

## 📊 全栈数据

| 维度 | 数量 |
| --- | --- |
| 主 agent | **5**(Claude / Cursor / Codex / OpenCode / Pi)+ 1(LM Studio,仅 MCP) |
| 全局 skills | **39**(10 分类) |
| 项目本地 skills | **~365**(8 packs;权威清单见 `HARNESS.md`) |
| MCP | 9 always-on + 10 opt-in（+3 iOS/macOS 模板） |
| Skill parity | ✅ 5/5 · MCP 4/5 · hooks 2/5(见能力矩阵) |

---

# 📖 Meta:如何写好一个 Skill(Matt Pocock)

> 出自 Matt Pocock 的演讲 *"The Missing Manual: How to Write Great Skills"*。这套标尺现在活在
> `skills/global/skill-creator/references/rubric.md`(术语定义在同目录 `GLOSSARY.md`,逐字保留),
> 由 **model-invoked** 的 `skill-creator` 在写/审 skill 时自动读进去 —— 不用你记得喊。
> 下面是给**人**看的浓缩版。核心目标叫 **Predictability**:让 agent 每次走**同一套过程**(不是同一个输出)。

## 四个维度

**① Triggering(怎么被调用)**
- **model-invoked**:保留 `description`,agent 自动触发、别的 skill 也能调 —— 但每条 description
  常驻上下文,增加 **context load**。
- **user-invoked**(`disable-model-invocation: true`):只有人敲名字能调,**零 context load**,
  但增加 **cognitive load**(你得记得它存在)。太多时用一个 **router skill** 统管。
- **写 description**:把**引导词前置**;**一个 branch 一个触发**(同义词重复 = duplication,合并);
  砍掉正文已有的身份介绍。

**② Structure(内部布局)**
- 两种内容:**steps**(有序动作)和 **reference**(支撑资料),可自由混合。
- **信息层级阶梯**:in-skill step → in-skill reference → **external reference(context 指针)**。
  只在主 `SKILL.md` 放**每个 branch 都要**的;只有某 branch 用的,推到 `references/*.md` 后面挂指针
  (**progressive disclosure**)。
- 每个 step 收在一个**完成判据**上,要**可检验**且(必要时)**穷尽**("每个改过的 model 都交代了",
  不是"产出一个变更列表")—— 模糊判据会招致 **premature completion**。

**③ Steering(让它照你的意思做)**
- **引导词(leading words)**:模型预训练里已有的紧凑概念(*vertical slice* / *tight* / *red* /
  *tracer bullets*),写进 skill 反复出现,用最少 token 锚定一整片行为。可在推理轨迹里**验证**它被采纳。
- **拆步骤隐藏未来**:agent 常在准备步骤(如"提澄清问题")偷懒赶着去做最终目标。把后续步骤**拆成独立
  skill**、当前只让它看到这一步,能逼它在当前步多投入。

**④ Trimming(修剪)**
- **单一权威源**:每个含义只有一处,改行为 = 改一处。
- **相关性**:每行还切题吗?
- **no-op 删除测试**(逐句):删掉这句,行为会变吗?不变就整句删,**要狠**。

## 六个失败模式(拿来自查)
- **Premature completion** —— 步骤没真做完就收(注意力滑向"完成")。先磨判据,再考虑拆步骤。
- **Duplication** —— 同一含义多处出现,费 token 又抬高它的层级权重。
- **Sediment(沉积)** —— 加着安全、删着危险,于是攒下过时废料。没有修剪纪律的默认下场。
- **Sprawl** —— 单纯太长(哪怕每行都活)。解药是阶梯:reference 推到指针后、按 branch/序列拆。
- **No-op** —— 模型本来就会做的话,白占 load。弱引导词(*be thorough*,它本来就 thorough)= no-op,
  换更强的词(*relentless*),不是换技巧。
- **Negation** —— 用禁令引导会反噬:*别想大象*,大象就来了。改成**正向陈述目标行为**,让被禁的那个
  压根不出现在文本里;实在没法正着说的硬护栏,也要配一句"那该怎么做"。

---

# 🗂️ 文档地图

| 文档 | 给谁 | 干嘛 |
| --- | --- | --- |
| **README.md**(本文) | 人 | 概览 / 架构 / 怎么用 + skill meta 知识 |
| **HARNESS.md** | agent | 运行时路由(生成:pack 索引 + harness 一览) |
| **INSTALL.md** | 装机的人/agent | 新机器怎么装 |
| **INVENTORY.md** | 选装 | 精确 source→target 文件映射 + "不装什么" |
