# Skill Engineering

A Skill is the packaging unit for "how to handle this class of task" — loadable
on demand, so knowledge lives outside the conversation instead of inside the
system prompt.

## The problem it solves

Wire 30 tools to an agent and every tool's usage, caveats and failure handling
must go into the system prompt. Three consequences:

- Context fills with tool documentation, squeezing out the actual task.
- Most tools are irrelevant to most tasks, yet their documentation occupies space
  permanently.
- Adding one tool means editing the system prompt, which affects every task.

**Core idea: package "how to do this class of thing" into a unit that loads on
demand. Normally only its business card is loaded; the full text loads when it is
actually needed.**

This is a direct application of loop Decision 3 (context budget), and it also
addresses **intent debt**: an agent cold-starts every session and fills each gap
in your intent with a confident guess. A Skill writes the intent down outside the
conversation — conventions, build steps, "we do not do it that way because of an
incident" — so the agent reads it every round instead of re-deriving it.

## Progressive disclosure — three load levels

```
LEVEL 1  discovery
         only name + description loaded (a few dozen tokens)
         ALL skills present, negligible context cost
              |
              v
LEVEL 2  matched
         full SKILL.md body loaded (the procedure)
         ONLY the one that triggered
              |
              v
LEVEL 3  execution
         references/, tools/, assets/ loaded as needed
         read whichever file is actually required
```

At scale this is the mechanism that makes hundreds of skills affordable: a small
set resident globally (auto-triggered by description) and a much larger set
loaded only on entering the relevant directory.

## SKILL.md structure

The format is minimal — a Markdown file with a YAML header:

```markdown
---
name: refund-processing
description: >-
  Process customer refund requests. Use when a user asks for a refund,
  wants an order cancelled with money returned, or disputes a charge.
---

# Refund Processing

## Preconditions
1. Confirm the order exists and is in `paid` state
2. Check the refund window has not expired (30 days)
3. Check no refund is already in progress

## Procedure
...

## Failure handling
- If the payment gateway returns a timeout, do not retry; mark as
  pending and escalate to a human
- If the amount does not match, stop immediately and escalate

## Safety boundaries
- Any single refund above the threshold requires human approval
- This Skill must not be used for bulk refunds
```

### `description` is the most important field

**`description` is not a human-facing summary; it is the trigger condition.** The
model uses it to decide whether to load the Skill for the current task. Write
**when to use it**, not **what it is**.

- Wrong: "Refund processing tool"
- Right: "Use when a user asks for a refund, wants an order cancelled with money
  returned, or disputes a charge"

Three things a good description contains: **when to use it**, **the trigger
phrases**, and **how it differs from a similar Skill**. Being clever is useless;
being discriminable is what matters.

## Skill / MCP / Tool layering

Three concepts routinely conflated. The layering is clean and worth memorizing:

```
+---------------------------------------------------+
|  SKILL   -  task capability abstraction           |
|  "when this comes up, follow this procedure"      |
|  knowledge and steps                              |
+---------------------------------------------------+
|  MCP     -  tool connection layer                 |
|  "how to reach that external system"              |
|  protocol, auth, schema                           |
+---------------------------------------------------+
|  TOOL    -  a concrete action                     |
|  "call this function"                             |
|  a single executable operation                    |
+---------------------------------------------------+
```

| | Answers | Form | Can stand alone |
| --- | --- | --- | --- |
| **Skill** | How should this class of task be handled? | Markdown document plus optional scripts | Yes — usable without any MCP |
| **MCP** | How do I connect to that system? | Server process plus protocol | Yes, but needs Tools to expose |
| **Tool** | What action does this perform? | Function / API call | Yes — the most primitive |

The positioning: **Skill carries the task-capability abstraction layer, MCP
carries the tool-connection layer.** They are technically independent — a Skill
lands directly in the client's directory and needs no MCP server.

If a design does not use MCP, the standard move is to state an **equivalent
integration contract** covering six points: protocol / authentication / input and
output schema / error handling / audit records / the cost of migrating to MCP
later. Stating those six makes not using MCP defensible.

## Seven design rules

1. **`description` states trigger conditions, not a feature summary.** It is the
   only field that determines whether the Skill loads.
2. **One Skill, one thing.** "Order management" is too large; split into "query
   order", "cancel order", "process refund". Granularity test: **the purpose fits
   in one sentence.**
3. **Write the failure handling in.** This is what separates a toy from a
   production artifact: what happens on timeout, on amount mismatch, on an
   upstream 429.
4. **Write the safety boundaries in.** What this Skill must not do, when it must
   escalate to a human, the per-operation ceiling.
5. **Body holds the procedure; details go in `references/`.** Keep SKILL.md at a
   readable length; move bulk reference material (API docs, error code tables)
   into referenced files loaded on demand.
6. **Executable things go in `scripts/`.** Deterministic logic — validation,
   format conversion, calculation — should be a script the agent calls, not
   something the model performs mentally. This is the determinism budget applied
   to skill design.
7. **Record provenance.** Authored / official / third-party, plus licence. At
   scale this is the only thing that saves you.

Related but distinct: **Skill is the authoring format (SKILL.md); a plugin is the
distribution mechanism** (share across repos, install a group of skills at once).

## Governance at scale

Ten skills can be managed by hand. **Three hundred require governance**, or they
rot into a pile of markdown with unknown provenance that nobody dares delete and
that conflicts internally.

Four required mechanisms:

| # | Mechanism | Purpose |
| --- | --- | --- |
| **1** | **Single source of truth** | One catalog as the sole manifest; documentation, indexes and load tables are all generated from it. A hand-maintained list will rot |
| **2** | **Drift gate** | The generator supports `--check`: when actual content and the catalog disagree it **aborts**. No "we will fix it later" |
| **3** | **Provenance register** | Every Skill records provenance: authored / vendored from which upstream / under which licence. This is the compliance floor |
| **4** | **Pre-install scanning** | Scan third-party Skills for prompt injection, credential leakage, and dangerous commands before adoption. **A Skill is an executable attack surface** |

Minimal provenance fields:

```json
{
  "name": "systematic-debugging",
  "provenance": "vendored",       // authored | vendored | derived
  "upstream": "https://github.com/...",
  "license": "MIT"
}
```

Plus a root `LICENSE` and an `ATTRIBUTIONS.md`.

## Skill manifest — ten fields

Whether for a design document or a deliverable, a Skill should be describable by
these ten:

```
name             refund-processing
type             authored / official / third-party (+ licence)
when triggered   what situation causes it to load
input            what parameters, sourced from where
output           what it produces, for whom
preconditions    required prior state (e.g. order must be paid)
tool dependencies which Tools / MCP servers it calls
failure handling what to do for each failure class (retry? escalate? stop?)
permissions      who may invoke it, when human approval is mandatory, operation ceiling
reuse value      does it transfer to another domain, and what would need to change
```

**Filling this in forces design holes into the open.** Most people cannot fill
"failure handling" and "permissions" on the first attempt — which means the Skill
is still an idea, not a design.
