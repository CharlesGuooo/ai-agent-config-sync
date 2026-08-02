# HARNESS — agent-facing routing manifest

**You are an AI agent. Read this when you start work in a project to decide what to
use.** It maps the *harness* (the scaffolding around the model) configured on this
machine — with emphasis on the **local skill packs**, because those are the part you do
NOT get for free.

**What you already have without this file** (auto-exposed at session start, don't re-derive):
global skills, global MCP servers, the global CLAUDE.md/AGENTS.md principles, and the
skills of whatever directory you launched in. **What this file adds:** the home-level
local packs at `~/<pack>/` are NOT auto-discovered when your cwd is elsewhere (e.g. a
fresh repo on another drive). Use the routing table below to pick the right pack, then
`cd ~/<pack>[/<sub>]` (or open it) so its skills auto-load.

---

## Harness at a glance (5 extension points + 2 supplements)

- **CLAUDE.md / AGENTS.md** — layered context, auto-loaded every session (root → cwd,
  concatenated, not overridden). Global lives at `~/.claude/CLAUDE.md` (+ per-agent
  `AGENTS.md`/rules). Keep project CLAUDE.md focused on broadly-applicable knowledge.
- **Hooks** — `guard.mjs` (PreToolUse: blocks secret-file access + destructive shell)
  and `format.mjs` (PostToolUse: formats edited files only if the project opts in) run
  on **Claude Code + Codex**. A `SessionStart → any-buddy` hook may also be present.
  (Cursor/OpenCode hook wiring is a known TODO.)
- **Skills** — progressive disclosure. Global skills auto-load by description match;
  **local packs** below load when you're in their directory. Don't dump reusable
  expertise into CLAUDE.md — that's what skills are for.
- **Plugins** — (Claude) marketplace plugins carry the LSPs (below); no repo-managed
  plugin bundles beyond that.
- **MCP servers** — 9 always-on (`github`, `memory`, `filesystem`, `context7`,
  `sequential-thinking`, `brave-search`, `playwright`, `chrome-devtools`, `web-reader`)
  + 10 opt-in via per-project `.mcp.json` (`supabase`, `vercel`, `railway`, `expo-mcp`,
  `magic`, `zai-mcp-server`, `cloudflare-{docs,workers-builds,workers-bindings,observability}`).
  Reach for MCP to touch tools/data the model can't otherwise; templates in `~/MCP-Templates/`.
- **LSP** — symbol-level navigation. Claude: `pyright` (Python), `typescript`, `gopls`
  (Go), `rust-analyzer`. OpenCode: native (`"lsp": true`, 40+ langs incl. bash). Cursor:
  built into the editor. Codex: no LSP mechanism.
- **Subagents** — delegate exploration so it doesn't crowd your edit context. Built-in
  types: `Explore` (read-only search), `Plan` (design), `general-purpose`,
  `claude-code-guide`. Spawn a read-only Explore agent to map a subsystem, then edit with
  the summary.

---

## Local skill packs — routing (cd into the right one first)

Pick by task, then `cd ~/<pack>[/<sub>]` so the pack's skills auto-load. Document tasks
(PDF/Word/Excel/PPT) use **global** skills directly — no pack needed.

| Task domain | Pack | Sub-packs (cd deeper for the specialty) |
| --- | --- | --- |
| Software dev (general) | `~/dev-project/` | `frontend` `backend` `cloud-platform` `testing-qa` `devops-sre` `agent-dev` `ml` |
| Finance / investing / trading | `~/finance-project/<sub>/` | `trading` `research` `macro` `modeling` `portfolio` `quant-methods` `advisory/{ib,pe,wealth,fund-admin,compliance}` |
| Academic / 科研 (AI/CS focus) | `~/research-project/` | flat (LLM/3DGS/systems paper workflow) |
| Data analysis / stats / viz | `~/data-analysis-project/` | flat |
| Marketing / SEO / content / ads | `~/marketing-project/` | flat |
| Productivity / PM / notes | `~/productivity-project/` | flat |
| iOS / Swift / SwiftUI | `~/ios-project/` | flat |
| Cross-cutting craft (writing/design quality) | `~/craft-project/<sub>/` | `writing` `design` |

The per-skill index below is a discovery aid ("which pack has a skill for X?"). Once you
`cd` into a pack, that pack's full SKILL.md descriptions auto-load — you don't need this
index anymore.

<!-- PACKS:BEGIN -->

> Auto-generated from `skills/project-packs/` by `scripts/gen-harness.mjs`.
> Do not edit between the PACKS markers by hand — run the generator.

**Global skills (38, auto-exposed at startup — no need to route):** Process 12 · Thinking 1 · Escalation 2 · Routing & Meta 5 · Workflow 3 · Code Review 3 · Design & Architecture 4 · OpenSpec 4 · Document 3 · Learning 1.

### Local skill packs — index

#### dev-project (94)
- `changelog-generator` — Generate changelogs and release notes from git history/commits.
- `codebase-onboarding` — Produce onboarding docs and a guided tour of an unfamiliar codebase.
- `database-schema-designer` — Design or review a database schema — tables, relationships, indexes, normalization, migrations.
- `dependency-auditor` — Audit project dependencies for security vulnerabilities, outdated/abandoned packages, and license issues.
- `drawio-skill` — Use when user requests diagrams, flowcharts, architecture charts, or visualizations.
- `find-bugs` — Find bugs, security vulnerabilities, and code quality issues in local branch changes.
- `ponytail` — Forces the laziest solution that actually works, simplest, shortest, most minimal.
- `ponytail-audit` — Whole-repo audit for over-engineering.
- `ponytail-debt` — Harvest every `ponytail:` comment in the codebase into a debt ledger, so the deliberate shortcuts and deferrals ponytail leaves behind ge...
- `ponytail-gain` — Show ponytail's measured impact as a compact scoreboard: less code, less cost, more speed, from the benchmark medians.
- `ponytail-help` — Quick-reference card for all ponytail modes, skills, and commands.
- `ponytail-review` — Code review focused exclusively on over-engineering.
- `release-manager` — Plan and coordinate a software release — versioning, release checklist, tagging, rollout.
- `remotion` — Best practices for Remotion - Video creation in React
- `senior-security` — Security engineering toolkit for threat modeling, vulnerability analysis, secure architecture, and penetration testing.
- `site-architecture` — When the user wants to plan, map, or restructure their website's page hierarchy, navigation, URL structure, or internal linking.
- `tech-debt-tracker` — Scan codebases for technical debt, score severity, track trends, and generate prioritized remediation plans.
- **agent-dev/**
  - `agents-sdk` — Build AI agents on Cloudflare Workers using the Agents SDK.
  - `claude-api` — Build apps with the Claude API or Anthropic SDK.
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
  - `prompt-optimizer` — Creates, optimizes, and iteratively refines agent prompts, system prompts, developer prompts, and reusable prompt templates.
- **backend/**
  - `backend-dev-guidelines` — Comprehensive backend development guide for Node.js/Express/TypeScript microservices.
  - `senior-architect` — This skill should be used when the user asks to "design system architecture", "evaluate microservices vs monolith", "create architecture ...
  - `senior-backend` — Designs and implements backend systems including REST APIs, microservices, database architectures, authentication flows, and security har...
  - `senior-fullstack` — Fullstack development toolkit with project scaffolding for Next.js, FastAPI, MERN, and Django stacks, code quality analysis with security...
- **cloud-platform/**
  - `aws-solution-architect` — Design AWS architectures for startups using serverless patterns and IaC templates.
  - `durable-objects` — Create and review Cloudflare Durable Objects.
  - `posthog-error-tracking-nextjs` — PostHog error tracking for Next.js
  - `posthog-error-tracking-python` — PostHog error tracking for Python
  - `posthog-error-tracking-react` — PostHog error tracking for React
  - `posthog-feature-flags-nextjs` — PostHog feature flags for Next.js applications
  - `posthog-feature-flags-nodejs` — PostHog feature flags for Node.js applications
  - `posthog-feature-flags-python` — PostHog feature flags for Python applications
  - `posthog-feature-flags-react` — PostHog feature flags for React applications
  - `stripe-best-practices` — Guides Stripe integration decisions — API selection (Checkout Sessions vs PaymentIntents), Connect platform setup (Accounts v2, controlle...
  - `stripe-integration-expert` — Integrate Stripe payments end-to-end — checkout, subscriptions, webhooks, customer portal, invoicing.
  - `stripe-projects` — Use when the user needs to provision a third-party service available on https://projects.dev/providers; create or retrieve a provider/ser...
  - `supabase` — Use when doing ANY task involving Supabase.
  - `supabase-postgres-best-practices` — Postgres performance optimization and best practices from Supabase.
  - `upgrade-stripe` — Guide for upgrading Stripe API versions and SDKs
  - `web-perf` — Analyzes web performance using Chrome DevTools MCP.
  - `workers-best-practices` — Reviews and authors Cloudflare Workers code against production best practices.
  - `wrangler` — Cloudflare Workers CLI for deploying, developing, and managing Workers, KV, R2, D1, Vectorize, Hyperdrive, Workers AI, Containers, Queues...
- **devops-sre/**
  - `ci-cd-pipeline-builder` — CI/CD Pipeline Builder
  - `docker-development` — Docker and container development agent skill and plugin for Dockerfile optimization, docker-compose orchestration, multi-stage builds, an...
  - `error-tracking` — Add Sentry v8 error tracking and performance monitoring to your project services.
  - `incident-commander` — Coordinate incident response as incident commander — triage, severity, comms, roles, timeline, postmortem.
  - `observability-designer` — Design observability for production systems — SLI/SLO frameworks, alerting, dashboards, metrics/logs/tracing.
  - `performance-profiler` — Profile and optimize application performance — bottlenecks, hot paths, CPU/memory, latency.
  - `runbook-generator` — Generate operational runbooks — procedures, on-call steps, recovery playbooks.
  - `senior-devops` — Comprehensive DevOps skill for CI/CD, infrastructure automation, containerization, and cloud platforms (AWS, GCP, Azure).
  - `terraform-patterns` — Terraform infrastructure-as-code agent skill and plugin for Claude Code, Codex, Gemini CLI, Cursor, OpenClaw.
- **frontend/**
  - `frontend-design` — Create distinctive, production-grade frontend interfaces with high design quality.
  - `frontend-dev-guidelines` — Frontend development guidelines for React/TypeScript applications.
  - `senior-frontend` — Frontend development skill for React, Next.js, TypeScript, and Tailwind CSS applications.
  - `ui-ux-pro-max` — UI/UX design intelligence for web and mobile.
  - `web-artifacts-builder` — Suite of tools for creating elaborate, multi-component claude.ai HTML artifacts using modern frontend web technologies (React, Tailwind C...
- **ml/**
  - `get-available-resources` — This skill should be used at the start of any computationally intensive scientific task to detect and report available system resources (...
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
  - `pufferlib` — High-performance reinforcement learning framework optimized for speed and scale.
  - `pytorch-lightning` — Deep learning framework (PyTorch Lightning).
  - `scikit-learn` — Machine learning in Python with scikit-learn.
  - `shap` — Model interpretability and explainability using SHAP (SHapley Additive exPlanations).
  - `stable-baselines3` — Production-ready reinforcement learning algorithms (PPO, SAC, DQN, TD3, DDPG, A2C) with scikit-learn-like API.
  - `torch-geometric` — Graph Neural Networks (PyG).
  - `train-sentence-transformers` — Train or fine-tune sentence-transformers models across `SentenceTransformer` (bi-encoder; dense or static embedding model; for retrieval,...
  - `transformers` — This skill should be used when working with pre-trained transformer models for natural language processing, computer vision, audio, or mu...
  - `transformers-js` — Use Transformers.js to run state-of-the-art machine learning models directly in JavaScript/TypeScript.
  - `umap-learn` — UMAP dimensionality reduction.
- **testing-qa/**
  - `api-test-suite-builder` — Build an automated API test suite — endpoint tests, auth, fixtures, contract/integration coverage.
  - `route-tester` — Test authenticated routes in the your project using cookie-based authentication.
  - `senior-qa` — Generates unit tests, integration tests, and E2E tests for React/Next.js applications.
  - `webapp-testing` — Toolkit for interacting with and testing local web applications using Playwright.

#### finance-project (129)
- **advisory/compliance/**
  - `kyc-doc-parse` — Parse an investor or client onboarding packet into structured KYC fields — identity, ownership, control, source of funds, and document in...
  - `kyc-rules` — Apply the firm's KYC/AML rules grid to a parsed onboarding record — assign a risk rating, list every rule outcome with the rule cited, an...
- **advisory/fund-admin/**
  - `accrual-schedule` — Build the period-end accrual schedule — for each accrual, compute the entry, cite the support, and draft the JE.
  - `break-trace` — Root-cause a reconciliation break to its source transaction or posting — follow the audit trail from the break row back to the originatin...
  - `gl-recon` — Reconcile general ledger to subledger for a trade date or period — match at the position or transaction level, surface breaks, and classi...
  - `nav-tieout` — Tie an LP statement to the fund's NAV pack — recompute the LP's capital account from the NAV components and flag any line that doesn't ag...
  - `roll-forward` — Build a roll-forward schedule for a balance-sheet account — beginning balance plus activity less reversals equals ending balance, with ea...
  - `variance-commentary` — Write flux commentary for every P&L and balance-sheet line over threshold — current vs prior period and vs budget, with the driver explai...
- **advisory/ib/**
  - `buyer-list` — Build and organize a universe of potential acquirers for sell-side M&A processes.
  - `cim-builder` — Structure and draft a Confidential Information Memorandum for sell-side M&A processes.
  - `datapack-builder` — Build professional financial services data packs from various sources including CIMs, offering memorandums, SEC filings, web search, or M...
  - `deal-tracker` — Track multiple live deals with milestones, deadlines, action items, and status updates.
  - `pitch-deck` — Populates investment banking pitch deck templates with data from source files.
  - `process-letter` — Draft process letters and bid instructions for sell-side M&A processes.
  - `strip-profile` — Creates professional investment banking strip profiles (company profiles) for pitch books, deal materials, and client presentations.
  - `teaser` — Draft anonymous one-page company teasers for sell-side M&A processes.
- **advisory/pe/**
  - `ai-readiness` — Scan the portfolio for the highest-leverage AI opportunities and rank where to deploy operating-partner time.
  - `dd-checklist` — Generate and track comprehensive due diligence checklists tailored to the target company's sector, deal type, and complexity.
  - `dd-meeting-prep` — Prepare for due diligence meetings — management presentations, expert network calls, customer references, and advisor sessions.
  - `deal-screening` — Quickly screen inbound deal flow — CIMs, teasers, and broker materials — against the fund's investment criteria.
  - `deal-sourcing` — PE deal sourcing workflow — discover target companies, check CRM for existing relationships, and draft personalized founder outreach emails.
  - `ic-memo` — Draft a structured investment committee memo for PE deal approval.
  - `portfolio-monitoring` — Track and analyze portfolio company performance against plan.
  - `value-creation-plan` — Structure post-acquisition value creation plans with revenue, cost, and operational levers mapped to an EBITDA bridge.
- **advisory/wealth/**
  - `client-report` — Generate professional client-facing performance reports with portfolio returns, allocation breakdowns, and market commentary.
  - `client-review` — Prepare for client review meetings with portfolio performance summary, allocation analysis, talking points, and action items.
  - `investment-proposal` — Create professional investment proposals for prospective clients.
- **macro/**
  - `breadth-chart-analyst` — This skill should be used when analyzing market breadth charts, specifically the S&P 500 Breadth Index (200-Day MA based) and the US Stoc...
  - `downtrend-duration-analyzer` — Analyze historical downtrend durations and generate interactive HTML histograms showing typical correction lengths by sector and market cap.
  - `earnings-calendar` — This skill retrieves upcoming earnings announcements for US stocks using the Financial Modeling Prep (FMP) API.
  - `economic-calendar-fetcher` — Fetch upcoming economic events and data releases using FMP API.
  - `ftd-detector` — Detects Follow-Through Day (FTD) signals for market bottom confirmation using William O'Neil's methodology.
  - `ibd-distribution-day-monitor` — Detect IBD-style Distribution Days for QQQ/SPY (close down at least 0.2% on higher volume), track 25-session expiration and 5% invalidati...
  - `institutional-flow-tracker` — Use this skill to track institutional investor ownership changes and portfolio flows using 13F filings data.
  - `macro-rates-monitor` — Build macroeconomic and rates dashboards combining macro indicators, yield curves, inflation breakevens, and swap rates.
  - `macro-regime-detector` — Detect structural macro regime transitions (1-2 year horizon) using cross-asset ratio analysis.
  - `market-breadth-analyzer` — Quantifies market breadth health using TraderMonty's public CSV data.
  - `market-environment-analysis` — Comprehensive market environment analysis and reporting tool.
  - `market-top-detector` — Detects market top probability using O'Neil Distribution Days, Minervini Leading Stock Deterioration, and Monty Defensive Sector Rotation.
  - `scenario-analyzer` — ニュースヘッドラインを入力として18ヶ月シナリオを分析するスキル。
  - `stanley-druckenmiller-investment` — Druckenmiller Strategy Synthesizer - Integrates 8 upstream skill outputs (Market Breadth, Uptrend Analysis, Market Top, Macro Regime, FTD...
  - `uptrend-analyzer` — Analyzes market breadth using Monty's Uptrend Ratio Dashboard data to diagnose the current market environment.
  - `us-market-bubble-detector` — Evaluates market bubble risk through quantitative data-driven analysis using the revised Minsky/Kindleberger framework v2.1.
- **modeling/**
  - `3-statement-model` — Complete, populate and fill out 3-statement financial model templates (Income Statement, Balance Sheet, Cash Flow Statement) .
  - `audit-xls` — Audit a spreadsheet for formula accuracy, errors, and common mistakes.
  - `clean-data-xls` — Clean up messy spreadsheet data — trim whitespace, fix inconsistent casing, convert numbers-stored-as-text, standardize dates, remove dup...
  - `competitive-analysis` — Framework for building competitive landscape decks — market positioning, competitor deep-dives, comparative analysis, strategic synthesis.
  - `comps-analysis` — Build institutional-grade comparable company analyses with operating metrics, valuation multiples, and statistical benchmarking in Excel/...
  - `dcf-model` — Real DCF (Discounted Cash Flow) model creation for equity valuation.
  - `deck-refresh` — Updates a presentation with new numbers — quarterly refreshes, earnings updates, comp rolls, rebased market data.
  - `ib-check-deck` — Investment banking presentation quality checker.
  - `lbo-model` — This skill should be used when completing LBO (Leveraged Buyout) model templates in Excel for private equity transactions, deal materials...
  - `merger-model` — Build accretion/dilution analysis for M&A transactions.
  - `ppt-template-creator` — Creates self-contained PPT template SKILLS (not presentations) from user-provided PowerPoint templates.
  - `pptx-author` — Produce a .pptx file on disk (headless) instead of driving a live PowerPoint document — for managed-agent sessions with no open Office app.
  - `returns-analysis` — Build quick IRR/MOIC sensitivity tables for PE deal evaluation.
  - `unit-economics` — Analyze unit economics for PE targets — ARR cohorts, LTV/CAC, net retention, payback periods, revenue quality, and margin waterfall.
  - `xlsx-author` — Produce a .xlsx file on disk (headless) instead of driving a live Excel workbook — for managed-agent sessions with no open Office app.
- **portfolio/**
  - `backtest-expert` — Expert guidance for systematic backtesting of trading strategies.
  - `bond-futures-basis` — Analyze the bond futures basis by pricing futures, identifying the cheapest-to-deliver, and comparing with yield curves to assess deliver...
  - `bond-relative-value` — Perform relative value analysis on bonds by combining pricing, yield curve context, credit spreads, and scenario stress testing.
  - `edge-concept-synthesizer` — Abstract detector tickets and hints into reusable edge concepts with thesis, invalidation signals, and strategy playbooks before strategy...
  - `edge-hint-extractor` — Extract edge hints from daily market observations and news reactions, with optional LLM ideation, and output canonical hints.yaml for dow...
  - `edge-pipeline-orchestrator` — Orchestrate the full edge research pipeline from candidate detection through strategy design, review, revision, and export.
  - `edge-signal-aggregator` — Aggregate and rank signals from multiple edge-finding skills (edge-candidate-agent, theme-detector, sector-analyst, institutional-flow-tr...
  - `edge-strategy-designer` — Convert abstract edge concepts into strategy draft variants and optional exportable ticket YAMLs for edge-candidate-agent export/validation.
  - `edge-strategy-reviewer` — Critically review strategy drafts from edge-strategy-designer for edge plausibility, overfitting risk, sample size adequacy, and executio...
  - `exposure-coach` — Generate a one-page Market Posture summary with net exposure ceiling, growth-vs-value bias, participation breadth, and new-entry-allowed ...
  - `financial-plan` — Build or update a comprehensive financial plan covering retirement projections, education funding, estate planning, and cash flow analysis.
  - `fixed-income-portfolio` — Review fixed income portfolios by pricing multiple bonds, retrieving reference data, analyzing cashflows, and running scenario analysis.
  - `fx-carry-trade` — Evaluate FX carry trade opportunities by combining spot rates, forward points, interest rate differentials, volatility surface analysis, ...
  - `option-vol-analysis` — Analyze option volatility by combining vol surface data, option pricing with Greeks, and historical price data to assess implied vs reali...
  - `options-strategy-advisor` — Options trading strategy analysis and simulation tool.
  - `portfolio-manager` — Comprehensive portfolio analysis using Alpaca MCP Server integration to fetch holdings and positions, then analyze asset allocation, risk...
  - `portfolio-rebalance` — Analyze portfolio allocation drift and generate rebalancing trade recommendations across accounts.
  - `position-sizer` — Calculate risk-based position sizes for long stock trades.
  - `strategy-pivot-designer` — Detect backtest iteration stagnation and generate structurally different strategy pivot proposals when parameter tuning reaches a local o...
  - `swap-curve-strategy` — Analyze the interest rate swap curve by pricing swaps at multiple tenors, overlaying government and inflation curves, and identifying cur...
  - `tax-loss-harvesting` — Identify tax-loss harvesting opportunities across taxable accounts.
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
  - `catalyst-calendar` — Build and maintain a calendar of upcoming catalysts across a coverage universe — earnings dates, conferences, product launches, regulator...
  - `earnings-analysis` — Create professional equity research earnings update reports (8-12 pages, 3,000-5,000 words) analyzing quarterly results for companies alr...
  - `earnings-preview` — Build pre-earnings analysis with estimate models, scenario frameworks, and key metrics to watch.
  - `earnings-preview-beta` — Generate a concise 4-5 page equity research earnings preview for a single company.
  - `edge-candidate-agent` — Generate and prioritize US equity long-side edge research tickets from EOD observations, then export pipeline-ready candidate specs for t...
  - `equity-research` — Generate comprehensive equity research snapshots combining analyst consensus estimates, company fundamentals, historical prices, and macr...
  - `funding-digest` — Generate a polished one-page PowerPoint slide summarizing key takeaways from recent funding rounds and notable capital markets activity a...
  - `idea-generation` — Systematic stock screening and investment idea sourcing.
  - `initiating-coverage` — Create institutional-quality equity research initiation reports through a 5-task workflow.
  - `market-news-analyst` — This skill should be used when analyzing recent market-moving news events and their impact on equity markets and commodities.
  - `model-update` — Update financial models with new data — quarterly earnings, management guidance, macro changes, or revised assumptions.
  - `morning-note` — Draft concise morning meeting notes summarizing overnight developments, trade ideas, and key events for coverage stocks.
  - `sector-analyst` — This skill should be used when analyzing sector rotation patterns and market cycle positioning.
  - `sector-overview` — Create comprehensive industry and sector landscape reports covering market dynamics, competitive positioning, key players, and thematic t...
  - `signal-postmortem` — Record and analyze post-trade outcomes for signals generated by edge pipeline and other skills.
  - `tear-sheet` — Generate professional company tear sheets using S&P Capital IQ data via the Kensho LLM-ready API MCP server.
  - `theme-detector` — Detect and analyze trending market themes across sectors.
  - `thesis-tracker` — Maintain and update investment theses for portfolio positions and watchlist names.
  - `trade-hypothesis-ideator` — Generate falsifiable trade strategy hypotheses from market data, trade logs, and journal snippets.
  - `trader-memory-core` — Track investment theses across their lifecycle — from screening idea to closed position with postmortem.
  - `us-stock-analysis` — Comprehensive US stock analysis including fundamental analysis (financial metrics, business quality, valuation), technical analysis (indi...
- **trading/**
  - `breakout-trade-planner` — Generate Minervini-style breakout trade plans from VCP screener output with worst-case risk calculation, portfolio heat management, and A...
  - `canslim-screener` — Screen US stocks using William O'Neil's CANSLIM growth stock methodology.
  - `dividend-growth-pullback-screener` — Use this skill to find high-quality dividend growth stocks (12%+ annual dividend growth, 1.5%+ yield) that are experiencing temporary pul...
  - `earnings-trade-analyzer` — Analyze recent post-earnings stocks using a 5-factor scoring system (Gap Size, Pre-Earnings Trend, Volume Trend, MA200 Position, MA50 Pos...
  - `finviz-screener` — Build and open FinViz screener URLs from natural language requests.
  - `kanchi-dividend-review-monitor` — Monitor dividend portfolios with Kanchi-style forced-review triggers (T1-T5) and convert anomalies into OK/WARN/REVIEW states without aut...
  - `kanchi-dividend-sop` — Convert Kanchi-style dividend investing into a repeatable US-stock operating procedure.
  - `kanchi-dividend-us-tax-accounting` — Provide US dividend tax and account-location workflow for Kanchi-style income portfolios.
  - `pair-trade-screener` — Statistical arbitrage tool for identifying and analyzing pair trading opportunities.
  - `parabolic-short-trade-planner` — Screen US equities for parabolic exhaustion patterns and generate conditional pre-market short plans, then evaluate intraday trigger fire...
  - `pead-screener` — Screen post-earnings gap-up stocks for PEAD (Post-Earnings Announcement Drift) patterns.
  - `technical-analyst` — This skill should be used when analyzing weekly price charts for stocks, stock indices, cryptocurrencies, or forex pairs.
  - `value-dividend-screener` — Screen US stocks for high-quality dividend opportunities combining value characteristics (P/E ratio under 20, P/B ratio under 2), attract...
  - `vcp-screener` — Screen S&P 500 stocks for Mark Minervini's Volatility Contraction Pattern (VCP).

#### research-project (47)
- `auto-review-loop` — Iteratively improve YOUR OWN research artifact (paper draft, experiment writeup, or codebase) by having a DIFFERENT model review it adver...
- `citation-management` — Comprehensive citation management for academic research.
- `hypothesis-generation` — Structured hypothesis formulation from observations.
- `latex-compilation` — Compile LaTeX to PDF and report errors clearly, using the self-contained Tectonic engine (auto-downloads packages, runs multi-pass + BibT...
- `latex-paper-en` — English LaTeX assistant for existing .tex journal or conference papers.
- `latex-posters` — Create professional research posters in LaTeX using beamerposter, tikzposter, or baposter.
- `literature-review` — Conduct comprehensive, systematic literature reviews using multiple academic databases (arXiv, Semantic Scholar, ACL Anthology, DBLP, Ope...
- `narrative-flow` — Revise an already-drafted paper for STRUCTURE and FLOW — reverse-outline diagnostics, one-message-per-paragraph rewriting, and section-sp...
- `paper-2-web` — This skill should be used when converting academic papers into promotional and presentation formats including interactive websites (Paper...
- `paper-library` — Search and reason over a LOCAL library of collected research papers (downloaded arXiv/conference PDFs).
- `paper-reading-guide` — Use this whenever the user wants to read, understand, or be walked through an academic paper — whether they share a PDF, arxiv/URL link, ...
- `paper-stress-test` — Adversarially stress-test YOUR OWN paper draft before submission — as the harshest fair reviewer would.
- `peer-review` — Structured manuscript/grant review with checklist-based evaluation.
- `pptx-posters` — Create research posters using HTML/CSS that can be exported to PDF or PPTX.
- `pyzotero` — Interact with Zotero reference management libraries using the pyzotero Python client.
- `repro-pack` — Assemble a reproducibility package for an ML/systems paper so a reviewer or future-you can re-run the experiments.
- `research-codex-en/research` — Conduct preliminary research on a topic and generate research outline.
- `research-codex-en/research-add-fields` — Add field definitions to existing research outline.
- `research-codex-en/research-add-items` — Add items (research objects) to existing research outline.
- `research-codex-en/research-deep` — Read research outline, launch independent agent for each item for deep research.
- `research-codex-en/research-report` — Summarize deep research results into markdown report, cover all fields, skip uncertain values.
- `research-codex-zh/research` — Conduct preliminary research on a topic and generate research outline.
- `research-codex-zh/research-add-fields` — Add field definitions to existing research outline.
- `research-codex-zh/research-add-items` — Add items (research objects) to existing research outline.
- `research-codex-zh/research-deep` — Read research outline, launch independent agent for each item for deep research.
- `research-codex-zh/research-report` — Summarize deep research results into markdown report, cover all fields, skip uncertain values.
- `research-en/research` — Conduct preliminary research on a topic and generate research outline.
- `research-en/research-add-fields` — Add field definitions to existing research outline.
- `research-en/research-add-items` — Add items (research objects) to existing research outline.
- `research-en/research-deep` — Read research outline, launch independent agent for each item for deep research.
- `research-en/research-report` — Summarize deep research results into markdown report, cover all fields, skip uncertain values.
- `research-grants` — Write competitive research proposals for NSF, NIH, DOE, DARPA, and Taiwan NSTC.
- `research-lookup` — Look up current research information using the Parallel Chat API (primary) or Perplexity sonar-pro-search (academic paper searches).
- `research-zh/research` — 对目标话题进行初步调研，生成调研outline。用于学术调研、benchmark调研、技术选型等场景。
- `research-zh/research-add-fields` — 向现有调研outline补充字段定义。
- `research-zh/research-add-items` — 向现有调研outline补充items（调研对象）。
- `research-zh/research-deep` — 读取调研outline，为每个item启动独立agent进行深度调研。禁用task output。
- `research-zh/research-report` — 将deep调研结果汇总为markdown报告，覆盖所有字段，跳过不确定值。
- `scholar-evaluation` — Systematically evaluate scholarly work using the ScholarEval framework, providing structured assessment across research quality dimension...
- `scientific-brainstorming` — Creative research ideation and exploration.
- `scientific-critical-thinking` — Evaluate scientific claims and evidence quality.
- `scientific-schematics` — Create publication-quality scientific diagrams using Nano Banana 2 AI with smart iterative refinement.
- `scientific-slides` — Build slide decks and presentations for research talks.
- `scientific-visualization` — Meta-skill for publication-ready figures.
- `scientific-writing` — Core skill for the deep research and writing tool.
- `terminology-ledger` — Keep terminology, acronyms, and notation consistent across a manuscript.
- `venue-templates` — Access comprehensive LaTeX templates, formatting requirements, and submission guidelines for major scientific publication venues (Nature,...

#### data-analysis-project (18)
- `dask` — Distributed computing for larger-than-RAM pandas/NumPy workflows.
- `defuddle` — Extract clean markdown content from web pages using Defuddle CLI, removing clutter and navigation to save tokens.
- `exploratory-data-analysis` — Perform comprehensive exploratory data analysis on scientific data files across 200+ file formats.
- `infographics` — Create professional infographics using Nano Banana Pro AI with smart iterative refinement.
- `matplotlib` — Low-level plotting library for full customization.
- `networkx` — Comprehensive toolkit for creating, analyzing, and visualizing complex networks and graphs in Python.
- `parallel-web` — Search the web, extract URL content, and run deep research using the Parallel Chat API and Extract API.
- `perplexity-search` — Perform AI-powered web searches with real-time information using Perplexity models via LiteLLM and OpenRouter.
- `plotly` — Interactive visualization library.
- `polars` — Fast in-memory DataFrame library for datasets that fit in RAM.
- `pymc` — Bayesian modeling with PyMC.
- `seaborn` — Statistical visualization with pandas integration.
- `statistical-analysis` — Guided statistical analysis with test selection and reporting.
- `statsmodels` — Statistical models library for Python.
- `sympy` — Use this skill when working with symbolic mathematics in Python.
- `timesfm-forecasting` — Zero-shot time series forecasting with Google's TimesFM foundation model.
- `vaex` — Use this skill for processing and analyzing large tabular datasets (billions of rows) that exceed available RAM.
- `zarr-python` — Chunked N-D arrays for cloud storage.

#### marketing-project (40)
- `ad-creative` — When the user wants to generate, iterate, or scale ad creative — headlines, descriptions, primary text, or full ad variations — for any p...
- `ai-seo` — When the user wants to optimize content for AI search engines, get cited by LLMs, or appear in AI-generated answers.
- `analytics-tracking` — When the user wants to set up, improve, or audit analytics tracking and measurement.
- `canvas-design` — Create beautiful visual art in .png and .pdf documents using design philosophy.
- `churn-prevention` — When the user wants to reduce churn, build cancellation flows, set up save offers, recover failed payments, or implement retention strate...
- `cold-email` — Write B2B cold emails and follow-up sequences that get replies.
- `competitor-alternatives` — When the user wants to create competitor comparison or alternative pages for SEO and sales enablement.
- `content-strategy` — When the user wants to plan a content strategy, decide what content to create, or figure out what topics to cover.
- `copy-editing` — When the user wants to edit, review, or improve existing marketing copy.
- `copywriting` — When the user wants to write, rewrite, or improve marketing copy for any page — including homepage, landing pages, pricing pages, feature...
- `elevenlabs-agents` — Build voice AI agents with ElevenLabs.
- `elevenlabs-music` — Generate music using ElevenLabs Music API.
- `elevenlabs-setup-api-key` — Guides users through setting up an ElevenLabs API key for ElevenLabs MCP tools.
- `elevenlabs-sound-effects` — Generate sound effects from text descriptions using ElevenLabs.
- `elevenlabs-speech-to-text` — Transcribe audio to text using ElevenLabs Scribe v2.
- `elevenlabs-text-to-speech` — Convert text to speech using ElevenLabs voice AI.
- `elevenlabs-transcribe` — Transcribe audio to text using ElevenLabs Scribe.
- `elevenlabs-voice-changer` — Transform the voice in an audio recording into a different target voice while preserving emotion, timing, and delivery using the ElevenLa...
- `elevenlabs-voice-isolator` — Remove background noise and isolate vocals/speech from audio using ElevenLabs Voice Isolator (audio isolation) API.
- `email-sequence` — When the user wants to create or optimize an email sequence, drip campaign, automated email flow, or lifecycle email program.
- `free-tool-strategy` — When the user wants to plan, evaluate, or build a free tool for marketing purposes — lead generation, SEO value, or brand awareness.
- `generate-image` — Generate or edit images using AI models (FLUX, Nano Banana 2).
- `last30days` — Research what people actually say about any topic in the last 30 days.
- `launch-strategy` — When the user wants to plan a product launch, feature announcement, or release strategy.
- `market-research-reports` — Generate comprehensive market research reports (50+ pages) in the style of top consulting firms (McKinsey, BCG, Gartner).
- `marketing-ideas` — When the user needs marketing ideas, inspiration, or strategies for their SaaS or software product.
- `marketing-psychology` — When the user wants to apply psychological principles, mental models, or behavioral science to marketing.
- `paid-ads` — When the user wants help with paid advertising campaigns on Google Ads, Meta (Facebook/Instagram), LinkedIn, Twitter/X, or other ad platf...
- `pricing-strategy` — When the user wants help with pricing decisions, packaging, or monetization strategy.
- `product-marketing-context` — When the user wants to create or update their product marketing context document.
- `programmatic-seo` — When the user wants to create SEO-driven pages at scale using templates and data.
- `referral-program` — When the user wants to create, optimize, or analyze a referral program, affiliate program, or word-of-mouth strategy.
- `revops` — When the user wants help with revenue operations, lead lifecycle management, or marketing-to-sales handoff processes.
- `sales-enablement` — When the user wants to create sales collateral, pitch decks, one-pagers, objection handling docs, or demo scripts.
- `schema-markup` — When the user wants to add, fix, or optimize schema markup and structured data on their site.
- `seo-audit` — When the user wants to audit, review, or diagnose SEO issues on their site.
- `social-content` — When the user wants help creating, scheduling, or optimizing social media content for LinkedIn, Twitter/X, Instagram, TikTok, Facebook, o...
- `theme-factory` — Toolkit for styling artifacts with a theme.
- `wechat-ai-publisher` — 自动采集 AI 热门内容，撰写公众号文章，生成配图并发布到微信公众号草稿箱。当用户说"发布AI热点"、"写公众号文章"、"采集AI内容"、"publish AI news"时触发。
- `xhs-visual-director` — Use this skill when planning, redesigning, or reviewing Xiaohongshu carousel visuals, covers, 3:4 image posts, page-by-page visual direct...

#### productivity-project (22)
- `capture-tasks-from-meeting-notes` — Analyze meeting notes to find action items and create Jira tasks for assigned work.
- `doc-coauthoring` — Guide users through a structured workflow for co-authoring documentation.
- `generate-status-report` — Generate project status reports from Jira issues and publish to Confluence.
- `gws` — Google Workspace CLI for AI agents.
- `internal-comms` — A set of resources to help me write all kinds of internal communications, using the formats that my company likes to use.
- `jira-expert` — Atlassian Jira expert for creating and managing projects, planning, product discovery, JQL queries, workflows, custom fields, automation,...
- `json-canvas` — Create and edit JSON Canvas files (.canvas) with nodes, edges, groups, and connections.
- `markdown-mermaid-writing` — Comprehensive markdown and Mermaid diagram writing skill.
- `notebooklm` — Drive Google NotebookLM from the agent — auto-upload PDFs/sources, then get grounded summaries and Q&A back.
- `notion-cli` — Use the Notion CLI (`ntn`) to interact with the Notion API, manage workers, and upload files.
- `obsidian-bases` — Create and edit Obsidian Bases (.base files) with views, filters, formulas, and summaries.
- `obsidian-cli` — Interact with Obsidian vaults using the Obsidian CLI to read, create, search, and manage notes, tasks, properties, and more.
- `obsidian-markdown` — Create and edit Obsidian Flavored Markdown with wikilinks, embeds, callouts, properties, and other Obsidian-specific syntax.
- `open-notebook` — Self-hosted, open-source alternative to Google NotebookLM for AI-powered research and document analysis.
- `planning-with-files` — Implements Manus-style file-based planning to organize and track progress on complex tasks.
- `ppt-master` — Generate truly EDITABLE PowerPoint (.pptx) from any document — native shapes and native animations (not slide images), optional speaker-n...
- `scrum-master` — Advanced Scrum Master skill for data-driven agile team analysis and coaching.
- `search-company-knowledge` — Search across company knowledge bases (Confluence, Jira, internal docs) to find and explain internal concepts, processes, and technical d...
- `senior-pm` — Senior Project Manager for enterprise software, SaaS, and digital transformation projects.
- `spec-to-backlog` — Automatically convert Confluence specification documents into structured Jira backlogs with Epics and implementation tickets.
- `triage-issue` — Intelligently triage bug reports and error messages by searching for duplicates in Jira and offering to create new issues or add comments...
- `what-if-oracle` — Run structured What-If scenario analysis with multi-branch possibility exploration.

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

#### craft-project (9)
- **design/**
  - `banner-design` — Design banners for social media, ads, website heroes, creative assets, and print.
  - `brand` — Brand voice, visual identity, messaging frameworks, asset management, brand consistency.
  - `design` — Comprehensive design skill: brand identity, design tokens, UI styling, logo generation (55 styles, Gemini AI), corporate identity program...
  - `design-system` — Token architecture, component specifications, and slide generation.
  - `impeccable` — Give an AI coding agent real design craft: a shared design vocabulary, live in-browser iteration, and 44 deterministic checks that catch ...
  - `slides` — Create strategic HTML presentations with Chart.js, design tokens, responsive layouts, copywriting formulas, and contextual slide strategies.
  - `taste-skill` — Anti-slop frontend skill for landing pages, portfolios, and redesigns.
  - `ui-styling` — Create beautiful, accessible user interfaces with shadcn/ui components (built on Radix UI + Tailwind), Tailwind CSS utility-first styling...
- **writing/**
  - `humanizer` — Remove signs of AI-generated writing from text.

<!-- PACKS:END -->

---

*Generated block above is produced by `scripts/gen-harness.mjs` from the actual pack
`SKILL.md` files (drift-proof). This file is read on demand — it is intentionally NOT a
`CLAUDE.md`, so it does not auto-load into every session.*
