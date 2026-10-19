# Observability and Audit

Observability answers "what was it doing at the time". Audit answers "who is
accountable for this". Different technology, different retention, different
readers. Keep them separate.

## Observability is not auditability

| | **Observability** | **Auditability** |
| --- | --- | --- |
| **Answers** | What happened, where it was slow, where it broke | Who did what to which thing, when, approved by whom |
| **Reader** | Developers (debugging, optimizing) | Compliance, legal, incident investigation, regulators |
| **Form** | Traces / spans / metrics / logs | A structured audit record table |
| **Mutability** | Samplable, discardable, aggregatable | Append-only, never modified |
| **Retention** | Days to weeks | Years (5–7 is common in finance) |
| **Granularity** | Every model call, every tool call | **Only consequential actions** |

**The most common error is using logs in place of audit.** Logs roll, get
sampled, get cleaned up, and are unstructured. Grepping 100GB of JSON for "who
approved that refund" does not work. **Audit must be a table with a schema.**

## Observability — OTel GenAI span structure

This area is converging on the OpenTelemetry GenAI semantic conventions, which
specify what spans an agent system should emit and which attributes they carry.

The core structure is a three-level tree:

```
invoke_agent
  |
  +-- chat                 (LLM call)
  +-- execute_tool         (tool call)
  +-- chat                 (second round)
```

Common attributes:

```
gen_ai.agent.name
gen_ai.agent.id
gen_ai.operation.name
gen_ai.request.model
gen_ai.usage.input_tokens
gen_ai.usage.output_tokens
gen_ai.tool.name
```

Reasons to follow the standard rather than invent one:

- **Backends are interchangeable** — any OTLP-compatible backend consumes it
  directly, so no vendor lock-in.
- **Comparable across frameworks** — switching frameworks does not mean
  re-instrumenting.
- "Does it follow OTel GenAI conventions" is becoming a review question.

**A real specification gap:** the conventions currently define **single-agent**
spans well (and remain in Development status). The multi-agent orchestration
layer — the relationships between Task / Team / Memory / Artifact — is still an
open proposal with nothing landed. A self-consistent multi-agent trace semantics
that declares alignment with that proposal is a genuine, verifiable
contribution, and the gap is public and checkable.

### Three things multi-agent adds

1. **Causal chain** — which agent triggered which agent. Without it, a trace of
   parallel execution is unreadable.
2. **Per-node cost attribution** — which node consumed the tokens. At 3–10x
   overall cost, without a per-node split you cannot tell what to optimize.
3. **Context snapshot at handoff** — what was passed. The first question in any
   post-mortem of "why did B get it wrong" is always "what did A give it".

### The identifier triple

Propagate three stable identifiers through every call, all the way to the
gateway layer:

```
graph_id : "release-review"
run_id   : "run-8f31"
node_id  : "security-reviewer"
```

This is what enables:

- **Per-node cost attribution** — where the money goes
- **Per-node model routing optimization** — discovering a node that a cheap model
  handles fine
- **Semantic caching** of repeated subtasks
- **Fallback chains** configured per unreliable target
- **Policy correlation** — which node tripped which guardrail

**Hard constraint: the gateway does not infer graph membership. Correlation
depends entirely on explicitly propagating the identifiers.** Without them you
have a pile of unattributable call records.

**The orchestrator is the source of truth for topology**; the gateway supplies
evidence about models, tools, policies, latency and cost. Only correlating both
gives a complete picture.

Record per stage: what the model reasoned, which tool was called, what arguments
were passed, what came back, how it was interpreted.

## Audit — table design

The core of audit is a single **append-only structured table**.

```
audit_log
-----------------------------------------------------------------
id              autoincrement primary key
occurred_at     when it happened (not when it was written)
actor_type      human | agent | system | cron
actor_id        which one specifically (agent name / user id)
action          *** typed enum, never free text ***
target_table    which table it acted on
target_id       which record
before          snapshot before the change (JSON)
after           snapshot after the change (JSON)
reason          why (the agent's stated basis / the human's note)
approved_by     if approval was required, who approved
trace_id        *** links to the observability trace ***
-----------------------------------------------------------------
constraint: the application layer never UPDATEs or DELETEs
```

Two design points carry most of the value:

**1 — `action` must be a typed enum, not free text.** Written as a string like
"user requested a refund", three months later there will be ten phrasings,
making the table neither countable nor queryable. Use constants:
`order_refund`, `voucher_void`, `settlement_mark_paid`,
`manual_points_adjustment`.

**2 — `trace_id` is mandatory.** It is the only bridge between the audit table
and the observability system. The incident path is: audit table locates *which
action* was wrong → take its `trace_id` → go to the trace to see *what the agent
was thinking at the time*. Without the field the two systems cannot talk to each
other.

For an agent system, the two columns that a conventional audit table lacks are
`actor_type: agent` and `trace_id`.

## Approval gates — risk tiers

Not every action needs a human. Approving everything turns the agent into a very
slow form; approving nothing causes incidents. Tier by risk.

