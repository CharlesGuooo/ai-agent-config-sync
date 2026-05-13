---
name: using-superpowers
description: How to choose, load, and apply skills correctly. Consult this whenever you're about to start a substantive task — coding, debugging, planning, research, creative work — to decide which skill(s) to invoke first, in what order, and whether to route to a local project pack. Also use when the user asks about how skills work, why you're not using one, or which skill applies. Skip for greetings, small talk, or pure factual lookups.
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

## When to Use Skills

Skills are for **substantive tasks** — coding, debugging, planning, research, creative work. Do NOT load skills for:
- Greetings, small talk, or simple questions ("hello", "what time is it")
- Factual lookups that need no workflow
- Clarifying what the user wants before you know the task

When a real task is identified and a skill clearly applies, invoke it before starting work.

## Instruction Priority

Superpowers skills override default system prompt behavior, but **user instructions always take precedence**:

1. **User's explicit instructions** (CLAUDE.md, GEMINI.md, AGENTS.md, direct requests) — highest priority
2. **Superpowers skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority

If CLAUDE.md, GEMINI.md, or AGENTS.md says "don't use TDD" and a skill says "always use TDD," follow the user's instructions. The user is in control.

## How to Access Skills

**In Claude Code:** Use the `Skill` tool. When you invoke a skill, its content is loaded and presented to you—follow it directly. Never use the Read tool on skill files.

**In Codex:** Skills are in `~/.codex/skills/`. Only read a skill file when you are about to follow it for a real task. Do NOT preload skills at session start.

**In Gemini CLI:** Skills activate via the `activate_skill` tool. Gemini loads skill metadata at session start and activates the full content on demand.

**In other environments:** Check your platform's documentation for how skills are loaded.

## Platform Adaptation

Skills use Claude Code tool names. Non-CC platforms: see `references/codex-tools.md` (Codex) for tool equivalents. Gemini CLI users get the tool mapping loaded automatically via GEMINI.md.

# Using Skills

## The Rule

**When a substantive task is identified, invoke relevant skills BEFORE starting work.** If no skill clearly applies, just respond directly.

```
User message → Is this a substantive task?
  → No → Respond directly (no skill needed)
  → Yes → Does a skill clearly apply?
    → No → Respond directly
    → Yes → Load skill → Announce "Using [skill] for [purpose]" → Follow skill
```

## When Skills Apply

| Task type | Skill to use |
|-----------|-------------|
| Build something new | `brainstorming` first → `writing-plans` → implementation skills |
| Fix a bug | `systematic-debugging` |
| Write or change code | `test-driven-development` |
| Multi-step implementation | `writing-plans` → `executing-plans` → `verification-before-completion` |
| Need isolation from current workspace | `using-git-worktrees` |
| Plan has independent tasks in same session | `subagent-driven-development` |
| 2+ truly independent problem domains | `dispatching-parallel-agents` |
| About to merge / claim "done" | `verification-before-completion` → `requesting-code-review` |
| Got review feedback to act on | `receiving-code-review` |
| Closing a feature branch | `finishing-a-development-branch` |
| Installing a new community skill | `skill-scanner` first (检查 prompt injection / 凭证泄露) |
| Task failing repeatedly | `pua` |
| Sustained long task / motivation drift | `high-agency` |

## Skill Priority

When multiple skills could apply, use this order:

1. **Process skills first** (brainstorming, debugging) - these determine HOW to approach the task
2. **Implementation skills second** (frontend-design, mcp-builder) - these guide execution
3. **Routing before domain packs** - if the task clearly belongs to a local project pack, use `skill-router` to choose the directory before reasoning from the global layer about domain specifics

"Let's build X" → brainstorming first, then implementation skills.
"Fix this bug" → debugging first, then domain-specific skills.

If the task is clearly domain-specific and the relevant expertise lives in a project-local pack, the global layer should route the user to the correct project directory rather than trying to enumerate local skills itself.

Examples:

- General software engineering → `~/dev-project/<sub>/` (frontend / backend / cloud-platform / testing-qa / devops-sre)
- LLM agent framework code (LangChain / LangGraph / Deep / MCP) → `~/dev-project/agent-dev/`
- ML / DL / RL model training → `~/dev-project/ml/`
- iOS / Swift / SwiftUI native app → `~/ios-project/`
- Active trading / stock screening → `~/finance-project/trading/`
- Financial modeling (DCF / LBO / comps) → `~/finance-project/modeling/`
- Quant methodology (PBO / CV / Triple Barrier / GARCH / portfolio opt) → `~/finance-project/quant-methods/`
- IB / PE / wealth / fund-admin / KYC work → `~/finance-project/advisory/<vert>/`
- Marketing execution → `~/marketing-project/`
- Document task (PDF / Word / Excel / PPT) → **stay**, use global document skills directly

The purpose of global skills is to decide whether a skill applies and whether a directory switch is needed. The purpose of local packs is to provide domain-specific guidance after the switch.

## Skill Types

**Rigid** (TDD, debugging): Follow exactly. Don't adapt away discipline.

**Flexible** (patterns): Adapt principles to context.

The skill itself tells you which.

## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.
