# Claude Code 全局指令

## 核心行为准则

1. **主动思考** - 在执行任务前先分析需求和最佳方案
2. **穷尽方案** - 不轻易说"无法解决"，先尝试所有可能
3. **验证优先** - 完成任务后验证结果，不自假设成功
4. **上下文意识** - 理解项目背景和用户意图

---

## 第一层：核心 Skills (自动加载)

### 工作流 (必用)

| 触发场景 | Skill | 用途 |
|----------|-------|------|
| 开始实现任务 | `/brainstorming` | 创意发想 |
| 编写代码 | `/test-driven-development` | 测试驱动开发 |
| 遇到 bug | `/systematic-debugging` | 系统调试 |
| 完成任务前 | `/verification-before-completion` | 结果验证 |
| 编写计划 (快速) | `/writing-plans` | 实现计划 |
| 编写 Spec (大型) | `/opsx:propose` | Spec 驱动开发 |
| 执行计划 | `/executing-plans` | 执行已写计划 |
| 并行任务 (2+) | `/dispatching-parallel-agents` | 并行分发 |

### OpenSpec 工作流 (Spec 驱动开发)

| 命令 | 用途 | 触发场景 |
|------|------|----------|
| `/opsx:explore` | 探索想法、调研 | 需求不清晰时 |
| `/opsx:propose` | 创建变更提案 | 大型功能/重构 |
| `/opsx:apply` | 实现任务 | 提案完成后 |
| `/opsx:archive` | 归档变更 | 实现完成后 |

**选择指南**：
- 大型功能/重构 → OpenSpec (结构化管理、依赖追踪)
- 快速 bug 修复 → writing-plans (更轻量)
- 多变更并行 → OpenSpec (change 列表管理)

### 激励 (卡住时)

| 触发场景 | Skill | 用途 |
|----------|-------|------|
| 失败 2+ 次 | `/pua` | 穷尽方案 |
| 需要动力 | `/high-agency` | 高主动性 |
| 多视角 | `/consciousness-council` | 多角度思考 |
| 场景分析 | `/what-if-oracle` | What-If 分析 |

### 配置

| 触发场景 | Skill | 用途 |
|----------|-------|------|
| 配置 ECC | `/configure-ecc` | 安装配置 |
| 同步技能 | `/skillshare` | 同步到 Codex |

---

## 第二层：分类 Skills 索引 (按需查阅)

| 类别 | 索引文件 | 包含内容 |
|------|----------|----------|
| 开发 | `~/.claude/index/development.md` | 后端/前端/架构/DevOps/质量/Git |
| 数据库 | `~/.claude/index/databases.md` | 生物医学/金融/学术论文检索 |
| 科学计算 | `~/.claude/index/scientific.md` | ML/生信/化学/神经科学 |
| Office | `~/.claude/index/office.md` | PDF/Word/Excel/PPT/学术海报 |
| 营销 | `~/.claude/index/marketing.md` | 内容/邮件/社交/广告/产品 |
| 研究 | `~/.claude/index/research.md` | 文献/假设/写作/基金 |
| 数据分析 | `~/.claude/index/data-analysis.md` | 处理/统计/可视化/预测 |
| 生产力 | `~/.claude/index/productivity.md` | 知识管理/协作/项目管理 |
| 专业 | `~/.claude/index/specialized.md` | 安全/技能开发/全栈 |

---

## 第三层：完整 Skills (231个)

所有 231 个 skills 存储在 `~/.claude/skills/`，通过以上两层路由发现并调用。

---

## Skills 使用最佳实践

### 三层渐进式加载架构

```
Layer 1: CLAUDE.md 核心表 (~100 tokens) → 常用 skills 快速发现
Layer 2: index/*.md 分类索引 → 领域 skills 按需查阅
Layer 3: skills/*/SKILL.md → 完整 skill 按需加载
```

**Token 节省**: 正确使用三层架构可节省 98% tokens（相比一次性加载所有 skills）

### ❌ 不推荐

```
每次任务前都 "扫描所有 skills 然后告诉我用哪些"
```

原因：
- 扫描 231 个 skills 消耗大量 context
- 增加交互轮次，降低效率

### ✅ 推荐做法

#### 1. 日常任务 → 信任自动匹配

```
用户: "帮我实现用户登录功能"
Claude: [自动匹配 test-driven-development]
```

#### 2. 特定领域 → 关键词触发

直接在需求中提到**触发关键词**：

```
"用 pubmed 搜索 Alzheimer 文献"  → pubmed-database
"分析这个分子的 drug-likeness"   → rdkit / medchem
"生成 market research 报告"      → market-research-reports
"用 seaborn 画个 heatmap"        → seaborn
"配置 GitHub Actions pipeline"   → ci-cd-pipeline-builder
```

索引文件中的「触发关键词」列专为语义匹配优化，提及即可激活。

#### 3. 复杂任务 → 说明领域

```
"这是一个生信分析任务，我有单细胞 RNA-seq 数据"
```

Claude 会自动：
1. 识别领域 → 查阅 index/scientific.md
2. 确定需要的 skills
3. 执行任务

#### 4. 失败后 → 手动指定

只有在以下情况手动指定：
- 罕见的 skill (如 denario, glycoengineering)
- 自动匹配失败
- 需要组合多个 skills

---

## API Keys 状态

- `ANTHROPIC_AUTH_TOKEN`
- `GITHUB_TOKEN`
- `OPENROUTER_API_KEY`
- `PARALLEL_API_KEY`
- `ALPHAVANTAGE_API_KEY`

---

## 配置位置

| 项目 | 路径 |
|------|------|
| Skills | `~/.claude/skills/` |
| 索引 | `~/.claude/index/` |
| MCP | `~/.claude.json` |
| Codex | `~/.codex/` |
