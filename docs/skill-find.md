# skill-find 与按项目装技能 设计

> 状态：2026-11-19 和用户在 brainstorming 中逐条确认。思路借鉴自另一台电脑上的 Copilot harness 改动报告；
> Copilot 本身不在本 repo 的范围内，这里只服务本 repo 的 5 个 agent（claude、codex、cursor、opencode、pi）。

## 为什么要改

- **用户的实际工作方式**：开发都在真实项目目录里（如 `D:/Projects2/xxx`），不会去 `~/dev-project` 这类 pack 目录启动。
  需要领域技能时，是自己去 pack 里翻，再手动复制到项目目录。
- **全局技能越堆越多**：全局 37 个技能，其中 35 个自动触发，描述合计 11,712 字。推测原因：真实项目里只用得到全局技能，
  所以开发流程类技能（executing-plans、using-git-worktrees……）只能放全局。
- **技能列表有预算**：Claude Code 的技能列表最多占 context 的 1%，超出后从最少用的技能开始删描述，只留名字
  （官方文档 skills 页 "Skill descriptions are cut short"）。其他 agent 也在每个会话开头列出技能。
- **用户确认的痛点**：(a) 真实项目里用不到想要的开发/领域技能；(c) 技能列表占的上下文太多。

核心思路（来自报告）：把"repo 里存多少技能"和"一个会话默认看到多少技能"分开管；描述写成准确的选择入口，
不是缩小版说明书；这些选择用代码和检查来维持，不靠一次性手工清理。

## 目标

1. 新增全局技能 `skill-find`（替代 `skill-router`）：用户说要做什么，它在所有 pack 技能里找出几个推荐，用户同意后装进项目。
2. 新增 `node harness.mjs add` / `remove`：把选中的技能链接进真实项目，装给本机全部已安装的 agent，并记录在本机状态里。
3. 全局技能从 35 个自动 + 2 个点名，精简为 14 个自动 + 6 个点名。
4. 压缩留下的全局技能描述，并在 `check` 里加全局描述总量的上限。

## 不做（non-goals）

- Copilot 适配器、中文 HTML 技能指南、skill-creator 的 Copilot 评测、按 agent 分开的技能配置（profile）。
- 不删 home 下的 pack 目录（`~/dev-project` 等）：不在那里启动就不占上下文，以后确认一直不用再说。
- 不改 vendored 技能的正文（它们有上游，改正文会造成和上游的漂移）。引用问题在常驻指令里统一处理，见 D。
- 不做"复制"模式，只做链接。

## 失败的样子（anti-goals）

- 压缩描述后，某个技能在该触发的时候不再触发。
- 项目里的技能链接被提交进项目的 git（链接是指向本机 `D:/Projects2/...` 的绝对路径，换台机器就是坏链接）。
- 移出全局的技能变得找不到：留下的技能里提到它，agent 却无从下手。
- 出现第二份手写的技能索引，跟 `HARNESS.md` 慢慢对不上。

## 约束

- 修 bug 的分支已于 2026-11-19 快进合并进 master（4 个提交：技能元数据修复、`check` 里的元数据检查
  `lib/skillspec.mjs`、guard 误判、doctor 的 Codex 误报），本机已 `update`，`doctor --deep` 只剩 Cursor 规则需手动粘贴。
  本设计在它之上做，预算检查扩展 `lib/skillspec.mjs`。guard 边界维持现状（三级及以上的具体路径放行）。
- 技能名在整个 repo 里唯一（已核对，无重复），所以 `add` 按名字找技能。
- 各 agent 在一个目录下的项目技能位置，已经由适配器的 `skills.pack(root)` 给出：`.claude/skills`、`.codex/skills`、
  `.cursor/skills`、`.opencode/skills`、`.pi/skills`。现在装 pack 就是用它。
