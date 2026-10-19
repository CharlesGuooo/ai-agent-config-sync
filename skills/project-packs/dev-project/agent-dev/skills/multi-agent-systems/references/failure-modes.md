# Failure Modes

Three catalogues, at three different levels. Use them in this order when
reviewing a design: MAST for component and protocol holes, the cybernetic four
for whole-system pathologies, the grounding check for "is any of this still
connected to reality".

## MAST — 14 empirical multi-agent failure modes

Derived by a Berkeley team from analysis of 1600+ real multi-agent execution
traces. It is the only multi-agent failure taxonomy with a large empirical base,
which makes it different in kind from principle-derived checklists: it covers
failure modes nobody would have predicted, because someone already hit them.

**Three categories, three different remedies.** Classify first, then act — the
debugging methods do not transfer between categories.

| Category | Meaning | Remedy |
| --- | --- | --- |
| **1 · Specification and system design** | Wrong from the start | Fix the spec, roles, tool surfaces |
| **2 · Inter-agent misalignment** | Each agent is correct, the combination is not | Fix the communication protocol |
| **3 · Task verification and termination** | Nobody is responsible for saying "enough" | Build a verifier |

### Category 1 — specification and system design

The system was doomed before it started: roles undefined, constraints unstated,
or the process itself is flawed.

| Failure mode | What it looks like | Mitigation |
| --- | --- | --- |
| **Task specification violation** | The agent ignores an explicit constraint ("do not modify the database") and does it anyway | Move hard constraints from the prompt **into the code layer** — do not grant the capability rather than asking it not to use one |
| **Role specification violation** | The reviewer starts writing code; the planner bypasses the executor and executes | **Trim the tool set per role**; a phase-scoped tool provider makes the wrong tool literally unavailable |
| **Step repetition** | The same subtask executes over and over; the system spins in place | Idempotency keys plus a completed-step register; record explicitly what has been done |
| **Loss of conversation history** | Context is truncated, the agent forgets a prior decision and reverses itself | **Persist key decisions into structured state**, not only into the conversation |
| **Unaware of termination conditions** | The task is actually finished but nobody notices, so it keeps running | Explicit machine-checkable completion criteria (see `verification.md`) |

Worked example of the first two: a phase-scoped `getToolsForPhase()` that makes a
finalization tool simply absent from the tool list during an earlier
conversation phase is an order of magnitude more reliable than a prompt saying
"do not summarize yet."

### Category 2 — inter-agent misalignment

Every agent works correctly in isolation, but the interactions fail. **This is
the hardest category to debug because no single component is broken.**

| Failure mode | What it looks like | Mitigation |
| --- | --- | --- |
| **Conversation reset** | Context is cleared at handoff; the receiver starts over and prior work is wasted | Pass an explicit **structured summary** at handoff rather than relying on conversation history (an input filter) |
| **Failure to ask for clarification** | The instruction is ambiguous; the agent does not ask and charges ahead on its own reading | Give explicit permission to ask in the prompt **plus** an `ask_human` tool |
| **Task derailment** | The agent drifts onto an adjacent but different task, progressively further out | Re-inject the original goal into context each round; add a deviation check against the original objective |
| **Information withholding** | An agent holds information a peer needs and never passes it on | Shared timeline (message passing) makes information **visible by default rather than private by default** |
| **Ignored input** | A peer's suggestion or warning arrives and is neither adopted nor rebutted — simply ignored | Enforce a **response protocol**: every received finding must be explicitly marked accepted or rejected, with a reason |
| **Reasoning-action mismatch** | The agent says "I should check the config first" and then edits code directly | Convert key actions from free text into **structured tool calls**, binding saying to doing |

**Ignored input is the most hidden failure in multi-agent systems.** Logs look
normal — A made a suggestion, B carried on working — but B never read it. The
only defence is making the response a mandatory part of the protocol, with no
silent pass. This is why a Council topology must require explicit votes rather
than "discuss it".

### Category 3 — task verification and termination

The system ran, produced something, and nobody actually checked it. This is the
direct expression of "verification is the constraint, not generation".

