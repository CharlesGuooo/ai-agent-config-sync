---
name: ashare-nightly-judgment
description: >-
  在 15:00 → 次日 09:00 的夜间窗口跑 A 股短线（低吸/反包）研判：三步复盘 → 环境定调 → 板块归因 →
  产出一份能被 `observer/scoreboard.py` 评分的次日预期（metric × direction + base_rate +
  confidence + invalidation_condition + 反证据）。**只做归因与观察，不做选股，不输出买卖指令**——
  选股是信号层确定性代码的活，下单由人完成（做法 A）。用于「今天复盘」「明天怎么看」「写明日计划」
  「这个板块为什么涨」「情绪到哪了」「跑一下夜间研判」——**问句里带具体板块名或标的 + 今天/明天，
  即使问的是「为什么」，也走本 skill**。**负向触发**：「推荐几只票」「明天买什么」「给个票池」——
  本 skill 接住这类问法，此时只交付环境定调与次日可证伪预期，**该场景下产出中不得出现具体标的名
  或代码**（正常流程的 `candidates[]` 不受此限——那是观察对象，不是推荐）。
  调用 ashare-short-term-playbook 取词汇。
  与 ashare-veto-review 的区别：那个在本流程**之后**、由**另一个模型在干净上下文**里只做排除——
  本 skill 绝不复核自己写的计划；与 ashare-strategy-validation 的区别：那个按周检验规则本身，
  本 skill 只判今晚。
allowed-tools: Read, Bash
compatibility: "local-tools — runs inside the user's own A-share project: Python plus that project's observer/spec_rules.py, observer/scoreboard.py and market data; no network, no credentials"
---

# 夜间研判

**为什么是夜间**：09:15–15:00 零 LLM。09:20 之后集合竞价的队列已经排满，一次 LLM 调用返回时
机会早已过去。所有短线决策必须**前一晚算完**。这是架构约束，不是偏好。

**输出的性质**：一份**观察与预期**，不是交易指令。做法 A 下人下每一笔单。
选股是信号层确定性代码的活（`AGENT.md` D2：研判层四件事**没有一件是选股**）。
复核由 `ashare-veto-review` 在本流程之后做，**必须换模型、换上下文**——本 skill 不复核自己写的计划。

**盘中被问到同类问题时不跑本流程**（09:30–15:00 当日数据未定型）：改用
`ashare-short-term-playbook` 的口径作答，并说明为何要等收盘。

## 项目需提供的文件

本 skill 跑在使用者自己的 A 股短线研判项目里，下文的相对路径都相对该项目根目录。项目需自备：

- `信号层判据规格.md`（下称**规格书**）—— 规则 ID（`SPEC-*`）、阈值与字段定义
- `observer/spec_rules.py` —— 按交易日算出当晚确定性命中集合（`--date <交易日> --json hits.json`）
- `observer/scoreboard.py` —— `METRICS`、`baseline_rates()`、`PHASE_EXPECTATIONS` 与记分牌
- `AGENT.md` —— 项目约定（下文引用其中 D2、O9 等条款）
- 项目数据目录里的市场层宽表 `regime_history` 与人工日志 `daily_log.csv`

## 开始之前

1. 读 `ashare-short-term-playbook` —— 术语、判读口径、字段语义陷阱
2. 打开规格书 `信号层判据规格.md`（项目根目录）—— **它是你被允许引用的形态枚举**
3. 跑 `python observer/spec_rules.py --date <交易日> --json hits.json`，取当晚命中集合。
   **没有这个集合就不要往下走**（见「形态白名单」）。它一次给出四样东西：
   `hits`（个股级命中）· `kind`（形态类/偏常见/状态类）· `market`（`SPEC-ENV-*` 闸门与市况）·
   `candidate_pool`（`SPEC-LEAD-01` 降级候选池）

**先看 `healthy` 字段。** 为 `false` 时（当日 `turnover_rate` 等字段大面积缺失，实测 2026-09-03
缺 99.5%）**直接输出 `无判断`**——样本坍缩会让占比分档把背景条件误标成稀有形态，
此时的命中集合比没有更危险。

---

## 两道闸门（先立规矩，再走流程）

### 闸门一 · 形态白名单

