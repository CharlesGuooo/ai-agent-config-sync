---
name: brainstorming
description: >-
  Works out what the user actually wants before anything gets built: sizes the
  request, then interrogates it in rounds of independent questions, each carrying
  a recommended answer, plays back what it heard, and writes a design document
  for projects. Use BEFORE building: new features, components, behaviour changes, or
  any plan with branches, in software or out of it (a talk, a trip, a
  renovation). Triggers: "brainstorm", "grill me", "盘问我", "帮我想清楚",
  "stress-test this", "poke holes in this", "help me think this through",
  "design X", "what should we build". Distinct from openspec-explore (open-ended
  divergent thinking, no pressure to converge): this skill CONVERGES. Distinct
  from writing-plans, which writes the implementation plan once the design is
  settled.
allowed-tools: Read, Grep, Glob, Write, Edit, Bash, Agent
metadata:
  category: process
  tags: [brainstorm, grilling, requirements, design, interrogation, decisions]
  source: >-
    The question engine (rounds over a decision frontier, a recommended answer
    per question, worded so "yes" accepts it) is adapted from `mattpocock/skills`
    (MIT) `productivity/grilling`. Sizing, the opening question, ownership of how
    it gets made, playback and the builder check are adapted from
    `obra/superpowers` (MIT) v7 `brainstorming`; builder-check-prompt.md,
    visual-companion.md and scripts/ are obra's, except that scripts/server.cjs
    no longer loads upstream's remote logo and visual-companion.md gained a
    contents line. Approach comparison and scope decomposition are ours.
---

# Brainstorming

Turn an idea into a design you both actually believe in, by interrogating it before
anything gets built.

## First: size it

Before you reply, ask yourself what you know about what they want, and why.

| Size | Looks like | Then |
|---|---|---|
| Quick, clear task | everything that matters is in the request ("make the icon cornflower blue") | do it, and say what you did |
| Small change | something non-trivial is missing, but the design fits in a chat message | run the rounds below, agree the design in chat, then build it through the normal workflow |
| Project | several parts, or choices that are expensive to reverse | run the rounds below, then write a design document (see *The design document*) |

Say the size in plain words; the user can override it. If the work grows mid-conversation,
say so and step up a size.

