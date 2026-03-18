# Codex 全局指令

## 核心行为准则

1. **穷尽方案** - 不轻易说"无法解决"，先尝试所有可能的方法
2. **主动排查** - 向用户提问前，先用工具自行调查
3. **端到端交付** - 解决问题时检查相关问题，不只是"刚好够用"
4. **验证结果** - 完成后验证，不自假设成功

---

## 第一层：核心 Skills (自动加载)

### 工作流 (推荐使用)

| 触发场景 | Skill | 用途 |
|----------|-------|------|
| 开始实现任务 | `brainstorming` | 创意发想 |
| 编写代码 | `test-driven-development` | 测试驱动开发 |
| 调试 bug | `systematic-debugging` | 系统调试 |
| 完成前验证 | `verification-before-completion` | 结果验证 |
| 编写计划 (快速) | `writing-plans` | 实现计划 |
| 编写 Spec (大型) | `openspec-propose` | Spec 驱动开发 |
| 执行计划 | `executing-plans` | 执行已写计划 |

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

| Skill | 触发条件 |
|-------|----------|
| `pua` / `pua-en` / `pua-ja` | 任务失败 2+ 次 |
| `high-agency` | 需要持续动力 |
| `consciousness-council` | 需要多视角思考 |

---

## 第二层：分类 Skills 索引 (按需查阅)

| 类别 | 索引文件 | 包含内容 |
|------|----------|----------|
| 开发 | `~/.codex/index/development.md` | 后端/前端/架构/DevOps |
| 数据库 | `~/.codex/index/databases.md` | 生物医学/金融检索 |
| 科学计算 | `~/.codex/index/scientific.md` | ML/生信/化学 |
| Office | `~/.codex/index/office.md` | PDF/Word/Excel/PPT |
| 营销 | `~/.codex/index/marketing.md` | 内容/邮件/广告 |
| 研究 | `~/.codex/index/research.md` | 文献/写作/基金 |
| 数据分析 | `~/.codex/index/data-analysis.md` | 统计/可视化 |
| 生产力 | `~/.codex/index/productivity.md` | 知识管理/协作 |
| 专业 | `~/.codex/index/specialized.md` | 安全/全栈 |

---

## 第三层：完整 Skills (231个)

存储在 `~/.codex/skills/`，通过以上路由发现调用。

---

## Skills 使用最佳实践

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
Codex: [自动匹配 test-driven-development]
```

#### 2. 特定领域 → 关键词触发

直接在需求中提到关键词：

```
"用 pubmed 搜索 Alzheimer 文献"  → pubmed-database
"分析这个分子的药物性"           → rdkit
"生成市场研究报告"               → market-research-reports
```

#### 3. 复杂任务 → 说明领域

```
"这是一个生信分析任务，我有单细胞 RNA-seq 数据"
```

Codex 会自动：
1. 识别领域 → 查阅 index/scientific.md
2. 确定需要的 skills
3. 执行任务

#### 4. 失败后 → 手动指定

只有在以下情况手动指定：
- 罕见的 skill (如 denario, glycoengineering)
- 自动匹配失败
- 需要组合多个 skills

---

## 配置

- approval_policy: never (不询问权限)
- sandbox_mode: danger-full-access (完全访问)
- Skills 目录: `~/.codex/skills/`
- 索引目录: `~/.codex/index/`
