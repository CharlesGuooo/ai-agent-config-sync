# Topologies — many agents

## Definition and scope

Graph engineering is designing and operating a multi-agent system as an
explicit, heterogeneous-node graph: deciding which nodes exist (agents,
deterministic functions, routers, joins, tools, human checkpoints), which
transitions are permitted, and how the runtime work graph is generated and
mutated.

Loop design governs one agent's behaviour cycle. Graph design governs the
topology on top of those cycles. They compose; neither replaces the other. A
well-designed graph containing undesigned loops fails at the node level. Well
designed loops in an accidental topology fail at the coordination layer.

**"Graph" now has four unrelated meanings. Keep them separate:**

| Type | Purpose | Representative |
| --- | --- | --- |
| **Control graph** | Workflow structure and routing rules | LangGraph, Google ADK |
| **Knowledge graph** | Relationships between entities in data | GraphRAG |
| **Execution trace** | What actually happened in one run | Agent debugging and observability |
| **Improvement graph** | Nested optimization loops | Self-improving systems |

**This material means the control graph.** A knowledge graph solves "how do I
retrieve better"; a control graph solves "who calls whom under what condition".

## Communication mechanisms

Every multi-agent framework, whatever it calls itself, uses one of three
mechanisms underneath. The choice determines debugging difficulty,
auditability, and failure modes.

```
A. SHARED STATE            B. MESSAGE PASSING         C. HANDOFF
   agent A   agent B          agent A   agent B          agent A --> agent B
      \       /                  \       /                 control transfers
       v     v                    v     v                  A exits, B takes over
    one state object          shared timeline
    risk: silent overwrite    audit is free            risk: context loss
```

| | Shared state | Message passing | Handoff |
| --- | --- | --- | --- |
| **Model** | All agents read/write one state object | Agents send messages onto a shared timeline | Control transfers wholesale; A exits, B continues |
| **Strength** | Fastest to write | **Auditability is free** — the collaboration record *is* the log, no extra instrumentation | **Cheapest in tokens** — no duplicate contexts to maintain |
| **Failure** | Parallel branches writing the same field silently overwrite each other without a reducer | Timeline volume | **Context loss** — how much history B sees must be designed explicitly (an input filter) |

Selection rule: ask "after an incident, how do I reconstruct what happened?" If
the answer is "reassemble a timeline from logs", use message passing. If it is
"look at the final state", shared state suffices. Handoff fits only clean
responsibility boundaries with no need to return — e.g. "escalate to the
specialist team".

Message passing has a further practical consequence: **a human can step into any
room at any time, so "human intervention" needs no dedicated feature.**

## Task decomposition — the hard part is merging, not splitting

LLMs split tasks well. The difficulty is recombining several agents' outputs
into something coherent, non-contradictory and non-duplicative.

| Merge strategy | Method | Use when |
| --- | --- | --- |
| **Concatenate** | Join parts in a fixed order | The structure is naturally separable (chapters of a report) |
| **Reduce** | Declare an explicit merge rule (dedupe / union / weighted) | Homogeneous results (several reviewers each producing findings) |
| **Re-synthesize** | Hand all sub-results to a synthesis agent to rewrite | A coherent narrative is required — but introduces fresh hallucination risk |
| **Adjudicate** | A judge agent or rule decides between conflicting sub-results | Subtasks can reach contradictory conclusions |

**The common failure is using re-synthesis to paper over the absence of a merge
rule.** Handing five results to a large model with "please integrate these"
produces output, but loses two things: traceability (which subagent produced
the final claim? unanswerable) and consistency (the synthesizer may invent
content absent from every sub-result). **Anything a reducer can merge should not
be merged by an LLM.**

## Context isolation — the substantive advantage

A single agent on a long task fills its window with irrelevant material:
retrieved source text, failed attempts, intermediate artifacts. Two
consequences: cost rises linearly, and attention is diluted (context rot).

The multi-agent answer: **each subagent gets its own context window and returns
only conclusions, never process.** The dirty work of reading 40 pages stays in
the subagent's window; the main agent receives a summary.

```
                 main agent (clean window)
                    ^        ^        ^
     conclusions only|        |        |conclusions only
                    |        |        |
            subagent A  subagent B  subagent C
            reads 40    12 failed   parses a
            documents   attempts    large JSON
```