- Claude Code：往已存在的 `<project>/.claude/skills/` 里新加技能，当前会话就能读到；如果 `.claude/skills/` 是会话中途新建的，
  要跑 `/reload-skills`（官方文档 skills 页 "Edit a skill during a session"）。文档没保证通过符号链接/junction 新加的技能
  一定被实时发现，需实测。其他 agent 一般要新开会话。
- 安装器拒绝在 worktree 里运行；`add` 同样要从主 checkout 运行。
- 零第三方依赖，Windows / macOS / Linux 共用（沿用 harness v2 的约束）。

## 已确认的决策

### A. `harness add` / `remove`（链接，装给全部已安装 agent）

```
node harness.mjs add <name>[,<name>…] <project-dir> [--dry-run] [--verbose]
node harness.mjs remove <name>[,<name>…]|all <project-dir> [--dry-run] [--verbose]
```

- 每个技能链接进本机**每个已安装 agent** 的项目技能目录（`skills.pack(<project-dir>)`），用的链接方式与 pack 相同
  （Windows junction，其他系统符号链接）。不复制。
- 本机状态新增 `projects`：项目绝对路径 → 排好序、去重的技能名数组；数组空了就删掉这一项。
- 报错且什么都不写的情况：技能名不存在；项目目录不存在；`remove` 一个没加进该项目的名字。
- **不动项目里已有的东西**：目标位置已经有同名的非链接内容（项目自己的技能、用户手动复制的副本），**即使内容和 repo 完全一样**，
  也跳过这个 agent 的这个位置并报告，不替换、不删除，也不记进状态。不复用 `lib/links.mjs` 里 pack 用的
  `replace-copy`（一样就换成链接）和冲突后 `resolve repo`（删掉本地副本）这两条路；`resolve` 不处理项目目录。
  想换成 harness 管理的链接，用户自己删掉副本再 `add`。同名位置已经是指向别处的链接时同样跳过并报告。
- 不迁移现有项目：`D:/Research/Thesis/.claude/skills`（约 30 个手动复制的技能）和 `D:/Research-env`
  （用自己的 `harness/scripts/link-skills.ps1` 链接到 `~/research-project`）保持原样。
- **git**：项目是 git 仓库时，把每个链接的相对路径（如 `/.claude/skills/prototype`）写进该仓库的 `.git/info/exclude`，
  放在带标记的受管块里；`remove` / `uninstall` 时同步删掉。只排除链接本身，不排除整个 `.claude/skills/`，
  以免藏掉项目自己提交的技能。
- `update`：按状态重新同步所有项目的链接。技能在 repo 里换了位置（例如从 global 移到 pack）→ 链接改指新位置；
  技能从 repo 删掉 → 删链接、从状态里去掉、打印一条说明。
- `uninstall --agents X`：同时删掉 X 在各项目里的链接。
- `doctor`：报告项目目录已不存在、链接损坏、状态与实际不符。

### B. `skill-find`（全局、自动触发，替代 skill-router）

- **何时触发**：用户说要做什么项目或任务，需要当前会话没有的领域技能；用户问"这个项目需要什么 skill"、"找个 X 的技能"、
  "帮我装 skill"。**不**因为"某个技能提到了一个当前会话没有的技能"而触发，那种情况按 D 直接读。
- **流程**：
  1. 弄清楚要做什么（信息太少就先问一句）。
  2. 在 `HARNESS.md` 已生成的 pack 索引里按关键词搜（grep），只读相关 pack 的那几节，不把 54KB 全读进来。
  3. 打开候选技能的 `SKILL.md` 看完整描述。
  4. 给出一份短名单（一般不超过 5 个），每个一句理由。
  5. 用户同意后运行 `node <repo>/harness.mjs add <names> <project-dir>`（repo 路径来自常驻指令）。
  6. 告诉用户怎么用上：Claude Code 当前会话即可（若 `.claude/skills/` 是刚建的，先 `/reload-skills`）；其他 agent 新开会话。