| Failure mode | What it looks like | Mitigation |
| --- | --- | --- |
| **Premature termination** | Declares success and exits before the task is complete | Completion criteria must be **machine-decidable**, never the model's self-assessment |
| **Incomplete or incorrect verification** | Verification exists but only checks the surface (JSON parses, but its content was never checked) | **Layered verification: format → constraints → semantics → end-to-end** (see `verification.md`) |
| **Verifier dereliction** | A dedicated verifier agent exists but waves everything through | Give the verifier **clean context** (it must not see the generation process), explicit rejection criteria, and human spot-checks |

**Why verifier dereliction is so common:** a verifier sharing the generator's
model and context is biased toward endorsing what it just produced. The fix is
fresh-context review — the verifier sees only the artifact, not the process, and
does not know who wrote it. A verifier that structurally cannot see the
generation parameters (for example a visual scorer that sees only the rendered
output) satisfies this by construction.

## Two officially named failure modes

Both are called out in Anthropic's primary guidance and overlap MAST.

**Telephone game.** When agents are split by **problem type** rather than
**context boundary**, they pass information back and forth, losing fidelity at
each handoff. The canonical wrong split: one agent writes the feature, another
writes the tests. It looks like clean division of labour, but both need the same
context (what the feature is supposed to do), so they burn coordination
bandwidth re-synchronizing. The right grouping is by context requirement:
"everything about the auth module" versus "everything about payments".

Humans split by function because humans can hold a meeting. Agents cannot —
every synchronization is a lossy text transfer. So agent organizations must be
cut along **context locality**, not function.

**Early victory.** The verifier subagent marks output as passing without
adequate testing. Mitigation is a hard-coded explicit instruction: "You **must**
run the full test suite before marking this as passing." This is not a
theoretical risk; it is the most common way the pattern fails. You add a verifier
and assume you are safe, while the verifier merely restates the writer's
confidence in different words.

## The cybernetic four — deeper feedback-loop failures

These explain why a network of interconnected loops is stronger than one loop,
and what still goes wrong at network scale.

| Failure | Description | Countermeasure in the graph |
| --- | --- | --- |
| **Goodhart's law** | Once a metric becomes a target it stops being a good metric | **Paired metrics** — optimize ticket resolution rate while monitoring customer retention |
| **Blindness upward** | A loop cannot question its own reference point; it cannot ask "is this goal still valid?" | **Goals owned by a slower, higher-level loop** |
| **Inter-loop conflict** | One loop optimizing for speed damages another optimizing for stability, with no arbitration inside either | **Explicit arbitration / authority edges** |
| **Measurement decay** | Sensors drift, data pipelines degrade; metrics detach from reality while the dashboard stays green | **An independent audit loop plus a frozen evaluation set** |

Illustration: a support team optimizing for ticket resolution rate builds a
system excellent at **deflecting** problems rather than **solving** them. The
loop runs perfectly; customer retention is destroyed.

The point: graph engineering is not only about running faster. It addresses the
fact that **a single feedback loop is structurally unable to correct itself.**
Parallelism is the shallowest of the benefits.

## Grounding — the check to run before shipping

> A network of interconnected loops risks becoming **elaborate mutual
> confirmation — everything internally consistent, nothing externally verified.**

Wiring loops into a graph can make this **worse**, not better. Three agents
citing each other's conclusions produce a world that is perfectly self-coherent
and completely detached from reality.

The durable distinction is not loop versus graph. It is **ungrounded versus
grounded**: whether the improvement machinery retains contact with external
reality through anchored measurement, frozen rules, and human judgement about
what "better" means.

### Anchors

> **An anchor is an external, fixed reference point the optimizing machinery is
> forbidden to rewrite.**

Examples:

- **A held-out evaluation set** — the optimization loop cannot see it, only be
  scored by it.
- **Physical inventory** — a real-world count, not the number in the system.
- **Ground-truth checks** — samples with known correct answers.
- **Safety constraints** — hard rules that are not tunable.

Without anchors, internal loops degenerate into a self-referential echo chamber.

### Four design principles

1. **Paired metrics** — an optimization metric (resolution rate, latency), a
   **counter-metric** specifically to catch Goodhart (retention, error rate), and
   an **anchored metric** that cannot be gamed.
