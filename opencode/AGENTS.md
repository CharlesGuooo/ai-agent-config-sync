# OpenCode 全局指令

## 核心行为准则

1. **主动思考** - 在执行任务前先分析需求和最佳方案
2. **穷尽方案** - 不轻易说"无法解决"，先尝试所有可能
3. **验证优先** - 完成任务后验证结果，不自假设成功
4. **上下文意识** - 理解项目背景和用户意图

---

## 全局核心 Skills（8个）

| 触发场景 | Skill | 用途 |
|----------|-------|------|
| 创意任务开始 | `brainstorming` | 创意发想 |
| 编写代码 | `test-driven-development` | TDD 开发 |
| 遇到 bug | `systematic-debugging` | 系统调试 |
| 完成任务前 | `verification-before-completion` | 结果验证 |
| 编写计划 | `writing-plans` | 实现计划 |
| 执行计划 | `executing-plans` | 执行已写计划 |
| 失败 2+ 次 | `pua` | 穷尽方案 |
| 需要动力 | `high-agency` | 高主动性 |

---

## 项目级 Skills (8个启动目录)

当任务涉及特定领域时，**切换到对应项目目录启动 OpenCode**：

| 领域 | 目录 | Skills |
|------|------|--------|
| 科学计算 | `~/scientific-project/` | 46 (scanpy, rdkit, pytorch...) |
| 数据库查询 | `~/database-project/` | 23 (pubmed, openalex...) |
| 数据分析 | `~/data-analysis-project/` | 24 (matplotlib, seaborn...) |
| 开发 | `~/dev-project/` | 50 (frontend, backend...) |
| 营销 | `~/marketing-project/` | 32 (copywriting, seo...) |
| 研究 | `~/research-project/` | 24 (literature-review...) |
| Office | `~/office-project/` | 7 (pdf, docx, xlsx...) |
| 生产力 | `~/productivity-project/` | 24 (obsidian, jira...) |

### 使用方式

```bash
cd ~/scientific-project/ && opencode   # 科学计算
cd ~/dev-project/ && opencode          # 开发
cd ~/database-project/ && opencode     # 数据库
cd ~/marketing-project/ && opencode    # 营销
cd ~/research-project/ && opencode     # 研究
```

### 领域关键词

| 关键词 | 项目目录 |
|--------|----------|
| 单细胞, RNA-seq, 基因, 蛋白质, 分子, ML, 深度学习 | `~/scientific-project/` |
| 文献, PubMed, OpenAlex, 化合物, 蛋白质查询 | `~/database-project/` |
| DataFrame, 统计, 可视化, 图表, EDA | `~/data-analysis-project/` |
| 前端, 后端, Docker, CI/CD, API, React | `~/dev-project/` |
| 文案, SEO, 广告, 社交媒体 | `~/marketing-project/` |
| 论文, 综述, 基金, 同行评审 | `~/research-project/` |
| PDF, Word, Excel, PPT | `~/office-project/` |
| Obsidian, Jira, Google Workspace | `~/productivity-project/` |

---

## 全局 MCP (17个)

所有 MCP 全局配置，启动不耗 token，按需调用：

**核心 (4个)**: memory, github, web-reader, zai-mcp-server

**可选 (13个)**: context7, firecrawl, sequential-thinking, vercel, railway, cloudflare-* (4个), playwright, supabase, magic, expo-mcp

---

## 四工具统一

Claude Code、Codex、OpenCode、Cursor 使用**相同的目录和配置**：

```bash
# 四条命令等价，加载相同的 Skills + MCP
cd ~/dev-project/ && claude
cd ~/dev-project/ && codex
cd ~/dev-project/ && opencode
# Cursor: 打开 ~/dev-project/ 目录
```

---

## 配置位置

| 项目 | 路径 |
|------|------|
| 全局配置 | `~/.config/opencode/opencode.json` |
| Skills | symlink → `~/*-project/.claude/skills/` |
| MCP | 全局 17 个 |
