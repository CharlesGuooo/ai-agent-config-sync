---
name: idea-haunter
description: Data-driven 4-stage funnel for discovering and validating indie-hacker product ideas from Reddit pain points, sizing them with Google Trends/News, checking social virality, and scanning Product Hunt competition. Use when hunting for new product/SaaS/app ideas or validating a candidate idea with evidence instead of gut feel.
allowed-tools: Read, Write, Edit, Bash, WebFetch
compatibility: "paid — Stages 1-3 lean on the brave-search MCP (BRAVE_API_KEY; Brave's Search API is metered beyond a monthly free credit); Stage 4 needs PRODUCT_HUNT_TOKEN (free developer token); Reddit via Arctic Shift needs no key; SerpApi (billed) only with explicit approval"
---

# Idea Haunter

Turn raw user complaints into a short list of **validated, data-backed product ideas**. The core principle from the source method: **replace "I think this is a good idea" with evidence**. Every claim must trace to a source. Never advance an idea on gut feel.

## The funnel (each stage kills most candidates)

| Stage | Platform / tool | Question it answers | Kill if... |
|---|---|---|---|
| 1. Discover | Reddit (or Brave `site:reddit.com`) | What are people actually complaining about / asking for? | No real, repeated pain; one-off gripe |
| 2. Size | Google Trends MCP (News + trending) + Brave | Is the audience big enough & is a mature solution still missing? | Tiny/declining interest, OR already well-solved |
| 3. Virality | Brave video/web search (TikTok/YouTube proxy) | Can it be distributed/marketed on social? | No social footprint → can't cheaply acquire users |
| 4. Compete | Product Hunt MCP | Are competitors already too strong/better? | Crowded with strong incumbents & no asymmetric angle |

Because each stage filters hard, **Stage 1 must over-generate** (cast wide, then narrow).

## Stage 1 — Reddit pain-point mining

**Search patterns (the "big-head" phrases):** combine these with topic words.
- `"is there an app that"`, `"is there a tool"`, `"is there any app"`
- `"I need an app that"`, `"I wish there was an app"`, `"I wish there was a way"`
- `"why is there no"`, `"does anyone know a tool"`, `"recommend me a tool"`
- `"alternative to <product>"`, `"so frustrated with"`, `"hate that I have to"`
- `"someone should build"`, `"would pay for"`, `"tired of manually"`

**Target subreddits (digital-products scope):** SomebodyMakeThis, AppIdeas, SaaS, indiehackers, Entrepreneur, smallbusiness, productivity, nocode, selfhosted, webdev, Business_Ideas, startups, SideProject, EntrepreneurRideAlong, freelance, digitalnomad, + verticals discovered during the sweep (e.g. fitness, personalfinance, teachers, realestate).

**Retrieval paths (Reddit locked down its API in 2026 — anonymous MCP access returns 403, and self-serve OAuth apps are gated behind a slow manual approval; the "Reddit for Researchers" track gives BigQuery, NOT OAuth creds the MCP can use). So the default backbone is no-auth sources:**
- **PRIMARY — Arctic Shift (no auth, structured, real metadata):** free Pushshift successor covering 2005–2026. REST API, no key.
  - Browse a subreddit: `GET https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=<sub>&limit=100&sort=desc` (returns full post objects: title, selftext, score, num_comments, created_utc, author, permalink).
  - Keyword search within a sub: add `&query=<phrase>` (full-text search is per-subreddit/user only).
  - Comments: `GET .../api/comments/search?subreddit=<sub>&query=<phrase>&limit=N`.
  - Call via Bash `curl` or WebFetch; parse JSON. Real upvote/comment counts = strong demand signal.
- **SECONDARY — Brave cross-sub phrase discovery:** `brave_web_search("site:reddit.com \"<pattern>\" <topic>", result_filter=["web","discussions"], extra_snippets=true)` — best for hunting the "big-head" phrases across ALL subreddits at once (Arctic Shift can't search all subs simultaneously). Then `webReader` the promising threads.
- **OPTIONAL — Native MCP (only if OAuth client_id+secret ever become available):** `reddit.search_reddit(...)`, `reddit.browse_subreddit(...)`, `reddit.get_post_details(...)`. Parked until creds exist; do NOT block on Reddit approval to run Stage 1.

**Output:** cluster raw complaints into distinct **candidate ideas**. For each: pain statement, source links (subreddit + permalinks), demand signal (upvotes/comment counts/repetition), one-line idea framing, category. Dedupe by semantic similarity with provenance so nothing is double-counted.

## Stage 2 — Market sizing

The free `google-trends` MCP is **Google News + trending-terms**, NOT interest-over-time curves. Use it as a momentum/demand proxy:
- `google-trends.get_news_by_keyword(keyword, period, max_results)` — density & recency of coverage; look for "X surpasses N users / demand grows" signals.
- `google-trends.get_trending_terms(geo)` — is the theme breaking out right now?
- Supplement with `brave_web_search` result breadth + `brave_news_search`.
- **Escalate only if the user approves:** a pytrends/SerpApi source for true interest-over-time.

Verdict per candidate: market size (S/M/L), trajectory (rising/flat/declining), solution-maturity gap (is it still under-solved?). Flag the sweet spot: **large & growing but under-solved**.

## Stage 3 — Social virality (approximate)

No free TikTok Creator-Insight API. Approximate with:
- `brave_video_search(query)` — count/quality of TikTok/YouTube videos on the topic; note view counts in snippets.
- `brave_web_search("<topic> tiktok OR #hashtag views")` — hashtag view-volume mentions.

Verdict: is there enough social footprint to cheaply distribute? Label this signal **APPROXIMATE** in every report.

## Stage 4 — Competition (Product Hunt)

Needs `PRODUCT_HUNT_TOKEN`. Tools: `product-hunt.get_posts(topic, order, count)`, `search_topics(query)`, `get_post_details(slug)`, `get_post_comments`, `check_server_status` (auth/rate check).
Per candidate: list competing launches, assess strength (upvotes, recency, feature maturity), find the **gap / asymmetric angle**. Kill if crowded with strong incumbents and no wedge.

## Reporting & gates (non-negotiable)

- Each stage produces: raw JSON -> `data/stageN-*.json`, and a human-readable **HTML report** -> `reports/stageN-*.html`.
- After each report, **STOP**. The user reviews and decides go/no-go. Never auto-advance.
- Append every decision + rationale to `README.md`'s decision log. Keep the README status table current.
- Final deliverable: `reports/final-ideas.html` — top ideas with the full 4-stage evidence trail, why-now, positioning, and a recommended MVP wedge.

## Scoring rubric (0–3 per axis, used to rank at each gate)

- **Pain intensity** — how acute/frequent/emotional is the complaint.
- **Market size** — breadth of affected audience.
- **Trajectory** — rising vs declining interest.
- **Distribution** — social/organic reach potential.
- **Competition gap** — how winnable vs incumbents.
- **Buildability** — can an indie hacker ship an MVP in weeks.

Rank by weighted total; carry the score through every stage so filtering is transparent.

## HTML report conventions

Self-contained, theme-aware (light/dark via `prefers-color-scheme`), no external assets. Each report includes: title + stage + date, a funnel-position banner (N in → M out), a sortable candidate table with source links, per-candidate verdict + score, an explicit "what was cut and why" section, and a "decision needed" call-to-action at the top. Use the shared style block in `reports/_style.html` (or inline it).
