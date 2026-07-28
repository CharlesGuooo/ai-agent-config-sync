---
name: requesting-code-review
description: >-
  Review your own changes since a fixed point along TWO independent axes —
  Standards (does it follow this repo's conventions and avoid known code smells?)
  and Spec (does it actually do what the plan/issue/spec asked?) — run as
  parallel subagents and reported side by side, never merged. Use when
  completing a task, finishing a major feature, before merging, or when the user
  asks to "review my changes/branch/PR since X". Distinct from
  receiving-code-review (acting on feedback someone gave you) and
  verification-before-completion (proving the thing runs).
allowed-tools: Read, Grep, Glob, Bash, Agent
metadata:
  category: code-review
  tags: [review, standards, spec, parallel-subagents, smells]
  source: >-
    Two-axis parallel-subagent structure and the Fowler smell baseline adapted
    from `mattpocock/skills` (MIT) — `engineering/code-review`. The
    when-to-request and act-on-feedback guidance is retained from the previous
    obra/superpowers `requesting-code-review`.
---

# Requesting Code Review

Review the diff between `HEAD` and a fixed point along two axes that **must not
contaminate each other**:

- **Standards** — does the code conform to this repo's conventions and avoid known smells?
- **Spec** — does the code faithfully implement what was actually asked for?

**Core principle:** review early, review often — and keep the axes apart.

## When to request

**Mandatory:** after each task in subagent-driven development · after completing a
major feature · before merging to main.

**Valuable:** when stuck (fresh perspective) · before a refactor (baseline) · after
fixing a complex bug.

Never skip because "it's simple."

## Process

### 1. Pin the fixed point

Whatever the user names — a SHA, branch, tag, `main`, `HEAD~5`. If they didn't say,
ask. Then capture the comparison **once**:

```bash
git rev-parse <fixed-point>                  # confirm the ref resolves
git diff <fixed-point>...HEAD                # three-dot: compare against merge-base
git log <fixed-point>..HEAD --oneline        # the commit list
```

A bad ref or an empty diff must fail **here**, not inside two subagents.

### 2. Find the spec source

In order: issue references in the commit messages (`#123`, `Closes #45`) · a path the
user passed · a plan/spec under `docs/`, `openspec/`, `specs/`, or `.scratch/` matching
the branch or feature · otherwise ask. If there genuinely is no spec, skip the Spec
axis and say so in the report — don't invent one.

### 3. Find the standards sources

Anything documenting how code should be written here: `CLAUDE.md` / `AGENTS.md`,
`CODING_STANDARDS.md`, `CONTRIBUTING.md`, lint configs.

On top of whatever the repo documents, the Standards axis always carries the **smell
baseline** in `references/smell-baseline.md` — a fixed set of Fowler smells that
applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses
  something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature
  Envy"), never a hard violation. Skip anything tooling already enforces.

### 4. Spawn both subagents in parallel

Send **one** message containing **two** subagent calls (general-purpose), so they run
concurrently and never see each other's findings.

**Standards brief** — give it the diff command, the commit list, the standards files
you found, **and the full text of the smell baseline** (the subagent has no other
access to it). Ask for: (a) every place the diff violates a documented standard, citing
the file and rule; (b) any baseline smell, named, with the hunk quoted. Distinguish
hard violations from judgement calls. Skip what tooling enforces. Under 400 words.

**Spec brief** — give it the diff command, the commit list, and the spec path or
contents. Ask for: (a) requirements asked for but missing or partial; (b) behaviour in
the diff nobody asked for (scope creep); (c) requirements that look implemented but
whose implementation looks wrong. Quote the spec line for each finding. Under 400 words.

### 5. Report side by side — do not merge

Present both under `## Standards` and `## Spec`, verbatim or lightly cleaned. **Do not
merge or re-rank findings across axes.** End with one line: total findings per axis and
the worst issue *within each axis*. Don't crown a single overall winner — that
re-ranking is exactly what the separation exists to prevent.

## Why two axes

A change can pass one and fail the other:

- Follows every convention but implements the wrong thing → **Standards pass, Spec fail.**
- Does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.

> `code-reviewer.md` in this directory is the older **single-reviewer** template. It is
> still used by `subagent-driven-development` for quick per-task reviews — keep it. Use
> the two-axis process above for branch/PR-level review.

## Acting on the results

Fix **Critical** immediately · fix **Important** before proceeding · note **Minor** for
later. If a reviewer is wrong, push back with technical reasoning and show the code or
test that proves it — don't perform agreement. To work through feedback properly, use
the `receiving-code-review` skill.