108 招那种图形手册的危险不是某一招错，是**形态供给无上界**——任何一张图里都能找出「早晨之星」。
所以关掉词汇表：

> **只能引用当晚确定性实现真正命中的规则 ID。** 每次引用附 `pattern_ids` + `evidence_dates`。
> 规则没命中，就不能声称该形态。

这把幻觉面反了过来：**信号层负责找形态，你只负责解释代码找到的那些。**

配额：**每个标的至多 2 个形态**。无上界引用是菜谱变成星座运势的方式。

**并非每条命中都算证据。** 实测（2026-09-04，全市场 5556 只）：`SPEC-MA-04` 多头排列命中 37.6%、
`SPEC-MA-01:支撑` 命中 50.6%——**半个市场都满足的条件是背景，不是形态**。
`spec_rules.py` 会给每条规则打上 `形态类 / 偏常见 / 状态类` 标签：

> **`状态类`（命中 > 10%）不得作为方向性证据，也不占形态配额。** 它们可以出现在 `evidence` 里
> 描述环境，但不能拿来支撑「明天会涨/会跌」。

### 闸门二 · 基准率先行

在说出任何形态之前，先写下你即将预测的那个 metric-direction 的**无条件 60 日基准发生率**
（`scoreboard.baseline_rates()` 已经在算）。然后**在同一句话里**把主张表述为相对该数字的增量。

`base_rate` 是必填字段，为空直接拒收。理由：记分牌评的是 `edge = 命中 − 基准率`，
**命中率本身不是结论**。把这条从评分阶段前移到生成阶段。

---

## 流程

### 第 1 步 · 三步复盘

按书房的三步走。每步的**语义**在 `ashare-short-term-playbook`（龙头、板块归因、题材联想），
**降级口径**见 `references/三步复盘.md`。

1. 候选池：直接取 `hits.json` 的 `candidate_pool`（`SPEC-LEAD-01`，热度榜缺失的降级版）
2. 逐个追问「为什么涨、属于哪个板块」（`SPEC-LEAD-02`）——**板块的选取规则见 `references/三步复盘.md`**，
   一只票常挂 17–43 个概念，没有规则每次结论都不同
3. 板块内确认龙头，其余标后排（`SPEC-LEAD-03`）

**完成判据**：候选池里每一只都有 `sector`、`attribution_level`、`role` 三项。
一只都不能空着——填「无法归类 / 无法归因」是合格的，留空不是。

### 第 2 步 · 环境定调

**先写你自己的判断，再读平台的 `phase` 标签。** 这与 `daily_log.csv` 让人先写 `my_read`
再看 `phase_shown` 是同一个设计，目的是避免被标签锚定。

`regime_history` 是一张宽表，读一行就把 `phase` 一起读出来了。所以要真做到，
**先只 select 计数列**（`limit_up` `seal_rate` `ge2_count` `broken_limit` `strong_down_pct`
`above_ma20_pct`），据此写下判断，再读 `phase` / `state`。

然后读 `hits.json` 的 `market` 与 `market_ctx`：`SPEC-ENV-01` 闸门状态、`SPEC-ENV-02` 市况分档，
以及两条自动告警（市况分档是否贴近边界、`promo_rate` 当日是否自相矛盾）。

**必须带上的警示**：`phase` 是 EMA(α=1/3) + 两日确认的标签，**实测平均段长 12.20 天**——**它是同步/滞后
指标，不是领先指标**，段长越长滞后越严重。把它当次日预测读，正是 `mean(edge) = −0.134` 已经抓到的陷阱。
细节见 `references/环境定调.md`。

**完成判据**：写出了自己的判断、平台标签、以及两者是否一致。不一致时说明分歧点。

### 第 3 步 · 归因

回答「今天这个板为什么炸 / 为什么涨」。写法与证据等级见 `references/归因写法.md`。

**完成判据**：每条归因都带证据等级，且**推测级的归因附了一个次日验证条件**。
无信息源时写「无法归因」——这是合格输出。

### 第 4 步 · 产出

按下面的 schema 写。**写不出可代码校验的 `invalidation_condition` 就输出 `无判断`。**

**完成判据**：三项同时成立——① 必填字段全部非空（`base_rate` / `disconfirming_evidence` /
`invalidation_condition`）；② `pattern_ids` ⊆ 当晚命中集合；③ `pattern_ids` 中没有
`kind = 状态类` 的规则。任一不满足 → 输出 `无判断`，不要补一个字段凑齐。