The decision heuristic follows directly: **"will this subtask generate a large
volume of intermediate garbage?"** Yes, split it out. No, do not.

The value is not "parallel is faster" — it is "the main agent's window stays
clean."

## Graph vocabulary

### Node types

| Node type | Contents | Nondeterministic? |
| --- | --- | --- |
| **Agentic node** | Runs a full observe-reason-act-verify loop internally | Yes |
| **Deterministic function** | Pure function: parse, look up, convert | No |
| **Router** | Chooses the next hop by condition | **Should be no** |
| **Join** | Waits for multiple branches, merges results | No |
| **Tool node** | External call, usually via MCP | No (but can fail) |
| **Human checkpoint** | Blocks awaiting approval | Human |

The significant recent change: **a node can now be an entire agent run**, not
merely one LLM call or one block of deterministic code. That is what makes
"embed a reliable agent as a graph component" possible.

### Edge types

| Edge type | Semantics |
| --- | --- |
| **Sequential** | A completes, then B |
| **Parallel** | A completes, then B, C, D start together |
| **Conditional** | A's output decides whether B or C runs |
| **Fallback** | A fails, go to F |
| **Back edge** | C is unsatisfied, return to B — **this is the cycle** |

**Agent graphs are usually not DAGs.** Production systems need cycles: retrying
failed calls, requesting user input, revising answers. Cycles are a basic
element, not an exception. This is also why "graphs replace loops" is a category
error — graphs contain cycles by construction.

### State schema and reducers

This is the most substantive technical difference between a loop and a graph. A
loop's state is a `messages` array anyone may append to. A graph's state is an
**explicitly declared schema in which every field specifies a merge rule
(reducer)**, because parallel branches write the same field concurrently.

```python
from typing import Annotated, TypedDict
import operator

class ReviewState(TypedDict):
    diff: str                                      # read-only, no merge
    findings: Annotated[list, operator.add]        # parallel branches concatenate
    verdict: str                                   # last write wins
```

**Five rules:**

1. Any field that **could be written by multiple branches** must have a reducer.
2. The reducer must be **associative and commutative**, because branch
   completion order is not guaranteed. List concatenation qualifies; "take the
   maximum" qualifies; "take the last one" **does not** — never use it on a
   parallel field.
3. **Reducers are field-scoped, not node-scoped.** Once a field carries an
   append reducer, *every* node writing it appends — including the join node
   that intended to overwrite with a deduplicated result.
4. Following from 3, the most important rule: **the field parallel branches
   write and the field the join node writes must be two different fields.**

   | Field | Reducer | Written by | Semantics |
   | --- | --- | --- | --- |
   | `raw_findings` | append | parallel branches | accumulate |
   | `findings` | none | join node | overwrite |

5. Decide what happens to **duplicates**. Two reviewers reporting the same bug
   produce two entries under an append reducer. Deduplication belongs in the
   join node; do not expect the reducer to do it.

**Write a test for fan-in.** This is the only failure mode that raises no error,
emits no warning, and merely produces a quietly wrong number. Assert that N
branches each producing k items yield exactly N×k items in final state before
deduplication.

Concrete instance of rule 3 going wrong: a single `findings` field with an
append reducer, written by three parallel branches *and* by a join node that
deduplicated. The join appended its 3 deduplicated items to the original 3,
yielding 6, with the high-severity item duplicated. No error. No warning. Just a
number that quietly became wrong.

## Org graph vs work graph

The most useful distinction in the whole area: two layers with completely
different lifecycles.

| | **Org graph** | **Work graph** |
| --- | --- | --- |
| **Lifecycle** | Long-lived, spans tasks | Generated per execution, disappears on completion |
| **Nodes** | Resident agents with fixed roles and territory | Temporary task nodes |
| **Edges** | Fixed dependency topology | Runtime-adaptive: split, merge, reorder |
| **Context** | Retained across task cycles | Discarded with the task |
| **How it changes** | Edit config, redeploy | At runtime as evidence arrives |
| **Analogy** | Org chart / operating charter | This sprint's task board |

Concretely — org graph: "we have a security reviewer, a data reviewer and an API
reviewer; security has veto power over shipping." Rarely changes. Work graph:
"this PR touched 12 files, 3 of them in auth, so dispatch the security reviewer
to those 3 and the API reviewer to 4 others; if security finds anything
high-severity, add a fresh-context re-check node." Different every time.

