# Templates, Numbers, Sources

## Loop design template

Fill this in before building any loop. **The blanks you cannot fill are the
places it will fail.**

```
[GOAL] one sentence: ______________________________________

[DECISION 1 - STOP CRITERIA]
  success   = _______________________  (must be machine-verifiable)
  failure   = max ___ iterations / ___ consecutive rounds unchanged / ___ failures
  escalate  = hand off to ______________________

[DECISION 2 - TOOL SURFACE]
  Data (read-only, replayable):        _________________________
  Action (side effects, needs idempotency key): _________________
  Orchestration (invokes other agents): _________________________

[DECISION 3 - CONTEXT BUDGET]
  per-round ceiling ___ tokens; on overflow: compress / prune / compact
  content always retained: ______________________

[DECISION 4 - FAILURE AND ESCALATION]
  recoverable errors: ______________________
  hard blocks (stop immediately, no retry): ______________________

[DECISION 5 - STATE]
  lives where: ______________  read by: ______________
  written when: ______________

[THE THREE GATES]
  iteration cap = ___   diff check = ___ rounds   spend cap = $___

[AUTONOMY] L__, justification via back-pressure: ______________________
```

## Graph design template

```
[WHY A GRAPH] (tick at least one, otherwise stay on a loop)
  [ ] true parallelism   [ ] context pollution   [ ] heterogeneity   [ ] auditability / human gate

[THE THREE MULTI-AGENT CRITERIA] (tick at least one)
  [ ] context isolation   [ ] parallelization   [ ] specialization

[ORG GRAPH - long-lived structure]
  resident nodes: ______________________________
  territory of each: ____________________________
  who holds veto over what: _____________________

[WORK GRAPH - runtime]
  what triggers a spawn: ________________________
  spawn limits (count / depth): _________________
  what a spawned node inherits: _________________
  how cancellation rolls back: __________________

[STATE SCHEMA]
  field           type       reducer        written by
  ____________   ________   ____________   ____________
  ____________   ________   ____________   ____________
  ! every field written by multiple branches needs an associative,
    commutative reducer
  ! the field branches write must differ from the field the join writes

[EDGES]
  sequential: ______________________
  parallel (fan-out point): ____________
  conditional (decided by CODE or MODEL?): ____________
  fallback: ______________________
  back edge (which node returns to which on dissatisfaction): ____________

[HUMAN GATE]
  placed on which edge: __________________
  approval record contains: who / when / artifact hash / decision /
                            validity / still valid after replay?

[DURABILITY] (only if rung 5)
  [ ] idempotency keys (which Actions need them)
  [ ] outbox (which state + intent must be written atomically)
  [ ] version records (model / prompt hash / tool schema / image / policy)
  [ ] replay tests (crash deliberately at the worst moment)

[OBSERVABILITY]
  graph_id = ______  run_id = ______  node_id = ______
  attributed per node:  cost [ ]  latency [ ]  failure rate [ ]

[ANCHOR]
  what is forbidden to be rewritten by the optimizing machinery: __________
  paired metrics: optimize ______ / counter ______ / anchored ______
```

## Loop to graph — six-step migration

1. **Get one loop working well first.** Do not start by drawing a graph.
2. **Identify the stress point:** context bloat? self-rubber-stamping? sequential
   execution as the bottleneck? need for a human gate?
3. **Cut nodes only where the work splits naturally.** "Research ≠ writing ≠
   review" is natural. "Writing the feature ≠ writing the tests" is not — it
   produces the telephone game.
4. **Define the inter-node state schema.** Which fields will be written in
   parallel, and what is each one's reducer?
5. **Add explicit routing.** Conditional branches, error handling, fallback edges.
6. **Test fan-in carefully.** This is where data disappears silently — write a
   test asserting that all N branches' results appear in the final state.

## Cost figures and their provenance

| Shape | Token multiple | Source strength |
| --- | --- | --- |
| Standard single conversation | 1x | Baseline |
| Single agent loop | ~4x | Secondary; order of magnitude only |
| **Multi-agent system** | **3–10x (typical)** | **Primary (Anthropic guidance)** |
| One vendor's Research system | ~15x | Primary, but a **special case** |

Two companion figures worth carrying:

- **Token usage alone explains ~80% of performance variance.** Most of any
  multi-agent quality gain is bought with spend, not conjured by topology.