2. **Owned references** — every goal is owned by a slower, higher-level loop, so
   an agent cannot quietly rewrite its own objective.
3. **Separated cadences** — layer by speed: daily tuning, weekly operations,
   quarterly strategy, annual audit. **Fast loops escalate signals upward; they
   do not overwrite slow-loop decisions.**
4. **Frozen nodes** — deliberately non-tunable elements: held-out test sets,
   safety constraints, ground-truth checks.

**The pre-ship check: where is my anchor? Which node is forbidden to be
optimized? If everything can be optimized, the system will eventually grow into
a self-consistent lie.**

Connecting this to the token-leaderboard example in `loop-design.md`: a
leaderboard on agent usage is an optimization loop with **no counter-metric**.
Measure token consumption and you get token consumption. Pair it with average
token cost per merged PR, or rework rate, and the damage drops sharply.

## Three debts — design implications

These grow *harder* as the loop gets better, not easier. Each attaches to a
sub-loop of the outer loop and implies a concrete design requirement.

| Debt | What accumulates | Design requirement it imposes |
| --- | --- | --- |
| **Verification debt** | An unattended loop is also unattended when it errs. "Done" remains a claim even with a verifier — and the verifier itself declares early victory | The **audit** sub-loop must retain evidence about the verifier, not only about the output. Build in verifier spot-checking |
| **Comprehension debt** | The gap widens between the code that exists and the code anyone understands. A smoother loop widens it faster | The **sampling** sub-loop needs an explicit strategy: random? risk-weighted? weighted toward the least-understood modules? Sampling policy is a design decision, not an afterthought |
| **Cognitive surrender** | When the loop runs itself, it becomes easy to stop having opinions and accept whatever it produces | The **ownership** sub-loop must have a named signer for each shipped artifact |

Lit factory versus dark factory is the same distinction as the back-pressure
principle applied to a whole pipeline: a **dark** pipeline ships code verified
only by machines, with nobody having read a diff — fast, because the most
expensive step vanished. A **lit** pipeline keeps human judgement at the
decisive nodes, especially upstream design and architecture. Same pipeline; the
only difference is where the lights are. Lights may be turned off only where all
four back-pressure conditions hold: checks cheap and frequent, verdict immediate
and drift-resistant, pass/fail unambiguous, loop 3–20 steps.

## Design review checklist

Copy into the design document; fill the right column. **Empty cells are the
system's real holes.**

```
CATEGORY 1 - SPECIFICATION AND SYSTEM DESIGN
[ ] Task specification violation  -> Are hard constraints in code or in the prompt?
[ ] Role specification violation  -> Is each agent's tool surface trimmed by role?
[ ] Step repetition               -> Idempotency keys / completed-step register?
[ ] Loss of conversation history  -> Are key decisions persisted to structured state?
[ ] Unaware of termination        -> What is the completion criterion, and who decides?

CATEGORY 2 - INTER-AGENT MISALIGNMENT
[ ] Conversation reset            -> What is passed at handoff, and who defined it?
[ ] No clarification requested    -> Is there an ask_human tool? When is it mandatory?
[ ] Task derailment               -> Is the original goal re-injected each round?
[ ] Information withholding       -> Is information visible by default or private by default?
[ ] Ignored input                 -> Is there an enforced response protocol?
[ ] Reasoning-action mismatch     -> Are key actions structured calls or free text?

CATEGORY 3 - VERIFICATION AND TERMINATION
[ ] Premature termination         -> Is the completion criterion machine-decidable?
[ ] Incomplete verification       -> How many layers, and what does each check?
[ ] Verifier dereliction          -> Clean context? What are the rejection criteria?

SYSTEM LEVEL
[ ] Goodhart                      -> Which counter-metric guards the optimization metric?
[ ] Blindness upward              -> Which slower loop owns this goal?
[ ] Inter-loop conflict           -> Where is the arbitration edge?
[ ] Measurement decay             -> Which evaluation set is frozen?
[ ] Grounding                     -> Which node is forbidden to be optimized?
```

**Not every row needs to be closed.** The mature posture is to close the
high-risk ones and explicitly record the rest: "this exposure is known and
accepted because X." An unrecognized hole is worse than an accepted one.
