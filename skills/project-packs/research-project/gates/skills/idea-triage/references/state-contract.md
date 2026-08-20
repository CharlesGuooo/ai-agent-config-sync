# The gate state contract

Shared by the four gate skills — `idea-triage`, `falsification-design`, `ablation-planning`,
`claim-calibration`. They all live in `gates/skills/`, so from any of them this file is at
`../idea-triage/references/state-contract.md`.

## The rule

> Read `.research/state.json` when it exists. When it does not, recover the same facts by globbing
> the artifact files named in the table below. **Never fail for want of the store, and never
> silently proceed without saying which source answered.**

Every skill here works standalone. The state store is a faster, machine-readable index of facts
that already live in human-readable artifacts — it is never the only home for any of them. What
you lose without it is bookkeeping speed and cross-project memory, not method.

## The artifacts are the fallback store

| Skill | Writes | Recoverable from |
|---|---|---|
| `idea-triage` | `ideas/TRIAGE-<date>.md` | glob `ideas/TRIAGE-*.md`, parse the Killed table |
| `falsification-design` | `PREREGISTER-<claim-id>.md` | glob `PREREGISTER-*.md`, read the header and sections |
| `ablation-planning` | `ABLATIONS.md` | read the table |
| `claim-calibration` | `CLAIMS-LICENCE.md` | read the table and the per-claim sections |

State that only exists in `.research/state.json` and nowhere else is a design error. Fix the
artifact, not the store.

## Fields

Optional to these skills, authoritative to an environment that maintains them.

| Field | Written by | Read by | Fallback |
|---|---|---|---|
| `venue_target.name` / `.deadline` | env or user | idea-triage, ablation-planning | ask |
| `ideas[].id` / `.claim` / `.discounted_headline` | idea-triage | idea-triage | `ideas/TRIAGE-*.md` |
| `ideas[].verdict` (`survivor` \| `killed`) | idea-triage | idea-triage, auto-review-loop | same |
| `ideas[].kill_reason_code` (6-value enum) | idea-triage | idea-triage | same |
| `ideas[].killed_on` / `.resurrection_condition` | idea-triage | idea-triage | same |
| `ideas[].human_override` | idea-triage | idea-triage | same |
| `claims[].id` / `.text` | idea-triage seeds | all four | the draft's contribution list |
| `claims[].outcome_clause` / `.mechanism_clause` | claim-calibration | claim-calibration, ablation-planning | `CLAIMS-LICENCE.md` |
| `claims[].scope` | falsification-design | claim-calibration | `PREREGISTER-*.md` |
| `claims[].defended_by` (ablation ids) | ablation-planning | claim-calibration | `ABLATIONS.md` Defends column |
| `claims[].licence.O` / `.M` / `.H` | claim-calibration | paper-stress-test | `CLAIMS-LICENCE.md` |
| `claims[].licence.rival_mechanism` | claim-calibration | ablation-planning | same |
| `claims[].licence.number_provenance` (`path:line`) | claim-calibration | repro-pack | same |
| `claims[].licence.licensed_wording` | claim-calibration | academic-humanizer, latex-paper-en | same |
| `claims[].licence.author_override` / `.risk` | claim-calibration | paper-stress-test, auto-review-loop | same |
| `preregistrations[].kill_threshold` | falsification-design | claim-calibration step 6 | `PREREGISTER-*.md` |
| `preregistrations[].admissible_excuses[]` | falsification-design | claim-calibration step 6 | same |
| `preregistrations[].held_out[]` / `.git_sha` | falsification-design | claim-calibration, repro-pack | same |
| `preregistrations[].ablation_requests[]` | falsification-design | ablation-planning | same |
| `ablations[].id` / `.kind` / `.defends` | ablation-planning | claim-calibration | `ABLATIONS.md` |
| `ablations[].if_true` / `.if_false` | ablation-planning | claim-calibration | same |
| `ablations[].status` / `.result_ref` | ablation-planning, user | claim-calibration | same |

## Two conventions

**Claim IDs are allocated once and never renumbered.** Whichever skill first names a claim owns
its ID. The whole handoff map hangs off them; renumbering silently breaks every cross-reference.

**`ideas[]` is append-only.** A killed idea is never deleted, only annotated — with
`overridden_by` if a human overturns the kill. The graveyard is the point: it is what stops the
same dead direction being re-proposed three months later.

## Asking, portably

`AskUserQuestion` exists on Claude Code; this pack syncs to five agents.

> Ask with `AskUserQuestion` where it exists. Where it does not, write the question as the last
> line of the reply and stop. The decision line in the artifact stays empty and its status stays
> `OPEN` until an answer arrives.

An unanswered question leaves an open artifact. It never leaves a decided one.
