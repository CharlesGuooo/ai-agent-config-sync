# Verification and Closed Loops

## What actually counts as a closed loop

"Being able to call tools several times in a row" is a loop, not a closed loop.
The difference is the fourth step.

```
OPEN (a loop only)                CLOSED
  perceive                          perceive
  decide                            decide
  act                               act
  (nobody checks the result)        verify
                                    correct / terminate
                                    ^ returns carrying WHAT WAS WRONG,
                                      not just "try again"
```

> **Closed loop = loop + verification + informed correction.** All three words
> are required, especially "informed": if a retry re-sends the same input, that
> is not correction, that is rolling dice. Real correction feeds **what was
> wrong last time** back in as input.

## Verifier tiers, ordered by reliability

The single most consequential decision when designing a closed loop: what does
the verifying. Work strictly top-down; never use a lower tier where a higher one
applies.

| Tier | Verifier | Examples | Reliability |
| --- | --- | --- | --- |
| **L1** | **Deterministic check** | JSON schema validation, type check, compile, unit tests, "does this SQL execute" | Highest — zero hallucination |
| **L2** | **Rule / constraint check** | Value within range, required fields present, state transition legal, budget not exceeded | High |
| **L3** | **Model as judge** | A second model scores the output across dimensions against thresholds | Medium — guard against preference bias |
| **L4** | **Human** | Approval gate, sampled review | Highest, but most expensive |

**The most common design error is using L3 where L1 applies.** "Check whether the
generated SQL is correct" is frequently written as a prompt asking a model to
judge, when running `EXPLAIN` against the database returns a definitive answer.
Every tier downward introduces one more unreliable component.

**The inverse error: forcing L3 where L4 is required.** Any action that is
irreversible or carries financial or safety consequences must have a human gate,
no matter how accurate the model scoring is.

### Layered verification

Where a single check is insufficient, layer them rather than reaching for a
stronger judge:

```
format  ->  constraints  ->  semantics  ->  end-to-end
(L1)        (L2)             (L3)           (L1/L4)
parses?     in range?        means the      does the whole
            required         right thing?   thing actually work?
            fields?
```

MAST's "incomplete verification" failure is precisely stopping at the first
layer: the JSON parses, so it passes, while nobody checked the content.

## Worked shape: Evaluator-Optimizer

A standard closed loop, with the four things that make it work:

```
   produce artifact
        |
        v
   score on N independent dimensions   <- verifier sees ONLY the artifact
        |
        v
   threshold decision
        |
    +---+------------------+---------------------+
    |                      |                     |
  >= high              mid band              < low
  pass              conditional pass    map defect type -> specific parameter
                                        |
                                        v
                                jump back to the named stage and re-run
                                (damping factor, attempt cap, fail-open on
                                 verifier outage)
```

Four properties that make it correct:

1. **The verifier runs on clean context** — it sees only the produced artifact,
   never the generation parameters. This structurally prevents verifier
   dereliction.
2. **Correction is informed** — not "run it again", but **defect type mapped to a
   specific parameter change**. Each failure category has a designated remedy.
3. **There is damping** — a coefficient below 1 on each correction's magnitude,
   preventing parameters from oscillating between two extremes.
4. **There is termination and degradation** — a hard attempt cap that force-passes
   afterwards, and a defined behaviour when the verifier itself fails.

A common gap in this shape: hard thresholds with no record of **whether the
correction actually improved the score**. Adding "abandon early if this
correction did not raise the score" saves a wasted re-run. This is
**no-progress termination**.

## Three boundaries every closed loop must define

### 1 — Termination: what counts as enough

The most dangerous failure of a closed loop is **not terminating**. At least
three independent stops, any of which fires:

```python
while True:
    result = execute(plan)
    verdict = verify(result)

    if verdict.passed:              break   # 1 success
    if attempts >= MAX_ATTEMPTS:    break   # 2 attempt cap      (hard stop)
    if cost_spent >= BUDGET:        break   # 3 budget cap       (hard stop)
    if verdict.score <= last_score: break   # 4 no progress -> abandon early

    plan = revise(plan, verdict.defects)    # informed correction
    attempts += 1
    last_score = verdict.score
```

**Stops 2 and 3 are mandatory and must live in code, not in the prompt.** A model
agreeing to try at most three times is not a cap.

### 2 — Oscillation: two corrections cancelling each other

Typical symptom: round one judges "too bright" and darkens; round two judges "too
dark" and brightens; it ping-pongs. Three remedies, usable together:

| Remedy | Mechanism |
| --- | --- |
| **Damping** | Multiply each correction's magnitude by a coefficient below 1 |
| **Memory** | Record parameter combinations already tried; never repeat one |
| **Monotonic constraint** | Allow adjustment of a given dimension in one direction only |

### 3 — Verifier failure: what happens when the checker breaks

The most frequently forgotten boundary. The judge model times out or returns 429.
The system must have a defined behaviour:

| Strategy | Behaviour | Fits |
| --- | --- | --- |
| **fail-open** | Let it through, tag it "unverified" | Low-risk output where the cost of a bad pass is a re-run |
| **fail-closed** | Reject, the task fails | High-risk actions: refunds, deletions, publishing |
| **degrade** | Fall back to L1/L2 deterministic checks | **Best when a deterministic fallback exists** |

> The choice follows from which is worse: **wrongly passing or wrongly
> blocking.** A poor-quality rendered image means the user regenerates —
> acceptable — so fail-open. A mistakenly issued refund is irreversible, so
> fail-closed. Write this judgement explicitly into the design document.

Do not confuse two distinct cases: **a guard failing open** (a guard that
interrupts legitimate work is worse than no guard) and **a high-risk action
failing closed**. They coexist without contradiction.

## Reconciliation loops

Everything above is an in-task closed loop. There is a second, frequently
overlooked kind: the **reconciliation loop** — periodically scan system state,
detect deviation from the intended state, and correct it. This is the core idea
of Kubernetes controllers and it applies to agent systems.

Shape: **scan → find things that should have happened but did not → execute a
compensating action.** Typical instances: expire unpaid orders, enforce
deadlines, send reminders, expire vouchers and points, clean up records pending
deletion.

Identical in structure to a task closed loop; the trigger source changes from "a
task" to "the clock". In an agent system this class of backstop loop is what
catches the things the main flow dropped, and it is worth a great deal.

## Verification and reliability are different jobs

The most important division to keep straight, and where most agent systems have
a hole:

| | Handles | Catches |
| --- | --- | --- |
| **Circuit breaker / retry / fallback** | **Infrastructure failure** | "The call did not go through" |
| **Verifier** | **Semantic failure** | "The call went through and the answer is wrong" |

A model call that returns 200 with well-formed output whose content was invented
is, from the reliability system's point of view, a complete success. Circuit
breakers, retries and fallbacks cannot see it. **Only the verifier can.**

Neither substitutes for the other. Most agent systems build only the first.
