# Agents Overview — 人看的总览手册

本仓库把**一套** skill / 指令 / MCP / hook 配置装到任意电脑(Windows · macOS · Linux)上的任意几个
AI agent:Claude Code · Codex · Cursor · OpenCode · Pi。这份 README 是**给人看的概览**。

> **👉 怎么用这些 skill(流程 + 该说什么话)在 `PLAYBOOK.md`** —— 装了不会用等于没装,先读它。
> **给 agent 看的路由清单**在 `HARNESS.md`(pack 索引是生成的)。
> **装机步骤**在 `INSTALL.md`,**设计和原理**在 `docs/harness-v2.md`。

---

## ⚙️ 怎么装、怎么同步

```bash
node harness.mjs install --agents claude --dry-run   # 先看会做什么
node harness.mjs install --agents claude,codex       # 装哪几个 agent 由你点名
git pull && node harness.mjs update                  # 之后每次更新
node harness.mjs doctor                              # 体检:漂移、冲突、遗留、缺的环境变量
```

三条原理:

- **skill 是链接,不是拷贝**:每个 agent 的 skill 目录里放的是指回本仓库的链接(Windows 用 junction),
  只有一份文件;在本机改 skill 就是在改仓库,`git status` 里直接看得到。
- **按条目合并**:仓库只管它定义的条目(某个 MCP、某个 hook、提示词里标记圈出的一段),agent 配置
  文件里其他东西(模型、登录、你自己加的 MCP 和插件)一律不碰。
- **三方比较**:本机改过仓库管的条目,安装器不覆盖,报冲突,用 `node harness.mjs resolve` 决定用哪边。

---

## 🤖 Agents

| Agent | 入口 | 指令 | skill | MCP |
| --- | --- | --- | --- | --- |
| **Claude Code** | `claude` | `~/.claude/CLAUDE.md` | `~/.claude/skills/` | `~/.claude.json` |
| **Codex CLI** | `codex` | `~/.codex/AGENTS.md` | `~/.codex/skills/` | `~/.codex/config.toml` |
| **Cursor** | 打开目录 | 设置 → Rules(粘贴一次) | `~/.cursor/skills/` | `~/.cursor/mcp.json` |
| **OpenCode** | `opencode` | `~/.config/opencode/AGENTS.md` | `~/.config/opencode/skills/` | `~/.config/opencode/opencode.json` |
| **Pi** | `pi` | `~/.pi/agent/AGENTS.md` | `~/.pi/agent/skills/` | `~/.pi/agent/mcp.json` |

**能力矩阵(诚实版)**:

| | Claude Code | Codex | Cursor | OpenCode | Pi |
| --- | :-: | :-: | :-: | :-: | :-: |
| 6 条核心原则 | ✅ | ✅ | ✅(手动粘贴) | ✅ | ✅ |
| 全局 skill | ✅ | ✅ | ✅ | ✅ | ✅ |
| 本地 pack skill | ✅ | ✅ | ✅ | ✅ | ✅ |
| MCP | ✅ | ✅ | ✅ | ✅ | ✅ |
| guard/format hooks | ✅ | ✅ | ❌ | ❌ | ❌ 无声明式 hooks |
| 子 agent(并行扇出) | ✅ | ✅ | ✅ | ✅ | ❌ |
| LSP | ✅ 4 语言 | ❌ | ✅ 内建 | ✅ 原生 40+ | ❌ |

Pi 上有 5 个 skill 会降级为顺序执行(`requesting-code-review` 双轴、`codebase-design`
DESIGN-IT-TWICE、`improve-codebase-architecture`、`dispatching-parallel-agents`、
`subagent-driven-development`)—— 处理办法写在 `agents/pi/notes.md` 里,它会照做并**主动
声明自己是顺序跑的**,不会假装并行过。

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
> 源头是 `prompt/core.md`,安装时拼进每个 agent 的指令。

---

## 🌐 Global Skills(36 个,5 agent 共享,启动自动可用)

每个 agent 的 skill 目录里各有一份指向仓库的链接。按分类(权威清单见 `skills/global/catalog.json`):

| 分类 | 数 | 是什么 |
| --- | --- | --- |
| Process | 13 | 流程纪律:using-superpowers / **brainstorming**(盘问引擎)/ writing-plans / TDD / systematic-debugging / verification / **handoff** / **action-first** / **`no-ai-slop`**(去 AI 味)… |
| Thinking | 1 | `first-principles-thinking` —— 从第一性原理推理 |
| Escalation | 1 | `high-agency` —— 常驻内驱 + 失败时自救 |
| Routing & Meta | 4 | `skill-router` / **`skill-creator`**(写 skill + 审 skill,含标尺与 eval 工具)/ `skill-scanner` / `book-to-skill`(书→技能) |
| Workflow | 2 | `playwright-interactive` / **`github-gold`**(挖 GitHub 宝藏) |
| Code Review | 3 | requesting(**双轴并行**)/ receiving / finishing-a-development-branch |
| **Design & Architecture** | 4 | `codebase-design`(深模块)/ `domain-modeling`(CONTEXT.md+ADR)/ `prototype` / `improve-codebase-architecture` |
| OpenSpec | 4 | explore / propose / apply-change / archive-change |
| Document | 3 | pdf / **officecli**(Word/Excel/PPT 引擎,取代旧 docx/xlsx/pptx)/ markitdown |
| Learning | 1 | `teach` —— 多轮互动式辅导 |

