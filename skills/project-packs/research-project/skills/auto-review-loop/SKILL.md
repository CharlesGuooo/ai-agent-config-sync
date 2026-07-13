---
name: auto-review-loop
description: >-
  Iteratively improve YOUR OWN research artifact (paper draft, experiment
  writeup, or codebase) by having a DIFFERENT model review it adversarially each
  round, until it is submission-ready or a round cap is hit. Use when the user
  wants cross-model / external review or an unattended improvement loop: "review
  my paper with GPT/Codex", "cross-model review", "keep improving until a
  reviewer says ready", "research in sleep", "overnight improvement loop", "have
  another model red-team this and iterate". Requires a second model reachable
  from this machine (Codex CLI, Gemini CLI, or manual paste). Distinct from
  paper-stress-test, which is a one-shot SELF-review by this same model.
metadata:
  category: research
  tags: [autonomous, cross-model, review-loop, adversarial, codex, iteration]
  source: >-
    Distilled from `wanshuiyin/Auto-claude-code-research-in-sleep` (ARIS, MIT) —
    its `auto-review-loop` + `research-wiki` patterns. Adapted to a lean, bounded,
    dependency-light loop; ARIS's GPU-experiment queue and forensics engine are
    intentionally out of scope.
---

# Auto Review Loop (cross-model adversarial improvement)

Improve an artifact by looping: **a different model reviews → you fix → it
re-reviews**, until it clears a quality bar or a round cap. The whole point is
**heterogeneous** review — one model reviewing its own work only samples its own
blind spots (predictable noise); a *different* model reviewing is genuinely
adversarial and catches what self-review can't.

**Precondition:** a second model must be reachable from this machine. If none is,
this degrades to single-model self-review — use `paper-stress-test` instead.
See `references/reviewer-protocol.md` for wiring (`codex exec` is the default
since Codex CLI is installed here; Gemini CLI or manual paste also work).

## The loop

Bounded at **`MAX_ROUNDS` (default 4)**. Each round:

1. **Review** — send the current artifact to the reviewer model with the
   adversarial prompt (`references/reviewer-protocol.md`). The reviewer returns a
   score (1–10), ranked weaknesses, a minimum fix per weakness, and a verdict.
2. **Parse** — extract `score` and `verdict` (parsing rules below).
3. **Decide** — apply the stop rule. If continuing, proceed; if stopping, report.
4. **Improve** — address the reviewer's ranked weaknesses (orchestrate existing
   skills — see below). Record what you changed.
5. **Re-review** — next round on the improved artifact.

## Stop rule (exact)

```
if (score >= 6) AND (verdict in {ready, almost}):  STOP  → report success
elif rounds_used >= MAX_ROUNDS:                    STOP  → report remaining weaknesses (do NOT loop forever)
else:                                              CONTINUE
```

A **high score paired with `not ready` does NOT stop** — the verdict gates, not
the number alone. Never fabricate a passing verdict to end the loop early.

## Parsing the reviewer output

- **score** — the final explicit 1–10 the reviewer states; accept `Score: 7`,
  `7/10`, `7 out of 10`. If several appear, take the last explicit one.
- **verdict** — case-insensitive match of exactly `ready`, `almost`, or
  `not ready`. Synonyms ("accept", "looks good") do **not** count as a verdict;
  if the reviewer didn't state one of the three, treat verdict as `not ready`.

## The "improve" step — orchestrate, don't reinvent

Route each weakness to the skill that owns it:
- Structure / flow / "reads as incremental" → **narrative-flow**
- Unsupported claim / missing ablation / rejection risk → **paper-stress-test**
- Missing prose / a section to draft → **scientific-writing**
- Wording / de-AI / tense / LaTeX / bib → **latex-paper-en**
- Fabricated or wrong citation → **citation-management**

Do the minimum fix the reviewer asked for. Don't gold-plate beyond the weakness.

## State + the failed-fix banlist

Persist loop state to `.auto-review/state.json` (resumable, and prevents churn):

```json
{"round": 2, "max_rounds": 4, "reviewer": "codex/gpt-5.x", "thread_id": "...",
 "last_score": 5.0, "last_verdict": "not ready",
 "addressed": ["W1: added ablation on module Y"],
 "rejected_fixes": ["reframe as efficiency paper — reviewer said scope too narrow"]}
```

**Never re-propose a fix the reviewer already rejected** — keep it in
`rejected_fixes` as a banlist so the loop doesn't oscillate on the same idea. This
is the single most important guard against an unattended loop spinning.

## Difficulty tiers (how hard the reviewer probes)

- **medium** (default) — reviewer judges from the artifact you send it.
- **hard** — reviewer keeps a persistent `REVIEWER_MEMORY.md` across rounds and you
  run a short debate (you rebut, reviewer rules).
- **nightmare** — reviewer reads the repo **independently** (e.g. `codex exec` with
  read access) and verifies your claimed numbers against the actual result files.

Full tier wiring is in `references/reviewer-protocol.md`.

## Running unattended (safely)

- The loop is **bounded** (`MAX_ROUNDS`) and **resumable** (`state.json`) — it
  cannot run forever. On no progress for 2 rounds, try a structural pivot; after
  the cap, stop and report rather than loop.
- **Human checkpoints:** confirm the artifact + reviewer + `MAX_ROUNDS` before an
  unattended run; surface the final report for a human decision. Do not
  auto-submit anywhere.
- **Out of scope by design:** this skill does not autonomously run GPU experiments,
  push commits, or take destructive actions. Running new experiments is a manual /
  explicitly-approved step, not part of the automatic loop.

## Anti-sycophancy

If the reviewer starts rubber-stamping across rounds, switch to a **fresh reviewer
thread each round** (no prior fix summaries, artifact only) so it can't be led. See
the protocol reference for the exact toggle.
