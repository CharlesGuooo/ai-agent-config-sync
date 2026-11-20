---
name: handoff
description: >-
  Writes the work in flight into a HANDOFF.md so a fresh agent, here or on another machine,
  can pick it up. Use when the user says "hand off", "写个交接", "写个 HANDOFF", "compact this
  session", or is moving the work to a new session, or when a long session nears its context
  limit with work unfinished. Distinct from writing-plans, which plans work not yet started.
allowed-tools: Read, Write, Edit, Bash
metadata:
  category: process
  tags: [handoff, session, context, continuity, compaction]
  source: >-
    Adapted from `mattpocock/skills` (MIT) `productivity/handoff`. Ours is model-invoked, and
    the document goes in the project as HANDOFF.md, updated in place and kept out of git unless
    it has to travel, instead of the OS temp directory: the user put all three of their
    handoffs in the project, and the one written to %TEMP% has since been cleaned away.
    Ours also adds the Standing instructions section. Description shortened for the global
    skill-list budget (docs/skill-find.md E); keep it short when syncing upstream.
---

# Handoff

Write a handoff document summarising the current conversation so a fresh agent can
continue the work without re-deriving everything.

## Where it goes

`HANDOFF.md` at the root of the directory the next agent will start in, usually the project
root. When that folder already holds a handoff for an unrelated line of work, name this one by
topic: `HANDOFF-<topic-slug>.md`.

If the file exists, read it first and update it in place: finished items move to done, open
items stay, stale ones go. Print the full path when you're done.

## Git

Keep it out of history by default. In a git repository, unless `git check-ignore -q <file>`
already succeeds, add the file name to the exclude file that `git rev-parse --git-path
info/exclude` names (usually `.git/info/exclude`): it applies on this machine only and leaves
`.gitignore` alone.

Commit it only when the user asks, or when the next agent works on another machine and gets the
repository through git. A public repository keeps it uncommitted whatever the reason: check with
`gh repo view --json visibility`, and ask when you can't tell.

## What goes in

- **The task** — what the user actually asked for, in their terms.
- **Standing instructions** — the user's rules that outlive this session: what not to touch,
  what to ask before doing, how they want answers. Quote them where the wording matters. They
  are the easiest thing to lose between sessions and the costliest to break.
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
