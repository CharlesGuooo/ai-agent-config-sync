# HARNESS — agent-facing routing manifest

**You are an AI agent. Read this when you start work in a project to decide what to
use.** It maps the *harness* (the scaffolding around the model) configured on this
machine — with emphasis on the **local skill packs**, because those are the part you do
NOT get for free.

**What you already have without this file** (auto-exposed at session start, don't re-derive):
global skills, global MCP servers, the global CLAUDE.md/AGENTS.md principles, and the
skills of whatever directory you launched in. **What this file adds:** the home-level
local packs at `~/<pack>/` are NOT auto-discovered when your cwd is elsewhere (e.g. a
fresh repo on another drive). Use the routing table below to pick the right pack; its skills
load when an agent session starts in `~/<pack>[/<sub>]` (or Cursor opens it) — a `cd` inside a
running session does not load them, so if you are already running elsewhere, tell the user which
directory to start from.

---

## Agent roster — 5 supported; which ones a machine gets is chosen at install time

`node harness.mjs install --agents <list>` decides the subset; nothing is installed for an agent
you did not name. Never assume all five.

| Agent | Entry | Config home | Gets MCP? | Gets hooks? | Sub-agents? |
| --- | --- | --- | :-: | :-: | :-: |
| Claude Code | `claude` | `~/.claude/` | ✅ | ✅ | ✅ |
| Codex CLI | `codex` | `~/.codex/` | ✅ | ✅ | ✅ |
| Cursor | open a dir | `~/.cursor/` | ✅ | ❌ | ✅ |
| OpenCode | `opencode` | `~/.config/opencode/` | ✅ | ❌ | ✅ |
| **Pi** | `pi` | `~/.pi/agent/` | ✅ | ❌ | ❌ |

All five get the six Core Principles (Cursor: pasted once into Settings → Rules), every global
skill (count in the generated block below), every local pack, and the MCP servers from
`mcp/catalog.json`.
**Pi has no declarative hooks and no sub-agents upstream** — not a misconfiguration;
`agents/pi/notes.md` tells Pi how to degrade the five fan-out skills to sequential execution and
to say so in its output.

Path quirk worth knowing: two agents keep global and project-pack skills in differently shaped
places — Pi at `~/.pi/agent/skills/` vs `<project>/.pi/skills/`, OpenCode at
`~/.config/opencode/skills/` vs `<project>/.opencode/skills/`. Each adapter in `lib/agents/`
owns its two paths; don't hardcode `.<agent>/skills`.

---

## Harness at a glance (5 extension points + 2 supplements)

- **CLAUDE.md / AGENTS.md** — layered context, auto-loaded every session (root → cwd,
  concatenated, not overridden). Global lives at `~/.claude/CLAUDE.md` (+ per-agent
  `AGENTS.md`/rules). Keep project CLAUDE.md focused on broadly-applicable knowledge.
- **Hooks** — `guard.mjs` (PreToolUse: blocks secret-file access + destructive shell)
  and `format.mjs` (PostToolUse: formats edited files only if the project opts in) run
  on **Claude Code + Codex**, straight from this repo's `scripts/hooks/`. A `SessionStart → any-buddy` hook may also be present.
  (Cursor, OpenCode and Pi get no hooks; their instructions tell them to confirm destructive
  commands and to leave credential files alone instead.)
- **Skills** — progressive disclosure. Global skills auto-load by description match;
  **local packs** below load when the session starts in their directory. Don't dump reusable
  expertise into CLAUDE.md — that's what skills are for.
- **Plugins** — (Claude) marketplace plugins carry the LSPs (below); no repo-managed
  plugin bundles beyond that.
- **MCP servers** — one catalog, `mcp/catalog.json`, rendered into each agent's own format.
  On by default: `github`, `memory`, `filesystem`, `context7`, `sequential-thinking`,
  `brave-search`, `playwright`, `chrome-devtools`, `web-reader` (off in Codex). Off by default,
  turned on per project: `supabase`, `vercel`, `railway`, `expo-mcp`, `magic`, `zai-mcp-server`,
  `cloudflare-{docs,workers-builds,workers-bindings,observability}`, `revenuecat`, and on macOS
  `xcodebuildmcp`, `ios-simulator`. Your instructions say how to turn one on in your agent
  (Claude: templates in `~/.claude/mcp-templates/`).
- **LSP** — symbol-level navigation. Claude: `pyright` (Python), `typescript`, `gopls`
  (Go), `rust-analyzer`. OpenCode: native (`"lsp": true`, 40+ langs incl. bash). Cursor:
  built into the editor. Codex: no LSP mechanism.
- **Subagents** — delegate exploration so it doesn't crowd your edit context. Built-in
  types: `Explore` (read-only search), `Plan` (design), `general-purpose`,
  `claude-code-guide`. Spawn a read-only Explore agent to map a subsystem, then edit with
  the summary.

---

## Local skill packs — routing (start the agent in the right one)

Pick by task, then start the agent from `~/<pack>[/<sub>]` (or open it in Cursor) so the pack's
skills load; a `cd` inside a running session does not load them. Document tasks
(PDF/Word/Excel/PPT) use **global** skills directly — no pack needed.

| Task domain | Pack | Sub-packs (start one level deeper for the specialty) |
| --- | --- | --- |
| Software dev (general) | `~/dev-project/` | `frontend` `backend` `cloud-platform` `testing-qa` `devops-sre` `agent-dev` `ml` |
| Finance / investing / trading | `~/finance-project/<sub>/` | `trading` `research` `macro` `modeling` `portfolio` `quant-methods` `advisory/{ib,pe,wealth,fund-admin,compliance}` |
| Academic / 科研 (AI/CS focus) | `~/research-project/<sub>/` | `literature` `gates` `manuscript` `review` `talks` |
| Data analysis / stats / viz | `~/data-analysis-project/` | flat |
| Marketing / SEO / content / ads | `~/marketing-project/` | flat |
| Productivity / PM / notes | `~/productivity-project/` | flat |
| iOS / Swift / SwiftUI | `~/ios-project/` | flat |
| Cross-cutting craft (writing/design quality) | `~/craft-project/<sub>/` | `writing` `design` |

The per-skill index below is a discovery aid ("which pack has a skill for X?"). Once an agent
starts in a pack, that pack's full SKILL.md descriptions load with it — you don't need this
index anymore.

<!-- PACKS:BEGIN -->

> Auto-generated from `skills/project-packs/` by `scripts/gen-harness.mjs`.
> Do not edit between the PACKS markers by hand — run the generator.

**Global skills (37, auto-exposed at startup — no need to route):** Process 13 · Thinking 1 · Escalation 1 · Routing & Meta 5 · Workflow 2 · Code Review 3 · Design & Architecture 4 · OpenSpec 4 · Document 3 · Learning 1.

### Local skill packs — index

#### dev-project (86)
- `archify` — Create validated architecture, workflow, sequence, data-flow, lifecycle/state, ERD, class, tree, timeline, and waterfall diagrams as expl...
- `changelog-generator` — Produce consistent, auditable release notes from Conventional Commits.
- `codebase-onboarding` — Analyze a codebase and generate onboarding documentation for engineers, tech leads, and contractors.
- `codebase-to-course` — Turn a codebase into an interactive single-page HTML course that teaches non-technical readers how the code works: scroll navigation, ani...
- `database-schema-designer` — Use when the user asks to create ERD diagrams, normalize database schemas, design table relationships, or plan schema migrations.
- `dependency-auditor` — Audit and manage dependencies across multi-language projects.
- `drawio-skill` — Create and edit draw.io/diagrams.net diagrams as editable `.drawio` files.
- `find-bugs` — Find bugs, security vulnerabilities, and code quality issues in local branch changes.
- `ponytail` — Lazy senior dev mode: the smallest change that fully solves the task, and a reply a busy human understands in one read.
- `ponytail-audit` — Quality audit of a whole repo: bugs, security holes, what breaks under real load, risky code without tests, slow paths, and what to delet...
- `ponytail-review` — Quality review of a change: is the logic right, is it safe, does it hold under real load, is risky code tested, is it fast enough, and is...
- `release-manager` — Plan and coordinate a software release — versioning, release checklist, tagging, rollout.
- `remotion-best-practices` — Router for all Remotion skills
- `senior-security` — Use when the user asks for STRIDE threat modeling, DREAD risk scoring, data-flow-diagram threat analysis, or a quick secret scan — or whe...
- `site-architecture` — When the user wants to plan, map, or restructure their website's page hierarchy, navigation, URL structure, or internal linking.
- `tech-debt-tracker` — Scan codebases for technical debt, score severity, track trends, and generate prioritized remediation plans.
- **agent-dev/**
  - `claude-api` — Reference for the Claude API / Anthropic SDK — model ids, pricing, params, streaming, tool use, MCP, agents, caching, token counting, mod...
  - `deep-agents-core` — INVOKE THIS SKILL when building ANY Deep Agents application.
  - `deep-agents-memory` — INVOKE THIS SKILL when your Deep Agent needs memory, persistence, or filesystem access.
  - `deep-agents-orchestration` — INVOKE THIS SKILL when using subagents, task planning, or human approval in Deep Agents.
  - `framework-selection` — INVOKE THIS SKILL at the START of any LangChain/LangGraph/Deep Agents project, before writing any agent code.
  - `langchain-dependencies` — INVOKE THIS SKILL when setting up a new project or when asked about package versions, installation, or dependency management for LangChai...
  - `langchain-fundamentals` — Create LangChain agents with create_agent, define tools, and use middleware for human-in-the-loop and error handling.
  - `langchain-middleware` — INVOKE THIS SKILL when you need human-in-the-loop approval, custom middleware, or structured output.
  - `langchain-rag` — INVOKE THIS SKILL when building ANY retrieval-augmented generation (RAG) system.
  - `langgraph-fundamentals` — INVOKE THIS SKILL when writing ANY LangGraph code.
  - `langgraph-human-in-the-loop` — INVOKE THIS SKILL when implementing human-in-the-loop patterns, pausing for approval, or handling errors in LangGraph.
  - `langgraph-persistence` — INVOKE THIS SKILL when your LangGraph needs to persist state, remember conversations, travel through history, or configure subgraph check...
  - `mcp-builder` — Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-des...
  - `multi-agent-systems` — Design knowledge for agent loops and multi-agent graphs — when a task warrants a loop at all, when to escalate from one agent to many, to...
  - `prompt-optimizer` — Creates, optimizes, and iteratively refines agent prompts, system prompts, developer prompts, and reusable prompt templates.
- **backend/**
  - `backend-dev-guidelines` — Comprehensive backend development guide for Node.js/Express/TypeScript microservices.
  - `senior-architect` — This skill should be used when the user asks to "design system architecture", "evaluate microservices vs monolith", "create architecture ...
  - `senior-backend` — Designs and implements backend systems including REST APIs, microservices, database architectures, authentication flows, and security har...
  - `senior-fullstack` — Fullstack development toolkit with project scaffolding for Next.js, FastAPI, MERN, and Django stacks, code quality analysis with security...
- **cloud-platform/**
  - `aws-solution-architect` — Design AWS architectures for startups using serverless patterns and IaC templates.
  - `durable-objects` — Build, debug, or review Cloudflare Durable Objects code for persistent state and coordination.
  - `posthog-error-tracking-nextjs` — PostHog error tracking for Next.js
  - `posthog-error-tracking-python` — PostHog error tracking for Python
  - `posthog-error-tracking-react` — PostHog error tracking for React
  - `posthog-feature-flags-nextjs` — PostHog feature flags for Next.js applications
  - `posthog-feature-flags-nodejs` — PostHog feature flags for Node.js applications
  - `posthog-feature-flags-python` — PostHog feature flags for Python applications
  - `posthog-feature-flags-react` — PostHog feature flags for React applications
  - `stripe-best-practices` — Guides Stripe integration decisions across development and test environment planning (separate sandboxes vs the shared test mode sandbox)...
  - `stripe-integration-expert` — Production-grade Stripe integrations: subscriptions with trials and proration, one-time payments, usage-based billing, checkout sessions,...
  - `stripe-projects` — Use when the user wants to provision infrastructure or third-party services using Stripe Projects.
  - `supabase` — Use when doing ANY task involving Supabase.
  - `supabase-postgres-best-practices` — Postgres best practices maintained by Supabase, for Postgres running anywhere.
  - `upgrade-stripe` — Guide for upgrading Stripe API versions, webhook endpoints, server-side SDKs, Stripe.js, and mobile SDKs
  - `web-perf` — Audit, diagnose, or optimize website loading and interaction performance, Core Web Vitals, and Lighthouse performance scores.
  - `workers-best-practices` — Cloudflare Workers best practices for production applications.
  - `wrangler` — Run or troubleshoot Wrangler CLI commands in projects that have a wrangler.jsonc, wrangler.json, or wrangler.toml file, including local d...
- **devops-sre/**
  - `ci-cd-pipeline-builder` — Generate pragmatic CI/CD pipelines from detected project stack signals — fast baseline generation, repeatable checks, environment-aware d...
  - `docker-development` — Docker and container development agent skill and plugin for Dockerfile optimization, docker-compose orchestration, multi-stage builds, an...
  - `performance-profiler` — Systematic performance profiling for Node.js, Python, and Go applications.
- **frontend/**
  - `frontend-design` — Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one.
  - `frontend-dev-guidelines` — Frontend development guidelines for React/TypeScript applications.
  - `senior-frontend` — Frontend development skill for React, Next.js, TypeScript, and Tailwind CSS applications.
  - `ui-ux-pro-max` — UI/UX design intelligence for web, mobile, and desktop.
  - `web-artifacts-builder` — Suite of tools for creating elaborate, multi-component claude.ai HTML artifacts using modern frontend web technologies (React, Tailwind C...
- **ml/**
  - `get-available-resources` — Detects host inventory and effective CPU, memory, disk, scheduler, container, and accelerator limits when a user asks for resource-aware ...
  - `huggingface-best` — Use when the user asks about finding the best, top, or recommended model for a task, wants to know what AI model to use, or wants to comp...
  - `huggingface-community-evals` — Run evaluations for Hugging Face Hub models using inspect-ai and lighteval on local hardware.
  - `huggingface-datasets` — Use this skill for Hugging Face Dataset Viewer API workflows that fetch subset/split metadata, paginate rows, search text, apply filters,...
  - `huggingface-gradio` — Build Gradio web UIs and demos in Python.
  - `huggingface-llm-trainer` — Train or fine-tune language and vision models using TRL (Transformer Reinforcement Learning) or Unsloth with Hugging Face Jobs infrastruc...
  - `huggingface-local-models` — Use to select models to run locally with llama.cpp and GGUF on CPU, Mac Metal, CUDA, or ROCm.
  - `huggingface-paper-publisher` — Publish and manage research papers on Hugging Face Hub.
  - `huggingface-papers` — Look up and read Hugging Face paper pages in markdown, and use the papers API for structured metadata such as authors, linked models/data...
  - `huggingface-tool-builder` — Use this skill when the user wants to build tool/scripts or achieve a task where using data from the Hugging Face API would help.
  - `huggingface-trackio` — Track and visualize ML training experiments with Trackio.
  - `huggingface-vision-trainer` — Trains and fine-tunes vision models for object detection (D-FINE, RT-DETR v2, DETR, YOLOS), image classification (timm models — MobileNet...
  - `pufferlib` — Version-aware guidance for PufferLib reinforcement-learning environments, vectorization, policies, PuffeRL training, evaluation, and safe...
  - `pytorch-lightning` — Deep learning framework (PyTorch Lightning / lightning package).
  - `scikit-learn` — Supports machine learning in Python with scikit-learn.
  - `shap` — Explain and audit machine-learning predictions with SHAP.
  - `stable-baselines3` — Trains and evaluates single-agent reinforcement learning with Stable Baselines3 (PPO, SAC, DQN, TD3, DDPG, A2C), Gymnasium custom environ...
  - `torch-geometric` — Supports PyTorch Geometric (PyG) graph neural networks — node/link/graph classification, message passing (GCN, GAT, GraphSAGE, GIN), hete...
  - `train-sentence-transformers` — Train or fine-tune sentence-transformers models across `SentenceTransformer` (bi-encoder, dense or static embedding model for retrieval, ...
  - `transformers` — Hugging Face Transformers for loading Hub models, running pipeline inference, text generation, and Trainer fine-tuning on NLP, vision, au...
  - `transformers-js` — Use Transformers.js to run state-of-the-art machine learning models directly in JavaScript/TypeScript.
  - `umap-learn` — Applies UMAP-learn to nonlinear dimensionality reduction, 2D/3D embeddings, clustering preprocessing, supervised or semi-supervised UMAP,...
- **testing-qa/**
  - `api-test-suite-builder` — Use when the user asks to generate API tests, create integration test suites, test REST endpoints, or build contract tests.
  - `senior-qa` — Generates unit tests, integration tests, and E2E tests for React/Next.js applications.
  - `webapp-testing` — Toolkit for interacting with and testing local web applications using Playwright.

#### finance-project (35)
- **portfolio/**
  - `backtest-expert` — Expert guidance for systematic backtesting of trading strategies.
  - `edge-concept-synthesizer` — Abstract detector tickets and hints into reusable edge concepts with thesis, invalidation signals, and strategy playbooks before strategy...
  - `edge-hint-extractor` — Extract edge hints from daily market observations and news reactions, with optional LLM ideation, and output canonical hints.yaml for dow...
  - `edge-pipeline-orchestrator` — Orchestrate the full edge research pipeline from candidate detection through strategy design, review, revision, and export.
  - `edge-signal-aggregator` — Aggregate and rank signals from multiple edge-finding skills (edge-candidate-agent, theme-detector, sector-analyst, institutional-flow-tr...
  - `edge-strategy-designer` — Convert abstract edge concepts into strategy draft variants and optional exportable ticket YAMLs for edge-candidate-agent export/validation.
  - `edge-strategy-reviewer` — Critically review strategy drafts from edge-strategy-designer for edge plausibility, overfitting risk, sample size adequacy, and executio...
  - `position-sizer` — Calculate risk-based position sizes for long stock trades.
  - `strategy-pivot-designer` — Detect backtest iteration stagnation and generate structurally different strategy pivot proposals when parameter tuning reaches a local o...
- **quant-methods/**
  - `backtesting-frameworks` — Selection guide and minimal working examples for major open-source Python backtesting frameworks — backtrader, vectorbt, backtesting.py, ...
  - `bet-sizing` — Convert model signals and probabilities into trade sizes — Kelly Criterion (full and fractional), ML-probability-to-position-size (López ...
  - `economic-indicators` — Construct quantitative features from macro / economic data — yield curve features (10Y-2Y, 10Y-3M, level, slope, curvature), leading indi...
  - `execution-modeling` — Realistic execution cost modeling for backtests and live trading — slippage models (fixed bp, vol-scaled, square-root-impact), market imp...
  - `factor-analysis` — Cross-sectional factor analysis for alpha research — Information Coefficient (IC), Information Ratio (IR), quintile / decile portfolio re...
  - `feature-engineering-fin` — Financial feature engineering — Fractional Differentiation (memory-preserving stationarization), structural break features (CUSUM, Chow),...
  - `investment-thesis-writer` — Structured framework for writing a defensible investment thesis — thesis statement, supporting variant view, key catalysts with dates and...
  - `labeling` — Generate ML training labels from financial time series in ways that match trading reality — Triple Barrier Method, Meta-Labeling, Fixed-T...
  - `overfitting-detection` — Statistical tests for diagnosing backtest overfitting and inflated Sharpe ratios — Probability of Backtest Overfitting (PBO), Deflated Sh...
  - `portfolio-optimization` — Portfolio construction methods — Mean-Variance (Markowitz), Hierarchical Risk Parity (HRP), Black-Litterman, Risk Parity / Equal Risk Con...
  - `regime-detection` — Detect and classify market regimes — Hidden Markov Models (HMM), Markov Switching regression, change-point detection (Bai-Perron, rupture...
  - `risk-metrics` — Performance and risk metrics for trading strategies and portfolios — Sharpe / Sortino / Calmar / Omega ratios, Value-at-Risk (VaR) and Co...
  - `time-series-cv` — Leakage-safe cross-validation for financial time series — Purged K-Fold, Combinatorial Purged Cross-Validation (CPCV), Embargo, and Walk-...
  - `time-series-stats` — Statistical tests and tools for financial time series — stationarity (ADF, KPSS, Phillips-Perron), cointegration (Engle-Granger, Johansen...
  - `volatility-modeling` — Volatility forecasting and modeling for financial returns — GARCH family (GARCH, EGARCH, GJR-GARCH), Realized Volatility, HAR-RV models, ...
- **research/**
  - `edge-candidate-agent` — Generate and prioritize US equity long-side edge research tickets from EOD observations, then export pipeline-ready candidate specs for t...
  - `signal-postmortem` — Record and analyze post-trade outcomes for signals generated by edge pipeline and other skills.
  - `thesis-tracker` — Maintain and update investment theses for portfolio positions and watchlist names.
  - `trade-hypothesis-ideator` — Generate falsifiable trade strategy hypotheses from market data, trade logs, and journal snippets.
  - `trader-memory-core` — Track investment theses across their lifecycle — from screening idea to closed position with postmortem.
- **trading/**
  - `ashare-nightly-judgment` — 在 15:00 → 次日 09:00 的夜间窗口跑 A 股短线（低吸/反包）研判：三步复盘 → 环境定调 → 板块归因 → 产出一份能被 `observer/scoreboard.py` 评分的次日预期（metric × direction + base_rate + co...
  - `ashare-short-term-playbook` — A股短线（低吸/反包）研判的共用词汇与判读语义——初强与末强、物极必反、换手率的分歧与锁筹读数、 龙头与后排、板块逻辑归因、题材联想、出货特征，以及平台字段的语义陷阱（`up_ratio` 是涨跌家数比 而非上涨占比、`avg_turnover` 是成交额而非换手率、同表混...
  - `ashare-strategy-validation` — 把交易书里的经验法则变成**可证伪的 A 股规格**再判死活：先算样本量够不够，再写零假设、 无条件基准、入场/离场/止损/持有期、预登记终止日期，**让回测下结论而不是让模型下结论**。
  - `ashare-veto-review` — 对一份 A 股夜间研判计划或候选清单做**独立否决复核**：只能排除（附理由）或附加警示， **不新增标的、不重排序、不背书、不改写**。一轮，无修订循环，干净上下文，且必须与写计划的模型不同； 只读，不写。用于「帮我挑刺」「这批票有没有雷」「过一遍否决闸门」「复核一下今晚...
  - `pair-trade-screener` — Statistical arbitrage tool for identifying and analyzing pair trading opportunities.
  - `technical-analyst` — This skill should be used when analyzing weekly price charts for stocks, stock indices, cryptocurrencies, or forex pairs.

#### research-project (31)
- `research-router` — Routes a research task to one of five sub-packs under ~/research-project/ — literature, gates, manuscript, review, talks.
- **gates/**
  - `ablation-planning` — Enumerates the ablations a paper actually needs, then costs and orders them against a compute budget and maps each to the claim it defends.
  - `claim-calibration` — Decides what your results license you to say, and sets that as the ceiling before the abstract is written.
  - `experimental-design` — Designs experiments and studies BEFORE data is collected — choosing a design, randomizing, blocking, and laying out treatment combination...
  - `falsification-design` — Fixes the result that would end the claim, before the experiment runs.
  - `field-map` — Turns a research direction into a map of what the field actually disagrees about, and a register of anomalies an idea could come from.
  - `hypothesis-generation` — Formulates evidence-bounded scientific questions, candidate hypotheses, rival explanations, causal or associational claims, discriminatin...
  - `idea-forge` — Turns a field's anomaly register into 3-8 candidate research ideas.
  - `idea-triage` — Decides which research idea to commit to by eliminating the rest.
- **literature/**
  - `bibtex-manager` — Turns a reference you already have into a correct BibTeX entry, and checks the ones already in your .bib.
  - `paper-library` — Search and reason over a LOCAL library of collected research papers (downloaded arXiv/conference PDFs).
  - `paper-lookup` — Searches 18 scholarly APIs for papers, preprints, citations, open-access full text, repository records, and journal OA status, and return...
  - `paper-reading-guide` — Use this whenever the user wants to read, understand, or be walked through an academic paper — whether they share a PDF, arxiv/URL link, ...
  - `survey-deep` — Fans out one independent agent per item in a survey outline, each researching that item against every field and writing a structured JSON...
  - `survey-outline` — Builds a comparison table for a landscape survey — decides the items (what is being compared) and the fields (what is being compared abou...
  - `survey-report` — Collapses the per-item JSON results of a deep survey pass into one markdown report covering every field, and leaves uncertain values mark...
- **manuscript/**
  - `academic-humanizer` — Strips AI tells from academic prose — papers, theses, abstracts, rebuttals — and from NSF/NIH funding proposals, while keeping the precis...
  - `latex-paper-en` — Operates on an existing .tex manuscript — compiles it and diagnoses build failures, checks venue formatting and bibliography, and reviews...
  - `paper-figures` — Makes a paper's matplotlib figures — house style, journal sizing, colorblind and grayscale survival, multi-panel layout, export.
  - `paper-writing` — Decides what a paper's prose should say, then writes it — argument first, sentences second.
  - `repro-pack` — Assemble a reproducibility package for an ML/systems paper so a reviewer or future-you can re-run the experiments.
  - `terminology-ledger` — Keep terminology, acronyms, and notation consistent across a manuscript.
  - `venue-templates` — Gets the right template and the formatting rules for a specific venue, and checks a manuscript against them.
- **review/**
  - `auto-review-loop` — Iteratively improve YOUR OWN research artifact (paper draft, experiment writeup, or codebase) by having a DIFFERENT model review it adver...
  - `paper-stress-test` — Adversarially stress-test YOUR OWN paper draft before submission — as the harshest fair reviewer would.
  - `peer-review` — Prepares evidence-bounded, constructive peer-review drafts and structured manuscript assessments.
  - `rebuttal` — Writes, audits or revises a point-by-point response to reviewers.
- **talks/**
  - `latex-posters` — Creates research posters in LaTeX using beamerposter, tikzposter, or baposter.
  - `nature-paper2ppt` — Create or improve a Chinese academic PPTX from a scientific paper or research reading notes, with source figures and speaker notes.
  - `pptx-posters` — Creates and audits editable scientific posters in macro-free PowerPoint (.pptx) from author-approved local content and assets.
  - `scientific-slides` — Builds a research talk — slide structure, what goes on each slide, timing, and a visual validation pass.

#### data-analysis-project (16)
- `dask` — Scales pandas, NumPy, and custom Python research workflows beyond memory or across clusters with Dask.
- `defuddle` — Extract clean Markdown from HTML pages with Defuddle CLI.
- `exploratory-data-analysis` — Performs bounded, local exploratory analysis of explicitly supported scientific files.
- `matplotlib` — Creates and customizes scientific plots with Matplotlib.
- `networkx` — Creates, analyzes, and visualizes complex networks and graphs in Python with NetworkX.
- `perplexity-search` — Perform AI-powered web searches with real-time information using Perplexity models via LiteLLM and OpenRouter.
- `plotly` — Interactive visualization library.
- `polars` — High-performance DataFrame library for Python ETL, analytics, and pandas migration.
- `pymc` — Builds and checks Bayesian models with PyMC, including hierarchical models, NUTS MCMC, variational inference, mutable-data predictions, p...
- `seaborn` — Creates Seaborn statistical visualizations with pandas integration for distributions, relationships, categorical comparisons, regression ...
- `statistical-analysis` — Guided statistical analysis for research data - test selection, assumption checking, effect sizes, power analysis, Bayesian alternatives,...
- `statsmodels` — Fits and diagnoses Python statistical models including OLS, GLM, discrete and mixed models, ARIMA and SARIMAX.
- `sympy` — Performs exact symbolic mathematics with SymPy for algebra, calculus, equation solving, symbolic linear algebra, physics, and lambdify or...
- `timesfm-forecasting` — Performs zero-shot time-series forecasting with Google's TimesFM, including regular-grid CSV preparation, quantile forecasts, XReg covari...
- `vaex` — Processes large tabular scientific datasets with Vaex expressions, filtered views, streamed statistics, binned visualizations, and file c...
- `zarr-python` — Stores and queries chunked N-D scientific arrays with Zarr-Python 3, including codecs, sharding, S3/GCS storage, and NumPy/Dask/Xarray in...

#### marketing-project (49)
- `ab-testing` — When the user wants to plan, design, or implement an A/B test or experiment, or build a growth experimentation program.
- `ad-creative` — When the user wants to generate, iterate, or scale ad creative — headlines, descriptions, primary text, or full ad variations — for any p...
- `ai-seo` — When the user wants to optimize content for AI search engines, get cited by LLMs, or appear in AI-generated answers.
- `aso` — When the user wants to audit or optimize an App Store or Google Play listing.
- `attribution` — When the user wants to figure out which marketing actually drives conversions and revenue, choose or interpret an attribution model, or r...
- `canvas-design` — Create beautiful visual art in .png and .pdf documents using design philosophy.
- `co-marketing` — When the user wants to find co-marketing partners, plan joint campaigns, or brainstorm partnership opportunities.
- `community-marketing` — Build and leverage online communities to drive product growth and brand loyalty.
- `competitor-profiling` — When the user wants to research, profile, or analyze competitors from their URLs.
- `content-strategy` — When the user wants to plan a content strategy, decide what content to create, or figure out what topics to cover.
- `copy-editing` — When the user wants to edit, review, or improve existing marketing copy, or refresh outdated content.
- `copywriting` — When the user wants to write, rewrite, or improve marketing copy for any page, including homepage, landing pages, pricing pages, feature ...
- `cro` — When the user wants to optimize, improve, or increase conversions on any marketing page or form — including homepage, landing pages, pric...
- `customer-research` — When the user wants to conduct, analyze, or synthesize customer research.
- `directory-submissions` — When the user wants to submit their product to startup, SaaS, AI, agent, MCP, no-code, or review directories for backlinks, domain rating...
- `elevenlabs-agents` — Build voice AI agents with ElevenLabs.
- `elevenlabs-music` — Generate music using ElevenLabs Music API.
- `elevenlabs-setup-api-key` — Fix or hand-configure an existing ElevenLabs API key.
- `elevenlabs-sound-effects` — Generate sound effects from text descriptions using ElevenLabs.
- `elevenlabs-speech-to-text` — Transcribe audio to text using ElevenLabs Scribe v2.
- `elevenlabs-text-to-speech` — Convert text to speech using ElevenLabs voice AI.
- `elevenlabs-transcribe` — Transcribe audio to text using ElevenLabs Scribe.
- `elevenlabs-voice-changer` — Transform the voice in an audio recording into a different target voice while preserving emotion, timing, and delivery using the ElevenLa...
- `elevenlabs-voice-isolator` — Remove background noise and isolate vocals/speech from audio using ElevenLabs Voice Isolator (audio isolation) API.
- `generate-image` — Generates or edits images with AI models through the OpenRouter Image API (Gemini, Seedream, Recraft, GPT-Image, Riverflow).
- `image` — When the user wants to create, generate, edit, or optimize images for marketing — blog heroes, social graphics, product mockups, profile ...
- `influencer-marketing` — When the user wants to run influencer, creator, or ambassador partnerships to promote their product — finding and vetting partners, struc...
- `last30days` — Research what people actually say about any topic in the last 30 days.
- `launch` — When the user wants to plan a product launch, feature announcement, or release strategy.
- `lead-magnets` — When the user wants to create, plan, or optimize a lead magnet for email capture or lead generation.
- `market-research-reports` — Builds evidence-traceable market research reports and assumption-driven market sizing or forecast scenarios.
- `marketing-council` — When the user wants multiple expert perspectives on a marketing question — a simulated board of advisors staffed by legendary marketers (...
- `marketing-ideas` — When the user needs marketing ideas, inspiration, or strategies for their SaaS or software product.
- `marketing-loops` — When the user wants to set up a recurring, self-running marketing workflow — a repeatable loop an AI agent runs on a cadence (weekly, dai...
- `marketing-plan` — When the user needs a comprehensive marketing plan for a client, a company they advise, or their own product.
- `marketing-psychology` — When the user wants to apply psychological principles, mental models, or behavioral science to marketing.
- `offers` — When the user wants to design, construct, or improve an offer — the thing they actually sell — including value framing, bonus stacking, g...
- `onboarding` — When the user wants to optimize post-signup onboarding, user activation, first-run experience, or time-to-value.
- `paywalls` — When the user wants to create or optimize in-app paywalls, upgrade screens, upsell modals, or feature gates.
- `pricing` — When the user wants help with pricing decisions, packaging, or monetization strategy.
- `product-marketing` — When the user wants to create or update their product marketing context document.
- `public-relations` — When the user wants help with public relations, earned media, press coverage, journalist outreach, or media strategy (not pull requests).
- `seo-audit` — When the user wants to audit, review, or diagnose SEO issues on their site.
- `signup` — When the user wants to optimize signup, registration, account creation, or trial activation flows.
- `social` — When the user wants help creating, scheduling, or optimizing social media content for LinkedIn, Twitter/X, Instagram, TikTok, or Facebook...
- `theme-factory` — Toolkit for styling artifacts with a theme.
- `video` — When the user wants to create, generate, or produce video content using AI tools or programmatic frameworks.
- `wechat-ai-publisher` — 自动采集 AI 热门内容，撰写公众号文章，生成配图并发布到微信公众号草稿箱。当用户说"发布AI热点"、"写公众号文章"、"采集AI内容"、"publish AI news"时触发。
- `xhs-visual-director` — Use this skill when planning, redesigning, or reviewing Xiaohongshu carousel visuals, covers, 3:4 image posts, page-by-page visual direct...

#### productivity-project (24)
- `agent-reach` — MUST USE when user wants to 调研/research/搜索/search/查/找/look up anything on the internet — e.g.
- `autonomy-audit` — 逐环节审计一条变现路径能否真的无人托管，输出「人工小时/月」的可加总估算。
- `career-ops` — Open-source AI job search agent -- evaluate offers, generate CVs, scan portals, track applications.
- `decision-memo` — 把调研收口成一份可拍板的决策备忘录：选定 ONE 条路径，说清为什么淘汰另外两条最强候选， 给出 30 天落地方案、kill 判据和敞口自述。当你要「出最终结论」「选一条」「写决策文档」 「给落地方案」「收口」时使用。含六维加权打分卡与对抗性复核流程（打分必须在干净上下文里做）。
- `evidence-ledger` — 维护证据台账并给来源分级，专治「AI 月入 X 万」类内容营销污染。
- `gws` — Google Workspace CLI for AI agents.
- `idea-haunter` — Data-driven 4-stage funnel for discovering and validating indie-hacker product ideas from Reddit pain points, sizing them with Google Tre...
- `job-application-assistant` — Assists with job applications: evaluating job postings, tailoring CVs, writing cover letters, and preparing for interviews.
- `joe-ielts-writing` — 按 Joe 老师的雅思写作教学体系陪学生练写作。大作文（Task 2）：审题四陷阱、"为什么"转述法、 题型与结构、具象化/情景化 Brainstorming、中心句与因果论证、冲 7 语言三件套；语法地基：主干法、 三类从句、五种修饰（汉译英、长难句）；按官方四项评分标准...
- `json-canvas` — Create and edit JSON Canvas files (.canvas) with nodes, edges, groups, and connections.
- `markdown-mermaid-writing` — Writes scientific Markdown documentation and Mermaid diagrams for workflows, relationships, timelines, and schemas.
- `monetization-path-scan` — 枚举并初筛「可无人托管运转的变现路径」候选池。当你需要生成候选变现路径、 横向对比赚钱方式、回答「有哪些路可以走」「先把候选列出来」「筛掉不可行的」时使用。
- `notebooklm` — Drive Google NotebookLM from the agent — auto-upload PDFs/sources, then get grounded summaries and Q&A back.
- `notion-cli` — Use the Notion CLI (`ntn`) to interact with the Notion API, manage workers, and upload files.
- `obsidian-bases` — Create and edit Obsidian Bases (.base files) with views, filters, formulas, and summaries.
- `obsidian-cli` — Interact with Obsidian vaults using the Obsidian CLI to read, create, search, and manage notes, tasks, properties, and more.
- `obsidian-markdown` — Create and edit Obsidian Flavored Markdown with wikilinks, embeds, callouts, properties, and other Obsidian-specific syntax.
- `open-notebook` — Organizes research with the self-hosted Open Notebook alternative to NotebookLM.
- `planning-with-files` — Persistent file-based planning for multi-step AI-agent work.
- `ppt-master` — Generate truly EDITABLE PowerPoint (.pptx) from any document — native shapes and native animations (not slide images), optional speaker-n...
- `resume-writing` — Use when writing, rewriting, or tailoring a resume or academic CV kept as LaTeX source in a repository: one shared class file, one .tex p...
- `upskill` — Compares tracked job postings against the candidate profile to identify skill gaps and generate a prioritized learning plan with study re...
- `what-if-oracle` — Supports structured what-if scenario analysis for research planning, experimental contingencies, and scientific project decisions.
- `youtube-transcript` — 提取 YouTube 视频的字幕文本，用于"观看"并学习视频教程内容。当你遇到 YouTube 链接、需要了解某个视频讲了什么、或要照着视频教程操作时使用。也可用于列出视频有哪些字幕语言轨道。Triggers on YouTube URLs, youtu.be links,...

#### ios-project (21)
- `alarmkit` — Build alarms and timers with iOS 26's AlarmKit.
- `app-store-changelog` — Generate App Store release notes from git history.
- `apple-hig-design` — Make an iOS/SwiftUI screen look beautiful and native (Apple Human Interface Guidelines).
- `fastlane` — Set up and run fastlane for iOS signing, TestFlight, and App Store submission on macOS.
- `github-issue-fix` — GitHub issue fix workflow.
- `ios-architecture` — iOS app architecture design and review.
- `ios-debugger` — iOS app build, simulator, debug support.
- `ios-foundation-models` — iOS 26 Foundation Models, Apple Intelligence, HealthKit State of Mind, Swift Charts, StoreKit 2.
- `ios-testing` — iOS testing expert.
- `mac-dev-setup` — One-time setup runbook for agentic native iOS/macOS development after migrating to a Mac — install Xcode + XcodeBuildMCP + xcode-build-se...
- `native-profiling` — CLI Time Profiler via xctrace.
- `rive-ios` — Integrate Rive animations into a native iOS/SwiftUI app.
- `swift-concurrency` — Swift Concurrency review and fixes.
- `swift-style` — Swift code style check and formatting.
- `swiftui-animation` — Advanced SwiftUI animations — springs, custom transitions, matchedGeometryEffect hero animations, PhaseAnimator/KeyframeAnimator, and Met...
- `swiftui-components` — SwiftUI component design and implementation.
- `swiftui-liquid-glass` — iOS 26+ Liquid Glass API implementation and review.
- `swiftui-performance` — SwiftUI performance diagnosis and optimization.
- `swiftui-ui-patterns` — SwiftUI best practices and patterns.
- `swiftui-view-refactor` — SwiftUI view refactoring.
- `widgetkit-liveactivity` — Build or review iOS widgets (WidgetKit), Live Activities (ActivityKit), and the Dynamic Island.

#### craft-project (19)
- **design/**
  - `brand` — Brand voice, visual identity, messaging frameworks, asset management, brand consistency.
  - `brandkit` — Moved to github.com/Leonxlnx/imagegen-skills.
  - `design-system` — Token architecture, component specifications, and slide generation.
  - `design-taste-frontend-v1` — The original taste-skill v1, kept for projects that depend on its exact behaviour.
  - `gpt-taste` — Classic skill for GPT and Codex, opt-in: it runs only when called by name.
  - `high-end-visual-design` — Classic style skill, opt-in: it runs only when called by name.
  - `image-to-code` — Moved to github.com/Leonxlnx/imagegen-skills.
  - `imagegen-frontend-mobile` — Moved to github.com/Leonxlnx/imagegen-skills.
  - `imagegen-frontend-web` — Moved to github.com/Leonxlnx/imagegen-skills.
  - `impeccable` — Points to Impeccable (pbakaus/impeccable), which gives a coding agent design craft for frontend UI: a shared design vocabulary of 24 comm...
  - `impeccable-ppt` — Use when the visual craft or aesthetics of a slide deck / PowerPoint / 演示文稿 / 答辩PPT / presentation matter — making slides look designed a...
  - `industrial-brutalist-ui` — Classic style skill, opt-in: it runs only when called by name.
  - `minimalist-ui` — Classic style skill, opt-in: it runs only when called by name.
  - `redesign-existing-projects` — Retired: redesigns, restyles and design reviews are part of design-taste-frontend.
  - `slides` — Create strategic HTML presentations with Chart.js, design tokens, responsive layouts, copywriting formulas, and contextual slide strategies.
  - `stitch-design-taste` — Classic skill for Google Stitch, opt-in: it runs only when called by name.
  - `taste-skill` — tasteskill v2, the anti-slop frontend skill.
  - `ui-styling` — Create beautiful, accessible user interfaces with shadcn/ui components (built on Radix UI + Tailwind), Tailwind CSS utility-first styling...
- **writing/**
  - `humanizer-zh` — 编辑中文文章、评论和文档中的空话、重复及模板化表达，让文字更自然，同时保留事实、确定程度和作者声音。适用于润色已有文本，不用于判断作者身份或保证通过 AI 检测器。

#### life-project (10)
- `astrology-chart` — Generate real, astronomically-calculated natal (birth) charts, planetary transits, and synastry/compatibility readings using Swiss Epheme...
- `bazi` — 四柱八字命理分析。通过交互式步骤收集出生信息（姓名、曾用名、阳历/农历生日、时辰、性别、出生地）， 排出四柱八字，参照经典命理典籍（穷通宝典、三命通会、滴天髓、渊海子平、子平真诠等）进行专业分析。
- `fengshui` — 传统堪舆风水顾问：玄空飞星、八宅、形势峦头、择日，兼配八字。
- `liuren-skill` — 大六壬排盘与断卦技能。支持月将加时、起四课三传、排天将神煞、断课分析、课体关系判断、毕法赋断语自动化、占验反馈系统、金口诀集成、天将关系网、课经案例库（200+）。
- `mangpai` — 盲派（盲师派）四柱命理断命。以「做功／体用／宫星／取象」为核心，不是传统子平的旺衰用神法。
- `meihua-divination` — 梅花易数 / 五行生克风格的中式玄学解读：当前运势、感情、事业选择、项目走势、个人倾向， 侧重趋势诊断和可执行建议而非绝对预言。Use for 中式玄学 / 梅花易数 readings.
- `qimen` — 奇门遁甲排盘与预测分析工具。使用Python脚本自动排盘（秒出结果），Claude负责综合断局分析。
- `qingsheng` — 情圣 — 中文男性社交与恋爱私教（中文恋爱 AI · 恋爱话术生成器 · 微信聊天助手 · 高情商回复 · 情感咨询替代）。帮兄弟读懂女生发的消息、看懂聊天/朋友圈截图、判断对方是不是对自己有意思、想清楚下一步该回什么 / 该不该回 / 该怎么约。覆盖微信、探探、Soul、...
- `simp` — 追爱军师 — 帮你用最纯情的话把心上人追到手 | Love Strategist — win over your crush with the most sincere words
- `tarot` — Use when the user asks for tarot/塔罗/占卜/抽牌/牌阵/每日一牌/运势/感情、事业、决策指引.

#### media-project (7)
- `ffmpeg` — Provides FFmpeg commands and filter recipes for video automation pipelines - format conversion, resizing, trimming, audio mixing, subtitl...
- `openchatcut` — Connect an MCP-capable coding agent to OpenChatCut and edit local video projects.
- `video-audio-cleanup` — Clean up and improve the audio of a phone-recorded video or audio file — remove hiss/rumble/handling noise, fix a thin or boxy mic sound,...
- `wjs-burning-subtitles` — Use when the user has a video + an SRT and wants the subtitles either burned into the pixels (libass, always-visible) or soft-muxed as a ...
- `wjs-editing-multicam` — Use when the user has 2+ recordings of the same event (each with a `.sync.json` sidecar from wjs-syncing-multicam) and wants them combine...
- `wjs-overlaying-video` — Use when the user has one or more video clips and wants to add post-production on top — AI-generated cover as first frame, HTML/CSS capti...
- `wjs-syncing-multicam` — Use when the user has 2+ video / audio recordings of the same event captured by different devices (cameras, phones, separate audio record...

<!-- PACKS:END -->

---

*Generated block above is produced by `scripts/gen-harness.mjs` from the actual pack
`SKILL.md` files (drift-proof). This file is read on demand — it is intentionally NOT a
`CLAUDE.md`, so it does not auto-load into every session.*
