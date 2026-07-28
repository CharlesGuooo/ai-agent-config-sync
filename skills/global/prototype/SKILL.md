---
name: prototype
description: >-
  Build a deliberately throwaway prototype to answer ONE design question — does
  this state model / logic hold up, or what should this UI actually look like.
  Use when the user says "prototype this", "spike it", "does this state machine
  feel right", "let's see what it could look like", or is stuck arguing about a
  design on paper that a 20-minute runnable toy would settle. Distinct from
  test-driven-development (which builds the real thing) — prototype code is
  written to be deleted.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
metadata:
  category: design
  tags: [prototype, spike, throwaway, design-validation, ui, state-machine]
  source: >-
    Vendored from `mattpocock/skills` (MIT) — `engineering/prototype`, with its
    LOGIC / UI branch files moved under `references/`. Adapted, not copied.
---

# Prototype

A prototype is **throwaway code that answers a question**. The question decides the
shape.

## Pick a branch

Identify which question is being answered — from the user's prompt, the surrounding
code, or by asking if the user is around:

- **"Does this logic / state model feel right?"** → `references/LOGIC.md`. Build a tiny
  interactive terminal app that pushes the state machine through cases that are hard
  to reason about on paper.
- **"What should this look like?"** → `references/UI.md`. Generate several radically
  different UI variations on a single route, switchable via a URL search param and a
  floating bottom bar.

The two branches produce very different artifacts — getting this wrong wastes the
whole prototype. If the question is genuinely ambiguous and the user isn't reachable,
default to whichever branch better matches the surrounding code (a backend module →
logic; a page or component → UI) and state the assumption at the top of the prototype.

## Rules that apply to both

1. **Throwaway from day one, and clearly marked as such.** Put the prototype close to
   where it will actually be used, so context is obvious — but name it so a casual
   reader can see it's a prototype, not production. For throwaway UI routes, obey the
   project's existing routing convention; don't invent a new top-level structure.
2. **One command to run.** Whatever the project's task runner already supports —
   `pnpm <name>`, `python <path>`, `bun <path>`. The user must be able to start it
   without thinking.
3. **No persistence by default.** State lives in memory. Persistence is the thing the
   prototype is *checking*, not something it should depend on. If the question really
   does involve a database, hit a scratch DB or a local file named clearly
   "PROTOTYPE — wipe me".
4. **Skip the polish.** No tests, no error handling beyond what makes it runnable, no
   abstractions. The point is to learn something fast.
5. **Surface the state.** After every action (logic) or on every variant switch (UI),
   print or render the full relevant state so the user can see what changed.
6. **Capture it when done.** Fold the validated decision into the real code, then keep
   the prototype as a **primary source**: commit it to a throwaway branch, off main,
   and leave a pointer to that branch on the implementation issue or plan. Record the
   verdict *and the question it settled*. Main keeps only the validated decision.