Why the distinction matters: **it separates two different kinds of engineering
problem.**

- Org-graph problems are **design** problems: how to cut roles, allocate
  territory, assign veto power. These deserve slow thought, written
  documentation, review, version control.
- Work-graph problems are **runtime** problems: who may spawn a node, what a
  spawned node inherits, how a cancelled branch's side effects roll back. These
  are distributed-systems problems, and **no mature standard exists yet**.

Conflating them is a common root cause of failed multi-agent projects: teams
mutate organizational structure at runtime, or try to predict every task shape
at deploy time.

## Eight topology patterns

### 1 · Orchestrator-Worker

```
        +--------------+
        | Orchestrator |   plan + dispatch + aggregate
        +--+----+----+-+
           |    |    |
        +--v-+ +v--+ +v---+
        | W1 | | W2| | W3 |     independent contexts
        +--+-+ +-+-+ +-+--+
           |     |     |
           +-----+-----+
                 v
        +----------------+
        |   synthesize   |
        +----------------+
```

**Use when:** the task decomposes into independent exploration directions.

Reference implementation: a lead agent plans and stores the plan in memory, then
spawns subagents in parallel, each with its own context window and tools;
subagents return **condensed findings** (not long transcripts) and the lead
synthesizes a cited answer.

**Reported results:** ~90.2% above single-agent on an internal research
evaluation, ~90% reduction in research time on complex queries. **Always cite
the cost alongside:** that system used ~15x tokens, and token usage alone
explained ~80% of performance variance. A large part of the 90.2% was bought
with 15x spend, not conjured by the architecture.

**Failure modes:** the orchestrator becomes a bottleneck (it must read every
result); the subtasks were not actually independent and workers lack each
other's context; this is the worst shape for token amplification.

### 2 · Fan-out / Fan-in (map-reduce)

```
              +--------+
              | split  |   branch count decided at runtime
              +---+----+
        +---------+---------+
        v         v         v
    +-------+ +-------+ +-------+
    |map(a) | |map(b) | |map(c) |
    +---+---+ +---+---+ +---+---+
        +---------+---------+
                  v
            +----------+
            |  reduce  |  <- reducer must be correct or data vanishes silently
            +----------+
```

**Use when:** the number of branches is only known at runtime (how many files to
review, how many sources to consult).

A dynamic-send primitive exists for exactly this: it lets a node create work at
runtime without pre-declaring every transition.

**Failure mode:** silent data loss at fan-in when the reducer is wrong. The most
common bug in graphs.

### 3 · Router

```
                  +----------+
   input -------->| classify |   <- deterministic function, not an LLM
                  +----+-----+
          +------------+------------+
          v            v            v
     +--------+  +----------+  +---------+
     | branch |  |  branch  |  | branch  |
     |   A    |  |    B     |  |    C    |
     +--------+  +----------+  +---------+
```

**Use when:** input falls into a finite set of known categories.

**Key design point: routing itself should be deterministic code.** A function
node emits an event carrying a routing key; the engine dispatches on that key.
No LLM participates in orchestration.

