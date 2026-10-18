---

## How skills work on Pi

Global skills are in `~/.pi/agent/skills/`, project packs in `<project>/.pi/skills/`.

**Invoke a skill with `/skill:<name>`** — e.g. `/skill:brainstorming`. This differs from the
other agents in this harness (Claude Code uses a Skill tool; Codex reads the file). Skills whose
frontmatter sets `disable-model-invocation: true` are hidden from the system prompt and **can
only** be reached that way: currently `action-first`.

## What this harness does not give Pi

- **No `guard.mjs` safety hook.** On Claude Code and Codex, a PreToolUse hook blocks reads of
  secret files and destructive shell commands (`rm -rf /`, `curl | sh`, force-push). **On Pi that
  net does not exist.** Confirm before any destructive or irreversible command, and never read
  credential files (`.env`, `auth.json`, `*.pem`, `id_rsa`, cloud credential stores) unless the
  user asked you to work on that exact file.
- **No `format.mjs`.** Formatting is not applied automatically after edits.
- **No sub-agents.** Whenever a skill says to dispatch a sub-agent, do that step yourself, sequentially in this one context, and say in your output that you did so — do not silently skip it or pretend a parallel run happened. The skills that lean on this most:

  | Skill | What it asks for | What to do on Pi |
  | --- | --- | --- |
  | `requesting-code-review` | two parallel review sub-agents (Standards / Spec) | run both passes yourself, one after the other, and still report them **separately, unmerged** |
  | `codebase-design` | DESIGN-IT-TWICE: 3+ parallel interface designs | produce the alternative designs sequentially, then compare |
  | `improve-codebase-architecture` | a read-only Explore sub-agent | explore directly; expect it to take longer |
  | `dispatching-parallel-agents` | fan-out + merge protocol | not applicable — do the work in order |
  | `subagent-driven-development` | one sub-agent per plan step | execute the plan steps yourself, in order |
