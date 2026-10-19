# Loop Design — one agent

## The loop, stripped of packaging

```
while not done:
    response = call_llm(messages)
    if response has tool_calls:
        results = execute_tools(response.tool_calls)
        messages.append(results)
    else:
        done = True
return response
```

That is the whole thing. Agents are simple to implement; the difficulty is
entirely in the surrounding decisions.

The academic origin is ReAct (Yao et al., 2022): interleave reasoning and acting
in one prompt-driven loop — think about why, act, observe the result, think
again.

**The five-stage model (Perceive → Reason → Plan → Act → Observe) is a
description, not a design.** It describes what you observe once the loop runs;
it names no decision. Nobody implements a "Perceive stage" — perceiving is
appending a message to an array. A framework that cannot tell you what decision
to make next is taxonomy, not engineering. The actual decisions follow.

## The five design decisions

Every one must be written down. None may be left to the agent's improvisation.

### Decision 1 — stop criteria (what "done" means)

All three categories must be defined:

| Type | Content | Example |
| --- | --- | --- |
| **Success** | Machine-verifiable pass condition | "All unit tests pass", "lint reports no errors", "output validates against the JSON schema" |
| **Failure** | Hard abandonment trigger | "Max iterations reached", "3 consecutive rounds with no diff", "critical tool failed N times in a row" |
| **Escalation** | Who takes over when stuck | "Enter the triage inbox and wait for a human", "hand to another agent", "roll back and alert" |

A good goal is specific enough to evaluate ("all unit tests pass" is good;
"make the app better" is worthless), decomposes into testable subtasks, and is
scoped tightly enough that the agent does not invent adjacent work.

Defining only the success condition produces a loop that either runs forever or
stops arbitrarily.

### Decision 2 — tool surface (what the agent can move)

Classify every tool by side effect:

| Type | Purpose | Examples | Key property |
| --- | --- | --- | --- |
| **Data** | Acquire context | read file, database query, vector search, web search | Read-only, parallelizable, cacheable, freely retryable |
| **Action** | Cause side effects | write file, call external API, run shell, send message | **Not freely retryable** — needs an idempotency key |
| **Orchestration** | Invoke other agents | dispatch subtask, spawn subagent | Most expensive; amplifies token usage |

The value of the classification is that it forces you, at design time, to mark
which operations cannot simply be retried. This becomes load-bearing under
durable execution: Data can be replayed freely, Action must be idempotency-keyed
or crash recovery re-sends the email and re-opens the PR.

**Tool granularity rule:** start with a broad shell tool for reach, then promote
specific actions to dedicated tools when the harness needs to intercept, render,
audit, or parallelize them. A shell tool gives maximum reach but hands the
harness an opaque command string; a `send_email` tool gives the harness typed
arguments it can gate on. **The criterion for promotion is reversibility** —
actions that are hard to undo deserve dedicated tools.

### Decision 3 — context budget (what goes in each round, what gets cut)

Context grows every iteration. Unmanaged, it either hits the token ceiling or
dilutes the model's attention with early noise.

Three strategies:

- **Compress** — condense prior iterations into compact working memory rather
  than stacking raw transcript.
- **Structure** — record "what was tried, what happened" in a fixed format
  instead of scattering it through the conversation.
- **Prune** — drop irrelevant old tool output before each new iteration.

Modern APIs provide these as primitives: context editing (**delete** old tool
results and thinking blocks — deletion, not summarization), compaction
(server-side summarization of early history when approaching the limit), and a
memory tool (cross-session persistence to a memory directory). Long-running
agents typically use all three.

A large context window does not remove the need. A 1M-token window does not mean
1M useful tokens: longer context dilutes attention toward early irrelevant
material, and every round pays for the entire history. Prompt caching reduces
the cached prefix to roughly 0.1x cost, but only while the prefix bytes are
byte-identical.

### Decision 4 — failure and escalation

Errors are the normal case, not the exception.

| Error type | Signature | Handling |
| --- | --- | --- |
| **Recoverable** | Syntax error, missing import, failing test, transient 500 | Retry **with a different strategy** |
| **Hard block** | Missing credential, insufficient permission, nonexistent dependency, self-contradictory requirement | Escalate immediately, **do not retry** |

