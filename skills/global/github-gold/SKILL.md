---
name: github-gold
description: >-
  Hunt GitHub for genuinely good projects — the ones a sharp human curator would
  share, not the famous repos a star-sorted search returns. Use when the user says
  "找找 GitHub 上有什么好东西", "挖点宝藏项目", "有什么值得关注的新项目", "find me
  good repos", "what's hot on GitHub", "any good AI/agent tools lately", or wants a
  periodic digest of what's new. Distinct from a plain repo search — this one reads
  human-curated daily feeds, filters on momentum rather than totals, and is allowed
  to come back with nothing.
allowed-tools: Read, Write, Bash, WebFetch, WebSearch
metadata:
  category: workflow
  tags: [github, discovery, curation, trending, awesome-list, ai-tools]
  source: >-
    Written from scratch for this harness. The trending-fetch mechanics are
    informed by `hoodini/ai-agents-skills/skills/github-trending` (MIT), but that
    skill is boilerplate for building a scraper app, not an agent-facing curation
    skill — only the "no official trending API" fact survives. Source table
    verified live 2026-08-02; five claims re-verified independently before this
    skill was promoted to the global layer.
---

# GitHub Gold

Find projects worth the user's attention. Reject everything else.

## Why the naive approach fails

An agent asked for "good GitHub projects" typically runs `stars:>10000 language:python
sort:stars` and returns LangChain, AutoGPT, and yt-dlp. That is not discovery — it is
reciting a leaderboard the user already knows. Three specific failure modes:

1. **Star-count is a lagging indicator.** By the time a repo has 30k stars it is not a
   find, it is common knowledge. What makes a human curator's share feel valuable is
   *momentum* — the repo that went 200 → 4,000 stars in six weeks.
2. **No freshness check.** Star-sorted results are full of repos that peaked in 2023 and
   have not been pushed since. The star count persists; the project is dead.
3. **No taste, no rejection.** The naive agent returns 10 results because it was asked
   for 10. A curator looks at 200 and shares 3.

The fix is the rest of this file: mine what humans already curated, search by momentum
instead of totals, and be willing to come back with "nothing good this week."

## Tooling — check what you have first

This skill runs on all agents in this harness, which do **not** have the same tools.
Pick the first available path and say which one you used:

| Need | Claude / Cursor / Codex / OpenCode | Pi (no MCP) |
| --- | --- | --- |
| Repo search | `mcp__github__search_repositories` | `gh search repos '<query>' --json …` or `WebFetch https://api.github.com/search/repositories?q=…` |
| Read a file | `mcp__github__get_file_contents` | `WebFetch https://raw.githubusercontent.com/…` |
| Commit history | `mcp__github__list_commits` | `gh api repos/{owner}/{repo}/commits` |

`gh` needs auth (`gh auth status`); the raw `api.github.com` path works unauthenticated at
60 req/h, which is enough for one run if you batch. **Never fabricate a number you could
not fetch** — if a channel is unavailable, say so in the report rather than guessing.

## Step 1 — Pin down what "good" means here

Before searching, settle three things. Ask only if genuinely ambiguous; otherwise state
your assumption and go.

- **Domain** — AI agents / LLM infra / dev tooling / a specific language / anything.
  Default: whatever the user has been working on, else AI + developer tooling.
- **Purpose** — something to *use* today, something to *read* and learn from, or
  situational awareness of where the ecosystem is moving. These want different repos.
- **Novelty floor** — "new to me" or "new to the world". If the user already lives in
  this space, filter out anything above ~20k stars by default.

## Step 2 — Sweep the four channels

Run channels in parallel where possible. Aim for a raw pool of **40–80 candidates**
before filtering. Do not stop early because the first channel looked productive.

### Channel A — Human-curated sources (highest signal, do this first)

Machine-readable feeds that real curators maintain. Full verified table with exact file
paths and update cadence: **`references/sources.md`** — read it before this channel.

The core move is to fetch *today's* file, not the README:

- `bonfy/github-trending` → `https://raw.githubusercontent.com/bonfy/github-trending/master/YYYY-MM-DD.md`
  — daily, grouped by language, one line per repo. Best single source for "what moved today".
- `EvanLi/Github-Ranking` → `Top100/<Language>.md` — daily ranking snapshots. Use the
  **delta between two dated snapshots**, not the current list.
- `521xueweihan/HelloGitHub` → `content/HelloGitHubNNN.md` — monthly, hand-picked.
- `ruanyf/weekly` → `docs/issue-NNN.md` — weekly, editorialised, strong taste.

Read 3–7 days of daily files, not one. A single day is noise; a week is a trend.

### Channel B — Momentum search

Compute the dates from today's date; don't hardcode them.

