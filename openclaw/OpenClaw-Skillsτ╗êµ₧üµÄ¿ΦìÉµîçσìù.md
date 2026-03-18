# OpenClaw Skills & MCP 终极推荐指南

> 基于全网调研（ClawHub 官方市场 18,679 个 skills、VoltAgent 5,490 精选、DataCamp Top 100+、Composio Top 10、Reddit/Indie Hackers 社区评测），精选出最值得安装的 OpenClaw Skills。

**核心原则：** 只推荐"最好的"，不凑数。每个场景仅保留 Top 1-3。

---

## 一、OpenClaw Skills 生态概览

OpenClaw 的 Skills 生态以 **ClawHub**（clawhub.ai）为中心，这是一个类似 npm 的 Skills 市场，由 @steipete（Peter Steinberger）创建并维护。截至 2026 年 3 月，ClawHub 上共有 **18,679 个非可疑 skills**，但根据 Composio 的评测，"大约 80% 是垃圾或恶意的"。2026 年 2 月 Koi Security 的审计更是发现了 **341 个恶意 skills**。

因此，选择 skills 时必须格外谨慎。本指南中的所有推荐均经过以下交叉验证：

- ClawHub 下载量和 stars 排名
- 多个独立社区（Reddit、DataCamp、Composio）的重复推荐
- 作者信誉（@steipete 等核心贡献者优先）
- 官方 openclaw/skills 仓库的收录

---

## 二、按场景精选推荐

### 场景 1：元能力 — 让 Agent 更聪明、更安全

| 推荐等级 | Skill | 下载量 | 一句话说明 |
|---------|-------|--------|-----------|
| **必装** | self-improving-agent | 137k | 自动捕获错误和学习，持续改进 |
| **必装** | skill-vetter | 43.8k | 审查其他 skills 是否安全 |
| 强烈推荐 | proactive-agent | 73.9k | 主动型代理，不等你问就先做 |
| 推荐 | auto-updater | 34.5k | 自动更新 agent 和 skills |
| 推荐 | agentguard | — | 安全守卫，防止恶意执行 |

### 场景 2：搜索 & 信息获取

| 推荐等级 | Skill | 下载量 | 一句话说明 |
|---------|-------|--------|-----------|
| **必装** | tavily-search | 142k | 下载量第一，AI 优化搜索 |
| **必装** | summarize | 107k | 总结任何 URL/PDF/音频/YouTube |
| 推荐 | brave-search | 33.3k | Brave 搜索 API |
| 推荐 | exa-web-search-free | — | 开发者导向搜索（文档、GitHub）|
| 中文用户 | baidu-search | ~29k | 百度搜索 |

### 场景 3：编程开发

| 推荐等级 | Skill | 下载量 | 一句话说明 |
|---------|-------|--------|-----------|
| **必装** | github | 85.8k | gh CLI 交互，管理 repos/issues/PRs |
| 强烈推荐 | coding-agent | — | 后台编码模式 + tmux 集成（by @steipete）|
| 推荐 | debug-pro | — | 系统化 debug 流程 |
| 推荐 | conventional-commits | — | 规范化 commit message |
| 推荐 | playwright-mcp | — | 完整浏览器自动化 |

**额外推荐（通过 ClawHub 安装）：**
- `npx clawhub@latest install buildlog` — 构建日志分析
- `npx clawhub@latest install deepwiki` — 深度 Wiki 搜索

### 场景 4：学术研究（重点推荐）

| 推荐等级 | Skill | 一句话说明 |
|---------|-------|-----------|
| **必装** | literature-review | 多源学术搜索（S2 + OpenAlex + Crossref + PubMed），自动去重，可起草文献综述 |
| **必装** | academic-writing | 学术写作专家（论文、文献综述、方法论）|
| 强烈推荐 | academic-writing-refiner | 针对顶级会议（NeurIPS/ICLR/ICML/AAAI）优化论文 |
| 强烈推荐 | super-research | "终极 AI 研究系统"，结合 8 个顶级研究 skills |
| 推荐 | arxiv-watcher | ArXiv 论文搜索和摘要 |
| 推荐 | pubmed-edirect | PubMed 生物医学文献查询 |
| 推荐 | research-paper-kb | 跨会话的研究论文知识库 |
| 推荐 | literature-manager | 搜索、下载、转换、组织学术文献 |
| 推荐 | academic-deep-research | 透明、严谨的学术深度研究 |

### 场景 5：视频创作 & 媒体

