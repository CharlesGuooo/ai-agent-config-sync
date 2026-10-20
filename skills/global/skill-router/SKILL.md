---
name: skill-router
description: Decide which local project directory should own a task and (if needed) which sub-folder under it. Use this whenever the user starts substantive work — coding, research, finance, marketing, data analysis, productivity — to route the session to the right pack BEFORE loading any local skills. Also use when the user asks "which directory should I work in" or seems to be in the wrong cwd. Don't enumerate local skills from the global layer — just hand off the cd target.
---

# Skill Router

## Purpose

Use this skill to decide:

1. Which project directory should own the task.
2. Whether the task spans more than one domain.

This skill is a router, not a domain handbook. It should not teach frontend, backend, research, or data-analysis practices directly. Its job is to send the session to the right place.

## Routing Principles

- Prefer one clear primary domain.
- Add one secondary domain only if it materially changes execution.
- Route before loading domain-specific skills.
- Keep the global layer thin. Domain guardrails belong in local project skill packs.
- If the current directory already matches the best domain, stay there instead of asking for a move.
- The global layer should route to a directory, not curate a local skill list.

## Global Skills That Don't Need Routing

These are available regardless of directory — don't route the user just to use them:

**Process discipline:**
- `using-superpowers`, `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`
- `subagent-driven-development`, `dispatching-parallel-agents`, `using-git-worktrees` — multi-agent orchestration
- `handoff` — 会话交接给下一个 agent
- `action-first` — 输出风格开关(动作优先、无废话);user-invoked,不参与自动匹配

**Design & architecture:**
- `codebase-design`(深模块词汇), `domain-modeling`(GLOSSARY.md/ADR), `prototype`(一次性原型), `improve-codebase-architecture`(代码库体检)

**Code review flow:**
- `requesting-code-review`, `receiving-code-review`, `finishing-a-development-branch`

**Escalation:**
- `high-agency` (常驻内驱 + 第 2 次失败时的 Recovery Protocol)

**Meta / safety:**
- `skill-creator`, `skill-scanner` (装新 community skill 前先扫安全)

**Document handling:**
- `pdf`, `officecli`(Word/Excel/PPT), `markitdown` — document tasks need NO project switch

**External workflows:**
- `playwright-interactive`, `github-gold`

**OpenSpec workflow:**
- `openspec-{explore, propose, apply-change, archive-change}`

## Domain Map

| Domain | Directory | Typical task shape |
| --- | --- | --- |
| Software / dev / LLM-agent / ML | `~/dev-project/<sub>/` (8 sub-folders) | Frontend, backend, APIs, cloud-platform, testing/QA, DevOps/SRE, LLM agent frameworks, ML/RL training — see "Dev sub-routing" below |
| iOS / Swift / SwiftUI | `~/ios-project/` | iOS app development, Swift concurrency, SwiftUI components, App Store, native profiling |
| Finance / Investing / Trading | `~/finance-project/<sub>/` (4 sub-folders) | Trading ideas, strategy research and review, backtests and position sizing, quant methodology — see "Finance sub-routing" below |
| Data analysis | `~/data-analysis-project/` | EDA, statistics, visualization, notebooks, forecasting, time-series |
| Marketing | `~/marketing-project/` | SEO, ads, copywriting, growth, social, **ElevenLabs audio** |
| Research / academic | `~/research-project/<sub>/` (5 sub-folders) | Literature and surveys, experiment framing, manuscript writing and LaTeX, figures, review and rebuttal, talks and posters — see "Research sub-routing" below |
| Productivity | `~/productivity-project/` | Obsidian, Notion, NotebookLM, Google Workspace, planning with files, job search and CVs, research-to-decision memos |
| Video editing | `~/media-project/` | ffmpeg recipes, multicam sync and cuts, subtitles, overlays, audio cleanup |
| Divination / dating | `~/life-project/` | 八字, 风水, 六壬, 梅花易数, 奇门, 塔罗, 星盘, dating advice |
| Craft (cross-cutting) | `~/craft-project/<sub>/` (2 sub-folders) | Making writing or visual design look made by a person: Chinese prose de-AI-ing, UI taste and style systems, image-led web comps, slide polish — see "Craft sub-routing" below |

## Domain Heuristics

Use these to break ties:

- If the user is building software, default to `~/dev-project/<sub>/` even when the software uses AI. Then pick the right sub-folder (see Dev sub-routing).
- If the task is iOS / Swift / SwiftUI native app work, route to `~/ios-project/`.
- If the user is analyzing data for insight (charts / stats / EDA / forecasting), default to `~/data-analysis-project/`.
- If the task involves trading, strategy research, backtests, or quant methodology, route to `~/finance-project/<sub>/` (see Finance sub-routing).
- If the user is writing research artifacts (papers / reviews / talks) rather than building systems, route to `~/research-project/<sub>/` (see Research sub-routing).
- If the task centers on business messaging, growth, audio content, or acquisition, default to `~/marketing-project/`.
- If the task is primarily document transformation (PDF / Word / Excel / PowerPoint), use **global** document skills directly — no directory switch needed.
- If the task is workflow tooling or Obsidian/Notion/NotebookLM/Google Workspace, default to `~/productivity-project/`.
- If the work already exists and the ask is to make it look or read better (taste, style, de-AI-ing), route to `~/craft-project/<sub>/` (see Craft sub-routing); building the thing itself stays in its own domain.

