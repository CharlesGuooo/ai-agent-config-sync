# OpenClaw Skills Pack — 安装指南

> 从 18,679 个 ClawHub Skills 中精选 57 个最优质的 Skills，覆盖 12 大场景。
> 所有 Skills 均来自 [openclaw/skills](https://github.com/openclaw/skills) 官方备份仓库，经过社区验证。

**适用环境：** OpenClaw (Clawdbot) + Windows/macOS/Linux
**最后更新：** 2026年3月9日

---

## 目录

1. [包内容总览](#包内容总览)
2. [安装方式](#安装方式)
3. [各分类 Skills 详解](#各分类-skills-详解)
4. [安全注意事项](#安全注意事项)
5. [推荐安装顺序](#推荐安装顺序)
6. [未来自主发现新 Skills 的方法](#未来自主发现新-skills-的方法)

---

## 包内容总览

| 分类 | 目录 | Skills 数量 | 说明 |
|------|------|------------|------|
| 元能力 & 基础设施 | `01-meta/` | 6 | 自我改进、安全审查、自动更新等 |
| 搜索 & 网页 | `02-search/` | 6 | Tavily、Brave、Exa、DeepWiki 等 |
| 编程开发 | `03-coding/` | 5 | GitHub、Coding Agent、Debug、Playwright 等 |
| DevOps | `04-devops/` | 2 | Docker、n8n 工作流 |
| 学术研究 | `05-research/` | 10 | 文献综述、学术写作、ArXiv、PubMed 等 |
| 写作 & 创作 | `06-writing/` | 2 | AI 文本人性化 |
| 生产力 & 笔记 | `07-productivity/` | 9 | Google Workspace、Notion、Obsidian、Slack 等 |
| 文档 & PDF | `08-documents/` | 1 | Nano PDF |
| 媒体 & 视频 | `09-media/` | 8 | 视频生成、图片生成、Whisper、YouTube 等 |
| MCP & 工具 | `10-mcp/` | 3 | MCPorter、API Gateway、Gemini |
| 数据分析 | `11-data/` | 2 | Data Analyst、Senior Data Scientist |
| 其他工具 | `12-misc/` | 3 | 天气、博客监控、知识管理 |
| **总计** | | **57** | |

---

## 安装方式

### 方式一：手动复制（推荐，最可控）

将你需要的 skill 文件夹复制到 OpenClaw 的 skills 目录：

```bash
# 全局安装（对所有 workspace 生效）
cp -r <skill-folder> ~/.openclaw/skills/<skill-name>/

# 工作区安装（仅对当前项目生效）
cp -r <skill-folder> <project-dir>/skills/<skill-name>/
```

**示例：** 安装 self-improving-agent

```bash
cp -r 01-meta/self-improving-agent ~/.openclaw/skills/self-improving-agent/
```

### 方式二：通过 ClawHub CLI 安装（获取最新版本）

```bash
# 安装 ClawHub CLI
npm i -g clawdhub

# 安装单个 skill
npx clawhub@latest install <skill-slug>

# 示例
npx clawhub@latest install self-improving-agent
npx clawhub@latest install tavily-search
npx clawhub@latest install literature-review
```

### 方式三：让 OpenClaw 自行安装

将本包解压后，告诉你的 agent：

```
请阅读 README-安装指南.md，然后按照推荐安装顺序，
将最重要的 skills 安装到 ~/.openclaw/skills/ 目录下。
每个 skill 只需要复制其文件夹即可。
```

---

## 各分类 Skills 详解

### 01-meta — 元能力 & 基础设施

| Skill | ClawHub 下载量 | Stars | 说明 |
|-------|---------------|-------|------|
| **self-improving-agent** | 137k | 1.6k | **最热门 skill**。捕获错误和学习，持续自我改进。by @pskoett |
| **self-improving** | 39.1k | 176 | 自我反思 + 自我批评 + 自我学习。by @ivangdavila |
| **proactive-agent** | 73.9k | 458 | 主动型代理，WAL Protocol, Hal Stack。by @halthelobster |
| **skill-vetter** | 43.8k | 192 | **安全审查工具**，审查其他 skills 是否安全。by @spclaudehome |
| **auto-updater** | 34.5k | 226 | 自动更新 Clawdbot 和已安装的 skills。by @maximeprades |
| **agentguard** | — | — | 安全守卫，防止恶意 skill 执行 |

### 02-search — 搜索 & 网页

| Skill | 下载量 | Stars | 说明 |
|-------|--------|-------|------|
| **tavily-search** | 142k | 724 | **下载量第一**。AI 优化的网页搜索。by @arun-8687 |
| **brave-search** | 33.3k | 136 | Brave 搜索 API。by @steipete |
| **summarize** | 107k | 448 | 总结 URL/文件（web, PDF, 图片, 音频, YouTube）。by @steipete |
| **exa-web-search-free** | — | — | 开发者导向的搜索（文档、GitHub、论坛）|
| **deepwiki** | — | — | 深度 Wiki 搜索。by @arun-8687 |
| **baidu-search** | ~29k | — | 百度搜索（中文用户必备）|

### 03-coding — 编程开发

| Skill | 下载量 | Stars | 说明 |
|-------|--------|-------|------|
| **github** | 85.8k | 286 | gh CLI 交互，管理 repos/issues/PRs。by @steipete |
| **coding-agent** | — | — | 后台编码模式，tmux 集成。by @steipete |
| **debug-pro** | — | — | 系统化 debug 流程 |
| **conventional-commits** | — | — | 规范化 commit message |
| **playwright-mcp** | — | — | 完整浏览器自动化（导航、点击、填表、截图）|

### 04-devops — DevOps

| Skill | 说明 |
|-------|------|
| **docker-essentials** | Docker 容器管理 |
| **n8n** | n8n 工作流自动化控制 |

### 05-research — 学术研究（重点推荐）

| Skill | 下载量 | 说明 |
|-------|--------|------|
| **literature-review** | 4.6k | **多源学术搜索**：Semantic Scholar + OpenAlex + Crossref + PubMed，自动去重，可起草文献综述 |
| **academic-deep-research** | — | 透明、严谨的学术深度研究 |
| **academic-writing** | — | 学术写作专家（论文、文献综述、方法论）|
| **academic-writing-refiner** | — | 针对顶级会议（NeurIPS, ICLR, ICML, AAAI）优化学术写作 |
| **super-research** | — | "终极 AI 研究系统"，结合 8 个顶级研究 skills |
| **arxiv-watcher** | — | ArXiv 论文搜索和摘要 |
| **pubmed-edirect** | — | PubMed 生物医学文献查询 |
| **research-paper-kb** | — | 跨会话的研究论文知识库 |
| **literature-manager** | — | 搜索、下载、转换、组织学术文献 |

### 06-writing — 写作 & 创作

| Skill | 下载量 | Stars | 说明 |
|-------|--------|-------|------|
| **humanizer** | 41.4k | 340 | 去除 AI 写作痕迹，让文本更自然 |
| **humanize-ai-text** | 27.8k | 123 | AI 文本人性化（另一个实现）|

### 07-productivity — 生产力 & 笔记

| Skill | 下载量 | Stars | 说明 |
|-------|--------|-------|------|
| **gog** | 96k | 682 | **Google Workspace CLI**（Drive, Docs, Sheets, Calendar）|
| **notion** | 46.9k | 165 | Notion API 集成 |
| **obsidian** | 41.7k | 169 | Obsidian 笔记管理 |
| **slack** | 23.7k | 86 | Slack 控制 |
| **trello** | 21.1k | 96 | Trello 项目管理 |
| **gmail** | 22k | 56 | Gmail API (OAuth) |
| **himalaya** | 24.8k | 48 | 邮件管理 IMAP/SMTP |
| **imap-smtp-email** | 20.7k | 48 | 邮件读写 |
| **home-assistant** | — | — | 智能家居自然语言控制 |

### 08-documents — 文档 & PDF

| Skill | 下载量 | Stars | 说明 |
|-------|--------|-------|------|
| **nano-pdf** | 46.2k | 109 | 自然语言编辑 PDF |

### 09-media — 媒体 & 视频

| Skill | 下载量 | Stars | 说明 |
|-------|--------|-------|------|
| **nano-banana-pro** | 40.1k | 171 | Gemini 3 Pro 图片生成/编辑 |
| **openai-whisper** | 37.3k | 181 | 本地语音转文字 |
| **youtube-api-skill** | 21.5k | 114 | YouTube Data API |
| **video-cog** | — | — | 长视频 AI 制作（多步骤规划）|
| **video-agent** | — | — | HeyGen Video Agent API |
| **veo** | — | — | Google Veo API 视频生成 |
| **manim-composer** | — | — | 数学动画（Manim 风格）|
| **excalidraw-diagrams** | — | — | Excalidraw 图表生成 |

### 10-mcp — MCP & 工具

| Skill | 下载量 | Stars | 说明 |
|-------|--------|-------|------|
| **mcporter** | 31.8k | 89 | **官方 MCP Server 管理工具** |
| **api-gateway** | 37.2k | 191 | 连接 100+ API（OAuth）|
| **gemini** | 19.5k | 39 | Gemini CLI 集成 |

### 11-data — 数据分析

| Skill | 说明 |
|-------|------|
| **data-analyst** | SQL/表格分析、图表、报告 |
| **senior-data-scientist** | 世界级数据科学 skill |

### 12-misc — 其他工具

| Skill | 下载量 | 说明 |
|-------|--------|------|
| **weather** | 72.7k | 天气查询 |
| **blogwatcher** | 22.1k | 博客/RSS 监控 |
| **byterover** | 26.2k | 知识管理 |

---

## 安全注意事项

> **重要警告：** 2026年2月的安全审计发现 ClawHub 上有 **341 个恶意 skills**（Koi Security 报告）。Composio 的评测也指出"ClawHub 上大约 80% 的 skills 是垃圾或恶意的"。

**本包中的所有 skills 均来自 openclaw/skills 官方备份仓库，但仍建议：**

1. **安装前审查**：阅读每个 SKILL.md 和附带的脚本文件
2. **使用 skill-vetter**：本包已包含，可以用它来审查其他 skills
3. **在 Docker 中测试**：对不确定的 skill 先在隔离环境中测试
4. **检查 ClawHub 安全扫描**：在 clawhub.ai 上查看 Security Scan 是否显示 "Benign"
5. **优先使用 @steipete 的 skills**：他是 OpenClaw 核心贡献者，质量有保障

---

## 推荐安装顺序

### 第一优先级（核心必装，5个）

```bash
# 1. 自我改进 — 让 agent 越来越聪明
cp -r 01-meta/self-improving-agent ~/.openclaw/skills/

# 2. 安全审查 — 审查其他 skills 的安全性
cp -r 01-meta/skill-vetter ~/.openclaw/skills/

# 3. 搜索能力 — 最基础的信息获取
cp -r 02-search/tavily-search ~/.openclaw/skills/

# 4. GitHub — 开发必备
cp -r 03-coding/github ~/.openclaw/skills/

# 5. 总结能力 — URL/文件/视频总结
cp -r 02-search/summarize ~/.openclaw/skills/
```

### 第二优先级（按需安装）

```bash
# 学术研究用户必装
cp -r 05-research/literature-review ~/.openclaw/skills/
cp -r 05-research/academic-writing ~/.openclaw/skills/
cp -r 05-research/arxiv-watcher ~/.openclaw/skills/

# 视频创作用户
cp -r 09-media/video-cog ~/.openclaw/skills/
cp -r 09-media/veo ~/.openclaw/skills/

# 笔记管理
cp -r 07-productivity/obsidian ~/.openclaw/skills/
cp -r 07-productivity/notion ~/.openclaw/skills/
```

### 第三优先级（锦上添花）

```bash
# 其余 skills 按需安装
# 建议总数不超过 15-20 个，避免 agent 选择困难
```

---

## 未来自主发现新 Skills 的方法

### 方法一：使用 Find Skills（本包已包含）

本包中的 `01-meta/find-skills` 虽然未能从 GitHub 独立下载，但你可以通过 ClawHub 安装：

```bash
npx clawhub@latest install find-skills
```

安装后，直接告诉你的 agent："帮我找一个关于 XXX 的 skill"，它会自动搜索 ClawHub。

### 方法二：浏览 ClawHub 市场

访问 [clawhub.ai](https://clawhub.ai/)，按下载量、stars 排序浏览。

### 方法三：Awesome 列表

- [VoltAgent/awesome-openclaw-skills](https://github.com/VoltAgent/awesome-openclaw-skills) — 33.3k stars，5,490 个精选 skills，按分类整理
- 本包 `00-reference/awesome-openclaw-skills/` 目录已包含此列表的离线副本

### 方法四：社区跟踪

- Reddit: r/openclaw, r/AI_Agents, r/OpenClawUseCases
- Twitter/X: 关注 @steipete, @OpenClawAI
- Discord: OpenClaw 官方 Discord

### 方法五：skills.sh（by Vercel）

```bash
# Vercel 维护的精选 skills 列表
npx skills add <owner/repo>
```

访问 [skills.sh](https://skills.sh) 浏览经过审核的高质量 skills。

---

## 附加资源

- **ClawHub 官网**: https://clawhub.ai/
- **OpenClaw GitHub**: https://github.com/openclaw
- **官方 Skills 仓库**: https://github.com/openclaw/skills
- **安全审计报告**: Koi Security — 341 Malicious ClawHub Skills (2026.02)
- **DataCamp Top 100+**: https://www.datacamp.com/blog/top-agent-skills
- **Composio Top 10**: https://composio.dev/blog/top-openclaw-skills

---

*本 Skills Pack 由全网调研整理，数据来源包括 ClawHub 官方市场、VoltAgent awesome 列表、DataCamp、Composio、Reddit 社区等。*
