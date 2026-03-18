# OpenCode 全局指令

## 核心行为准则

1. **主动思考** - 在执行任务前先分析需求和最佳方案
2. **穷尽方案** - 不轻易说"无法解决"，先尝试所有可能
3. **验证优先** - 完成任务后验证结果，不自假设成功
4. **上下文意识** - 理解项目背景和用户意图

---

## Skills 配置

OpenCode 自动从以下位置加载 Skills：
- `~/.config/opencode/skills/` - OpenCode 专属 skills
- `~/.claude/skills/` - �� Claude Code 共享的 skills (244个)

**注意**: OpenCode 使用 `skill({ name: "xxx" })` 工具调用 skills，不是斜杠命令。

### 三层渐进式加载架构

```
Layer 1: 核心表 (~100 tokens) → 常用 skills 快速发现
Layer 2: index/*.md 分类索引 → 领域 skills 按需查阅
Layer 3: skills/*/SKILL.md → 完整 skill 按需加载
```

### 核心 Skills (自动加载)

| 触发场景 | Skill | 用途 |
|----------|-------|------|
| 开始实现任务 | `brainstorming` | 创意发想 |
| 编写代码 | `test-driven-development` | 测试驱动开发 |
| 遇到 bug | `systematic-debugging` | 系统调试 |
| 完成任务前 | `verification-before-completion` | 结果验证 |
| 编写计划 (快速) | `writing-plans` | 实现计划 |
| 编写 Spec (大型) | `openspec-propose` | Spec 驱动开发 |
| 执行计划 | `executing-plans` | 执行已写计划 |
| 并行任务 (2+) | `dispatching-parallel-agents` | 并行分发 |

### OpenSpec 工作流 (Spec 驱动开发)

| Skill | 用途 | 触发场景 |
|-------|------|----------|
| `openspec-explore` | 探索想法、调研 | 需求不清晰时 |
| `openspec-propose` | 创建变更提案 | 大型功能/重构 |
| `openspec-apply-change` | 实现任务 | 提案完成后 |
| `openspec-archive-change` | 归档变更 | 实现完成后 |

**选择指南**：
- 大型功能/重构 → OpenSpec (结构化管理、依赖追踪)
- 快速 bug 修复 → writing-plans (更轻量)
- 多变更并行 → OpenSpec (change 列表管理)

### 激励 (卡住时)

| 触发场景 | Skill | 用途 |
|----------|-------|------|
| 失败 2+ 次 | `pua` | 穷尽方案 |
| 需要动力 | `high-agency` | 高主动性 |
| 多视角 | `consciousness-council` | 多角度思考 |

---

## Skills 索引 (按需查阅)

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
| 专业 | `~/.claude/index/specialized.md` | 安全/技能开发/全栈/LangChain |

### 触发关键词机制

索引文件中的「触发关键词」列专为语义匹配优化。在需求中提及关键词即可激活对应 skill：

```
"用 seaborn 画个 heatmap"        → seaborn
"配置 GitHub Actions pipeline"   → ci-cd-pipeline-builder
"分析这个分子的 drug-likeness"   → rdkit / medchem
```

---

## MCP 服务器

已配置以下 MCP 服务器：
- `github` - GitHub API 操作
- `firecrawl` - 网页抓取
- `supabase` - Supabase 数据库操作
- `memory` - 语义记忆
- `sequential-thinking` - 顺序思考
- `vercel` - Vercel 部署
- `railway` - Railway 部署
- `cloudflare-*` - Cloudflare 服务 (docs, builds, bindings, observability)
- `clickhouse` - ClickHouse 数据库
- `context7` - 文档搜索
- `magic` - Magic UI Design
- `filesystem` - 文件系统操作
- `playwright` - 浏览器自动化
- `fastapi` - FastAPI 集成
- `expo-mcp` - Expo/React Native
- `react-native-guide` - React Native 指南
- `web-reader` - 网页读取
- `4_5v_mcp` - 图像分析
- `zai-mcp-server` - ZAI 工具集

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
| OpenCode Skills | `~/.config/opencode/skills/` |
| Claude Skills (共享) | `~/.claude/skills/` |
| 索引 | `~/.claude/index/` |
| MCP | `~/.config/opencode/opencode.json` |

---

## currentDate
Today's date is 2026-03-18.
