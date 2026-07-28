---
name: handoff
description: >-
  Compact the current session into a handoff document so a fresh agent — or a
  future you — can pick the work up cleanly. Use when the user says "hand off",
  "写个交接", "compact this session", "I'm starting a new session/agent on this",
  or when a long session is about to run out of context and the work isn't
  finished. Produces ONE markdown file written outside the workspace. Distinct
  from writing-plans (which designs work that hasn't started yet) — handoff
  captures work already in flight.
allowed-tools: Read, Write
metadata:
  category: process
  tags: [handoff, session, context, continuity, compaction]
  source: >-
    Vendored from `mattpocock/skills` (MIT) — `productivity/handoff`. Adapted:
    the output path is pinned to a stable cross-session temp directory rather
    than "the OS temp dir", because a session-scoped scratchpad disappears with
    the session that wrote it — which defeats the purpose.
---

# Handoff

Write a handoff document summarising the current conversation so a fresh agent can
continue the work without re-deriving everything.

## Where it goes

**One** markdown file, outside the workspace:

- Windows: `%TEMP%\agent-handoffs\<topic-slug>.md`
- macOS / Linux: `${TMPDIR:-/tmp}/agent-handoffs/<topic-slug>.md`

Not the repo — a handoff is not a project artifact and must never be committed. Not
the per-session scratchpad either: that dies with this session, and the entire point
is that the *next* session can read it. Print the full path when you're done.

## What goes in

- **The task** — what the user actually asked for, in their terms.
- **State** — what is done, what is in progress, what is untouched. Be honest about
  what was tried and failed; that's the most expensive thing to rediscover.
- **Decisions already made** — and the ones deliberately deferred, so the next agent
  doesn't silently re-litigate them.
- **Suggested skills** — name the skills the next agent should invoke, and for what.
- **Next step** — the single concrete thing to do first.

## What stays out

**Don't duplicate what is already captured elsewhere.** Specs, plans, ADRs, issues,
commits, diffs — reference them by path, URL, or SHA instead of copying them in. A
handoff that restates a spec goes stale the moment the spec changes.

**Redact secrets.** API keys, tokens, passwords, connection strings, and personally
identifiable information must not appear in the document. If a value matters to the
work, name the variable, not the value.

If the user said what the next session is for, tailor the document to that — lead
with what that session needs and cut what it doesn't.
