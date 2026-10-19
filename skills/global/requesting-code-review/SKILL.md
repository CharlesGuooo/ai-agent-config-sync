---
name: requesting-code-review
description: >-
  Review your own changes since a fixed point along TWO independent axes —
  Standards (does it follow this repo's conventions and avoid known code smells?)
  and Spec (does it actually do what the plan/issue/spec asked?) — run as
  parallel subagents and reported side by side, never merged. Use when
  completing a task, finishing a major feature, before merging, or when the user
  asks to "review my changes/branch/PR since X", "审一下我的改动", "合并前帮我
  review". Distinct from
  receiving-code-review (acting on feedback someone gave you) and
  verification-before-completion (proving the thing runs).
allowed-tools: Read, Grep, Glob, Bash, Agent
metadata:
  category: code-review
  tags: [review, standards, spec, parallel-subagents, smells]
  source: >-
    Two-axis parallel-subagent structure and the Fowler smell baseline adapted
    from `mattpocock/skills` (MIT) — `engineering/code-review`. The
    when-to-request and act-on-feedback guidance, the read-only and
    no-nested-subagent rules, and the Spec axis's reasonable-expectation rule
    and Declined to judge list come from `obra/superpowers` (MIT)
    `requesting-code-review`, whose code-reviewer.md is vendored verbatim.
---

# Requesting Code Review

Review the diff between `HEAD` and a fixed point along two axes that **must not
contaminate each other**:

- **Standards** — does the code conform to this repo's conventions and avoid known smells?
- **Spec** — does the code faithfully implement what was actually asked for?

**Core principle:** review early, review often — and keep the axes apart.

## When to request

**Mandatory:** after completing a major feature · before merging to main.

**Valuable:** when stuck (fresh perspective) · before a refactor (baseline) · after
fixing a complex bug.

Never skip because "it's simple."

Inside `subagent-driven-development` and `executing-plans`, their own reviews are the
review: a reviewer per task, then one final whole-branch review with
[code-reviewer.md](code-reviewer.md). Run the two-axis process below for branch and PR
review outside those workflows, not stacked on top of them.

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

Search the repo for every file that documents how code should be written here:
`CLAUDE.md` / `AGENTS.md`, `CODING_STANDARDS.md`, `CONTRIBUTING.md`, lint configs. When
`CODING_STANDARDS.md` or `CONTRIBUTING.md` exists, it must be on the list.

On top of whatever the repo documents, the Standards axis always carries the **smell
baseline** in `references/smell-baseline.md` — a fixed set of Fowler smells that
applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses
  something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature
  Envy"), never a hard violation. Skip anything tooling already enforces.

### 4. Spawn both subagents in parallel

Send **one** message containing **two** subagent calls (general-purpose), in the
foreground, so they run concurrently, never see each other's findings, and both reports
are back before you aggregate. Hand each one only what its brief lists, never your
session history.

Both briefs carry two rules:

- **Read-only.** The review changes nothing on this checkout: not the working tree, the
  index, HEAD, or branch state. Inspect history with `git show` / `git diff` / `git log`;
  to look at another revision, check it out into a temporary worktree
  (`git worktree add <tmp-dir> <sha>`).
- **Do it yourself.** The subagent reviews the whole diff on its own and dispatches no
  subagents; if the diff is large, it reviews in passes and says so.

**Standards brief** — give it the diff command, the commit list, the standards files
you found, **and the full text of the smell baseline** (the subagent has no other
access to it). Ask for: (a) every place the diff violates a documented standard, citing
the file and rule; (b) any baseline smell, named, with the hunk quoted. Distinguish
hard violations from judgement calls. Skip what tooling enforces. Under 400 words.

**Spec brief** — give it the diff command, the commit list, and the spec path or
contents. Tell it the spec says what the software must do, not every input or
condition it will meet: where the spec is silent, what a reasonable user of this
software would expect is a requirement, and silence is not permission. Ask for:
(a) requirements asked for but missing or partial, including those reasonable
expectations; (b) behaviour in the diff nobody asked for (scope creep);
(c) requirements that look implemented but whose implementation looks wrong; and
(d) a **Declined to judge** list: every behaviour it considered and set aside as outside
the spec, one line each with the reason. Quote the spec line for each finding in
(a)–(c). Under 400 words.

### 5. Report side by side — do not merge

Present both under `## Standards` and `## Spec`, verbatim or lightly cleaned. **Do not
merge or re-rank findings across axes.** Keep the Spec axis's Declined to judge list
under it, so the user rules on each line instead of losing it. End with one line: total
findings per axis and the worst issue *within each axis*. Don't crown a single overall
winner — that re-ranking is exactly what the separation exists to prevent.

## Why two axes

A change can pass one and fail the other:

- Follows every convention but implements the wrong thing → **Standards pass, Spec fail.**
- Does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.

> `code-reviewer.md` in this directory is obra's **single-reviewer** template.
> `subagent-driven-development` and `executing-plans` dispatch it for their final
> whole-branch review and read its Declined to judge list, so it tracks upstream as is.

## Acting on the results

Fix **Critical** immediately · fix **Important** before proceeding · note **Minor** for
later. If a reviewer is wrong, push back with technical reasoning and show the code or
test that proves it — don't perform agreement. To work through feedback properly, use
the `receiving-code-review` skill.
