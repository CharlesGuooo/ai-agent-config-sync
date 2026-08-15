# Measured evaluation

The three-prompt check in SKILL.md step 5 answers *does it work*. This file answers *how much* —
reach for it when triggering is contested, when two versions need separating, or when the skill
guards something expensive enough to justify the run.

The scripts here are Anthropic's, run from the skill directory as modules. Confirm `python` resolves
and the imports load before promising the user a run.

**Two things `run_eval.py` does that are worth knowing before you start it.** It measures triggering
by writing a temporary uniquely-named command file into `<project-root>/.claude/commands/` so the
description reaches `available_skills`, then calling `claude -p`; the file is removed in a `finally`.
Project root is resolved by walking up from the working directory for the first `.claude/` — so run
it from a directory where that resolves somewhere you expect, and check `git status` afterwards if
that turns out to be a repo. `skill-scanner` flags this write as a critical "agent config
modification"; on these scripts that finding is understood and accepted.

## Optimizing the description for trigger rate

The highest-value tool here, and the one that addresses descriptions competing for the same prompts.

**Write 20 queries**, 8–10 that should trigger and 8–10 that should not:

```json
[{"query": "the user prompt", "should_trigger": true}]
```

Make them substantive. An agent consults a skill for work it cannot already do in one step, so
`"read this PDF"` tests nothing regardless of the description. Write what a real user types — file
paths, company names, column names, lowercase, typos, a little backstory.

The negatives carry most of the signal, and only if they are **near-misses**: queries sharing
vocabulary with the skill that genuinely need something else. `"write a fibonacci function"` as a
negative for a PDF skill measures nothing.

Then run:

```bash
python -m scripts.run_loop \
  --eval-set <path-to-eval-set.json> \
  --skill-path <path-to-skill> \
  --model <model-id-of-the-current-session> \
  --max-iterations 5 --verbose
```

It splits 60/40 train/test, runs each query three times for a stable rate, proposes improved
descriptions from what failed, and returns `best_description` chosen by **test** score so the
result is not overfit to the training half. Use the current session's model id so the measurement
matches what the user experiences.

## Benchmarking a version against a baseline

Put results in `<skill-name>-workspace/iteration-<N>/eval-<id>/`, with `with_skill/outputs/` beside
either `without_skill/outputs/` (new skill) or `old_skill/outputs/` (improving an existing one —
snapshot the original first).

1. **Spawn every run in one turn**, with-skill and baseline together, so they finish together.
2. **Draft assertions while they run.** Objectively checkable, descriptively named. Skills with
   subjective output — writing style, visual design — are graded by reading, not by assertions.
3. **Capture `total_tokens` and `duration_ms`** from each completion notification into `timing.json`
   in that run directory. This arrives once and is stored nowhere else.
4. **Grade** with a subagent following [../agents/grader.md](../agents/grader.md), writing
   `grading.json`. Its `expectations` entries use the fields `text`, `passed`, `evidence` — the
   viewer reads those names. Check programmatically wherever a script can decide it.
5. **Aggregate and show the user**:

```bash
python -m scripts.aggregate_benchmark <workspace>/iteration-<N> --skill-name <name>
python eval-viewer/generate_review.py <workspace>/iteration-<N> --skill-name <name> \
  --benchmark <workspace>/iteration-<N>/benchmark.json
```

Add `--previous-workspace <workspace>/iteration-<N-1>` from the second iteration on. Where no
display exists, `--static <output_path>` writes a standalone HTML file instead of serving one.

Get the viewer in front of the user **before** forming your own opinion of the outputs. Feedback
lands in `feedback.json`; empty feedback means it was fine.

Schemas for all of these files: [schemas.md](schemas.md).

## Reading the results

Judge by **pass rate across runs**, not a single pass or fail — the system is non-deterministic and
one run is noise.

Watch for what the aggregate hides: an assertion that passes with and without the skill is
measuring nothing; a high-variance eval is probably flaky rather than informative; a skill that wins
on quality while tripling tokens is a trade the user should get to make.

Then generalize. You are iterating on three examples the user knows intimately, but the skill will
run on thousands. A change that only rescues those three is worse than no change — when an issue
resists, try a different metaphor or a different shape rather than another clause pinned to the
failing case. Cut what earns nothing: read the transcripts, and remove whatever sent the agent down
an unproductive path.

## Deeper comparisons

Two versions where the benchmark is ambiguous: hand both outputs to an independent agent without
saying which is which, following [../agents/comparator.md](../agents/comparator.md), then use
[../agents/analyzer.md](../agents/analyzer.md) to work out why the winner won.

To hand a skill to someone outside this repo: `python -m scripts.package_skill <path-to-skill>`.
