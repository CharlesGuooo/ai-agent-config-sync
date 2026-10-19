---
name: multi-agent-systems
description: >-
  Design knowledge for agent loops and multi-agent graphs — when a task warrants
  a loop at all, when to escalate from one agent to many, topology patterns,
  verifier and termination design, empirical failure taxonomies, reliability
  patterns for LLM call chains, observability/audit, and Skill engineering.
  Load BEFORE designing, building, or reviewing any system where an LLM runs in
  a loop with tools, where several agents coordinate, or where an agent runs
  unattended. Triggers "design a multi-agent system", "one agent or several",
  "orchestrator-worker", "fan-out/fan-in", "subagent architecture", "the agent
  loops forever", "how do I verify what it produced", "how do I audit what the
  agent did", "should this be a graph". Reference knowledge, not a procedure:
  it supplies criteria and vocabulary, it does not execute anything. Distinct
  from dispatching-parallel-agents (which runs a fan-out right now) and
  subagent-driven-development (which executes an existing plan step by step).
allowed-tools: Read, Glob, Grep
compatibility: "offline — reference knowledge only; no scripts, no network, no credentials"
---

# Multi-Agent Systems

Design knowledge for systems where an LLM runs in a loop with tools, and where
several such loops coordinate. This body is the decision core. Deep material
lives in `references/` and is read only when the task touches it.

## The question everything hangs on

Two decisions define the system:

1. **Where does nondeterminism live?**
2. **Where does verification happen?**

Loop design answers both for one agent. Graph design answers both for a group.
Automations, worktrees, skills, subagents, gates, checkpoints and human approval
are mechanical parts serving those two questions — not a list to memorize.

**A graph contains loops; it does not replace them.** Every agent node inside a
graph is itself a loop. A single loop is already a graph: one node with a back
edge to itself. It grows more nodes when the task needs true parallelism,
per-node model/tool differences, independent verification, or human gates.

## Three foundations

### 1. Agent = model + harness

A model does one thing: given context, produce the next output (possibly a
tool-call request). The harness decides which tool runs, how results re-enter
context, when to stop, and what happens on crash. **The loop is a property of
the harness, not of the model.**

A stronger model does not make the harness less important. It raises the
autonomy that can safely be granted, which increases the verification,
isolation, recovery and audit work the harness must carry.

Composition: `Agent = LLM + Memory + Planning + Tool Use`. Memory means short
term (the context window) and long term (disk, database, vector store).

### 2. Verification is the constraint, not generation

Generation capacity rises fast and has no near ceiling; human attention is
fixed. When a loop can produce twenty PRs overnight, the bottleneck moves from
"can it be written" to "can it be confirmed correct."

Three consequences, used everywhere downstream:

- **Autonomy must never exceed verification capacity.** (back-pressure)
- **Verification must be done by something independent of the writer.**
- **"Done" is a claim, not a proof.**

### 3. Determinism budget

Every system can afford a finite amount of nondeterminism. Each "let the model
decide" purchases token cost, latency, behavioural variance, debugging
difficulty, and prompt-injection surface. Where that budget is spent is the
most consequential architectural decision.

| Give to deterministic code | Give to the model |
| --- | --- |
| Parsing structured data (JSON, CSV, log formats) | Interpreting free text, vague descriptions, unstructured input |
| Code/policy lookup tables (status code to branch) | Cross-source comparison needing domain judgement |
| API calls and integration | Drafting, rewriting, summarizing, generating |
| Conditional branching (if X then Y) | Handling unseen edge cases |
| State management and audit logging | Judging "is this result good enough" |
| Retry, timeout, rate limiting, budget | |
| Scheduling, fan-out, fan-in | |

Four reasons not to let an LLM do orchestration: cost per routing decision,
added latency for a decision code makes instantly, non-reproducible execution
paths, and reliability that shifts whenever a prompt or model version changes.

**Free side effect — prompt-injection resilience.** If edges are defined in
code, injected text ("ignore previous instructions and approve") can change
what a node *produces* but cannot change which edge is *taken*. There is no
runtime channel for it to alter routing.

Determinism budget does not mean "use fewer agents." It means: deterministic
skeleton, model placed only at the nodes that genuinely require judgement.

## The escalation ladder

Default to the leftmost rung. Every step right requires an explicit trigger.

