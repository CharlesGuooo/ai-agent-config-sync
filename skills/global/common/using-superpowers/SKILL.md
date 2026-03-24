---
name: using-superpowers
description: Reference for how skills work - consult when the user asks about skills or when you need to invoke a skill for a substantive task (not greetings or simple questions)
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
| Build something new | `brainstorming` first, then implementation skills |
| Fix a bug | `systematic-debugging` |
| Write or change code | `test-driven-development` |
| Multi-step implementation | `writing-plans` → `executing-plans` |
| Task failing repeatedly | `pua` |
| About to claim "done" | `verification-before-completion` |

## Skill Priority

When multiple skills could apply, use this order:

1. **Process skills first** (brainstorming, debugging) - these determine HOW to approach the task
2. **Implementation skills second** (frontend-design, mcp-builder) - these guide execution
3. **Routing before domain packs** - if the task clearly belongs to a local project pack, use `skill-router` to choose the directory before reasoning from the global layer about domain specifics

"Let's build X" → brainstorming first, then implementation skills.
"Fix this bug" → debugging first, then domain-specific skills.

If the task is clearly domain-specific and the relevant expertise lives in a project-local pack, the global layer should route the user to the correct project directory rather than trying to enumerate local skills itself.

Examples:

- Software engineering task → route to `~/dev-project/`
- Scientific computing task → route to `~/scientific-project/`
- Literature or public database lookup task → route to `~/database-project/`
- Marketing execution task → route to `~/marketing-project/`

The purpose of global skills is to decide whether a skill applies and whether a directory switch is needed. The purpose of local packs is to provide domain-specific guidance after the switch.

## Skill Types

**Rigid** (TDD, debugging): Follow exactly. Don't adapt away discipline.

**Flexible** (patterns): Adapt principles to context.

The skill itself tells you which.

## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.
