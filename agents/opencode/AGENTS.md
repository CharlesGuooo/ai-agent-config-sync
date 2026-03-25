# OpenCode Global Instructions

## Core Principles

1. Think before acting.
2. Exhaust reasonable options before claiming something cannot be done.
3. Verify results before claiming success.
4. Preserve context and align with the user's actual goal.

---

## Global Skill Architecture

The shared architecture uses two layers:

1. Global skills for process, routing, escalation, and repeatable workflows.
2. Local project packs for domain-specific guidance.

OpenCode should follow the same split as Codex, Claude Code, and Cursor.

---

## Global Skills

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
| Design | `ui-ux-pro-max` | BM25 search engine for UI/UX design decisions (styles, colors, typography, UX guidelines) |

---

## Skill Combinations

| Trigger | Combination | Rule |
| --- | --- | --- |
| Frontend spec writing (`openspec-propose`, `openspec-explore`) | + `ui-ux-pro-max` | Always invoke ui-ux-pro-max to search for relevant design patterns, colors, typography, and UX guidelines before finalizing frontend specs. |

---

## Local Skill Packs

When a task becomes domain-specific, switch to the matching project directory and use the local pack there.

| Domain | Directory |
| --- | --- |
| Scientific computing | `~/scientific-project/` |
| Database lookup | `~/database-project/` |
| Data analysis | `~/data-analysis-project/` |
| Development | `~/dev-project/` |
| Marketing | `~/marketing-project/` |
| Research | `~/research-project/` |
| Office | `~/office-project/` |
| Productivity | `~/productivity-project/` |

---

## MCP Layout

Shared MCP inventory:

- `github`
- `memory`
- `web-reader`
- `zai-mcp-server`
- `context7`
- `sequential-thinking`
- `vercel`
- `railway`
- `cloudflare-docs`
- `cloudflare-workers-builds`
- `cloudflare-workers-bindings`
- `cloudflare-observability`
- `playwright`
- `supabase`
- `magic`
- `expo-mcp`
- `brave-search`
- `firecrawl` when keyed

`firecrawl` is optional and should only be installed when `FIRECRAWL_API_KEY` is available.
