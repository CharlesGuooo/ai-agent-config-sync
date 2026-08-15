---
name: skill-creator
description: >-
  Authors a new agent skill end to end, or audits an existing one against a quality rubric.
  Covers choosing whether the thing should be a skill at all rather than a hook, slash command,
  or memory file; finding the real gap by running the task without a skill first; writing evals
  before the body; drafting the name and description at the right level of constraint; grading
  against named failure modes; verifying with a fresh agent; and registering it so this repo's
  drift gates pass. Use when the user says "写个 skill", "帮我改进这个 skill",
  "这个 skill 写得好不好", "审一下这个 SKILL.md", "create a skill", "improve this skill's
  triggering", or hands over a SKILL.md for critique. Distinct from skill-scanner, which
  security-scans a third-party skill before installing it, and from book-to-skill, which mines a
  book into a draft that this skill then audits.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
metadata:
  category: routing
  tags: [skills, authoring, rubric, evaluation, predictability]
  source: >-
    This SKILL.md, references/rubric.md, references/evaluating.md and
    references/registering.md are written for this repo. references/GLOSSARY.md comes from
    mattpocock/skills' writing-great-skills (MIT), verbatim apart from its first-line
    back-link, which was retargeted here — so it can still track upstream at a one-line
    conflict. scripts/, agents/, eval-viewer/, assets/ and references/schemas.md are
    Anthropic's skill-creator (see LICENSE.txt), verbatim.
---

# Skill Creator

A skill exists to wrangle determinism out of a stochastic system. **Predictability** — the agent
taking the same *process* every run — is what every judgment below serves.

## Pick the branch first

| The user | Branch |
|---|---|
| hands over an existing SKILL.md to critique, or asks whether one is any good | **Audit** |
| wants a new skill, or a rewrite of one | **Create** |

## Reference files

| File | Open when |
|---|---|
| [references/rubric.md](references/rubric.md) | Grading a draft — both branches end here |
| [references/GLOSSARY.md](references/GLOSSARY.md) | A rubric term needs its precise definition |
| [references/registering.md](references/registering.md) | Wiring a finished skill into this repo |
| [references/evaluating.md](references/evaluating.md) | Measuring trigger rate or benchmarking versions |

## Create

### 0. Pick the mechanism

A skill is *advisory*: it fires when its description matches, and can be passed over. Match the
mechanism to the guarantee the work needs.

| The step | Mechanism | Guarantee |
|---|---|---|
| must run every time its trigger fires | hook (`.claude/settings.json`) | blocking, deterministic |
| depends on judgment, or encodes a procedure | **skill** | advisory, fires on description match |
| the human decides when to run | slash command, or a skill with model invocation switched off | on invocation |
| must sit in context permanently | memory file (`CLAUDE.md`) | standing |

Then place it. Ask: *would this help while writing a paper? while building a financial model?*
Both no → it belongs in a local pack under `skills/project-packs/`, which costs nothing until the
user cd's there. Global is for zero-domain-assumption process, routing, and meta-tooling.

**Done when:** the mechanism and the location are both stated out loud, with the reason.

### 1. Find the gap

Run the task **without** any skill and watch what happens. The context the user has to supply, the
step the agent skips, the convention it cannot guess — that is the gap, and it is the only thing
the skill should contain.

**Done when:** the baseline failure is written down concretely ("it wrote the file but never ran
the drift gate"), not predicted ("this would probably help").

### 2. Write three evals — before the body

Three realistic prompts a user would actually type: file paths, real names, casual phrasing, one
near-miss that should *not* trigger. Save to `evals/evals.json` beside the skill. Assertions come
later; the prompts come now, because they are what keeps the body honest.

**Done when:** three prompts exist on disk and the user has agreed they are the right three.

### 3. Draft

**Name** — lowercase, hyphens, ≤64 characters. Gerund form (`processing-pdfs`) reads best. A name
like `helper` or `utils` tells the agent nothing.

**Description** — the trigger surface, and the only part loaded every turn. Third person. State
what it does *and* when to use it. One trigger per branch: synonyms that rename a single branch are
duplication. Include the words the user actually types, Chinese included, since a description
written only in English will not fire on a Chinese prompt. Close with a "Distinct from …" clause
naming its nearest neighbour, so the model has a correct answer available when both look plausible.

**Body** — steps, reference, or both. Push a section behind a pointer when only some branches read
it; inline what every branch needs. Keep pointers one level deep from SKILL.md.

**Done when:** name, description, and body exist, and the description says when *not* to reach for
this skill instead of its neighbour.

### 4. Grade against the rubric

Read [references/rubric.md](references/rubric.md) and work down it.

**Done when:** every failure mode carries a verdict — hit, with the line number, or clear. A draft
that has not been graded item by item has not been graded.

### 5. Verify with a fresh agent

Start a new session, load the skill, run the three prompts. Watch three things: did it trigger, did
it reach the right reference file, did it finish the steps. Observed behaviour is the evidence; your
own reading of the draft is not.

When triggering is contested, or the skill guards something expensive, escalate to
[references/evaluating.md](references/evaluating.md) for measured trigger rate and a with/without
benchmark.

**Done when:** all three prompts have been run in a session that did not write the skill.

### 6. Register

Low freedom — the commands are exact and a drift gate goes red on a mistake. Follow
[references/registering.md](references/registering.md) verbatim.

**Done when:** both drift gates exit 0 and the skill is confirmed on disk for all five agents.

## Audit

Go straight to step 4. Report per finding: the failure mode, the line, and the positive rewrite —
the sentence that should replace it. Leave the file alone unless the user asks for the edit.

Rank by what changes behaviour. A description that fires on the wrong prompts outranks a section
that is merely long.

## Calibration: how much to constrain

Match specificity to how fragile the task is.

- **Open field** — many routes reach the goal, context decides which. Give direction and let the
  agent navigate. Code review, synthesis, design.
- **Narrow bridge** — one safe way across, cliffs either side. Give the exact command and say not to
  vary it. Migrations, release steps, anything with a gate that goes red.

This skill is its own example: steps 1–5 are open field, step 6 is a narrow bridge.

## Scope

Claude already knows the SKILL.md format and will produce valid frontmatter unprompted. What this
skill adds is the part that is local and hard: which mechanism the work deserves, whether it belongs
in the global layer or a pack, whether the draft survives the rubric, and how to wire it into this
repo so nothing drifts.
