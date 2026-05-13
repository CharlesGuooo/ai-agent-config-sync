# Cursor Global Rules

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

The global layer covers process, routing, escalation, workflows, and document handling. Identical across Claude / Cursor / OpenCode / Codex.

- **Process** (10): using-superpowers, brainstorming, writing-plans, executing-plans, test-driven-development, systematic-debugging, verification-before-completion, subagent-driven-development, dispatching-parallel-agents, using-git-worktrees
- **Escalation** (2): high-agency, pua
- **Routing & Meta** (3): skill-router, skill-creator, skill-scanner
- **Workflow** (3): playwright-interactive, gh-fix-ci, gh-address-comments
- **Code Review** (3): requesting-code-review, receiving-code-review, finishing-a-development-branch
- **OpenSpec** (4): openspec-{explore,propose,apply-change,archive-change}
- **Document** (5): pdf, docx, xlsx, pptx, markitdown

---

## Local Project Packs

When a task is domain-specific, open the matching project directory in Cursor and the local skill pack loads.

| Domain | Directory |
| --- | --- |
| Software dev (general / workflow) | `~/dev-project/` |
| Frontend / Web UI | `~/dev-project/frontend/` |
| Backend / Architecture | `~/dev-project/backend/` |
| Cloud / Platform (AWS / CF / Stripe / Supabase / PostHog) | `~/dev-project/cloud-platform/` |
| Testing / QA | `~/dev-project/testing-qa/` |
| DevOps / SRE | `~/dev-project/devops-sre/` |
| AI Agent dev (LangChain / LangGraph / Deep / MCP) | `~/dev-project/agent-dev/` |
| ML / DL / RL training | `~/dev-project/ml/` |
| Finance (container, cd a sub) | `~/finance-project/{trading,research,macro,modeling,portfolio,quant-methods,advisory/{ib,pe,wealth,fund-admin,compliance}}/` |
| Data analysis | `~/data-analysis-project/` |
| Marketing | `~/marketing-project/` |
| Research / Academic | `~/research-project/` |
| Productivity / PM | `~/productivity-project/` |
| iOS / Swift / SwiftUI | `~/ios-project/` |

> Document tasks (PDF/Word/Excel/PowerPoint) use **global** skills directly.

---

## Global MCP (19)

19 MCP servers — **9 always-on, 10 opt-in** (via per-project `.cursor/mcp.json` or `claude --mcp-config` flag).

- **Always-on (9)**: github, memory, filesystem, context7, sequential-thinking, brave-search, playwright, chrome-devtools, web-reader
- **Opt-in (10)**: supabase, vercel, railway, expo-mcp, magic, zai-mcp-server, cloudflare-{docs, workers-builds, workers-bindings, observability}

Templates for `.cursor/mcp.json` files in `C:\Users\PC\MCP-Templates\`.

---

## Cross-Agent Unified

Claude Code, Codex, OpenCode, Cursor share the **same skill directories and MCP set**:

```bash
cd ~/dev-project/ && claude
cd ~/dev-project/ && codex
cd ~/dev-project/ && opencode
# Cursor: open ~/dev-project/
```

---

## Config Locations

| Item | Path |
| --- | --- |
| MCP | `~/.cursor/mcp.json` |
| Skills (global) | `~/.cursor/skills/` |
| Skills (project) | `~/<project>/.cursor/skills/` |
| Cursor-specific skills | `~/.cursor/skills-cursor/` (canvas / hooks / rules / etc.) |
