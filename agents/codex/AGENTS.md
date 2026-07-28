# Codex Global Instructions

## Core Principles

Guidelines that bias toward caution over speed. For trivial tasks, use judgment.

**1. Think before acting.** State assumptions explicitly; if uncertain, ask. When multiple interpretations exist, present them — don't pick silently. If something is unclear, stop and name what's confusing before proceeding.

**2. Simplicity first.** Write the minimum code that solves the problem; nothing speculative. No abstractions for single-use code, no flexibility nobody asked for, no error handling for impossible cases. If a simpler approach exists, say so and push back. Test: would a senior engineer call this overcomplicated? If 200 lines could be 50, rewrite.

**3. Surgical changes.** Touch only what the task requires. Don't refactor what isn't broken; match the surrounding style even if you'd do it differently. Remove only the imports/variables your change orphaned — mention unrelated dead code, don't delete it. Test: every changed line traces directly to the request.

**4. Exhaust options before giving up.** Try the reasonable alternatives before claiming something can't be done. "It doesn't work" is a hypothesis to test, not a conclusion to report.

**5. Verify before claiming success.** Define success criteria, then prove them with evidence — run it, test it, observe it. Never report "done" or "fixed" on code you haven't exercised. "Fix the bug" means: write a test that reproduces it, then make it pass.

**6. Preserve context and align with the goal.** Keep the user's actual objective in view; don't win a subtask at the expense of the real goal.

> Aligned with andrej-karpathy-skills' `karpathy-guidelines` (Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution), extended with "Exhaust options" and "Preserve context". Loaded at system-prompt level — zero skill-match cost.

---

<!-- SKILLS:BEGIN -->

## Global Skills (36)

> Auto-generated from `skills/global/` by `scripts/gen-skill-table.mjs`.
> Do not edit between the SKILLS markers by hand — run the generator instead.

### Process (11) — Process discipline

| Skill | When to use |
| --- | --- |
| `using-superpowers` | Decide whether a skill applies before acting |
| `brainstorming` | Clarify intent/requirements/design before building or changing behavior |
| `writing-plans` | Write a multi-step implementation plan before coding |
| `executing-plans` | Execute an existing written plan step by step |
| `test-driven-development` | Write tests before implementing or fixing |
| `systematic-debugging` | Structured root-cause investigation for bugs |
| `verification-before-completion` | Verify with evidence before claiming done |
| `subagent-driven-development` | Dispatch subagents per plan step with spec/quality reviewers |
| `dispatching-parallel-agents` | Run 2+ independent tasks via parallel subagents with a merge protocol |
| `using-git-worktrees` | Isolated worktrees for parallel agents / high-risk refactors |
| `handoff` | Compact the session into a handoff doc for the next agent |

### Thinking (1) — Reasoning frameworks

| Skill | When to use |
| --- | --- |
| `first-principles-thinking` | Reason from base truths instead of by analogy; question inherited assumptions |

### Escalation (2) — Drive / pressure

| Skill | When to use |
| --- | --- |
| `high-agency` | Stay proactive and own complex long tasks |
| `pua` | High-pressure escalation after repeated failure or passivity |

### Routing & Meta (4) — Routing + skill tooling

| Skill | When to use |
| --- | --- |
| `skill-router` | Route the task to the correct local project pack |
| `skill-creator` | Create, edit, or evaluate a skill |
| `skill-scanner` | Security-scan a community skill before installing it |
| `writing-great-skills` | Rubric for writing/auditing skills: triggering, structure, steering, trimming (user-invoked) |

### Workflow (3) — External collaboration

| Skill | When to use |
| --- | --- |
| `playwright-interactive` | Persistent browser session for iterative UI debugging |
| `gh-fix-ci` | Investigate and fix failing GitHub Actions / PR checks with gh |
| `gh-address-comments` | Work through GitHub PR review comments with gh |

### Code Review (3) — Review discipline

| Skill | When to use |
| --- | --- |
| `requesting-code-review` | Self-review before merge/completion |
| `receiving-code-review` | Respond technically to review feedback |
| `finishing-a-development-branch` | Wrap up a dev branch (rebase/squash/PR) |

### Design & Architecture (4) — Deep modules, domain language, prototypes

| Skill | When to use |
| --- | --- |
| `codebase-design` | Deep-module vocabulary: interface, seam, depth, leverage, locality |
| `domain-modeling` | Pin down domain terms (CONTEXT.md) and record decisions (ADRs) |
| `prototype` | Throwaway prototype to settle one design question |
| `improve-codebase-architecture` | Scan a codebase for deepening opportunities → visual HTML report |

### OpenSpec (4) — Spec-driven development