Iron rule: never retry the same failing action indefinitely. If the second
attempt uses the same strategy as the first, that is spinning, not learning.

### Decision 5 — where state lives on disk

This is the spine of the loop.

**The model forgets everything between calls. Memory must be on disk, not only
in context.**

Deliberately plain forms work: a markdown checklist in the repo, a JSON file
beside it, a task board, a SQLite database. Pick one; every run reads it at
start and appends to it at end.

This is the only way a loop survives process crashes, context resets, and being
killed at 3am. Without it the loop is amnesiac: you pay for N days and receive
the same day repeated N times.

## The three gates

Install these **at the same time as the loop**, never afterwards.

| Gate | What it does | Consequence of omitting |
| --- | --- | --- |
| **Iteration cap** | Hard maximum rounds | The loop spins forever on a failure path |
| **Diff check (no-progress detection)** | Kill the run after N consecutive rounds with no change | Endless "tweaking" in a dead direction |
| **Spend cap** | Hard ceiling in tokens or currency | Wake up to a several-hundred-dollar bill |

A documented runaway: an agent deployed to scrape and summarize a site; the
target's structure changed and the scraping tool returned empty; the agent had
no hard stop and a prompt telling it to retry until it got data. It called the
broken tool **400 times in 5 minutes**, burned thousands of tokens, and stopped
only on a platform rate limit. All three gates were absent; any one of them
would have caught it.

Ordering matters. "Write the loop, then add gates" is wrong because you never
know in advance which run is the runaway one, and the cost is asymmetric.

## Inner loop and outer loop

The agent owns the inner loop. The human owns the outer loop.

```
+------------------------- OUTER LOOP (human) --------------------------+
|                                                                       |
|   Constraints      Sampling        Audit          Ownership           |
|   (what input)   (which outputs) (what evidence) (ships or not)       |
|        |               ^              ^               ^               |
|        v               |              |               |               |
|   +------------- INNER LOOP (agent) --------------+                   |
|   |  investigate -> implement -> verify -> repeat |                   |
|   |  produces: capability + evidence              |                   |
|   +-----------------------------------------------+                   |
|                                                                       |
+-----------------------------------------------------------------------+

        Evidence crosses the boundary. Decisions do not.
```

