---
name: brainstorming
description: >-
  Relentlessly interrogate an idea, plan, or design until you and the user reach
  a genuine shared understanding — one question at a time, each carrying your
  recommended answer. Use BEFORE building: new features, components, behaviour
  changes, or any decision that has branches. Triggers: "brainstorm", "grill me",
  "盘问我", "stress-test this", "poke holes in this", "help me think this
  through", "design X", "what should we build". Distinct from openspec-explore
  (open-ended divergent thinking, ASCII diagrams, no pressure to converge) — this
  skill CONVERGES. Distinct from writing-plans, which writes the implementation
  plan after the design is settled.
allowed-tools: Read, Grep, Glob, Write, Edit
metadata:
  category: process
  tags: [brainstorm, grilling, requirements, design, interrogation, decisions]
  source: >-
    Interrogation engine adapted from `mattpocock/skills` (MIT) —
    `productivity/grilling`, the engine behind his `grill-me`. The
    approach-comparison and scope-decomposition sections are ours, retained from
    the previous obra/superpowers `brainstorming`.
---

# Brainstorming

Turn an idea into a design you both actually believe in — by interrogating it, not by
running a ceremony.

## The engine

Interview the user relentlessly about every aspect of this until you reach a shared
understanding. Walk down each branch of the decision tree, resolving dependencies
between decisions one by one.

Four rules. They *are* the skill:

1. **One question per message.** Asking several at once is bewildering, and the answer
   to question 1 usually changes what question 2 should even be. If a topic needs more
   exploration, split it into several turns.
2. **Every question ships your recommended answer.** Never ask a bare question. State
   what you'd do and why, then ask. The user's job is to correct you, which is far
   cheaper than authoring an answer from nothing.
3. **Look up facts yourself; ask only for decisions.** If something can be discovered
   from the environment — the filesystem, git history, config, an existing file, a
   tool you can run — **go find it** instead of asking. Spending the user's attention
   on a fact you could have read is the most common way this skill goes wrong. The
   *decisions*, though, are theirs: put each one to them and wait.
4. **Don't act until they confirm.** No code, no scaffolding, no file changes until the
   user says you've reached shared understanding. "Sounds good" on one branch is not
   approval of the whole design.

## Put real options on the table

When a decision is architectural or has a genuine fork, don't just ask which way — lay
out **2–3 materially different approaches** with their trade-offs, lead with your
recommendation, and say why. Options that differ only cosmetically are noise; if you
can't name a real second approach, say so and move on.

**YAGNI ruthlessly.** Cut speculative features from every design under discussion. The
cheapest requirement is the one you talk the user out of.

## Check the scope before you start drilling

If the request describes several independent subsystems ("a platform with chat, file
storage, billing, and analytics"), say so immediately rather than drilling into
details of something that must be decomposed first. Help split it into pieces, decide
the order, then grill the first piece properly. Don't spend twenty questions refining
a project that needs to be three projects.

## Working in an existing codebase

Explore the current structure before proposing changes, and follow the patterns that
are already there. Where existing code genuinely blocks the work — a tangled module, an
unclear seam — fold a targeted fix into the design, the way a good engineer improves
the code they're working in. Don't propose unrelated refactoring.

For the vocabulary of module / interface / depth / seam, use the `codebase-design`
skill. To pin down contested domain terms as you go, use `domain-modeling`.

## When you're done — offer, don't force

Shared understanding reached. Now ask what they want; do **not** assume:

- **Write it down?** For anything non-trivial, offer to save the design to a doc and
  say where (match the repo's existing convention — `docs/`, `openspec/`, a spec file).
  Skip it for small decisions; a two-sentence design doesn't need a file.
- **Plan it?** If the work needs a multi-step implementation, offer to hand off to
  `writing-plans`. If it's a single obvious change, say so and skip straight to doing it.
- **Spec it?** If the user works in OpenSpec, `openspec-propose` turns the agreed design
  into proposal/design/tasks artifacts.

There is no mandatory next step and no mandatory artifact. A grilling session whose
only output is "we now both know what we're building" has done its job.

## Visual companion (optional)

For questions that are genuinely visual — mockups, layout comparisons, architecture
diagrams — a browser-based companion is available. Offer it **once**, in its own
message, and only when you expect visual questions; then decide per question whether
the browser beats the terminal. A question about a UI topic is not automatically a
visual question. Details and setup: `visual-companion.md`.