| Risk | Test | Handling | Examples |
| --- | --- | --- | --- |
| **LOW** | Read-only, reversible, no external effect | Execute directly | Query an order, read a file, search |
| **MEDIUM** | Writes, but easily undone | Execute plus audit record | Update a note, add a tag, internal notification |
| **HIGH** | Irreversible, or financial/external impact | **Suspend, await human approval** | Refund, message a customer, delete data |
| **UNKNOWN** | Cannot be determined | **Treat as HIGH** | A new tool, an unclassified action |

Three confirmation modes, switchable by environment:

- **ALWAYS_CONFIRM** — ask about every action. For a newly deployed system or a
  demo.
- **CONFIRM_RISKY** — ask only for HIGH and UNKNOWN. **The production default.**
- **NEVER_CONFIRM** — fully automatic. Only for thoroughly validated closed
  scenarios.

### Placement is the whole point

**Interception must happen immediately before the tool executes, not as an
instruction in the prompt.** The engineering term is a **Policy Enforcement
Point** — a mandatory checkpoint on the call path that the model cannot route
around.

A pre-tool-use hook is the canonical implementation: it receives the tool call's
arguments and returns allow, deny, or require-confirmation. A typical guard
blocks secret files (`.env`, `id_rsa`, `*.pem`, while allowing `.example`
variants) and dangerous commands (`rm -rf /`, fork bombs, `curl | sh`,
force-push without lease).

A mature trade-off inside such a guard: **make the guard itself fail-open** — a
guard that interrupts legitimate work is worse than no guard. Note this does not
conflict with high-risk actions failing closed; they are two different questions.

## Rollback — there is no Ctrl+Z in agent systems

Databases have transactions. Agent actions mostly happen in the outside world:
the email is sent, the refund is issued, the message reached the customer. Those
cannot be rolled back, only compensated.

| Type | Meaning | Design |
| --- | --- | --- |
| **Revertible** | Can restore the prior state | Snapshot before the operation (a timestamped backup) |
| **Compensable** | Cannot be undone, but a reverse action offsets it | Define a compensating action explicitly for each action: ship ↔ return, charge ↔ refund |
| **Irreversible** | Done is done | **Only pre-approval helps.** Deletion, external publication, physical actions |

### Plan / Apply separation

The most effective pattern for irreversible actions: **split "work out what to do"
from "actually do it"**. Produce a change plan for a human to read; execute only
after approval. This is the `terraform plan` / `terraform apply` model, and the
`--dry-run` flag pattern generally.

In an agent system: the agent emits "I intend to do these 5 things", the human
reviews, approves once, and then it executes. This is a better experience than a
confirmation dialog per action, and the human sees the whole picture rather than
a keyhole.

## How the three fit together

```
   agent decides on an action
            |
            v
   trace records HOW IT REASONED
            |
            v
   approval gate intercepts        --- HIGH ---> suspend, await human
   (classify by risk tier)
            |
            v
   execute + write audit record
   (before/after snapshot + trace_id)

   trace_id is the thread stitching "how it reasoned" to "what it did"
```

## Reference architecture: the governance-plane pattern

One deployed multi-agent platform separates the **governance plane** from the
**application framework**: agent logic stays in whatever framework you already
use, while a layer beneath it orchestrates and manages the agent containers.
Four transferable design decisions:

1. **Declarative resources for the whole system.** Four resource kinds — Worker
   (one working agent: model, runtime, image, skills, MCP servers, channel
   policy), Manager (coordinator), Team (a leader plus worker specs plus
   team-level policy), and **Human**.
2. **Human is a first-class resource, with a permission level and a scope of
   accessible teams and workers.** Most frameworks bolt human intervention on
   afterwards as an interrupt call or a callback. Modelling humans as peers of
   agents makes "who may approve what" **declarative configuration** rather than
   `if` statements scattered through code.
3. **A message bus makes audit free.** Human, manager and worker all communicate
   over a shared timeline (team room / leader DM / per-member channel). Two
   consequences come at no cost: the collaboration record *is* the audit log, and
   a human can step into any room at any time without a dedicated feature.
4. **Credential isolation at the gateway, workers are stateless.** Workers never
   hold real API keys or tokens — only a consumer token, with the gateway
   authorizing by identity. This bounds the leak surface at one point regardless
   of how many agents exist. Worker state lives in object storage rather than in
   the worker, so workers scale horizontally, are replaceable, and lose nothing on
   restart. That is one concrete answer to loop Decision 5.

**One boundary worth memorizing:** *Skills provide operational guidance; they do
not replace the runtime environment or the permission policy. Whether a
configuration change or production data access is permitted is still decided by
platform identity, policy and process.* Restated: **a Skill is knowledge, not
permission.** You cannot prevent a database from being dropped by writing "do
not drop the database" in a Skill; that requires IAM and a policy enforcement
point. Same principle as moving hard constraints out of the prompt and into
code.
