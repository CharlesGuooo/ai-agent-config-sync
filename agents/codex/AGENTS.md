# Codex Global Instructions

## Core Principles

1. Think before acting.
2. When multiple interpretations exist, present them — don't pick silently.
3. Push back when a simpler approach exists; don't just follow.
4. Touch only what the task requires — mention unrelated dead code, don't delete.
5. Exhaust reasonable options before claiming something cannot be done.
6. Verify results before claiming success.
7. Preserve context and align with the user's actual goal.

> Aligned with andrej-karpathy-skills' `karpathy-guidelines` (Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution), extended with "Exhaust options" and "Preserve context". Loaded at system-prompt level — zero skill-match cost.

---

## Global Skills (30)

The global layer covers process, routing, escalation, repeatable workflows, and document handling. Identical content across Claude / Cursor / OpenCode / Codex.

- **Process** (10): using-superpowers, brainstorming, writing-plans, executing-plans, test-driven-development, systematic-debugging, verification-before-completion, subagent-driven-development, dispatching-parallel-agents, using-git-worktrees
- **Escalation** (2): high-agency, pua
- **Routing & Meta** (3): skill-router, skill-creator, skill-scanner
- **Workflow** (3): playwright-interactive, gh-fix-ci, gh-address-comments
- **Code Review** (3): requesting-code-review, receiving-code-review, finishing-a-development-branch
- **OpenSpec** (4): openspec-{explore,propose,apply-change,archive-change}
- **Document** (5): pdf, docx, xlsx, pptx, markitdown

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
| Marketing | `~/marketing-project/` | 38 |
| Research / Academic | `~/research-project/` | 18 |
| Productivity / PM | `~/productivity-project/` | 20 |
| iOS / Swift / SwiftUI | `~/ios-project/` | 14 |

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
