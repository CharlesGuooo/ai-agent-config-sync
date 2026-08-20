# Reviewer protocol — wiring, prompt, tiers

## Wiring a second model as reviewer

Pick whichever is available on this machine. The reviewer MUST be a different
model from the one improving the artifact, or you lose the cross-model benefit.

### Option A — Codex CLI (default; Codex is installed here)

Non-interactive, one call per round:

```bash
codex exec "$(cat review_prompt.txt)" > review_out.txt
```

For the **nightmare** tier, run `codex exec` from inside the repo so the reviewer
reads the actual code/results itself instead of trusting your summary:

```bash
cd <repo> && codex exec "Read the diff and the files under results/. $(cat review_prompt.txt)"
```

### Option B — Gemini CLI

```bash
gemini -p "$(cat review_prompt.txt)" > review_out.txt
```

### Option C — Manual paste

Print the prompt + the artifact, ask the user to paste it into any external model
(GPT, Gemini, Kimi, DeepSeek…), and paste the reply back. Use this when no CLI is
wired.

> If a Codex-as-MCP server is configured (`mcp__codex__codex` /
> `mcp__codex__codex-reply`), you may call that instead of the CLI; reuse the
> thread id across rounds for the `hard` tier, drop it for anti-sycophancy.

## The adversarial reviewer prompt

Send this verbatim (fill in the venue). It deliberately assumes the work is broken
and tells the reviewer not to trust the author.

```
Please act as a senior ML reviewer (NeurIPS/ICML level). Start from the
assumption that the work is broken somewhere — your job is to find where.
Be adversarial. Trust nothing the author tells you — verify everything
yourself. Author notes are not evidence; read the artifact, not my description.

1. Score this work 1-10 for a top venue.
2. List the remaining critical weaknesses, ranked by severity.
3. For each weakness, specify the MINIMUM fix (experiment, analysis, or reframing).
4. State clearly: is this READY for submission? Answer exactly one of:
   ready / almost / not ready.

End your reply with these two lines:
Score: <n>/10
Verdict: <ready|almost|not ready>
```

## Required output format (for reliable parsing)

The last two lines must be:

```
Score: <1-10>/10
Verdict: <ready | almost | not ready>
```

If the reviewer omits them, re-ask for just those two lines rather than guessing.

## Difficulty tiers

| Tier | Reviewer context | Extra protocol |
| --- | --- | --- |
| **medium** | Only the artifact you send | none |
| **hard** | Artifact + persistent `REVIEWER_MEMORY.md` (prepend each round) | short debate: you rebut the weakest finding, reviewer rules |
| **nightmare** | Independent repo read access (`codex exec` in-repo) | reviewer verifies every claimed number against `results/` and flags unverified/false claims |

Escalate the tier when the stakes are higher (camera-ready, a claim you're unsure
of) or when medium-tier review keeps missing things.

## Anti-sycophancy toggle

Reviewers drift toward agreement once they've seen your fixes. If scores climb
without the weaknesses genuinely closing:

- Set **`REVIEWER_BIAS_GUARD=true`**: start a **fresh thread every round**, pass the
  reviewer only the current artifact (no prior fix summaries, no thread id).

Note the trade-off vs the `hard` tier, which *keeps* memory for a running debate —
memory helps depth but invites sycophancy. Pick per run; don't do both.

## Round bookkeeping

Each round, append to `.auto-review/state.json`: round number, score, verdict,
what you addressed, and any fix the reviewer rejected (the banlist). Stop per the
rule in `SKILL.md` (`score>=6 AND verdict in {ready,almost}`, else at `MAX_ROUNDS`).
