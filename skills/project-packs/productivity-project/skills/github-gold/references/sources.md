# Curated source repos (Channel A)

Every entry below was verified live on **2026-08-02** — `pushed_at` checked via the
GitHub API, file paths confirmed by listing the actual repo tree. Re-verify anything
older than ~3 months; curation repos die quietly and keep their stars.

## Tier 1 — Daily, machine-readable

These are the workhorses. Fetch dated files directly; do not parse the README.

| Repo | What it is | Exact path | Notes |
| --- | --- | --- | --- |
| `bonfy/github-trending` | Daily trending snapshot, grouped by language | `https://raw.githubusercontent.com/bonfy/github-trending/master/YYYY-MM-DD.md` | Best single daily source. Format: `#### python` headers, then `* [owner / repo](url):description`. Archives before 2026 live in `YYYY/` subdirs. 1.0k ★ |
| `EvanLi/Github-Ranking` | Top-100 star/fork rankings, per language | `Top100/Top-100-stars.md`, `Top100/Python.md`, `Top100/TypeScript.md`, `Top100/Rust.md`, `Top100/Go.md` … (36 languages) | Daily. Raw lists are useless alone — **diff two dated snapshots** to get who climbed. Historical CSVs in `Data/`. 11.8k ★ |
| `larsbijl/trending_archive` | Daily trending archive since 2014 | dated `.md` files under month dirs | Deepest history of any trending archive. Use for "is this a spike or a trend". 394 ★ |
| `mshibanami/GitHubTrendingRSS` | Trending as RSS feeds | RSS endpoints per language | Useful if you want a feed rather than a fetch. 358 ★ |

## Tier 2 — Human-curated, editorialised

Lower volume, much higher hit rate. This is the tier that produces the finds that feel
like a good 抖音 share — because a person with taste picked them.

| Repo | Cadence | Exact path | Notes |
| --- | --- | --- | --- |
| `521xueweihan/HelloGitHub` | Monthly (28th) | `content/HelloGitHubNNN.md` — latest was **124** on 2026-08-02; count forward from there | 168k ★. Hand-picked, biased toward interesting-and-approachable over enterprise. Highest signal-per-line of anything here. Chinese; English translations in `content/en/`. |
| `ruanyf/weekly` | Weekly (Friday) | `docs/issue-NNN.md` — latest was **406** on 2026-08-02; count forward from there | 99k ★. 科技爱好者周刊 — tools plus commentary. Strong personal taste, wider than GitHub. Chinese. |
| `hesreallyhim/awesome-claude-code` | Continuous | `THE_RESOURCES_TABLE_NEW.csv`, `resources/` | 51k ★. **CSV is machine-readable — parse that, not the README.** The reference index for Claude Code skills / hooks / commands / plugins. |
| `VoltAgent/awesome-agent-skills` | Continuous | repo tree | 29k ★. 1000+ agent skills across Claude Code, Codex, Gemini CLI, Cursor. |
| `VoltAgent/awesome-claude-code-subagents` | Continuous | repo tree | 24k ★. 100+ specialised subagent definitions. |
| `BehiSecc/awesome-claude-skills` | Continuous | `README.md` | 9.9k ★. Smaller, more curated skill list. |

## Tier 3 — Auto-generated agent/skill trackers

Small repos, near-real-time, narrow scope. Useful for the agent-skills niche
specifically; noisy for anything else. Their low star counts are expected — they are
bots, not projects.

| Repo | Refresh | Notes |
| --- | --- | --- |
| `linny006/trending-claude-skills` | ~15 min | Leaderboard of trending claude-skills / AI agent repos |
| `linny006/skills-tracker` | Continuous | Every new GitHub repo matching "skills" — rawest possible feed |
| `linny006/awesome-agent-skills` | Continuous | Same data with quality ratings applied |
| `zhuyansen/agent-skills-hub` | Continuous | Skills + MCP servers with quality scoring and security flags. 319 ★, TypeScript |
| `quemsah/awesome-claude-plugins` | Continuous | Claude Code plugin adoption metrics. 1.1k ★ |

## Non-GitHub

- **OSSInsight** — `https://ossinsight.io/trending/ai` — real-time AI repo rankings by
  star velocity, backed by the full GitHub event firehose. Better momentum data than
  anything scraped from the trending page.
- **`Thysrael/Horizon`** (8.6k ★) — not a source list; a tool that *builds* you a daily
  AI news radar in English + Chinese. Worth suggesting if the user wants this automated
  rather than run on demand.

## Known dead / demoted

Check before trusting a recommendation from an older list:

- **`GitHubDaily/GitHubDaily`** (47k ★) — **stale.** Last push 2025-12-31, verified
  2026-08-02. The account still posts to its website and 公众号, but the repo stopped.
  Its star count makes it look alive in search results; it is not. Classic example of
  why `pushed_at` beats `updated_at`.

## Adding a source

Before adding anything here, confirm all three:

1. `pushed_at` within the last 30 days (via the API — **not** `updated_at`, which moves
   when someone stars the repo).
2. There is a stable, dated, machine-readable path — not just a README that gets rewritten
   in place. If you can't construct tomorrow's URL today, it's a Tier 2 at best.
3. It surfaces things the API's momentum queries wouldn't already find. A source that
   only lists the top-100 by stars adds nothing.