| Skill | When to use |
| --- | --- |
| `openspec-explore` | Think through a spec before writing it |
| `openspec-propose` | Generate a full change proposal (design/specs/tasks) in one step |
| `openspec-apply-change` | Implement an OpenSpec change task by task |
| `openspec-archive-change` | Archive a completed OpenSpec change |

### Document (3) — Office / document I/O

| Skill | When to use |
| --- | --- |
| `pdf` | PDF read/merge/split/OCR/forms |
| `officecli` | Create/edit/render .docx/.xlsx/.pptx via the officecli binary (formulas, pivots, HTML/PNG) |
| `markitdown` | Convert PDF/Office/images/AV to Markdown |

### Learning (1) — Interactive teaching

| Skill | When to use |
| --- | --- |
| `teach` | Interactive multi-turn tutoring with persistent learner state |

<!-- SKILLS:END -->

---

## Local Project Packs

When a task is domain-specific, `cd` into the matching project directory and Codex will load the local skill pack.

| Domain | Directory | Skills |
| --- | --- | --- |
| Software dev (general) | `~/dev-project/` | 11 (workflow + cross-cutting) |
| Frontend / Web UI | `~/dev-project/frontend/` | 4 |
| Backend / Architecture | `~/dev-project/backend/` | 4 |
| Cloud / Platform (AWS / Cloudflare / Stripe / Supabase / PostHog) | `~/dev-project/cloud-platform/` | 18 |
| Testing / QA | `~/dev-project/testing-qa/` | 4 |
| DevOps / SRE / Observability | `~/dev-project/devops-sre/` | 9 |
| AI Agent dev (LangChain / LangGraph / Deep / MCP / Claude SDK) | `~/dev-project/agent-dev/` | 15 |
| ML / DL / RL training | `~/dev-project/ml/` | 22 |
| Finance / Trading | `~/finance-project/trading/` | 14 |
| Finance / Equity Research | `~/finance-project/research/` | 21 |
| Finance / Macro | `~/finance-project/macro/` | 16 |
| Finance / Financial Modeling | `~/finance-project/modeling/` | 15 |
| Finance / Portfolio | `~/finance-project/portfolio/` | 21 |
| Finance / Quant Methods (AFML) | `~/finance-project/quant-methods/` | 15 |
| Finance / Advisory (IB) | `~/finance-project/advisory/ib/` | 8 |
| Finance / Advisory (PE) | `~/finance-project/advisory/pe/` | 8 |
| Finance / Advisory (Wealth) | `~/finance-project/advisory/wealth/` | 3 |
| Finance / Advisory (Fund Admin) | `~/finance-project/advisory/fund-admin/` | 6 |
| Finance / Advisory (Compliance) | `~/finance-project/advisory/compliance/` | 2 |
| Data analysis | `~/data-analysis-project/` | 18 |
| Marketing | `~/marketing-project/` | 39 |
| Research / Academic | `~/research-project/` | 29 |
| Productivity / PM | `~/productivity-project/` | 23 |
| iOS / Swift / SwiftUI | `~/ios-project/` | 21 |
| Craft (writing / design, cross-cutting) | `~/craft-project/<sub>/` | 3 |

> Document tasks (PDF/Word/Excel/PowerPoint) use **global** skills directly — no project switch needed.

### Usage

```bash
cd ~/dev-project/frontend/ && codex       # frontend
cd ~/finance-project/quant-methods/ && codex  # quant methods
cd ~/marketing-project/ && codex          # marketing
```

---

## Global MCP (19)

All MCPs configured globally — startup-free, called on demand. **9 always-on + 10 opt-in** (per-project `.mcp.json` or `--mcp-config` flag).

- **Always-on (9)**: github, memory, filesystem, context7, sequential-thinking, brave-search, playwright, chrome-devtools, web-reader (web-reader disabled in Codex only)
- **Opt-in (10)**: supabase, vercel, railway, expo-mcp, magic, zai-mcp-server, cloudflare-{docs, workers-builds, workers-bindings, observability}

Templates for `.mcp.json` files in `C:\Users\PC\MCP-Templates\`.

---

## Cross-Agent Unified

Claude Code, Codex, OpenCode, Cursor share the **same skill directories and MCP set**:

```bash
cd ~/dev-project/ && claude
cd ~/dev-project/ && codex
cd ~/dev-project/ && opencode
# Cursor: open ~/dev-project/ in the IDE
```

---

## Config Locations

| Item | Path |
| --- | --- |
| Codex config | `~/.codex/config.toml` |
| Skills (global) | `~/.codex/skills/` |
| Skills (project) | `~/<project>/.codex/skills/` |
| MCP | 19 servers in `config.toml` (`[mcp_servers.*]`) |