- 没有用户同意不安装（它会往用户的项目里写东西）。
- 删除 `skills/global/skill-router/`；`lib/routing.mjs` 不再检查它，也不再检查 `prompt/core.md` 里的路由表（见 D）。

### C. 全局技能名单

| 去向 | 技能 |
|---|---|
| 留全局、自动触发（14） | brainstorming、writing-plans、test-driven-development、systematic-debugging、verification-before-completion、requesting-code-review、handoff、skill-creator、openspec-explore、openspec-propose、pdf、officecli、markitdown、skill-find（新） |
| 全局、只能点名（6） | action-first、improve-codebase-architecture（已经是）；openspec-apply-change、openspec-archive-change、skill-scanner、skillspector（新改） |
| 移进 `dev-project/skills/`（9） | codebase-design、domain-modeling、prototype、dispatching-parallel-agents、subagent-driven-development、executing-plans、using-git-worktrees、receiving-code-review、finishing-a-development-branch |
| 移进 `productivity-project/skills/`（4） | first-principles-thinking、github-gold、teach、book-to-skill |
| 移进 `craft-project/writing/skills/`（1） | no-ai-slop |
| 移进 `dev-project/testing-qa/skills/`（1） | playwright-interactive（依赖 Codex 的 `js_repl`） |
| 删除（2） | using-superpowers（选技能的规则已由常驻指令和 skill-find 覆盖）、high-agency（要求"所有任务都触发"，并用施压话术，跟每个技能抢触发） |
| 改造 | skill-router → skill-find |

- 新改为点名的 4 个：frontmatter 加 `disable-model-invocation: true`，并加 `agents/openai.yaml`
  （`policy.allow_implicit_invocation: false`），让 Codex 也不自动调用。
- 移动用 `git mv`，正文不改；同步更新 `skills/global/catalog.json`、`skills/sources.json` 里的路径、
  `skills/global/README.md`、`HARNESS.md`（重新生成）、`README.md` / `PLAYBOOK.md` 里提到的地方。
- 结果：dev-project 根 18 → 27 个，productivity 24 → 28，craft/writing 1 → 2，testing-qa 3 → 4。

### D. 常驻指令（`prompt/core.md`）

- "Local Skill Packs" 一节：删掉"领域 → home 目录"的路由表和"先问要不要换目录重开、等回答"的规则（4 天前 `a7314ae` 加的）。
  换成几句话：领域技能存在 repo 的 pack 里；用户要开始一个项目、或主动要技能时用 `skill-find`；**某个技能提到一个你没有的技能时，
  直接读 `{{REPO}}/skills/` 下同名目录的 `SKILL.md` 照着做，不问用户、不装进项目**。最后这句解决移走技能后的悬空引用
  （brainstorming → codebase-design / domain-modeling / prototype，writing-plans → executing-plans / subagent-driven-development /
  using-git-worktrees，requesting-code-review → receiving-code-review 等），不用改 vendored 正文；只读不写，在哪个项目都能用。
  已知代价：Claude Code 读项目外的文件，在非 bypass 模式下可能弹权限确认。
- 保留"文档类任务直接用全局 pdf / officecli / markitdown"那句。
- "Starting work" 一节去掉"before the pack question under Local Skill Packs"（已经没有这个问题了）。
- **点名技能清单自动生成**：`core.md` 加 `{{NAMED}}` 占位符，由 `lib/prompt.mjs` 按 frontmatter
  （`disable-model-invocation: true`）和 `catalog.json` 的一句话用途生成，例如 "`/action-first` — 输出风格开关"。
  理由：Claude Code 不把这类技能的描述放进上下文，不写出来 agent 就不知道它们存在，没法提醒用户用 `/名字` 调用。
- `agents/pi/notes.md` 里写死的技能引用（codebase-design、subagent-driven-development）随之更新。

### E. 描述压缩与预算检查

