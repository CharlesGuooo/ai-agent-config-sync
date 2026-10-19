# Reliability — stability patterns applied to LLM call chains

## Why LLM chains need this more, not less

The stability patterns from *Release It!* (Nygard) were designed for unreliable
remote services across a network. LLM providers are among the least reliable
services in that class:

| Traditional remote service | LLM provider |
| --- | --- |
| Occasionally times out | Times out **often**, with enormous latency variance (P99 can be 10x P50) |
| Returns an error code | May return **well-formed output whose content is wrong** — the hardest failure class to handle |
| Rate-limited by QPS | Rate-limited **by tokens per minute** — identical request counts can differ 100x in consumption |
| Idempotent via request ID | **The same input does not guarantee the same output**; retry semantics are themselves ambiguous |
| Cost approximately zero | Every call costs real money; failed retries burn budget directly |

A multi-agent system multiplies this by N — one task can trigger dozens or
hundreds of model calls.

## Circuit breaker

The goal is **not** "eventually retry successfully". It is: **when the downstream
is clearly broken, fail fast so you do not drag yourself down with it.**

```
   +---------+   consecutive failures >= N   +--------+
   | CLOSED  | ----------------------------> |  OPEN  |
   | pass    |                               | fail   |
   | through |                               | fast   |
   +---------+                               +---+----+
        ^                                        | cooldown elapsed
        | probe succeeded                        v
        |                              +------------------+
        +------------------------------|    HALF-OPEN     |
                                       | probe one request|
                                       +--------+---------+
                                                | probe failed
                                                +--> back to OPEN
```

Three parameters that must be tuned:

- **Failure threshold** — how many consecutive failures trip the breaker. Too low
  trips spuriously (occasional LLM timeouts are normal); too high makes it
  pointless. Typical range 3–5.
- **Cooldown duration** — how long OPEN lasts before probing. Provider rate-limit
  windows are often minute-scale, so do not set this too short.
- **What counts as a failure** — the parameter that most needs thought in an LLM
  context. Timeouts count. 5xx counts. Does 429 count? Does a parse failure
  count? Recommended: **429 counts** (it means back off); **poor content quality
  does not** — that is the verifier's job, not the breaker's.

Instrument the state transitions (`onBreak`, `onReset`, `onHalfOpen`) with
metrics. Most implementations skip this, and it is what makes a breaker
observable rather than a silent black box.

## Fallback chain

The breaker handles stopping; the fallback chain handles what happens next.
Design it in explicit levels:

```
Level 0   preferred model (best, most expensive)
   |  failure / breaker open
Level 1   equivalent-capability alternate model (different provider - removes the single point)
   |
Level 2   degraded model (cheaper / faster, acceptable quality)
   |
Level 3   non-model fallback (cached result / rule engine / fixed response / route to human)
```

**Every level must independently deliver value.** Degradation is not "try a few
more times"; it is **trading quality for availability**.

**Level 3 must not depend on any model.** If the last hop is still an LLM, the
whole chain fails together when every provider rate-limits simultaneously.
Typical Level 3 options: return a cached similar result, fall back to keyword
rules, or state plainly that the request cannot be handled and route to a human.
That last one looks weak, but it is honest and produces no wrong consequences.

Audit checklist for an existing chain: **is the final hop genuinely
model-independent?**

## Rate limiting, bulkheads, backpressure

Three patterns commonly conflated; they solve three different problems.

| Pattern | Solves | Implementation |
| --- | --- | --- |
| **Rate limiting** | Do not overwhelm upstream / do not exceed budget | Token bucket. **In LLM contexts, limit by tokens, not by request count** |
| **Bulkhead** | One runaway task must not sink the others | Independent concurrency slots / connection pools per task class, non-encroaching |
| **Backpressure** | When downstream cannot keep up, slow upstream rather than accumulate | **Bounded** queue; when full, reject or block — never buffer without limit |

**LLM-specific trap: limiting by request count is wrong.** A 500-token request
and a 100k-token request differ 200x in pressure on the provider but look
identical to a QPS limiter. The result is a limiter reporting "well under the
cap" while upstream returns 429.

Correct approach: **debit the bucket by an estimated token count** — estimate
input plus expected output before sending, debit, then reconcile against actual
usage when it returns.

Audit checklist for an existing wait queue: **is it bounded?** An unbounded queue
is the classic backpressure anti-pattern — it converts "reject" into "wait
indefinitely", which eventually becomes memory exhaustion.

## Three LLM-specific traps

