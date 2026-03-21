# Codex Global Instructions

## Core Principles

1. Think before acting.
2. Exhaust reasonable options before claiming something cannot be done.
3. Verify results before claiming success.
4. Preserve context and align with the user's actual goal.

---

## Global Skills

The global layer is intentionally small. It handles process, routing, escalation, and repeatable workflows.

| Type | Skill | Purpose |
| --- | --- | --- |
| Process | `brainstorming` | Clarify design before creative or behavior-changing work |
| Process | `test-driven-development` | Use TDD when implementing or changing code |
| Process | `systematic-debugging` | Investigate bugs and unexpected behavior methodically |
| Process | `writing-plans` | Write implementation plans before multi-step execution |
| Process | `executing-plans` | Execute an existing written plan |
| Process | `verification-before-completion` | Verify with evidence before claiming completion |
| Escalation | `high-agency` | Maintain ownership and initiative on complex work |
| Escalation | `pua` | Escalate after repeated failure or passive looping |
| Workflow | `playwright-interactive` | Use a persistent browser session for iterative UI debugging and QA |
| Workflow | `gh-fix-ci` | Investigate and fix failing GitHub Actions and PR checks |
| Workflow | `gh-address-comments` | Work through GitHub PR review comments with `gh` |

---

## Local Skill Packs

When a task becomes domain-specific, switch to the matching project directory and use the local pack there.

| Domain | Directory | Examples |
| --- | --- | --- |
| Scientific computing | `~/scientific-project/` | single-cell, ML, molecules, simulation |
| Database lookup | `~/database-project/` | PubMed, OpenAlex, UniProt, external databases |
| Data analysis | `~/data-analysis-project/` | EDA, visualization, statistics, forecasting |
| Development | `~/dev-project/` | frontend, backend, API, Docker, CI/CD, React |
| Marketing | `~/marketing-project/` | SEO, ad copy, content strategy, campaigns |
| Research | `~/research-project/` | papers, reviews, grants, peer review |
| Office | `~/office-project/` | PDF, Word, Excel, PowerPoint |
| Productivity | `~/productivity-project/` | Obsidian, Jira, Google Workspace, PM workflows |

The global layer should route to the right directory and stop there. Local packs own domain guidance.

---

## MCP Layout

MCP stays global and shared across tools.

- Core MCP: `github`, `memory`, `web-reader`, `zai-mcp-server`
- Shared optional MCP: `context7`, `sequential-thinking`, `vercel`, `railway`, `cloudflare-docs`, `cloudflare-workers-builds`, `cloudflare-workers-bindings`, `cloudflare-observability`, `playwright`, `supabase`, `magic`, `expo-mcp`, `brave-search`
- Optional when keyed: `firecrawl`

That is 18 total MCP entries, with `firecrawl` disabled until a key is provided.

---

## Cross-Tool Consistency

Claude Code, Codex, OpenCode, and Cursor are expected to share:

- the same project-directory routing model
- the same global-vs-local skill split
- the same MCP inventory

Typical usage:

```bash
cd ~/dev-project && claude
cd ~/dev-project && codex
cd ~/dev-project && opencode
```

Cursor should open the same project directory directly.
