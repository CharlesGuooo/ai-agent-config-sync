# Rubric

Contents: A. Failure modes (Sprawl · Duplication · Cache · Sediment · No-op · Negation ·
Restatement · Premature completion) · B. Mechanical checks · C. Calibration

Grade a draft here. Two kinds of item, deliberately separated: **A** needs judgment and often needs
the precise definition in [writing-for-agents.md](writing-for-agents.md); **B** is binary and can
be checked mechanically, some of it by grep.

A skill that scores badly fails *quietly* — it is either never selected, or selected and then
ignored. Neither shows up as an error, which is why grading has to be deliberate.

Give every item in A a verdict: **hit** (with the line) or **clear**. "Looks fine" is not a verdict.

---

## A. Failure modes — judgment

Definitions live in [writing-for-agents.md](writing-for-agents.md), by section: **Context
pointers** · **The two loads** (context, cognitive) · **Information hierarchy** (steps, reference,
progressive disclosure, co-location, sprawl) · **Steps and completion criteria** (legwork,
premature completion) · **When to split** · **Leading words** (negation) · **Pruning** (single
source of truth, duplication, cache, relevance, sediment, no-op). What changes when the document is
a skill (model- or user-invoked, router skills) is in [SKILL-MECHANICS.md](SKILL-MECHANICS.md).

### Sprawl

Too long, whatever the cause — even when every line is live and unique.

*Spot it:* the agent wades before it can act; the body runs past 500 lines.
*Fix:* push reference behind a pointer, and split by branch so each path carries only its own load.

### Duplication

One meaning given two homes. Costs maintenance and tokens, and inflates that meaning's rank past
what it deserves.

*Spot it:* two passages where deleting either loses nothing.
*Fix:* pick the authoritative home; the other becomes a pointer, or goes.

### Cache

A line restating what the environment already says: `package.json` scripts, a config file, the
directory layout, `--help` output. The copy goes stale; the lookup cannot.

*Spot it:* a line the agent could replace with one file read or one command.
*Fix:* delete it and let the agent look. Keep what looking cannot find: the unwritten convention,
the reason behind a choice, the gotcha no config confesses.

### Sediment

Stale layers nobody cleared, because adding feels safe and removing feels risky.

*Spot it:* a line describing a file, flag, or behaviour that no longer exists.
*Fix:* delete it. Staleness is not fixed by rewording.

### No-op

A line the model already obeys by default, so you pay load to say nothing.

*Spot it:* ask whether the line changes behaviour versus the default. "Be thorough" against an
already-thorough agent is a no-op; so is explaining what a PDF is.
*Fix:* delete the whole sentence rather than trimming words from it. When the weak part is a
leading word, replace it with one strong enough to beat the default.

### Negation

Steering by prohibition drags the banned behaviour into context and makes it *more* available.
*Don't think of an elephant.*

*Spot it:* "don't", "never", "avoid" carrying the instruction's weight.
*Fix:* state the target behaviour so the banned one is never named. Keep a prohibition only as a
hard guardrail you cannot phrase positively, and pair it with what to do instead.

### Restatement

One quality spelled out in several words, at several sites, where one pretrained word would carry
it: "fast, deterministic, low-overhead" is a *tight* loop.

*Spot it:* the same triad or phrase recurring across sections, or a pointer spending a sentence to
gesture at one idea.
*Fix:* name it with a leading word and repeat the word, never the sentence.

### Premature completion

A step ends before the work is done, because attention slipped to *being done*.

*Spot it:* a completion criterion you cannot check ("understanding reached", "code reviewed").
*Fix:* sharpen the criterion first — it is local and cheap. Split the sequence to hide the later
steps only when the criterion is irreducibly fuzzy *and* you have watched the agent rush.

---

## B. Mechanical checks — binary

Auditing a CLAUDE.md, AGENTS.md or prompt/core.md: skip the `name`, `description`, `allowed-tools`,
body-length and bundled-script items.

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