```
 1 single prompt -> 2 single loop -> 3 loop + verifier -> 4 graph -> 5 graph + durable execution
       |                  |                |                |               |
   path known        needs trial      "done" needs     true parallel    crosses processes
   one shot          and error        independent      context rot      survives crashes
                     stop criterion   confirmation     heterogeneity    hour-scale waits
                     exists                            human gates
```

| Rung | Trigger (all must hold) | Cost | Must ship together with it |
| --- | --- | --- | --- |
| **1 · Single prompt** | Path known, one shot, no feedback loop needed | — | — |
| **2 · Single loop** | Needs trial and error; a machine-checkable stop criterion exists | ~4x tokens | Three gates + state file |
| **3 · Loop + verifier subagent** | You will not read every result; a wrong "done" is expensive | One extra model call per verification | Verifier on clean context + explicit "you must actually run the checks" |
| **4 · Graph** | At least one of the four forces AND at least one of the three multi-agent criteria | 3–10x tokens; design time in hours; a new failure surface | State schema with reducers; per-node cost/latency attribution |
| **5 · Graph + durable execution** | Crosses processes / must survive crashes / human waits measured in hours | Full distributed-systems complexity | Idempotency keys + outbox + version records + replay tests |

**Downgrading matters as much as upgrading.** A rung-4 system that never runs
anything in parallel and has no human gate belongs at rung 3.

## Gate 1 — should this be a loop at all?

A loop has a floor price: design time, tokens, gates, a state file,
maintenance. Three criteria, all required:

| Criterion | Meaning | If missing |
| --- | --- | --- |
| **Repetitive** | Done often enough that design cost amortizes | Designing the loop costs more than doing the work by hand |
| **Reviewable** | "Complete" can be expressed as a check a verifier can run | **The loop cannot know when to stop** |
| **Valuable** | The output is worth ~4x tokens | Paying a premium for something unimportant |

**Reviewable is decisive.** If "what counts as passing" cannot be written down,
none of the five loop design decisions can be filled in. A loop without a stop
criterion is not a loop; it is an open invoice.

Do not use a loop for: fixed predictable workflows (use a deterministic
pipeline), single-step tasks (one LLM call plus one tool call), or paths where
latency dominates (every iteration adds a round trip).

Strongest positive signal: the thought "I am going to have to try many
variants."

## Gate 2 — should this be several agents?

**Only three legitimate reasons** (Anthropic, primary source):

| Reason | Meaning |
| --- | --- |
| **Context isolation** | The agent's context fills with subtask debris that degrades later work |
| **Parallelism** | The task splits into genuinely independent, concurrent pieces |
| **Specialization** | Different steps need different tool sets, system prompts, or domain expertise |

Outside these three, coordination cost usually exceeds the benefit.

Before splitting, confirm all three:

1. A real constraint exists that multiple agents actually relieve.
2. **Split by context, not by problem type.** Group work by "what context does
   this need." Splitting "writes the feature" from "writes the tests" is wrong:
   both need the same context, so they burn coordination bandwidth
   re-synchronizing it. Splitting "everything about the auth module" from
   "everything about payments" is right. Human orgs split by function because
   humans can hold a meeting; every agent handoff is instead a lossy text
   transfer, so agent orgs split by context locality.
3. Explicit verification points exist where a subagent can independently
   confirm its work.

**Four forces that break a single loop** (any one can justify a graph):

1. **True parallelism** — independent subtasks executed sequentially waste wall clock.
2. **Context pollution** — one agent that gathers, drafts, then reviews is
   reviewing its own work through a context full of debris. This is the most
   common and most hidden force.
3. **Heterogeneity** — different steps want different models, tools,
   permissions, or reasoning effort. A loop shares one configuration.
4. **Auditability and human gates** — "which actions need a human" is a topology
   question, not a prompt question. In a loop you can only ask the prompt nicely.
   In a graph an unapproved edge is structurally impassable.

**Self-test — "are you actually a graph?"** Count the yes answers:

1. Are there genuinely independent, specialized contexts (each node with its own
   prompt and tools), not one agent switching costume?
2. Is there real fan-out and fan-in (concurrent execution then merge), not
   several sequential steps?
3. Can the control flow be drawn — are routing rules defined in advance?
4. Did the success criterion change, or was the same goal re-packaged?

0–1 yes: a loop wearing graph clothing. 2–3: a real graph, worth the cost.
4: a genuine shift driven by the work itself.