### Trap 1 — retry semantics are ambiguous

Retrying a traditional service means "send the same request again, expect the
same result." An LLM may return something completely different. Two
consequences:

- You cannot tell whether success means "upstream recovered" or "this roll was
  lucky."
- If the first call **already produced side effects** (called tools, wrote data),
  the retry repeats them.

**Remedy: separate generation from execution.** The generation phase is a pure
function and can be retried freely. Once execution begins, protect it with an
**idempotency key** — the same logical operation carries the same key, and a
repeat execution returns the previous result instead of acting again.

### Trap 2 — partial success

The agent called five tools; the third failed. The side effects of the first two
already happened. **Retrying the whole task is wrong** — it repeats those two
actions.

Two remedies, chosen by the nature of the actions: **idempotency** (repetition is
harmless) or **compensation** (execute reverse operations for the first two). See
rollback in `observability-audit.md`.

### Trap 3 — failure masked by success

The most insidious. The call returns 200, the format is valid, and the content is
fabricated because the model found no source and invented one. **From the
reliability system's perspective the call succeeded completely.**

Circuit breakers, retries and fallbacks cannot detect this class. **Only a
verifier can.** This is why reliability patterns and verification must ship
together:

> **Reliability patterns handle "the call did not go through". Verifiers handle
> "the call went through and the answer is wrong."** Neither substitutes for the
> other; most agent systems build only the first.

## Durable execution

The load-bearing wall of long-running multi-agent graphs, and the most
substantive recent technical progress in the area.

**Session memory is not durable execution.** Conversation history cannot prove
which commands actually ran, and cannot guarantee a retry will not duplicate
side effects.

### Converged primitives

| Primitive | Purpose |
| --- | --- |
| **Event history / step log** | Reconstruct completed work after a crash |
| **Persisted step results** | Prevent re-executing an LLM or tool call |
| **Durable timers** | Support waits of hours or days without a live process |
| **External event waits** | Model human approvals and async callbacks |
| **Idempotency keys** | Prevent retries from producing duplicate side effects |
| **Sub-workflows** | Split a plan into independently recoverable units |

### How the main frameworks do it

| Framework | Mechanism |
| --- | --- |
| **Temporal** | **Deterministic replay**: workflow code must be deterministic; nondeterministic work (LLM calls, API requests, writes) moves into Activities; after a crash the event history is replayed to rebuild state |
| **LangGraph** | Checkpoint saved at **every superstep**, organized by thread; supports memory, crash recovery, state history, time travel, human intervention |
| **Restate** | Lighter checkpointing (durable steps in a `ctx.run` style) with built-in idempotency keys and awakeable callbacks |
| **Inngest** | Step memoization: each `step.run` result is persisted; a re-run skips completed steps |

The current framing treats an agent run as **a durable graph execution**, not a
Python function call.

### High-risk side effects need transactional boundaries

For shell commands, file writes, opening PRs, sending email, charging money:

1. **Record the intent before executing.**
2. **Execute through an idempotency wrapper** (the standard model is a payment
   processor's idempotency key).
3. **Record a receipt on success.**
4. **Check the receipt before retrying** to prevent duplication.

**Outbox pattern:** write local state and intent **atomically together**, then
dispatch separately, so "wrote it but crashed before sending" cannot produce a
duplicate.

### Approval must be a durable event

The most commonly missed requirement. An approval record must contain:

- **Who, and when**
- **Exactly which artifact was approved** — with a version hash
- **The decision and any attached constraints**
- **Validity policy**
- **Whether the approval remains valid after replay, or must be re-requested**

> Treat approval as **a durable event in the execution log**, not a transient
> prompt response.

### Version drift

Agents are unusually fragile here: the original run and the recovery run can
diverge. Record:

- Model identifier and inference parameters
- Prompt version / content hash
- Tool schemas and version hashes
- Runtime / sandbox image version
- Policy rule version

**These version records are part of replay correctness, not merely observability
data.**

### Retry storms

Multi-agent coordination amplifies crash risk across service boundaries. Set a
global retry budget and circuit breaker **at the run level**, not only per HTTP
client, or retries cascade and multiply through nested loops.

### The honest cost

This section reads like a distributed-systems textbook because it is one. **That
is what "adopting a graph" actually costs:** you did not add a few nodes, you
upgraded your system from a running script into a distributed workflow requiring
replay semantics. Do not pay this unless rung 5 of the escalation ladder is
genuinely triggered — the work crosses processes, must survive crashes, or
involves human waits measured in hours.
