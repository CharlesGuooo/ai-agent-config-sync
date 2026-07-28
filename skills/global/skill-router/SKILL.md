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

**Design & architecture:**
- `codebase-design`(深模块词汇), `domain-modeling`(CONTEXT.md/ADR), `prototype`(一次性原型), `improve-codebase-architecture`(代码库体检)

**Code review flow:**
- `requesting-code-review`, `receiving-code-review`, `finishing-a-development-branch`

**Escalation:**
- `high-agency` (常驻内驱), `pua` (失败时高压)

**Meta / safety:**
- `skill-creator`, `skill-scanner` (装新 community skill 前先扫安全)

**Document handling:**
- `pdf`, `officecli`(Word/Excel/PPT), `markitdown` — document tasks need NO project switch

**External workflows:**
- `playwright-interactive`, `gh-fix-ci`, `gh-address-comments`

**OpenSpec workflow:**
- `openspec-{explore, propose, apply-change, archive-change}`

## Domain Map

| Domain | Directory | Typical task shape |
| --- | --- | --- |
| Software / dev / LLM-agent / ML | `~/dev-project/<sub>/` (8 sub-folders) | Frontend, backend, APIs, cloud-platform, testing/QA, DevOps/SRE, LLM agent frameworks, ML/RL training — see "Dev sub-routing" below |
| iOS / Swift / SwiftUI | `~/ios-project/` | iOS app development, Swift concurrency, SwiftUI components, App Store, native profiling |
| Finance / Investing / Trading | `~/finance-project/<sub>/` (11 routing targets) | Active trading, equity research, macro/timing, financial modeling, portfolio mgmt, IB/PE/wealth/fund-admin/compliance, quant methodology — see "Finance sub-routing" below |
| Data analysis | `~/data-analysis-project/` | EDA, statistics, visualization, notebooks, forecasting, time-series |
| Marketing | `~/marketing-project/` | SEO, ads, copywriting, growth, social, **ElevenLabs audio** |
| Research / academic | `~/research-project/` | Papers, literature reviews, grants, scientific writing, peer review, academic posters |
| Productivity / PM | `~/productivity-project/` | Obsidian, Jira, Atlassian, Notion, Google Workspace, PM workflows |

## Domain Heuristics

Use these to break ties:

- If the user is building software, default to `~/dev-project/<sub>/` even when the software uses AI. Then pick the right sub-folder (see Dev sub-routing).
- If the task is iOS / Swift / SwiftUI native app work, route to `~/ios-project/`.
- If the user is analyzing data for insight (charts / stats / EDA / forecasting), default to `~/data-analysis-project/`.
- If the task involves stocks, trading, portfolio, valuation, IB/PE, financial modeling, or quant methodology, route to `~/finance-project/<sub>/` (see Finance sub-routing).
- If the user is writing research artifacts (papers / grants / reviews) rather than building systems, default to `~/research-project/`.
- If the task centers on business messaging, growth, audio content, or acquisition, default to `~/marketing-project/`.
- If the task is primarily document transformation (PDF / Word / Excel / PowerPoint), use **global** document skills directly — no directory switch needed.
- If the task is workflow tooling, Obsidian/Jira/Notion/Atlassian, or organizational operations, default to `~/productivity-project/`.

## Dev Sub-Routing

`~/dev-project/` has 8 sub-folders — route to the most specific:

| Sub-folder | Use when |
| --- | --- |
| `~/dev-project/` (top) | Repo workflow (changelog/tech-debt/release), cross-cutting (find-bugs/drawio), security review, niche (remotion/site-architecture) |
| `~/dev-project/frontend/` | React / Next / Tailwind / Suspense / SSR / UI design (frontend-design avoids "AI slop") |
| `~/dev-project/backend/` | REST APIs, microservices, system architecture, auth, full-stack (Next/FastAPI/MERN/Django) |
| `~/dev-project/cloud-platform/` | AWS / Cloudflare (Workers/DO) / Stripe / Supabase / PostHog (feature flags, error tracking, analytics) |
| `~/dev-project/testing-qa/` | API tests, route tests, E2E with Playwright, Jest / RTL unit + integration |
| `~/dev-project/devops-sre/` | CI/CD pipelines, Docker, Terraform, observability, performance profiling, incident response |
| `~/dev-project/agent-dev/` | Building LLM agents: LangChain, LangGraph, Deep Agents, MCP server, Claude SDK, Cloudflare agents-sdk, prompt-optimizer |
| `~/dev-project/ml/` | Training ML: sklearn / PyTorch Lightning / transformers / GNN / SHAP / UMAP / RL (SB3, pufferlib) + HuggingFace 13 |

## Finance Sub-Routing

`~/finance-project/` is a container, not a skill pack. Always route to one of these:

| Sub-folder | Use when |
| --- | --- |
| `~/finance-project/trading/` | Active trading, stock screening (VCP / CANSLIM / PEAD / breakout), Kanchi dividend strategies, technical analysis, entry decisions |
| `~/finance-project/research/` | Equity research, sector overviews, investment thesis, idea generation, earnings notes, initiating coverage |
| `~/finance-project/macro/` | Market regime, breadth, top/bottom detection, market timing, Druckenmiller-style macro |
| `~/finance-project/modeling/` | DCF, LBO, comps, 3-statement, merger model, Excel audit, IB-style deliverables |
| `~/finance-project/portfolio/` | Position sizing, options strategy, backtest, rebalancing, tax-loss harvesting, FX/rates relative value |
| `~/finance-project/advisory/ib/` | Investment Banking: CIM, teaser, pitch deck, buyer list, process letter, deal tracker |
| `~/finance-project/advisory/pe/` | Private Equity: deal sourcing, DD, IC memo, portfolio monitoring, value creation |
| `~/finance-project/advisory/wealth/` | Wealth management: client review, performance report, investment proposal |
| `~/finance-project/advisory/fund-admin/` | Fund admin: GL recon, NAV tieout, accruals, roll-forward, variance, break trace |
| `~/finance-project/advisory/compliance/` | Compliance / KYC: doc parsing, rules engine |
| `~/finance-project/quant-methods/` | López de Prado AFML methodology: PBO / Deflated Sharpe / Purged K-Fold CV / Triple Barrier / Bet Sizing / GARCH / HMM regime / portfolio optimization / risk metrics / backtest framework selection / execution cost modeling / thesis structuring |

## Cross-Domain Rules

Many tasks are mixed. Use this format:

- `Primary domain`: the directory where most implementation or reasoning should happen
- `Secondary domain`: optional, only if it materially changes where supporting work belongs

Examples:

- Build a LangGraph app for literature synthesis
  - Primary: `~/dev-project/agent-dev/`
  - Secondary: `~/research-project/`
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