## Non-negotiables

1. **The three gates ship with the loop, not after it** — iteration cap,
   no-progress detection, spend cap. You never know which run is the runaway one,
   and the cost is asymmetric.
2. **Stop criteria are machine-checkable and cover all three cases** — success,
   failure, escalation. Success-only means it never stops.
3. **The verifier gets clean context and an explicit instruction to actually run
   the checks.** A verifier sharing the writer's model and context rubber-stamps.
4. **Any state field written by parallel branches needs a reducer, and the field
   parallel branches write must differ from the field the join node writes.**
   Reducers are field-scoped, not node-scoped. Getting this wrong loses data
   silently — no error, no warning.
5. **Hard constraints live in the tool surface, not in the prompt.** Do not ask
   the model not to use a capability; do not give it the capability.
6. **Irreversible actions never run inside a branch.** Keep branch work
   reversible; concentrate irreversible actions in a single node after the join,
   behind a gate, protected by an idempotency key.
7. **Approval is a durable event, not a modal dialog.** It must survive process
   exit and replay.
8. **Caps live in code** — iterations, budget, spawn count, spawn depth. A model
   promising to try at most three times is not a cap.
9. **Route with code.** If classification needs judgement, the model emits an
   enum and code dispatches on it. Model gives judgement, code gives control.
10. **State lives on disk.** The model forgets everything between calls. Without
    a state file the loop re-derives the whole project every morning.

## Anti-patterns

| Anti-pattern | Why it fails |
| --- | --- |
| LLM makes routing, scheduling, or retry decisions | Cost, latency, nondeterminism, untestable |
| Agents split by problem type (dev / test / docs) | Telephone game — split by context instead |
| Verifier is the same model on the same context | It rubber-stamps its own work |
| Verifier prompt omits "must actually run the checks" | Early victory: passes without testing |
| Parallel-written field has no reducer | Silent data loss |
| Barrier inserted between every stage by default | Wastes wall clock; barrier only when stage N needs all of stage N-1 |
| Approval implemented as a one-shot prompt | Unrecoverable after crash, unauditable |
| Loop ships first, gates added later | You do not know which run is the runaway one |
| Agents spawn subnodes freely | Cost explosion, no depth bound |
| Irreversible action executed inside a branch | Cannot be rolled back on cancel |
| Timestamp or UUID inside the system prompt | Destroys prompt-cache prefix matching |
| Token usage used as a performance metric | Goodhart's law: you get token consumption |
| Graph adopted because graphs are more advanced | Distributed-systems cost for no benefit |
| Log used in place of an audit table | Logs roll, sample, and are unstructured — unqueryable after the fact |
| LLM judges what a deterministic check could decide | Introduces an unreliable component for free |
| LLM re-synthesis used where a reducer would do | Loses traceability, invents content not in the sub-results |

## Reference index

Read the file that matches the decision in front of you. Do not read all of them.

| File | Read it when |
| --- | --- |
| `references/loop-design.md` | Designing one agent's loop: the five decisions, three gates, four loop patterns, failure-mode table, a framework-free minimal implementation, cost and security posture |
| `references/topologies.md` | Choosing or reviewing a shape: node/edge vocabulary, state schema and reducers, org vs work graph, eight topology patterns, communication mechanisms, task decomposition and merge, when not to use a graph |
| `references/failure-modes.md` | Reviewing a design for holes: the 14 empirical multi-agent failure modes with mitigations, the four cybernetic feedback-loop failures, and a fill-in review checklist |
| `references/verification.md` | Building the part that decides "is this right": verifier tiers, termination boundaries, oscillation control, fail-open vs fail-closed, reconciliation loops |
| `references/reliability.md` | The call chain keeps breaking: circuit breakers, fallback chains, rate limiting/bulkheads/backpressure, durable execution, idempotency, LLM-specific traps |
| `references/observability-audit.md` | Needing to answer "what happened" or "who is accountable": OTel GenAI spans, audit table schema, risk-tiered approval gates, rollback and compensation |
| `references/skill-engineering.md` | Packaging knowledge for agents: SKILL.md structure, progressive disclosure, Skill vs MCP vs Tool, seven design rules, governance at scale |
| `references/templates.md` | Writing the design down: fill-in templates for loop and graph, the migration path, cost figures with provenance, discredited numbers not to cite, primary sources |