---

## 📦 Local Project Packs(8 个)

按领域组织。**在那个目录里启动 agent(Cursor:打开那个目录),该 pack 的 skills 就会加载**(token 成本最低);
已经开着的会话里 `cd` 过去不算。每个 pack 的完整 skill 清单和数量见 `HARNESS.md`(生成、不漂移):

| Pack | 领域 / 何时进 |
| --- | --- |
| `~/dev-project/` | 软件开发(8 层:frontend / backend / cloud-platform / testing-qa / devops-sre / agent-dev / ml + 根) |
| `~/finance-project/` | 量化/交易(容器:trading / research / portfolio / quant-methods) |
| `~/research-project/` | 学术/科研(AI/CS 取向。容器,5 个子包:literature / gates / manuscript / review / talks) |
| `~/marketing-project/` | 营销/SEO/增长/音频(ElevenLabs 套件)/ 小红书 · WeChat |
| `~/productivity-project/` | 工作流(Notion / Obsidian / NotebookLM / Google Workspace) |
| `~/data-analysis-project/` | 数据分析/EDA/统计/可视化 |
| `~/ios-project/` | iOS/SwiftUI(widget/Live Activity / Rive / 动画 / HIG 设计 / Mac 构建 runbook) |
| `~/craft-project/` | 跨领域「功力」(writing:去 AI 味;design:审美/anti-slop) |

新开一个任意项目时:让 agent 读本仓库的 `HARNESS.md`,它据此决定去哪个 pack。

---

## 🔌 MCP Servers

唯一来源 `mcp/catalog.json`,安装时按各 agent 的格式和当前系统生成。API key 全走环境变量(见 `INSTALL.md`)。

**默认开(9)**:`github` · `memory` · `filesystem` · `context7` · `sequential-thinking` ·
`brave-search` · `playwright` · `chrome-devtools` · `web-reader`(Codex 里默认关)。

**默认关,按项目打开(11)**:`supabase` · `vercel` · `railway` · `expo-mcp` · `magic` ·
`zai-mcp-server` · `cloudflare-{docs,workers-builds,workers-bindings,observability}` · `revenuecat`;
macOS 上另有 `xcodebuildmcp` · `ios-simulator`。

怎么打开:每个 agent 的指令里都写了(Claude:`claude --mcp-config ~/.claude/mcp-templates/<名>.mcp.json`,
或把那个文件拷进项目当 `.mcp.json`;Codex:`codex -c mcp_servers.<名>.enabled=true`)。

---

## 🪝 Hooks

`scripts/hooks/guard.mjs`(在 Bash / PowerShell / Read / Edit / Write 之前运行,拦密钥文件 + `rm -rf /` /
`curl|sh` / force-push 等危险命令)和 `format.mjs`(项目有 formatter 配置才格式化),直接从仓库运行,
装在 Claude Code 和 Codex。Codex 要在它自己里面信任一次这两个 hook 才会运行(装好后、clone 挪了位置后)。
Cursor / OpenCode / Pi 没有 hook,它们的指令里写了:危险命令先确认,不读凭证文件。

---

## 📁 仓库结构

| 路径 | 是什么 |
| --- | --- |
| `harness.mjs` + `lib/` | 安装器(Node 20+,零依赖) |
| `skills/global/` | 全局 skill + `catalog.json` |
| `skills/project-packs/` | 各领域 pack |
| `prompt/core.md` + `agents/<agent>/notes.md` | 提示词的公共部分和各 agent 自己的那一段 |
| `agents/claude/commands/` · `agents/opencode/commands/` | 斜杠命令 |
| `mcp/catalog.json` | MCP 清单 |
| `scripts/hooks/` | guard / format |
| `scripts/gen-harness.mjs` | 生成 `HARNESS.md` 的 pack 索引 |
| `tests/` | `node --test "tests/*.test.mjs"` |
| `docs/harness-v2.md` | 设计、规则、已知限制 |
| `.local/`(不提交) | 本机的安装状态 + 生成的 Cursor 规则;挪 clone 时要一起带走 |

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
| **PLAYBOOK.md** | 人 | 什么时候用哪个 skill、该说什么话 |
| **HARNESS.md** | agent | 运行时路由(pack 索引是生成的) |
| **INSTALL.md** | 装机的人/agent | 新机器怎么装、环境变量怎么设 |
| **docs/harness-v2.md** | 维护者 | 安装器的设计、规则和已知限制 |