| 推荐等级 | Skill | 下载量 | 一句话说明 |
|---------|-------|--------|-----------|
| **必装** | video-cog | — | 长视频 AI 制作（多步骤规划、分镜）|
| 强烈推荐 | veo | — | Google Veo API 视频生成 |
| 推荐 | video-agent | — | HeyGen Video Agent API |
| 推荐 | nano-banana-pro | 40.1k | Gemini 3 Pro 图片生成/编辑 |
| 推荐 | openai-whisper | 37.3k | 本地语音转文字 |
| 推荐 | manim-composer | — | 数学动画（Manim 风格）|
| 推荐 | excalidraw-diagrams | — | Excalidraw 图表生成 |

### 场景 6：写作 & 内容创作

| 推荐等级 | Skill | 下载量 | 一句话说明 |
|---------|-------|--------|-----------|
| 推荐 | humanizer | 41.4k | 去除 AI 写作痕迹 |
| 推荐 | humanize-ai-text | 27.8k | AI 文本人性化（另一个实现）|

### 场景 7：生产力 & 笔记

| 推荐等级 | Skill | 下载量 | 一句话说明 |
|---------|-------|--------|-----------|
| 强烈推荐 | gog | 96k | Google Workspace CLI（Drive, Docs, Sheets, Calendar）|
| 推荐 | obsidian | 41.7k | Obsidian 笔记管理 |
| 推荐 | notion | 46.9k | Notion API 集成 |
| 按需 | slack | 23.7k | Slack 控制 |
| 按需 | trello | 21.1k | Trello 项目管理 |
| 按需 | gmail | 22k | Gmail API |

### 场景 8：数据分析

| 推荐等级 | Skill | 一句话说明 |
|---------|-------|-----------|
| 推荐 | data-analyst | SQL/表格分析、图表、报告 |
| 推荐 | senior-data-scientist | 世界级数据科学 skill |

**额外推荐（通过 ClawHub 安装）：**
- `npx clawhub@latest install duckdb` — CSV/Parquet/JSON 快速分析

### 场景 9：MCP & 工具集成

| 推荐等级 | Skill | 下载量 | 一句话说明 |
|---------|-------|--------|-----------|
| **必装** | mcporter | 31.8k | 官方 MCP Server 管理工具 |
| 推荐 | api-gateway | 37.2k | 连接 100+ API（OAuth）|

---

## 三、安装策略

### 黄金法则：不要一次装太多

Reddit 社区反复强调的共识是：**Skills 数量控制在 10-15 个以内**。装太多会导致：
- Agent 选择困难，不知道该用哪个
- 上下文窗口被 SKILL.md 占满
- 响应速度变慢

### 推荐的分层安装策略

**第一层（立即安装，5个核心）：**
1. self-improving-agent — 让 agent 越来越聪明
2. skill-vetter — 安全审查
3. tavily-search — 搜索能力
4. github — 开发必备
5. summarize — 信息总结

**第二层（按你的主要场景选 3-5 个）：**
- 学术研究：literature-review + academic-writing + arxiv-watcher
- 视频创作：video-cog + veo
- 笔记管理：obsidian 或 notion
- 数据分析：data-analyst

**第三层（需要时再装）：**
- 其余 skills 按需安装，用完可以移除

---

## 四、与 Claude Code Skills 的对比

如果你同时使用 Claude Code 和 OpenClaw，以下是关键区别：

| 维度 | Claude Code Skills | OpenClaw Skills |
|------|-------------------|-----------------|
| 存放位置 | `~/.claude/skills/` | `~/.openclaw/skills/` |
| 市场 | 无官方市场 | ClawHub (clawhub.ai) |
| 安装方式 | 手动 git clone | `npx clawhub@latest install` |
| Skills 数量 | ~60,000+ (GitHub 分散) | 18,679 (ClawHub 集中) |
| 安全风险 | 中等 | 较高（341 恶意 skills 已发现）|
| 核心文件 | SKILL.md | SKILL.md |
| 触发机制 | 概率性（需要 Hook 辅助）| 概率性（需要 SKILL.md 引导）|

---

## 五、参考来源

1. **ClawHub 官方市场** — https://clawhub.ai/ （18,679 个 skills）
2. **VoltAgent awesome-openclaw-skills** — 33.3k stars，5,490 精选
3. **DataCamp Top 100+ Agent Skills** — 专业分类推荐
4. **Composio Top 10 OpenClaw Skills** — 实战评测
5. **Reddit r/AI_Agents** — "Best OpenClaw Skills from ClawHub's 500+ Skills"
6. **Koi Security** — 341 Malicious ClawHub Skills 审计报告
7. **openclaw/skills** — 官方 GitHub 备份仓库

---

*本指南由全网调研整理，2026年3月9日更新。*
