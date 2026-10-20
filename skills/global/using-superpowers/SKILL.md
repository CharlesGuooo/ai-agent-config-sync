---
name: using-superpowers
description: How to choose, load, and apply skills correctly. Consult this whenever you're about to start a substantive task — coding, debugging, planning, research, creative work — to decide which skill(s) to invoke first, in what order, and whether to route to a local project pack. Also use when the user asks about how skills work, why you're not using one, or which skill applies ("该用哪个 skill", "为什么没用 skill"). Skip for greetings, small talk, or pure factual lookups. Distinct from skill-router, which picks the local pack directory once a task is known to be domain-specific.
allowed-tools: Read
metadata:
  category: process
  source: >-
    Adapted from `obra/superpowers` (MIT) `using-superpowers`. references/ are
    upstream's, verbatim apart from a contents line in codex-tools.md. The
    body is ours: skills only for substantive tasks instead of upstream's
    "even a 1% chance" rule, how each of this repo's five agents loads a
    skill, the task-to-skill table, and routing to local packs.
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, ignore this skill.
</SUBAGENT-STOP>

## When to Use Skills

Skills are for **substantive tasks** — coding, debugging, planning, research, creative work. Answer these directly, with no skill:
- Greetings, small talk, or simple questions ("hello", "what time is it")
- Factual lookups that need no workflow
- Clarifying what the user wants before you know the task

When a real task is identified and a skill clearly applies, invoke it before starting work.

## How to Load a Skill

- **Claude Code:** the `Skill` tool. The skill's content is loaded and presented to you; follow it directly.
- **OpenCode:** the `skill` tool.
- **Codex, Cursor, Pi:** read the skill's `SKILL.md` when you are about to follow it for a real task, not at session start. On Pi the user can also type `/skill:<name>`.

## Platform Adaptation

Skills use Claude Code tool names. If your harness appears here, read its reference file for the equivalents and its special instructions:

- Claude Code: `references/claude-code-tools.md`
- Codex: `references/codex-tools.md`
- Pi: `references/pi-tools.md`
- Gemini CLI: `references/gemini-tools.md`
- Antigravity: `references/antigravity-tools.md`
- Hermes Agent: `references/hermes-tools.md`
- Muse: `references/muse-tools.md`

## The Rule

**When a substantive task is identified, invoke relevant skills BEFORE starting work.** If no skill clearly applies, just respond directly.

**Before entering plan mode:** if you haven't already brainstormed, invoke `brainstorming` first.

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
| Idea/plan needs stress-testing ("grill me") | `brainstorming` — rounds of independent questions, each with a recommendation |
| Fix a bug | `systematic-debugging` |
| Write or change code | `test-driven-development` |
| Designing a module's interface / where a seam goes | `codebase-design` |
| Terminology is fuzzy or contested; recording a decision | `domain-modeling` |
| "Would this design even work?" — settle it by building | `prototype` |
| Architecture review / "what should I refactor" | suggest the user run `/improve-codebase-architecture` (user-invoked) |
| Session running out of context, work unfinished | `handoff` |
| Multi-step implementation | `writing-plans` → `executing-plans` → `verification-before-completion` |
| Need isolation from current workspace | `using-git-worktrees` |
| Plan has independent tasks in same session | `subagent-driven-development` |
| 2+ truly independent problem domains | `dispatching-parallel-agents` |
| About to merge / claim "done" | `verification-before-completion` → `requesting-code-review` |
| Got review feedback to act on | `receiving-code-review` |
| Closing a feature branch | `finishing-a-development-branch` |
| Installing a new community skill | `skill-scanner` + `skillspector` first (检查 prompt injection / 凭证泄露) |
| Task failing repeatedly | `systematic-debugging` → 仍失败则 `high-agency`(Recovery Protocol 在第 2 次失败触发) |
| Sustained long task / motivation drift | `high-agency` |
| A draft reads like AI wrote it | `no-ai-slop` (你把稿子递过去它才动) |

## Skill Priority

When multiple skills could apply, use this order:

1. **Process skills first** (brainstorming, debugging) - these determine HOW to approach the task
2. **Implementation skills second** (frontend-design, mcp-builder) - these guide execution
3. **Routing before domain packs** - if the task clearly belongs to a local project pack, use `skill-router` to choose the directory before reasoning from the global layer about domain specifics

"Let's build X" → brainstorming first, then implementation skills.
"Fix this bug" → debugging first, then domain-specific skills.

If the task is clearly domain-specific and the relevant expertise lives in a project-local pack, route the user to the matching directory (the Local Skill Packs table in your global instructions, or `skill-router`) rather than enumerating local skills here. Document tasks (PDF / Word / Excel / PPT) stay in the global layer and use its document skills directly.

The purpose of global skills is to decide whether a skill applies and whether a directory switch is needed. The purpose of local packs is to provide domain-specific guidance after the switch.

## User Instructions

User instructions (CLAUDE.md, AGENTS.md, direct requests) take precedence over skills, which in turn override default behavior. Skip a skill's workflow or instructions only when the user has explicitly told you to.