- Reported multi-agent gains (e.g. ~90.2% over single-agent on one internal
  research evaluation) must always be cited **with** the ~15x cost. Quoting the
  gain without the cost misleads the decision.

One reported cost-optimization topology, **Advisor-Orchestrator** — a
high-capability model as the central planning node routing to cheaper models as
workers, then aggregating — is claimed to reach ~92% of the quality at ~63% of
the cost. Single secondary source; treat as an order-of-magnitude hint, never as
a figure in a business case.

## Numbers not to cite

These circulate widely and are wrong, misattributed, or unverified.

| Claim | Problem | Correct statement |
| --- | --- | --- |
| "Multi-agent = 15x tokens" | A special case treated as a law | Typical is **3–10x**; 15x is one vendor's Research system |
| "Multi-agent is 90.2% better" | Missing cost context | Only on one internal research evaluation; it also used ~15x tokens, and tokens explain ~80% of variance |
| "Graph engineering gives +18% accuracy / -85% cost" | Misattributed | Comes from a narrow industrial-drawing study, not a general result |
| "Microsoft replaced RAG with graph engineering" | **False** | GraphRAG is a *form* of RAG, not a replacement |
| "Stanford independently adopted graph engineering" | **Misleading** | Refers to DSPy, which optimizes language-model programs, not knowledge graphs |
| "Anthropic released graph engineering" | **Unverified** | Code-based orchestration is used, but it was never published as a discipline |
| "Graph engineering replaces loop engineering" | **Category error** | Graphs contain cycles by construction; the terms are not alternatives |

Naming history is worth knowing only to avoid over-reading it: prompt
engineering → context engineering → harness engineering → loop engineering →
graph engineering. Two of the posts that popularized "graph engineering" were
jokes about the industry renaming the same practice every few months. The word is
new; the practice is not — graph orchestration frameworks predate the term by
years. Both errors are available: treating it as a paradigm revolution and
rewriting simple loops as complex graphs, or dismissing it as a joke and missing
the cases that genuinely need a graph.

## Terminology map

| Term | Meaning |
| --- | --- |
| harness | The shell around the model: files, tools, memory, skills, sandbox, permissions, observability, recovery |
| determinism budget | The finite amount of nondeterminism a system can afford |
| back-pressure | Grant only the autonomy you can cheaply and reliably verify |
| inner / outer loop | Agent owns investigate-implement-verify; human owns constraints/sampling/audit/ownership |
| verdict | The production decision, made by a human |
| answerability | The guarantee that a decision can be explained and traced |
| calibrated autonomy | Autonomy matched to task risk and reversibility |
| intent debt | The gap an agent fills with confident guesses each cold start |
| verification debt | "Done" claimed but not proved |
| comprehension debt | Gap between code that exists and code anyone understands |
| lit / dark factory | Human judgement retained at key nodes, versus machine-only verification |
| org graph / work graph | Long-lived role topology versus per-execution task topology |
| control graph | Workflow structure and routing rules (as opposed to knowledge graph, execution trace, improvement graph) |
| reducer | The merge rule for a state field written by multiple branches |
| fan-out / fan-in | Split into parallel branches / merge them back |
| barrier | A synchronization point waiting for all branches |
| back edge | An edge returning to an earlier node — the cycle |
| durable execution | Execution that survives crashes via event history and replay |
| idempotency key | A key making a repeated operation harmless |
| deterministic replay | Rebuilding state by replaying a recorded event history |
| version drift | Divergence between the original run and the recovery run |
| compensating action | The reverse operation offsetting an action that cannot be undone |
| structural checkpoint | An approval gate placed where consequences concentrate |
| policy enforcement point | A mandatory checkpoint on the call path the model cannot route around |
| telephone game | Fidelity loss from splitting agents by problem type instead of context |
| early victory | A verifier passing output without adequate testing |
| anchor | An external fixed reference the optimizing machinery may not rewrite |
| frozen node | A deliberately non-tunable element |
| paired metrics | Optimization metric plus counter-metric plus anchored metric |
| grounded / ungrounded | Whether the system retains contact with external reality |
| credential scoping | Restricting which credentials, not just which commands, are exposed |
| progressive disclosure | Loading a Skill as name → body → referenced files |
| context rot | Attention dilution as the window fills with irrelevant material |

## Primary sources

Ranked by strength. Prefer these when citing.

