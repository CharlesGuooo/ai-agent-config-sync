---
name: skill-router
description: Skill Router - 查询可用技能并路由到正确的项目目录
---

## Skill Router

调用 `/skill-router` 或 `/using-superpowers` 查看有哪些可用技能及路由到正确的目录。

---

## 核心工作流 Skills (全局加载)

这些 skills 始终可用，无需切换目录：

| Skill | 用途 |
|-------|------|
| `/brainstorming` | 创意发想 |
| `/test-driven-development` | TDD 开发 |
| `/systematic-debugging` | 系统调试 |
| `/verification-before-completion` | 结果验证 |
| `/writing-plans` | 编写计划 |
| `/executing-plans` | 执行计划 |
| `/pua` | 穷尽方案 |
| `/high-agency` | 高主动性 |

---

## 项目级 Skills (需切换目录)

当用户需要以下领域的 skills 时，**告诉用户去对应项目目录启动**：

### 科学计算 → `~/scientific-project/`
**46 skills**: scanpy, rdkit, pytorch-lightning, transformers, biopython, anndata, cellrank, gseapy, openmm, diffdock, esm, phylogenetics, molecular-dynamics, medchem, molfeat, pyhealth, neurokit2, pathml, pydeseq2, scvelo, scvi-tools, shap, torch-geometric, torchdrug, umap-learn...

### 数据库查询 → `~/database-project/`
**23 skills**: pubmed-database, openalex-database, pubchem-database, uniprot-database, chembl-database, clinicaltrials-database, clinvar-database, drugbank-database, fda-database, uspto-database, edgartools, datacommons-client, fred-economic-data, gene-database, geo-database, kegg-database, pdb-database, reactome-database, ensembl-database, alpha-vantage...

### 数据分析 → `~/data-analysis-project/`
**24 skills**: polars, matplotlib, seaborn, plotly, statsmodels, scikit-survival, pymc, pymoo, networkx, geopandas, dask, vaex, zarr-python, sympy, statistical-analysis, exploratory-data-analysis, timesfm-forecasting, scikit-learn, infographics...

### 开发 → `~/dev-project/`
**50 skills**: senior-frontend, senior-backend, senior-devops, senior-architect, senior-security, senior-qa, docker-development, ci-cd-pipeline-builder, mcp-builder, langchain-*, langgraph-*, deep-agents-*, webapp-testing, terraform-patterns, error-tracking, performance-profiler, observability-designer...

### 营销 → `~/marketing-project/`
**32 skills**: copywriting, ad-creative, seo-audit, social-content, market-research-reports, pricing-strategy, email-sequence, cold-email, churn-prevention, referral-program, paid-ads, content-strategy, launch-strategy, brand-guidelines...

### 研究 → `~/research-project/`
**24 skills**: scientific-writing, literature-review, peer-review, research-grants, hypothesis-generation, scientific-visualization, scientific-slides, scientific-schematics, clinical-reports, citation-management, venue-templates, iso-13485-certification...

### Office → `~/office-project/`
**7 skills**: pdf, docx, xlsx, pptx, markitdown, latex-posters, pptx-posters

### 生产力 → `~/productivity-project/`
**24 skills**: obsidian-markdown, obsidian-cli, jira-expert, gws (Google Workspace), json-canvas, obsidian-bases, planning-with-files, open-notebook, scrum-master, senior-pm...

---

## 四工具统一启动

Claude Code、Codex、OpenCode、Cursor 使用**相同的目录和配置**：

```bash
# 任选一条命令，加载相同的 Skills + MCP
cd ~/scientific-project/ && claude    # 或 codex / opencode
cd ~/database-project/ && claude
cd ~/data-analysis-project/ && claude
cd ~/dev-project/ && claude
cd ~/marketing-project/ && claude
cd ~/research-project/ && claude
cd ~/office-project/ && claude
cd ~/productivity-project/ && claude

# Cursor: 打开对应目录即可
```

---

## 全局 MCP (17个)

所有工具共享全局 MCP，启动不耗 token：

**核心**: memory, github, web-reader, zai-mcp-server

**可选**: context7, firecrawl, sequential-thinking, vercel, railway, cloudflare-*, playwright, supabase, magic, expo-mcp

---

## 路由逻辑

当检测到用户需要非核心 skill 时：

1. **识别领域关键词** - 根据任务类型判断属于哪个项目
2. **返回切换命令** - 告诉用户去哪个目录启动

**示例响应**：
```
检测到你需要 [scanpy] 进行单细胞分析。
这是科学计算 skill，请切换目录：

cd ~/scientific-project/ && claude
# 或 codex / opencode / cursor
```

---

## 快速参考表

| 关键词 | 项目目录 |
|--------|----------|
| 单细胞, RNA-seq, 基因, 蛋白质, 分子, ML, 深度学习, pytorch | `~/scientific-project/` |
| 文献, PubMed, OpenAlex, 化合物, 蛋白质查询, 数据库检索 | `~/database-project/` |
| DataFrame, 统计, 可视化, 图表, EDA, pandas, polars | `~/data-analysis-project/` |
| 前端, 后端, Docker, CI/CD, API, React, LangChain | `~/dev-project/` |
| 文案, SEO, 广告, 社交媒体, 营销 | `~/marketing-project/` |
| 论文, 综述, 基金, 同行评审, 学术写作 | `~/research-project/` |
| PDF, Word, Excel, PPT, LaTeX | `~/office-project/` |
| Obsidian, Jira, Google Workspace, 项目管理 | `~/productivity-project/` |
