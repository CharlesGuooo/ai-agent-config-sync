# Rubric

Grade a draft here. Two kinds of item, deliberately separated: **A** needs judgment and often needs
the precise definition in [GLOSSARY.md](GLOSSARY.md); **B** is binary and can be checked
mechanically, some of it by grep.

A skill that scores badly fails *quietly* — it is either never selected, or selected and then
ignored. Neither shows up as an error, which is why grading has to be deliberate.

Give every item in A a verdict: **hit** (with the line) or **clear**. "Looks fine" is not a verdict.

---

## A. Failure modes — judgment

Definitions live in [GLOSSARY.md](GLOSSARY.md), grouped by axis: **Invocation** (model-invoked,
user-invoked, description, context pointer, context load, cognitive load, router skill,
granularity) · **Information Hierarchy** (steps, reference, external reference, progressive
disclosure, co-location, sprawl) · **Steering** (branch, leading word, completion criterion,
legwork, post-completion steps, premature completion, negation) · **Pruning** (single source of
truth, duplication, relevance, sediment, no-op).

### Sprawl

Too long, whatever the cause — even when every line is live and unique.

*Spot it:* the agent wades before it can act; the body runs past 500 lines.
*Fix:* push reference behind a pointer, and split by branch so each path carries only its own load.

### Duplication

One meaning given two homes. Costs maintenance and tokens, and inflates that meaning's rank past
what it deserves.

*Spot it:* two passages where deleting either loses nothing.
*Fix:* pick the authoritative home; the other becomes a pointer, or goes.

### Sediment

Stale layers nobody cleared, because adding feels safe and removing feels risky.

*Spot it:* a line describing a file, flag, or behaviour that no longer exists.
*Fix:* delete it. Staleness is not fixed by rewording.

### No-op

A line the model already obeys by default, so you pay load to say nothing.

*Spot it:* ask whether the line changes behaviour versus the default. "Be thorough" against an
already-thorough agent is a no-op; so is explaining what a PDF is.
*Fix:* delete, or replace the weak word with one strong enough to beat the default.

### Negation

Steering by prohibition drags the banned behaviour into context and makes it *more* available.
*Don't think of an elephant.*

*Spot it:* "don't", "never", "avoid" carrying the instruction's weight.
*Fix:* state the target behaviour so the banned one is never named. Keep a prohibition only as a
hard guardrail you cannot phrase positively, and pair it with what to do instead.

### Premature completion

A step ends before the work is done, because attention slipped to *being done*.

*Spot it:* a completion criterion you cannot check ("understanding reached", "code reviewed").
*Fix:* sharpen the criterion first — it is local and cheap. Split the sequence to hide the later
steps only when the criterion is irreducibly fuzzy *and* you have watched the agent rush.

---

## B. Mechanical checks — binary

- [ ] `name`: lowercase, hyphens, digits only; ≤64 characters; not `helper`/`utils`/`tools`
- [ ] `description` is third person — not "I can help you…" or "You can use this to…"
- [ ] `description` states both what it does and when to use it; ≤1024 characters
- [ ] `description` carries the words the user actually types, including Chinese where they use it
- [ ] `description` names its nearest neighbour and when that one wins instead
- [ ] SKILL.md body under 500 lines
- [ ] every reference link is one level deep from SKILL.md — a pointer inside a pointed-at file
      invites a partial `head` read and silently loses content
- [ ] reference files over 100 lines open with a table of contents
- [ ] paths use forward slashes throughout, including on Windows
- [ ] no dated instructions in the body; superseded guidance sits under an "Old patterns" heading
- [ ] one term per concept throughout — "field" everywhere, never "field"/"box"/"element"
- [ ] one default given, with an escape hatch, rather than a menu of equivalent options
- [ ] required packages and tools named explicitly
- [ ] `allowed-tools` lists what the skill actually uses
- [ ] bundled scripts handle their own error cases and explain their constants

---

## C. Calibration

One judgment, neither a failure mode nor a checkbox: **is the constraint level matched to how
fragile the task is?** Open field where many routes work, narrow bridge where one command must run
exactly — see *Calibration* in [SKILL.md](../SKILL.md).

Over-constraining an open field burns tokens and blocks the better route the agent would have
found. Under-constraining a narrow bridge is how the gate goes red.