```
created:>{today-90d} stars:>200 sort:stars          # new breakouts
stars:200..3000 pushed:>{today-14d} topic:{domain}  # underrated but alive
topic:agent-skills stars:>50 pushed:>{today-30d}    # ecosystem drilling
```

Rules for this channel:
- **Never** use a bare `stars:>10000`. It returns the famous set every time.
- Always pair a star filter with `pushed:>` — it removes the entire dead-repo class.
- `sort=updated` surfaces different repos than `sort=stars`. Run both.
- The API's `updated_at` field moves when someone **stars** the repo. Only `pushed_at`
  means code changed. Filter on `pushed:`; never treat `updated_at` as liveness.

### Channel C — The trending page

GitHub has **no official trending API**. Either fetch `https://github.com/trending`
(add `/{language}` and `?since=daily|weekly|monthly`), or rely on Channel A's archives,
which are the same page snapshotted daily and usually the better option — they give you
history and don't break when GitHub changes its HTML.

Prefer `?since=weekly`. Daily trending is dominated by whatever hit Hacker News that morning.

### Channel D — Outside-GitHub corroboration

For any candidate that survives to the shortlist, one search for
`"{owner}/{repo}" review OR 实测 OR "we switched to"` tells you whether anyone actually
uses it, or whether it is a README with a good logo. Cheapest way to catch the
"1.5k stars, zero users" class.

## Step 3 — Filter hard

### Kill on sight

- `archived: true`, or `pushed_at` older than 6 months
- Star count with no proportionate forks or issues — roughly `forks < stars/200` on a
  repo above 1k stars is a bought-stars or bot-farm signature
- README is all promise and no artifact: no screenshot, no demo, no install line, no
  code sample
- A course, roadmap, interview-prep list, or "awesome-X" list — *unless* the user asked
  for reading material. These dominate star charts and are almost never the answer
- Already known to the user, or already in the seen-list (Step 5)

### Score what survives

Five signals, 1–5 each. Anything below **16/25 does not get shown**.

| Signal | What you're checking |
| --- | --- |
| **Momentum** | Stars gained recently vs. total. A 3-month-old repo at 2k beats a 4-year-old at 20k. |
| **Aliveness** | Commits in the last 30 days, issues answered, releases tagged. Not one commit — a rhythm. |
| **Substance** | Does the code do what the README claims? Skim the actual source, not the pitch. |
| **Usability** | Can the user get it running in under 15 minutes? Install path, docs, examples. |
| **Fit** | Does it match the domain and purpose from Step 1? A brilliant repo they'll never open scores 1. |

For anything reaching the final shortlist, **open the repo** — read the README and one
real source file, and check the last few weeks of commits. Do not score from search-result
metadata alone. Metadata builds the pool; reading picks the winners.

## Step 4 — Report

Ranked, ruthless, honest. **3–7 items**, never a padded ten.

```
### {owner}/{repo} — {one line on what it actually is}
{stars} ★ (+{recent gain}) · {language} · last push {date} · score {n}/25

**为什么值得看**: the specific reason THIS user should care, tied to their Step 1 purpose.
**代价**: setup friction, immaturity, licence, the thing the README doesn't mention.
**Verdict**: use it now / watch it / read the source and move on.
```

Then two short closers:

- **Also-rans** — one line each for 3–5 near-misses, with the reason each was cut. This is
  how the user calibrates your taste and corrects it.
- **What I didn't find** — if a channel came back empty or the week was thin, say so.
  "Nothing in agent-memory this week worth your time" is a valid, useful result and far
  more trustworthy than a padded list.

Cite every claim with the repo URL. Never state a star count or a date you did not fetch.

## Step 5 — Remember what you showed

Append every shown repo to a seen-list as `YYYY-MM-DD | owner/repo | verdict`, and read it
at the start of Step 3 to drop repeats. Put it **outside the synced skills tree** (that
tree is mirrored from the repo and would wipe it):

- Windows: `%TEMP%\github-gold\seen.md`
- macOS / Linux: `${TMPDIR:-/tmp}/github-gold/seen.md`

If the user wants it durable across machines, ask before writing anywhere else.

Without this, every run resurfaces the same repos and the skill is worthless on second use.

## Anti-patterns

- **Padding to a round number.** Three excellent finds beat three plus four fillers — the
  fillers teach the user to skim your output.
- **Reciting the leaderboard.** If the user could have named it before asking, it is not a find.
- **Trusting the README.** The README is marketing. Commit history and source are evidence.
- **Reporting `updated_at` as activity.** It moves on a star. Use `pushed_at`.
- **One-day sampling.** One day of trending is noise. Read a week.
- **Skipping the also-rans.** They are how the user tells you your filter is miscalibrated.