If the classification genuinely needs judgement ("what is the intent of this
free text"), split it in two: **the LLM classifies, code routes.** The model
emits an enum value; code looks the enum up in a table. Model gives judgement,
code gives control.

**Failure mode:** the classification enum omits a case and there is no default
branch, so the graph silently stalls.

### 4 · Pipeline (no barrier)

```
item A:  stage1 --> stage2 --> stage3   done
item B:      stage1 --> stage2 --> stage3   done
item C:  stage1 ------> stage2 --> stage3   done
         (each item flows through independently; nobody waits)
```

Contrast with the barriered version:

```
         +-- stage1 --+
items ---+-- stage1 --+--[wait for all stage1]--+-- stage2 --+
         +-- stage1 --+                          +-- stage2 --+-->
                          ^                      +-- stage2 --+
                    waiting on the slowest
```

**Use when:** multiple items each pass through multiple stages with no
cross-item dependency between stages.

**Default to no barrier.** The wall-clock cost is real: if the slowest of 5
items is 3x the fastest, a barrier wastes two thirds of the fast items' idle
time.

**A barrier is necessary only when stage N needs cross-item context from all of
stage N-1:**

- Deduplicating or merging across the full set before expensive downstream work
- Early exit when the total is zero ("0 findings -> skip verification entirely")
- Stage N's prompt must reference "the other findings" for comparison

**A barrier is not justified by:** "I need to flatten/map/filter first" (do it
inside a stage); "these stages are conceptually separate" (separate stages are
not synchronized stages); "the code looks tidier" (barrier latency is real).

### 5 · Zone Defense

```
+----------+ +----------+ +----------+ +----------+
| Security | |   Data   | |   API    | | Frontend |   resident, each owns a zone
| resident | | resident | | resident | | resident |
+----+-----+ +----+-----+ +----+-----+ +----+-----+
     +-----------+-- work graph --+---------+
              (cross-zone traffic via the work graph)
```

**Use when:** the codebase or business partitions cleanly by domain and
per-domain context accumulation has long-term value.

This is the canonical **org graph** shape: agents hold stable territory and
retain domain memory; cross-zone communication happens through the work graph.

**Failure mode:** zone boundaries do not match real change boundaries, so one PR
triggers every zone, or a change falls between two zones and nobody owns it.

### 6 · Council

```
   finding --+--> lens A (correctness) --+
             +--> lens B (security)      +--> anti-herding gate --> verdict
             +--> lens C (reproducible) -+     (majority / any-veto)
```

**Use when:** a conclusion can be wrong in several distinct ways and needs
several independent perspectives.

**Key design point: the perspectives must differ.** Three identical skeptics add
less than three distinct lenses — correctness, security, performance,
reproducibility. Diversity catches failure modes redundancy cannot.

Pairs well with **adversarial verification**: each verifier is prompted to
*refute* the finding, defaulting to "refuted" when uncertain. A majority of
refutations kills it.

**Failure mode:** herding. If each perspective sees the others' output rather
than the raw evidence, they converge on the same error. Hence the anti-herding
gate: **independent conclusions first, aggregate afterwards.**

### 7 · Fresh-context Reviewer

```
   writer  (dirty context: all search results, all drafts, all failed attempts)
      |
      |  passes ONLY the artifact + the rubric; never the process
      v
   reviewer (clean context: artifact and rubric only)
      |
      +--(fail)--> back edge to writer
```

**Use when:** almost always. This is the verifier subagent expressed as a graph
shape.

**Key design point: what flows along the edge matters more than what happens in
the nodes.** Pass the writer's full context to the reviewer and you have no
fresh context — only the same agent wearing a different system prompt.

### 8 · Human Gate

```
   ... --> before a high-risk action --> || interrupt || --> approved --> execute
                                         ||  blocks   || --> rejected --> fallback branch
```

**Use when:** consequences concentrate — production deploys, deleting data,
outbound messages, spending money.

Place gates where consequences concentrate rather than uniformly before every
tool call. These are **structural checkpoints**: an unapproved edge is
impassable, which is a structural guarantee rather than a behavioural hope.

**Key design point: approval must be a durable event, not a transient prompt.**
See `observability-audit.md`.

## Runtime mutation of the work graph — unsolved

The most honest section here: **no mature standard exists.** Who may spawn a
node, what a spawned node inherits, and how a cancelled task's side effects roll
back are evolving practices, not settled standards.

| Open problem | Why it is hard |
| --- | --- |
| **Who may spawn nodes** | Free spawning explodes cost; forbidding it removes the dynamism |
| **What a spawned node inherits** | Context? permissions? budget? Inherit too much and permissions diffuse; too little and the node lacks information |
| **How to roll back a cancelled branch** | A branch wrote files, opened a PR, sent a message — how do you unsend a message? |
| **Who holds rollback authority** | The orchestrator? the cancelled node? a human? |

Practical guidance until standards arrive:

- Set **hard limits on spawning** (count and depth), enforced in code, never as a
  prompt constraint.
- Spawned nodes **inherit minimum permissions by default**; grant explicitly.
- **Defer irreversible actions.** Do only reversible work inside branches;
  concentrate irreversible actions in a single node after the join. This is the
  most practical rule of the four.
- Each branch maintains a **list of compensating actions**, executed in reverse
  order on cancellation.

## When not to build a graph

**Use a plain loop when:** the task finishes in seconds, re-running from scratch
is cheap, single-process execution suffices.

**A graph is needed when:** work spans multiple processes, human gates are
required, or it must survive crashes and restarts.

### The core distinction: dynamic dispatch vs durable coordination

| Problem | What it is | What solves it |
| --- | --- | --- |
| **Dynamic dispatch** | "Given what I just learned, what next?" | **A simple ReAct loop is enough** |
| **Durable coordination** | "Survive restarts, wait for approval, run for a long time" | **State machine / durable execution** |

**Confusing these is the root cause of premature graph adoption.** Seeing "the
agent needs to decide the next step dynamically" and reaching for a graph
framework is a mistake; an ordinary tool-calling loop already covers it.

Graph engineering frequently creates automation debt: burying simple logic
inside expensive, nondeterministic LLM calls.

### Three sharp reminders

1. **A graph does not confer reliability. It makes failure paths explicit enough
   to be inspected and tested.** Systems get more reliable after adopting a graph
   because you were *forced* to think the failure paths through, not because the
   graph has magic.
2. **A graph forces you to admit how much of the workflow you never modelled.** A
   loop is forgiving — the agent improvises. A graph is not: nodes and permitted
   transitions must be stated up front. That is good (it surfaces problems) and
   costly (design time goes from minutes to hours).
3. Teams routinely spend more time managing framework abstractions than
   improving the agents' actual reasoning.

### Cost ledger

| You gain | You pay |
| --- | --- |
| Parallel, independent contexts | Multiple prompts to maintain |
| Clean separation of concerns | State-schema overhead between nodes |
| Auditable control flow | New failure modes: merge bugs, routing deadlock, state leakage |
| Fan-out/fan-in as first-class operations | Substantially higher debugging complexity |
| Structured human gates | The system becomes a distributed workflow, not a script |

| Dimension | Loop | Graph |
| --- | --- | --- |
| Scope | One agent's retry cycle | A multi-agent organization |
| Structure | Deferred (the agent figures it out) | Nodes and edges declared explicitly |
| Failure surface | One agent, isolated failure | Node failure propagates through the trace and threatens work-graph consistency |
| Context flow | Implicit inside the agent | Must be designed into the edges; a missing edge is lost information |
| **Design time** | **Minutes** (a draft instruction file) | **Hours** (domain mapping + handoff protocols) |

A useful summary: **a loop's harness is roughly a bash script; a graph's harness
approaches a distributed-systems runtime.**

## What a graph framework actually buys

| Concept | Framework | Hand-rolled | Framework's marginal value |
| --- | --- | --- | --- |
| State + reducer | Annotated type with a merge function | `findings += branch_result` | Declarative, harder to forget |
| Fan-out | Dynamic send primitive | Thread pool | Dynamic count + checkpoint integration |
| Conditional edge | Conditional-edge API | `if` | Visualizable, statically checkable |
| Checkpoint | Built-in saver | Hand-written JSON | **Replay semantics, time travel, concurrency safety** |
| Human gate | `interrupt` | Write a file and return | **Interrupt at arbitrary depth, resume at exactly that point** |
| Observability | Built-in tracing | Manual instrumentation | Identifier propagation |

Two conclusions:

1. **Small graphs need no framework.** Three parallel branches and an aggregation
   step is twenty lines with a thread pool; a framework adds abstractions, a new
   debugging surface, and an upgrade burden.
2. **The framework's value concentrates in the checkpoint row.** "Interrupt at
   arbitrary depth, exit the process, resume hours later at exactly the right
   point" is very hard to get right by hand. **If the task does not need that, it
   probably does not need a graph framework.**

Note also that the hand-rolled version makes the `raw_findings` / `findings`
separation into two local variables, where scoping is explicit and the bug is
naturally hard to write. In a framework's state schema the same distinction is
implicit, which is exactly why it gets stepped on. **A framework gives you
capability and a new surface to trip over.**

## Graph primitives inside a coding agent

If the graph is being built inside a coding agent rather than in Python:

| Graph concept | Coding-agent form |
| --- | --- |
| Agentic node | A subagent definition file |
| Node isolation | Worktree isolation — each helper gets its own checkout |
| Fan-out | Multiple parallel subagent calls in a single message |
| Pipeline (no barrier) | Each item flows independently through several stages |
| Human gate | Pre-tool-use hooks plus permission modes |
| Budget | A per-run token budget |

A pre-tool-use hook receives the tool call's arguments and may allow, deny, or
require confirmation. **That is a deterministic checkpoint on an edge** — the
same idea as defining edges in code.