- 压缩留在全局、自动触发的 14 个技能的描述（含新写的 skill-find）。规则：
  - 必须保留：做什么、什么时候用、与相近技能的区别；**所有中文触发说法**；所有明确的分界（如 brainstorming 与
    openspec-explore / writing-plans、officecli 与 pdf / markitdown）。
  - 可以删：同一意图的多种英文说法、功能枚举、正文里已有的步骤细节、对已移走技能的比较。
  - vendored 技能在 `metadata.source` 里记一句"为技能列表预算压缩了描述"（repo 现有约定），以免下次同步上游时被原样覆盖回去。
- 预算检查加进 `lib/skillspec.mjs`、由 `check` 调用：全局自动技能的描述总字数不超过上限；超了就失败并列出最大的几个。
  上限 = 压缩后的总字数 × 1.2，向上取整到百位。点名技能不计入。
- **触发测试**（只测 Claude Code，其他 agent 没有现成工具）：
  - 测 7 个：压缩得多的 brainstorming、officecli、requesting-code-review、pdf、skill-creator、handoff，加新写的 skill-find。
  - 每个技能约 10 条该触发的提问（含用户常用的中文说法）+ 约 8 条不该触发的（优先放相近技能的提问，如给 brainstorming
    放 openspec-explore / writing-plans 的说法）。测试集存进 repo（如 `evals/triggers/<name>.json`），以后改描述可以重跑。
  - 用 `evals/triggers/run.mjs`（零依赖 Node 脚本，测试集格式与 skill-creator 相同）直接测本机已安装的真技能：
    移动完成并 `update` 后跑一次基线，压缩后再跑一次（链接指向工作树，改完即生效），每条 1 次，
    合计约 250 次 `claude -p` 短调用（会花 API 额度）。结果在边界上的技能再用 3 次/条重跑。
  - 通过标准：该触发的命中率不低于压缩前，不该触发的误触发不高于压缩前。不通过的技能把删掉的说法补回去再测，不阻塞其他技能。
  - 不用 skill-creator 的 `run_eval.py`（实施计划阶段的决定）：它用 `select.select` 读管道，Windows 上会直接报错；
    它把被测描述写成临时副本 `<name>-skill-<id>`，会和本机同名的真技能抢触发。直接测真技能没有这两个问题，
    邻近技能之间的竞争也更真实。

### F. 实施顺序（每步单独提交）

1. ~~合并修 bug 的分支，在本机跑 `node harness.mjs update`。~~ 已完成（2026-11-19）。
2. `add` / `remove` + 状态 + `update` / `uninstall` / `doctor` 的处理 + 测试。
3. `skill-find`，删 `skill-router`，改 `routing.mjs`、`core.md`、`{{NAMED}}`、Pi 说明。
4. 全局技能移动、删除、改点名，更新 catalog / sources / README / HARNESS。
5. 先跑压缩前的触发测试，再压缩描述 + 预算检查，再跑压缩后的触发测试（见 E）。
6. 本机 `node harness.mjs update`，`doctor --deep`；在一个真实项目里试一遍 skill-find → add → Claude Code 当前会话能用上。

## 留给实施者

- CLI 输出措辞、状态文件 `version` 是否要升、`.git/info/exclude` 受管块的具体格式。
- 本机没有任何已安装 agent 时 `add` 怎么报错。
- 逐个 agent 实测项目技能目录确实会被读到（如在项目里跑 `codex debug prompt-input`、`opencode debug skill`），
  把结果记进 `docs/harness-v2.md` 的已知限制。
- Claude Code 通过 junction 新加的技能是否被实时发现：实测；不行就在 skill-find 第 6 步统一提示 `/reload-skills`。

## 待用户决定

无。最后一轮（2026-11-19）的 4 个决定已写进上面各节：`add` 不动项目里已有内容（A）；技能提到别的技能时直接读、
skill-find 不为此触发（B、D）；只测 7 个技能的触发（E）；bug 分支已合并、guard 边界不变（约束、F）。
