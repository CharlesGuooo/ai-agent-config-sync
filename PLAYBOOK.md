# PLAYBOOK — 全局 skill 怎么用(给人看的操作手册)

装了不会用等于没装。这份文档解决一个问题:**什么时候、说什么话、触发哪个 skill。**

> - **权威技能清单**在 `HARNESS.md`(自动生成,不漂移)和 `skills/global/catalog.json`。
>   本文是**用法**指南,不是清单 —— 不逐个枚举,只讲怎么用。
> - **架构和总览**在 `README.md`。**装机**在 `INSTALL.md`。

---

## 🎯 第一件事:你不需要记住全部

绝大多数 skill 是**模型按描述自动触发**的 —— 你一提"这报错了",`systematic-debugging`
自己就上来了,不用你喊。

**你真正需要记住的,是那些"不主动开口它就不会来"的。大概 8 个。** 先把这 8 个刻进脑子,
其余的忘掉也没关系。

---

## 🗣️ 需要你主动喊的 8 个

| 你心里想的 | 你说什么 | 触发 |
| --- | --- | --- |
| 这想法还没想透 / 帮我挑毛病 | **"grill me"** / **"盘问我"** | `brainstorming` |
| 这代码库到底哪里烂 | "做个架构体检" | `improve-codebase-architecture` |
| 这设计行不行,先验证一下 | "先做个原型" / "spike 一下" | `prototype` |
| 我们说的好像不是一个东西 | "把术语定下来" / "写个 ADR" | `domain-modeling` |
| 上下文快满了但活没干完 | **"写个交接"** | `handoff` |
| 合并前帮我审一遍 | "review 一下我的改动" | `requesting-code-review` |
| 这活该在哪个目录干 | "我该 cd 去哪" | `skill-router` |
| 想装个外面的 skill | "先扫一下安全" | `skill-scanner` |

其余的按需:`teach`(让它教你一个概念,多轮带记忆)· `first-principles-thinking`(逼它
从第一性原理重推,别照搬惯例)· `pua` / `high-agency`(它偷懒或活很长时加压)。

## 🤖 会自动来的(别操心)

一写代码 → `test-driven-development` · 一报错 → `systematic-debugging` ·
一说"完成了" → `verification-before-completion` · 一提 PDF/Word/Excel/PPT →
`pdf` / `officecli` / `markitdown` · 多步实现 → `writing-plans` / `executing-plans` ·
GitHub PR/CI → `gh-fix-ci` / `gh-address-comments`。

OpenSpec 那 4 个走 `/opsx:` 命令,不靠描述触发。

---

## 🚀 主线:vibe coding 一个程序(0 → 合并)

### ① 想清楚 —— 别跳过,这步最省时间

> 你:**"我想做个 X。grill me"**

`brainstorming` 上场。它的规矩是:

- **一次只问一个问题**(一次抛一堆没法回答)
- **每个问题都先给出它推荐的答案** —— 你的活是"纠正它",比"从零想一个"便宜得多
- **能从代码库/文件系统查到的事实,它自己去查**,只把**决策**交给你
- **你不点头,它不动手**

> 术语对不齐 → 顺手 `domain-modeling`,把词钉死在 `CONTEXT.md`
> 核心设计没把握 → `prototype`,花 20 分钟写个一次性玩具验证,别在纸上吵

### ② 落成计划

> "写个实现计划" → `writing-plans`
> 或 `/opsx:propose` → OpenSpec 生成 proposal / design / tasks

### ③ 去对的地方

> "这活该在哪做" → `skill-router` → 例如 `cd ~/dev-project/frontend`

**进目录之后,那个 pack 的领域技能才加载。** 这是分层的意义:不进去就完全不花钱。

### ④ 写

`test-driven-development` 自动上场:先写会失败的测试 → 最小代码通过 → 重构。
新增的三条硬规矩:

- **只在系统边界 mock**(外部 API / DB / 时间 / 随机),**绝不 mock 自己的模块**
- **禁止同义反复的断言** —— 期望值不能用实现的算法再算一遍,要写死成独立的字面量
- **通过接口验证**,不要绕到数据库里查

> 设计模块接口时 → `codebase-design`(深模块、接缝切在哪、"删除测试")

### ⑤ 卡住了

> 报错 → `systematic-debugging`

**新增的 Phase 0 硬门禁:先造出一条稳定会变红的命令,才准开始猜原因。**
"还没有复现命令就开始读代码找理论" —— 这正是它要拦的失败模式。