**Vendor guidance and engineering write-ups**
- Anthropic — *Building Effective Agents*: the vocabulary source for the field
  (workflow vs agent, routing, orchestrator-workers, evaluator-optimizer). Its
  central claim runs against the trend: most "agentic" systems should be simple
  workflows.
- Anthropic — *Building multi-agent systems: when and how to use them*: the three
  criteria, 3–10x tokens, telephone game, early victory, split by context.
- Anthropic — multi-agent research system engineering post: 90.2%, ~15x tokens,
  tokens explain 80% of variance. The only public retrospective on a real
  production multi-agent system, valuable for its failure lessons and cost
  candour.
- Anthropic — *Effective context engineering for AI agents*: context rot,
  just-in-time retrieval, compaction, isolation under multi-agent.
- Anthropic — Agent Skills documentation and the official skills repository:
  first-party definition of SKILL.md, three-level loading, security
  considerations. Reading real examples beats reading the spec ten times.
- Anthropic API documentation — official semantics for context editing,
  compaction, the memory tool, and prompt caching.
- LangChain — *3 Years of Graph Engineering with LangGraph*: "agent graphs are
  usually not DAGs", the dynamic send primitive, "a node can be an entire agent
  run".
- LangGraph documentation — checkpointer, thread, interrupt, time travel;
  interrupts are the most direct engineering example of preserving an approval
  boundary for high-risk actions.
- Google ADK 2.0 documentation — code owns routing, models own judgement; four
  reasons not to let an LLM orchestrate; function/agent/join node kinds;
  prompt-injection resilience.

**Academic**
- Yao et al., 2022 — *ReAct: Synergizing Reasoning and Acting in Language Models*.
- Kim et al., ICML 2024 — *LLMCompiler*: the parallel-DAG form of
  plan-and-execute.
- Berkeley MAST — *Why Do Multi-Agent LLM Systems Fail?* (arXiv 2503.13657): 14
  failure modes from 1600+ traces. Read the taxonomy section; the experiments are
  optional.
- Russell & Norvig, 1995 — the classic agent definition: capable of acting, not
  merely responding.
- Lilian Weng — *LLM Powered Autonomous Agents*: Agent = LLM + Memory + Planning
  + Tool Use.

**Practitioner analysis**
- Addy Osmani — the loop-engineering series: L0–L5 autonomy levels; inner/outer
  loop and Quality-Verdict-Answerability; verification as the real constraint,
  lit versus dark factories, the back-pressure principle; intent debt;
  orchestration tax.
- Simon Willison — *Designing Agentic Loops*: YOLO mode, the three security
  postures, credential scoping, the disposable-permission-boundary case study.
- Zylos — *Durable Execution for AI Agent Runtimes*: the full primitive table,
  approval as a durable event, version drift, retry storms.
- TrueFoundry — graph engineering for multi-agent systems: the graph/run/node
  identifier triple, structural checkpoints, runtime graph mutation as an open
  problem.
- Carlos E. Perez — the four feedback-loop failures; grounded versus ungrounded;
  anchors.
- Turing Post — *Is Graph Engineering Real?*: the timeline and the point-by-point
  debunking of the viral claims.
- Martin Fowler — *CircuitBreaker*: the authoritative source for the three-state
  model. Ten minutes to read.

**Standards and security**
- OpenTelemetry GenAI semantic conventions — agent span definitions and attribute
  tables; the multi-agent orchestration layer remains an open proposal.
- OWASP — *Agentic AI Threats and Mitigations*: for threat modelling. Its six
  elements (Task / Action / Agent / Team / Artifact / Memory) map almost
  one-to-one onto the governance-plane object model.
- OpenHands — security and confirmation policy: the four risk tiers and three
  confirmation modes come from here; currently the most concrete reference
  design.

**Tooling**
- LangGraph — StateGraph, dynamic send, checkpointer, interrupt; durable
  execution as a first-class concern.
- Temporal — deterministic replay, with a LangGraph plugin.
- Restate / Inngest — lighter-weight durable execution.
- LiteLLM reliability documentation — a working reference implementation of
  Nygard patterns mapped onto LLM traffic.
- MCP — the cross-vendor tool connection standard.

**Do not use AutoGen as a primary reference architecture.** It has been declared
to be in maintenance mode with no new features; the vendor directs new users to
its successor framework.
