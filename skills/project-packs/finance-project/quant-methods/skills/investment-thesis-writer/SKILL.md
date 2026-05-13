---
name: investment-thesis-writer
description: Structured framework for writing a defensible investment thesis — thesis statement, supporting variant view, key catalysts with dates and probabilities, falsification conditions (what proves us wrong), explicit risk register, position sizing recommendation, and exit triggers. Use whenever the user is writing or formalizing an investment thesis, capturing a long / short idea, preparing an IC (investment committee) memo, documenting why they hold a position, or asks for "thesis writeup", "pitch", "investment memo", or "long write-up". A good thesis is testable and time-bound, not a vibes paragraph — this skill enforces that discipline.
---

# Investment Thesis Writer

## When to Use This Skill

Trigger whenever:

- The user is writing a long / short pitch
- An "investment thesis", "thesis", "memo", "IC memo", "pitch" is mentioned
- A new position is being formalized — even informally ("I think X is interesting because…")
- An existing position needs an updated writeup
- The user asks "how do I make sure I have a real thesis"

For **multi-stakeholder IB / PE deal memos**, the existing `ic-memo`, `cim-builder`, `investment-proposal` skills (in `advisory/`) are richer. This skill is for the **personal / fund investment thesis** discipline.

For **tracking** a thesis over time, route to `thesis-tracker` and `trader-memory-core`.

## Required Structure (the contract)

A useful investment thesis must contain — at minimum — all of these:

1. **One-line thesis** — what view do you hold, in one sentence
2. **Variant view** — what does the consensus believe, and where do you differ specifically
3. **Catalysts** — what specific events / dates could revalue the security toward your view
4. **Time horizon** — when do you expect the thesis to play out
5. **Falsification conditions** — what would prove you wrong and force exit
6. **Key risks** — what could go wrong even if thesis is right
7. **Position sizing** — how big given conviction and risk
8. **Exit plan** — at what price/condition do you take profit / cut loss

Missing any of these = not a thesis, just an opinion.

## Template

```markdown
# Investment Thesis: [Ticker] — [Title]

**Author**: [you]  **Date**: [YYYY-MM-DD]  **Position**: Long / Short
**Current Price**: $___  **Price Target**: $___ (X% upside, Y-month horizon)
**Conviction**: Low / Medium / High  **Position Size**: X% of portfolio

---

## 1. Thesis (one sentence)

[ONE sentence. Subject-verb-object. Avoid "I think". State the view as a falsifiable claim.]

> Example: AAPL services revenue will grow >18% per year for the next 3 years, materially above the 12% consensus, driving multiple expansion to 32x from 25x today.

## 2. Variant View

**Consensus believes:** [what the sell-side / market currently thinks]
**We believe:** [the specific differentiated view]
**Why we're right:** [the asymmetric information, mispriced data point, or framework difference]

## 3. Catalysts

| Date | Catalyst | Probability | Impact if hit |
|---|---|---|---|
| 2026-Q3 earnings | iPhone refresh cycle data | 70% | +5-8% |
| 2026 WWDC | AI strategy reveal | 60% | +3-6% |
| Regulatory ruling on App Store | Court decision | 40% | -10% / +5% |

## 4. Time Horizon

- **Primary**: [12-24 months — most theses don't work below this]
- **Re-check at**: [first major catalyst date]

## 5. Falsification Conditions ("Stop Loss for the Thesis")

We exit immediately if:

- [ ] [Specific condition 1 — must be observable, not interpretive]
- [ ] [Specific condition 2]
- [ ] [Stock down X% on news that confirms a thesis-breaking event]

> Example: "If services revenue growth comes in below 14% for two consecutive quarters, the variant view is dead."

## 6. Key Risks

1. **[Risk name]** — [mechanism, probability, impact]
2. ...

## 7. Position Sizing

- **Conviction**: [number 1-10 with justification]
- **Risk per share**: $___ (from price target to falsification trigger)
- **Position size**: $___ (target loss given falsification × portfolio risk budget)
- **Heat budget check**: Combined open thesis risk = X% (below Y% limit?)

## 8. Exit Plan

- **Take profit at**: $___ ([reasoning — multiple compression, catalyst hit, etc.])
- **Stop**: $___ (hard exit at this technical / fundamental level)
- **Re-rate**: [conditions under which thesis is upgraded / size increased]

---

## Appendix

- [ ] Financial model link
- [ ] Comparable companies analyzed
- [ ] Management quality assessment
- [ ] Sources cited
```

## Common Failure Modes

### Vibes Thesis

> "I like AAPL. Great company, strong moat, AI tailwind."

**What's wrong**: no variant view, no catalyst, no falsification. This is opinion, not thesis.

### Thesis with Untestable Falsification

> "I'll sell if the long-term value proposition changes."

**Wrong**: "long-term value proposition" can't be observed in real time. Falsification must be a specific number on a specific report.

### Catalyst Without Probability

> "AAPL has positive catalysts ahead."

**Wrong**: list them, attach a probability and impact estimate. Even rough numbers (30%, 70%) force you to think.

### Time Horizon "Long-term"

> "I'm a long-term investor."

**Wrong**: state a number of months. Define what "playing out" looks like and when. Otherwise, you'll never exit when wrong.

### Position Sizing Decoupled from Risk

> "I bought a 10% position because I have high conviction."

**Wrong**: size must come from `position_loss = (price - stop_price) × shares`, capped to your portfolio risk budget. See `bet-sizing` and `position-sizer`.

## Quality Checklist (run before submitting)

- [ ] Can a hostile reader cite ONE sentence as "the claim"?
- [ ] Could you set a Bloomberg alert that triggers when falsification condition is met?
- [ ] Are catalyst dates concrete (not "next year") and probabilities numeric?
- [ ] Does position size mathematically follow from stop distance × portfolio heat?
- [ ] Is the variant view specific (a number, not "I think there's more upside")?
- [ ] If the stock moves 5% against you tomorrow, do you know whether that fits your thesis?

If any box is unchecked, the thesis isn't done.

## Workflow

When invoked, walk the user through the template **interactively**:

1. Ask for ticker, side, current price, rough horizon
2. Probe for the **variant view** until specific — "what specifically does the market have wrong"
3. Force enumeration of at least 2 falsification conditions
4. Compute position size from stop distance, not from conviction alone
5. Output the filled markdown template
6. Suggest registering with `thesis-tracker` for ongoing monitoring

## Pitfalls

- **Anchoring on the buy price** — falsification should be a thesis condition, not "−15% from where I bought"
- **Multi-thesis pile-up** — five active theses on similar names = one bet. Track total correlated risk.
- **Refusing to update** — when new information arrives, the thesis is restated, not preserved. Tracker tools force this.
- **Over-quantifying** — assigning probabilities to catalysts adds discipline, but precision is illusory. Wide ranges (30-50%) are honest.
- **Hindsight rewriting** — if it works, the thesis is "obviously correct"; if it fails, "well, the world changed". Keep the original document immutable; append updates, don't overwrite.

## References

- Greenblatt (1997). *You Can Be a Stock Market Genius*.
- Klarman (1991). *Margin of Safety*.
- Anson (2021). *Trade-Off: The Decision Theory of Active Investing*.
- Annie Duke (2018). *Thinking in Bets*.

## Related Skills

- `thesis-tracker` (in `research/`) — monitor live theses
- `trader-memory-core` (in `research/`) — lifecycle management
- `ic-memo` (in `advisory/`) — institutional version
- `bet-sizing` (in `modeling/`) — math for position sizing
- `signal-postmortem` (in `research/`) — closing thesis with lessons