### ⑥ 收尾

> "完成了" → `verification-before-completion` 会拦你:**拿证据来**
> "review 一下" → `requesting-code-review`:派**两个并行子 agent**,一个只查代码规范
> (含 Fowler 坏味道基线),一个只查是否符合原始需求 —— **两份报告分开呈现,不合并**
> (一个通过、另一个挂,是常事)
> 有意见 → `receiving-code-review`(技术性回应,不是无脑照做)
> "收掉这个分支" → `finishing-a-development-branch`

### ⑦ 没干完就要断了

> **"写个交接"** → `handoff` 把状态压成一份文档(自动脱敏 key/密码),写到工作区**外面**,
> 下个会话直接接上。

---

## 🔁 另外几条高频路径

**修 bug**
`systematic-debugging`(先造复现命令)→ `test-driven-development`(把 bug 写成失败测试)
→ `verification-before-completion`

**接手一个烂代码库**
`improve-codebase-architecture`(扫出候选 + 可视化 HTML 报告,带 before/after 图和推荐强度)
→ 你挑一个 → `brainstorming` 盘问细节 → `codebase-design` 定接口 → `domain-modeling` 同步术语

**改这个 harness 本身**
`writing-great-skills`(标尺:触发 / 结构 / 引导 / 修剪)→ `skill-creator`(写)
→ `skill-scanner`(装任何外部 skill 前先扫)→ 跑 `node scripts/gen-skill-table.mjs` + `gen-harness.mjs`

**非代码工作(研究 / 写作 / 金融 / 营销)**
`skill-router` 送你进对应 pack。全局层里仍然好用的:`brainstorming`(盘问任何决策,
不限代码)· `handoff` · `officecli` / `pdf` / `markitdown` · `teach`。

---

## 🧠 一句话记法

> **想不清就 grill,动手前先 plan,写代码自动 TDD,说完成前先验证,
> 合并前双轴 review,做不完就 handoff。**

---

## 📐 为什么不是全部塞进全局

全局层是**常驻收费**的:每个技能的 description 每轮都在上下文里。实测(2026-07):

| | |
| --- | --- |
| 全局技能常驻成本(仅 name + description) | **~3,300 tokens / 轮** |
| 若所有正文都加载(实际不会) | ~87,500 tokens |
| 常驻部分占技能全文比例 | **3.8%** |

在 1M 上下文里常驻成本约 **0.3%** —— 渐进式披露有效,正文只在触发时才读。
**所以"token 太贵"已经不再是限制因素。**

真正的限制变成了**区分度**:

> 早期的问题是"模型不够强,选错技能"。
> 现在的问题是"两个技能描述重叠,导致**根本不存在**正确答案可选"。
> 模型再强也救不了设计缺陷。

**因此加新 skill 的判据是这一条:**

> **能不能用一句话说清 —— 什么时候该用它,而不该用它旁边那个?**
> 说不清 → 它和旧的是同一件事,**该合并进旧的,不该新增。**

这也是为什么每个 skill 的 description 里都硬写了区分句("Distinct from …")。
2026-07 引入 `mattpocock/skills` 时按这条执行:重叠的 5 个**改造进已有技能**,
只有真空白的 5 个才新增 —— 所以是 31→36,不是 31→53。

**分层规则:**

| 层 | 放什么 | 成本 |
| --- | --- | --- |
| **全局** `skills/global/` | 零领域假设的流程 / 路由 / 元技能 | 常驻,每轮都花 |
| **本地包** `skills/project-packs/` | 领域专属(论文 figure、DCF 模型、SwiftUI…) | **进目录才加载,不进免费** |

判断题:**"这个技能,我写论文时用得上吗?做金融建模时用得上吗?"**
都用不上 → 进本地包。

---

## ⚠️ 常见误区

- **"技能装了它就会自动变好"** —— 不会。`brainstorming` 这类要你开口喊。
- **"全局技能越多越强"** —— 重叠的技能会互相稀释,让模型无从选择。宁可合并。
- **"跳过 grill 直接写"** —— 最常见的浪费。需求没问透写出来的东西大概率要返工。
- **"说完成了就是完成了"** —— `verification-before-completion` 存在的理由:证据优先于断言。
- **手改生成块** —— `<!-- SKILLS:BEGIN -->` / `<!-- PACKS:BEGIN -->` 之间的内容跑生成器,
  别手写,`--check` 门禁会拦你。