**Inner loop (agent's territory)** — investigate the task, implement, verify,
repeat. Output is capability and evidence.

**Outer loop (human's territory)** — four sub-loops:

| Sub-loop | The decision it owns |
| --- | --- |
| **Constraints** | What input, what instructions, what boundaries |
| **Sampling** | Which outputs get inspected (you cannot inspect all of them) |
| **Audit** | What evidence is retained, and for how long |
| **Ownership** | What reaches production — the signing loop |

Three linked concepts:

1. **Quality** — pre-ship checks and guardrails; their product is *evidence*.
2. **Verdict** — the production decision, made by a human.
3. **Answerability** — the guarantee that a decision can be explained and
   traced: someone must be able to state what changed, why it is safe, and what
   happens if it is wrong.

Agents can select, route, merge and escalate within policy, but they cannot
inherit consequences. Without accountability there is no rule.

## Autonomy levels L0–L5

| Level | Name | Behaviour | Verification mode | Main risk |
| --- | --- | --- | --- | --- |
| **L0** | Assist | Suggests; human approves before anything moves | Local visual inspection | Almost none |
| **L1** | Supervised Action | Edits/executes on your behalf, asks before each consequential action | Per-item confirmation | **Approval fatigue** — every request looks identical, you start clicking yes |
| **L2** | Scoped Task Delegation | Bounded work with explicit goals and constraints | Shifts from watching to reading measurable evidence (tests, type checks) | Poorly defined boundaries |
| **L3** | Goal-Driven Autonomy | Pursues a goal until conditions are met | Requires a **measurable** stop condition | A vague goal ("improve UX") guarantees drift |
| **L4** | Parallel Delegation | Multiple isolated agents on different task slices | Independent verification per slice + merge check | **Bad slicing** → merge conflicts, duplicated work |
| **L5** | Managed-by-Exception | Define success criteria and policy; a manager agent dispatches, monitors, escalates only on exception | Exceptions and sampling only | This is the continuous-factory shape |

As autonomy rises supervision falls, but the human always retains four duties:
setting direction (roughly 70% of planning decisions), verifying evidence,
detecting drift, and approving escalations. The mature posture is **calibrated
autonomy**: match autonomy to the task's risk and reversibility.

### Back-pressure principle

> **Grant a loop only the autonomy you can verify cheaply and reliably. Not one
> inch more.**

A loop may run unattended ("lights off") only when all four hold:

- **Checks are cheap and frequent** — seconds per run, not tens of minutes.
- **The verdict is immediate and drift-resistant** — the result does not decay
  quietly with the environment.
- **Pass/fail is unambiguous** — a type checker, property test, or rubric acts as
  an oracle; "seems fine" does not qualify.
- **The loop is short** — 3 to 20 steps. Beyond that context degrades.

Four out of four: lights off. Three out of four: lights stay on.

### Open vs closed loop (orthogonal to L0–L5)

| Dimension | Open loop | Closed loop |
| --- | --- | --- |
| Philosophy | Trade structure for coverage | Trade freedom for predictability |
| Agent freedom | Given a goal and boundaries, picks its own path | Steps, checks and stop conditions are pre-set |
| Fits | Prototyping, unknown territory | Production, work with a rubric |
| Cost | Burns tokens fast | Predictable running cost |

Default to closed until you hit a task it cannot handle (typically "I do not yet
know what I am looking for"), then open a loop to explore.

L0–L5 describes **how far the human has stepped back**; open/closed describes
**how far the path is pre-specified**. They are independent axes.

## Four loop patterns

| Pattern | How it runs | Fits | Trap |
| --- | --- | --- | --- |
| **Retry** | Try, fail, try again | Short tasks with a clear pass/fail (write a function until tests pass; run a query until it returns rows) | Retrying the same action without changing strategy — spinning, not learning |
| **Plan-Execute-Verify** | Produce the plan first, execute step by step, verify each step | Multi-step, order-sensitive work where an early error cascades (refactoring a module, standing up a service) | Loyalty to a bad plan — when step 2 reveals the plan is wrong, **revise the plan**, do not push through |
| **Explore-Narrow** | Try several paths in parallel or in series, select based on intermediate results | Debugging unknown errors, exploring an unfamiliar API, performance tuning | Context explosion — parallel paths are expensive, prune early |
| **Human-in-the-Loop** | Pause when confirmation is needed | Requirements that cannot be fully stated up front, production changes, expensive mistakes | Interrupting too often — asking about every small decision saves nobody time (this is L1 approval fatigue) |

**Default to Plan-Execute-Verify.** It covers roughly 80% of everyday cases:
Retry is too simple, Explore-Narrow too expensive, Human-in-the-Loop too tiring.

**Where these meet graph patterns:** when Explore-Narrow's parallel paths start
bursting a single agent's context, it should become a fan-out. When
Human-in-the-Loop's pause must survive across processes and hours, it should
become an interrupt plus a checkpointer. The pattern does not change; the
structure carrying it does. That is how a loop grows into a graph.

**Plan-and-Execute with a parallel DAG:** a planner emits the full decomposition
once, an executor runs each subtask, a re-planner adjusts on deviation. Making
the task flow an explicit DAG with marked dependencies enables parallel
execution; the original LLMCompiler paper (Kim et al., ICML 2024) reports ~3.6x
speedup over sequential ReAct. This is the transitional form between loop and
graph: already a DAG, but with no cycles, no persistence, no human gates. Note
that production agent graphs are usually *not* DAGs — they need retries and
revisions — so this fits tasks with clear dependencies and no need to go back.

## Six building blocks, mapped to the decisions

Do not memorize these as six parallel nouns; hang each on the decision it serves.

| Block | Serves | Role in the loop |
| --- | --- | --- |
| **Automations** | (the loop's heartbeat) | Scheduled discovery and triage of tasks |
| **Worktrees** | Decision 4 (failure isolation) | Parallel tasks do not collide on files |
| **Skills** | Decision 3 (context budget) | Project knowledge stored outside the conversation, not re-derived each session |
| **Connectors / MCP** | Decision 2 (tool surface) | Lets the loop touch the real world |
| **Sub-agents** | Decision 1 (stop criteria) | **Independently verify that "done" holds** |
| **State** | Decision 5 (state location) | Memory across runs |

**Automations** — without a heartbeat you have a one-off task, not a loop.
Mechanisms include recurring-interval reruns, scheduled tasks/cron, lifecycle
hooks that fire shell commands at defined points, and CI pipelines that keep
running after the laptop closes. Two useful primitives are distinct: *rerun on a
frequency* versus *run until a condition is satisfied* (the latter supports
pause/resume). The important design detail in the second: **an independent model
judges "done" after each round — the model that writes is not the model that
grades.** Keep automations maintainable by invoking a named skill rather than
pasting a wall of instructions into the schedule, which nobody will update.

**Worktrees** — once more than one agent runs, files collide. A git worktree
gives each agent an independent working directory and branch on the same repo
history, so one agent's edits physically cannot touch another's checkout. This
solves *mechanical* collision only; review bandwidth, not tooling, caps how many
agents can usefully run.

**Sub-agents** — the single most useful structure inside a loop. The model that
wrote the code grades its own homework too generously. A second agent, with
different instructions, **clean context**, and sometimes a different model,
catches what the first talked itself into. This is the one multi-agent pattern
that is consistently effective across domains. A reviewer subagent using a
smaller model at high reasoning effort is often both cheaper and stricter than a
large model at low effort, because it has no position to defend. Subagents burn
more tokens (each runs its own model and tools), so spend them where a second
opinion is worth paying for.

**Connectors / MCP** — a loop that can only see the filesystem is a small loop.
MCP is a cross-vendor standard, so a connector written for one agent generally
works in another. This is the difference between an agent saying "here is the
fix" and a loop that opens the PR, links the ticket, and posts to chat when CI
goes green.

## Cost

| Shape | Token multiple | Production requirement | Source strength |
| --- | --- | --- | --- |
| Standard single conversation | 1x | Basic observability | Baseline |
| Single agent loop | ~4x | Structured logging, iteration cap | Secondary, order-of-magnitude only |
| Multi-agent system | **3–10x (typical)** | Full observability + strict budget + detailed tracing | **Primary (Anthropic)** |
| Anthropic's own Research system | ~15x | — | Primary, **special case** |

The 15x figure is one highly parallel, exploratory deep-research workload, not a
general baseline. Treating it as a law causes two bad decisions: refusing
multi-agent out of fear, or budgeting at 15x and wildly over-estimating. From
the same source, a more useful number: **token usage alone explains ~80% of
performance variance.**

Architectural cost controls (build them in, do not bolt them on):

- **Prompt caching** — cached prefix bills at roughly 0.1x. It is **prefix
  matching**: change one byte and everything after it invalidates. So no
  timestamps, UUIDs or session ids in the system prompt; sort the tool list
  deterministically; do not swap models or tool sets mid-run.
- **Plan-and-execute** — front-load planning, reduce per-step reasoning calls.
- **Cache frequently repeated tool results.**
- **Per-run token/cost budget** — the third gate.

A real-world illustration of the failure mode: an organization exhausted its
annual AI budget in four months and imposed a per-person, **per-tool** monthly
cap — engineers using two tools therefore retained double the allowance. It also
ran an internal leaderboard of agent usage, creating a cultural incentive to
consume more tokens and accelerating the burn. **Making token usage a
performance metric is a textbook Goodhart failure**: you want problems solved,
you measure tokens consumed, so you get tokens consumed.

## Security posture

An agent is inherently dangerous: it can make wrong decisions, it can be
exploited by prompt injection, and its tool calls have real side effects.
Requiring confirmation for every command is safe but destroys its ability to
brute-force a problem. Approving everything by default frees the agent and
releases the tiger.

Three risk classes: a bad shell command destroys something important; data
exfiltration (someone steals files or secrets the agent can see); the machine is
used as an attack proxy.

| Posture | Implementation | Residual risk |
| --- | --- | --- |
| **Container sandbox** | Docker or equivalent, restricted files, secrets and network | Container escape exists but is acceptable for most |
| **Someone else's computer** | Cloud dev environment / hosted agent environment | A runaway agent burns someone else's CPU |
| **Unsandboxed** | Nothing, hope no malicious instruction is encountered | Hope you notice before it matters |

The recommended form of skip-confirmation mode is to run it **inside a
network-isolated container**.

### Credential scoping

Control which credentials are exposed, not just which commands:

- **Prefer staging credentials** — damage stays bounded.
- **Any credential that can spend money must carry a budget cap.**

Reference practice: for a one-off investigation into cold-start times, create a
dedicated cloud organization for that investigation only, set a $5 budget, issue
an API key scoped to creating and modifying apps *within that organization
only*, then let the agent run. **The point is not the $5 — it is building a
disposable permission boundary for a disposable task.** The same principle
reappears at enterprise scale as per-node virtual accounts and budgets.

## Loop failure modes — quick reference

| Symptom | Root cause | Fix |
| --- | --- | --- |
| Runs forever, never stops | Only a success condition, no failure condition | Iteration cap; express "done" as a machine-checkable criterion |
| Tweaks the same spot repeatedly | No no-progress detection; retry strategy identical to last time | Diff check; on failure force a different strategy |
| Starts producing nonsense mid-run | Context bloat; early noise dilutes attention | Prune old tool output; enable context editing / compaction |
| Grades its own work, everything green but useless | Verifier is the same model on the same context | Independent verifier on clean context; **hard-code "you must actually run the tests" in the prompt** |
| Forgot everything by the next day | State lives only in context, not on disk | State file; every run reads it and writes it |
| After crash recovery, duplicate emails / duplicate PRs | Action-class tools have no idempotency key | See durable execution in `reliability.md` |
| Hundreds of dollars overnight | No spend cap | The three gates ship with the loop |
| Prompt injection made it run something it should not | Model was allowed to decide routing; credential scope too wide | Move routing into code; scope credentials |
| Approval prompts became numbing, started auto-approving | Stuck at L1, every request looks the same | Move to L2 (bounded work + measurable evidence) or tier approvals by risk |

## A framework-free minimal loop

All five decisions and all three gates made explicit in code. Runs offline with
a deterministic stub model; swap `call_model` for a real API call to go live.

```python
"""
minimal_loop.py - an agent loop with no framework dependency.
Five design decisions + three gates, all explicit.
"""

import json
import pathlib
import subprocess

# --------------- Decision 5: where state lives on disk ---------------
STATE_PATH = pathlib.Path("loop_state.json")


def load_state() -> dict:
    if STATE_PATH.exists():
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    return {"runs": 0, "history": []}


def save_state(state: dict) -> None:
    STATE_PATH.write_text(
        json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8"
    )


# --------------- Decision 2: tool surface (Data / Action split) ---------------
def tool_read(path: str) -> str:                      # Data: read-only, freely retryable
    return pathlib.Path(path).read_text(encoding="utf-8")


def tool_write(path: str, content: str) -> str:       # Action: side effect
    pathlib.Path(path).write_text(content, encoding="utf-8")
    return f"wrote {len(content)} bytes to {path}"


def tool_run_tests() -> tuple[bool, str]:             # Data: probes the world read-only
    proc = subprocess.run(
        ["python", "-m", "pytest", "-q"],
        capture_output=True, text=True, timeout=120,
    )
    return proc.returncode == 0, (proc.stdout + proc.stderr)[-2000:]


TOOLS = {"read": tool_read, "write": tool_write, "run_tests": tool_run_tests}


# --------------- The three gates ---------------
MAX_ITERATIONS = 8          # gate 1: iteration cap
NO_PROGRESS_LIMIT = 3       # gate 2: kill after N rounds with no change
MAX_SPEND_USD = 0.50        # gate 3: spend cap

PRICE_IN, PRICE_OUT = 5.0 / 1e6, 25.0 / 1e6   # per-token input / output price


def call_model(messages: list[dict]) -> dict:
    """
    Returns {"text": str, "tool_calls": [...], "in_tokens": int, "out_tokens": int}

    Live version:
        import anthropic
        client = anthropic.Anthropic()
        r = client.messages.create(
            model="claude-opus-5",
            max_tokens=16000,
            tools=TOOL_SCHEMAS,
            messages=messages,
        )
        return {
            "text": "".join(b.text for b in r.content if b.type == "text"),
            "tool_calls": [b for b in r.content if b.type == "tool_use"],
            "in_tokens": r.usage.input_tokens,
            "out_tokens": r.usage.output_tokens,
        }

    Offline: a deterministic stub that demonstrates the loop mechanics.
    """
    turn = sum(1 for m in messages if m["role"] == "assistant")
    if turn == 0:
        return {"text": "Inspect the current implementation.",
                "tool_calls": [("read", {"path": "target.py"})],
                "in_tokens": 800, "out_tokens": 60}
    if turn == 1:
        return {"text": "Fill in the missing branch.",
                "tool_calls": [("write", {"path": "target.py",
                                          "content": "def add(a, b):\n    return a + b\n"})],
                "in_tokens": 1200, "out_tokens": 90}
    if turn == 2:
        return {"text": "Run the tests.", "tool_calls": [("run_tests", {})],
                "in_tokens": 1400, "out_tokens": 40}
    return {"text": "Tests pass, task complete.", "tool_calls": [],
            "in_tokens": 1500, "out_tokens": 30}


def run_loop(goal: str) -> dict:
    state = load_state()
    state["runs"] += 1

    messages = [{"role": "user", "content": goal}]
    spend = 0.0
    last_snapshot = None
    stale_rounds = 0

    for i in range(1, MAX_ITERATIONS + 1):
        resp = call_model(messages)
        spend += resp["in_tokens"] * PRICE_IN + resp["out_tokens"] * PRICE_OUT

        # -- gate 3: spend cap --
        if spend > MAX_SPEND_USD:
            return finish(state, "spend_cap", f"iter {i}, ${spend:.4f}")

        messages.append({"role": "assistant", "content": resp["text"]})

        # -- Decision 1: no tool calls means the model believes it is done --
        if not resp["tool_calls"]:
            ok, out = tool_run_tests()          # but we do not believe it; verify independently
            if ok:
                return finish(state, "success", f"iter {i}, ${spend:.4f}")
            # claimed done but verification failed -> feed real evidence back, continue
            messages.append({"role": "user",
                             "content": f"Tests did not pass, not complete:\n{out}"})
            continue

        # -- execute tools --
        results = []
        for name, args in resp["tool_calls"]:
            try:
                out = TOOLS[name](**args)
                results.append(f"{name} -> {out}")
            except Exception as e:
                # -- Decision 4: recoverable vs hard block --
                if isinstance(e, (PermissionError, FileNotFoundError)):
                    return finish(state, "escalate", f"{type(e).__name__}: {e}")
                results.append(f"{name} -> ERROR: {e}")   # recoverable: let the model change strategy
        messages.append({"role": "user", "content": "\n".join(map(str, results))})

        # -- gate 2: no-progress detection --
        snapshot = workspace_fingerprint()
        stale_rounds = stale_rounds + 1 if snapshot == last_snapshot else 0
        last_snapshot = snapshot
        if stale_rounds >= NO_PROGRESS_LIMIT:
            return finish(state, "no_progress", f"{stale_rounds} rounds unchanged")

    # -- gate 1: iteration cap --
    return finish(state, "iteration_cap", f"{MAX_ITERATIONS} rounds used, ${spend:.4f}")


def workspace_fingerprint() -> str:
    """Coarse fingerprint of the workspace - used to detect real movement."""
    parts = []
    for p in sorted(pathlib.Path(".").glob("*.py")):
        parts.append(f"{p.name}:{p.stat().st_size}")
    return "|".join(parts)


def finish(state: dict, outcome: str, detail: str) -> dict:
    # Decision 5: append state at the end of every run so the next run can read it
    state["history"].append({"outcome": outcome, "detail": detail})
    save_state(state)
    print(f"[loop] {outcome}: {detail}")
    return {"outcome": outcome, "detail": detail}


if __name__ == "__main__":
    run_loop("Make add() in target.py pass its tests")
```

The load-bearing line is in the `if not resp["tool_calls"]` branch. When the
model says "tests pass, task complete", **the code does not believe it** — it
runs `tool_run_tests()` itself. That is the minimal form of "done is a claim,
not a proof" and of separating the writer from the checker. No second model is
required; a deterministic check suffices.

**Anything a deterministic check can verify should not be verified by a model.**
That is the determinism budget applied to verification.