If the request is really several independent projects ("a platform with chat, file storage,
billing, and analytics"), say so before drilling: split it, agree the order, then brainstorm
the first piece. Twenty questions spent refining a project that needs to be three projects
are wasted.

## The engine

Interview the user relentlessly until you reach a shared understanding. Map the decisions as
a tree: every decision branches into the decisions that hang off it.

1. **Open with the why while intent is thin.** If you can't yet say what they want and why,
   your first message is one open question that gets them describing a real moment or a
   concrete picture: "What's the moment you find yourself wishing this existed?" Their own
   words carry intent that your options can't. Once the why is clear, move to decisions.
2. **Ask in rounds.** The frontier is every decision whose prerequisites are already settled.
   Ask the frontier in one round, numbered, at most four questions; a question whose answer
   depends on another question still open belongs to a later round. Each round of answers
   reshapes the tree: recompute the frontier and ask the next round.
3. **Every decision ships your recommended answer.** State what you'd pick and why, worded so
   that "yes" accepts it. The user's job is to correct you, which is far cheaper than
   authoring an answer from nothing.
4. **Find facts yourself; put only decisions to the user.** Anything discoverable (the
   filesystem, git history, config, docs, a tool you can run) you go and read, with a
   subagent when the lookup is long. Only the questions downstream of a running lookup wait
   for it; ask the rest of the frontier now.
5. **Build only after approval.** Code, scaffolding, installs and file changes wait until the
   user approves the whole design: in chat for a small change, the design document for a
   project. "Sounds good" on one branch approves that branch.

Lay a round out so each question stands apart:

```
**Q1. <title>**: <the question, with the options if there are any>
➡️ <recommended answer, and why>

---

**Q2. <title>**: ...
➡️ ...
```

Where the harness has a structured question tool (Claude Code's `AskUserQuestion`), a round
is one call, with the recommended option first and marked as recommended.

## Ground to cover

Use this list to spot gaps; turn each gap into a question about their specifics.

- what it is, why now, and what success looks like to them
- goals, non-goals, and anti-goals (what would make it a failure even if it technically works)
- prior art they loved or hated; what exists now, and what they've tried
- **how it gets made**: platform, language, libraries, medium. Find out early which of these
  choices they want to own and which they hand to you, and build on whatever existing work
  already uses. A choice you make goes into the design as your call, said out loud, so they
  can reject it.

## Put real options on the table

Before proposing anything, come up with several ideas privately and drop the weak ones,
including any that fight what they told you about why. When a decision is architectural or
has a genuine fork, lay out **2–3 materially different approaches** with their trade-offs,
lead with your recommendation, and say why. If you can't name a real second approach, say so
and move on.

**YAGNI ruthlessly.** Cut speculative features from every design under discussion. The
cheapest requirement is the one you talk the user out of.

## Play it back

As soon as you understand one part well enough to describe it (what it's for and who it
serves, say, or how one piece behaves), describe it back in a few sentences, then go on to the
next round. Mark your guesses as guesses; only what they said goes in as theirs. End the
playback by asking what's wrong or missing.

## Working in an existing codebase

Explore the current structure before proposing changes, and follow the patterns already
there. Where existing code genuinely blocks the work (a tangled module, an unclear seam),
fold a targeted fix into the design, the way a good engineer improves the code they're
working in. Keep refactoring to what serves the current goal.

For the vocabulary of module / interface / depth / seam, use the `codebase-design` skill. To
pin down contested domain terms as you go, use `domain-modeling`. When the open question is
whether an idea works at all, a throwaway build from the `prototype` skill settles it faster
than more questions.

## The design document

For a project, write a plain design document that a capable builder in the domain could plan
from without going back to the user. Cover:

- intent and the why
- goals, non-goals, anti-goals
- constraints
- the parts of the how they decided, as they decided them
- what's left to the builder

Save it where the repo keeps such documents (`docs/`, `openspec/`, a spec file); outside a
repo, ask where.

**Builder check.** Before handing the document over, dispatch a fresh subagent with
[builder-check-prompt.md](builder-check-prompt.md). Sort what the builder asks into three
piles:

- **Answered already** by the conversation or the project: put the answer in the document.
- **Minor**: a sensible builder could settle it without changing what gets built. Settle it
  yourself and mark it in the document as your call.
- **Theirs**: only the user can answer it, and the answer changes what gets built.

Bring the "theirs" pile as one round, most important first. Update the document with the
answers, then hand it over with a short list of the calls you made so they can check those
while reading. Without a subagent tool, read the document as that builder yourself.

## Done, and what comes next

Done when every branch of the tree has been visited, nothing is silently assumed, and the
user has approved the design. Then offer the next step and let them choose:

- **Plan it?** If the work needs a multi-step implementation, offer `writing-plans`. If it's a
  single obvious change, say so and do it.
- **Spec it?** If the user works in OpenSpec, `openspec-propose` turns the agreed design into
  proposal/design/tasks artifacts.

## Visual companion (optional)

A browser tab for mockups, diagrams and clickable throwaway prototypes. Offer it the first time
seeing would help more than reading: something they'll look at (a screen, a page, a sign), a
layout, a flow, options that would look different from each other, or a structure that reads
better as a diagram. The offer is its own message:

> "This might be easier if I show you. Want me to open a browser tab with some mockups?"

If they decline, stay in text unless they raise it. Once they accept, read
[visual-companion.md](visual-companion.md) before starting the server: it says which
questions go to the browser and how to run it. The server needs Node.js and bash.
