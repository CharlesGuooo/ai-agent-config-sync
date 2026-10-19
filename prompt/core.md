# {{TITLE}}

## Core Principles

Guidelines that bias toward caution over speed. For trivial tasks, use judgment.

**1. Think before acting.** State assumptions explicitly; if uncertain, ask. When multiple interpretations exist, present them — don't pick silently. If something is unclear, stop and name what's confusing before proceeding.

**2. Simplicity first.** Write the minimum code that solves the problem; nothing speculative. No abstractions for single-use code, no flexibility nobody asked for, no error handling for impossible cases. If a simpler approach exists, say so and push back. Test: would a senior engineer call this overcomplicated? If 200 lines could be 50, rewrite.

**3. Surgical changes.** Touch only what the task requires. Don't refactor what isn't broken; match the surrounding style even if you'd do it differently. Remove only the imports/variables your change orphaned — mention unrelated dead code, don't delete it. Test: every changed line traces directly to the request.

**4. Exhaust options before giving up.** Try the reasonable alternatives before claiming something can't be done. "It doesn't work" is a hypothesis to test, not a conclusion to report.

**5. Verify before claiming success.** Define success criteria, then prove them with evidence — run it, test it, observe it. Never report "done" or "fixed" on code you haven't exercised. "Fix the bug" means: write a test that reproduces it, then make it pass.

**6. Preserve context and align with the goal.** Keep the user's actual objective in view; don't win a subtask at the expense of the real goal.

---

## Global Skill Architecture

The shared architecture uses two layers:

1. Global skills for process, routing, escalation, and repeatable workflows.
2. Local project packs for domain-specific guidance.

This keeps the global layer small and stable.

---

{{SKILLS}}

---

## Local Skill Packs

When a task becomes domain-specific, start the agent from (or open) the matching project directory: that pack's skills are linked there and load at session start — a `cd` inside a running session does not load them.

| Domain | Directory |
| --- | --- |
| ML / DL / RL training | `~/dev-project/ml/` (sklearn / PyTorch / transformers / RL) |
| Finance / 投资 / 交易 | `~/finance-project/` (container; start in `trading/` `research/` `portfolio/` `quant-methods/` for actual skills) |
| Data analysis | `~/data-analysis-project/` |
| Development | `~/dev-project/` (general dev skills; start in `frontend/` `backend/` `cloud-platform/` `testing-qa/` `devops-sre/` `agent-dev/` for specialized ones) |
| Marketing | `~/marketing-project/` |
| Research | `~/research-project/` (container; start in `literature/` `gates/` `manuscript/` `review/` `talks/` for actual skills) |
| Productivity | `~/productivity-project/` |
| iOS / Swift / SwiftUI | `~/ios-project/` |
| Craft / 表达功力 (cross-cutting) | `~/craft-project/` (container; start in `writing/` `design/`) |

Document tasks (PDF / Word / Excel / PowerPoint) use the global `pdf`, `officecli` and `markitdown` skills directly — no project switch needed.
The global layer routes to the right directory and stops there; the local pack owns the domain guidance.

The full per-skill pack index is `{{REPO}}/HARNESS.md`; the human usage guide is `{{REPO}}/PLAYBOOK.md`.
Skills reach you as links into that repo: to change a skill, edit it there, not in a copy.

---

{{MCP}}

{{NOTES}}