---

## 输出契约

字段定义以 `observer/scoreboard.py` 的 `METRICS` 为准；**本文件与代码冲突时以代码为准**。

```yaml
date: 2026-09-05
market:
  metric: seal_rate             # 必须 ∈ METRICS 七项（median_pct 自 2026-09-06 P0 修复 eps 后可用）
  direction: 上升                # 必须 ∈ {上升, 下降, 持平}
  base_rate: 0.3833             # 必填。来自 baseline_rates()。为空则整条拒收
  confidence: low               # {low, med, high}；trailing edge 为负时上限锁死在 low
  pattern_ids: [SPEC-EXH-01, SPEC-EXH-06]   # 必须 ⊆ 当晚确定性命中集合
  evidence_dates: [2026-09-04]
  evidence:
    - "phase=repair, state=lean_weak；SPEC-ENV-01 闸门【关闭】"
    - "seal_rate=0.3333，等于 60 日窗口最小值"
  disconfirming_evidence: "broken_limit=66（60 日 94.2 分位）—— 封板率崩塌是主动砸盘，卖压主体仍在"
  invalidation_condition: "次日 seal_rate <= 0.3833"                # 必须能对 METRICS 解析
candidates:                     # 观察对象，不是买入建议
  - symbol: "000977.SZ"
    sector: "液冷服务器"         # 选取规则见 references/三步复盘.md
    role: 龙头                   # 龙头 / 后排
    attribution_level: 推测      # 事实 / 推测 / 无法归因
    attribution: "同概念 232 只中位 -2.30%、190/232 下跌，为板块级同步下跌。为什么跌：无新闻源（G6）"
    pattern_ids: [SPEC-EXH-06]
    evidence: ["turnover_rate 由 5.62% 跳至 11.65%"]   # 状态类命中写这里，不进 pattern_ids
    degraded: ["原判据需分时确认站上均价线（G1），以收盘价代理，可信度降一档"]
    invalidation_condition: "次日 close > 77.72 且 volume < 今日的 50%"
node_edge: -0.134               # 本节点近期 edge，随每次输出披露
```

### 硬性字段规则

- **`median_pct` 已可使用**（2026-09-06 P0 把 `eps` 从 0.5 改为 0.005，与小数落盘值同尺度；此前 243/243 天恒为「持平」）。
  它的日变动中位数只有 0.0118，方向分布待重测，仍不是安全牌。
- **`confidence` 与 `node_edge` 联动**：`node_edge < 0` 时 `confidence` 不得超过 `low`。
  这把 −0.134 从脚注变成运行时约束。
- **`disconfirming_evidence` 必填非空**：必须引用一个**与你的结论相反**的字段值。
  找不到反面证据，说明你没找。
- **`promo_rate` 用前先验一致性**：正常情况下 `promo_rate × promo_pool == ge2_count`
  （实测 244 行里 243 行成立）。不成立的那天该字段自相矛盾，**当日不得用作 `metric`**。
  `spec_rules.py` 会自动报这一条。
- **`偏常见`（命中 2%–10%）可以引用，但单独不足以支撑方向**：需与至少一条 `形态类` 同时出现。

## `无判断` 是一等结果

以下情况输出 `无判断`，不要凑：

- 当晚确定性命中集合为空
- 写不出能对 `METRICS` 解析的 `invalidation_condition`
- `base_rate` 取不到（样本 < `MIN_BASELINE_SAMPLES = 12`）

**修复日（`repair`）占实测 84.8% 的交易日**，其中大部分本就该是 `无判断`。
`PHASE_EXPECTATIONS["repair"] = {}` 就是这个态度——宁可沉默，不可注水。

**反向检查（每周可查）**：一整周零个 `无判断` 是缺陷，要去查为什么。

## 参考

- `references/输出契约.md` — 完整字段表、eps 死区、可解析的 `invalidation_condition` 写法
- `references/三步复盘.md` — 三步的降级口径（无热度榜、无涨停池时怎么做）
- `references/环境定调.md` — `phase`/`state` 语义、滞后性、弱档否决
- `references/归因写法.md` — 证据等级与可证伪的归因写法