## Dev Sub-Routing

`~/dev-project/` has 8 sub-folders — route to the most specific:

| Sub-folder | Use when |
| --- | --- |
| `~/dev-project/` (top) | Repo workflow (changelog/tech-debt/release), cross-cutting (find-bugs/drawio), security review, niche (remotion/site-architecture) |
| `~/dev-project/frontend/` | React / Next / Tailwind / Suspense / SSR / UI design (frontend-design avoids "AI slop") |
| `~/dev-project/backend/` | REST APIs, microservices, system architecture, auth, full-stack (Next/FastAPI/MERN/Django) |
| `~/dev-project/cloud-platform/` | AWS / Cloudflare (Workers/DO) / Stripe / Supabase / PostHog (feature flags, error tracking, analytics) |
| `~/dev-project/testing-qa/` | API tests, E2E with Playwright, Jest / RTL unit + integration |
| `~/dev-project/devops-sre/` | CI/CD pipelines, Docker, performance profiling |
| `~/dev-project/agent-dev/` | Building LLM agents: LangChain, LangGraph, Deep Agents, MCP server, Claude SDK, prompt-optimizer |
| `~/dev-project/ml/` | Training ML: sklearn / PyTorch Lightning / transformers / GNN / SHAP / UMAP / RL (SB3, pufferlib) + HuggingFace 13 |

## Finance Sub-Routing

`~/finance-project/` is a container, not a skill pack. Always route to one of these:

| Sub-folder | Use when |
| --- | --- |
| `~/finance-project/trading/` | Technical analysis of a chart, pair-trade screening |
| `~/finance-project/research/` | Trade hypotheses, research tickets, thesis tracking, signal post-mortems, trade journal memory |
| `~/finance-project/portfolio/` | Edge research pipeline (hints → concepts → strategy drafts → review), backtest robustness, position sizing, strategy pivots |
| `~/finance-project/quant-methods/` | López de Prado AFML methodology: PBO / Deflated Sharpe / Purged K-Fold CV / Triple Barrier / Bet Sizing / GARCH / HMM regime / portfolio optimization / risk metrics / backtest framework selection / execution cost modeling / thesis structuring |

## Research Sub-Routing

`~/research-project/` is a container, not a skill pack. Always route to one of these:

| Sub-folder | Use when |
| --- | --- |
| `~/research-project/literature/` | Finding prior work, mining PDFs you already have, landscape/benchmark surveys, BibTeX and citation validation |
| `~/research-project/gates/` | Framing what to work on and how you would know it failed — hypothesis formulation, and the experiment-design decisions that precede a run |
| `~/research-project/manuscript/` | Writing and restructuring the paper, LaTeX mechanics and compilation, figures, terminology consistency, venue formatting, reproducibility packaging |
| `~/research-project/review/` | Attacking a draft — your own before submission, someone else's as a reviewer, or iterating with a second model |
| `~/research-project/talks/` | After acceptance: slides, LaTeX posters, PPTX posters |

Nothing in this pack requires a paid API key. Each skill declares its tier on a
`compatibility:` line (`offline` / `network` / `local-tools`).

## Craft Sub-Routing

`~/craft-project/` is a container, not a skill pack. Always route to one of these:

| Sub-folder | Use when |
| --- | --- |
| `~/craft-project/writing/` | Chinese prose that reads as machine-written (humanizer-zh); for English drafts the global `no-ai-slop` needs no switch |
| `~/craft-project/design/` | UI taste and style direction, design systems and brand kits, image-generated web/app comps and image-to-code, Impeccable, slide polish |

## Cross-Domain Rules

Many tasks are mixed. Use this format:

- `Primary domain`: the directory where most implementation or reasoning should happen
- `Secondary domain`: optional, only if it materially changes where supporting work belongs

Examples:

- Build a LangGraph app for literature synthesis
  - Primary: `~/dev-project/agent-dev/`
  - Secondary: `~/research-project/literature/`
- Train a deep model and plot evaluation curves
  - Primary: `~/dev-project/ml/`
  - Secondary: `~/data-analysis-project/`
- Build a dashboard for marketing metrics
  - Primary: `~/dev-project/`
  - Secondary: `~/marketing-project/`

## Output Format

When routing a task, answer in this structure:

```text
Primary domain: <domain>
Directory: <path>
Secondary domain: <domain or none>
Why: <one or two sentences>
Switch command: cd <path> && claude
```

If already in the correct directory:

```text
Primary domain: <domain>
Directory: <current path>
Secondary domain: <domain or none>
Why: <one or two sentences>
Switch command: none
```

## Startup Guidance

After routing, tell the user to start from the target project directory and let that local pack govern domain-specific skill choice.

- Do not enumerate local skills from the global layer.
- Do not dump a long list of next steps.
- If the current directory is already correct, say so and continue there.

## What Not To Do

- Do not duplicate local domain skill content here.
- Do not block work with domain-specific guardrails from the global layer.
- Do not recommend changing directories when the current one is already correct.
- Do not suggest more than one secondary domain.
- Do not turn a routing answer into a full design or implementation plan.
- Do not recommend specific local skills from the global layer.
