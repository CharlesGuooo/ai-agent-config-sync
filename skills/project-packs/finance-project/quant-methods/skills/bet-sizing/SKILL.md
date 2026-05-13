---
name: bet-sizing
description: Convert model signals and probabilities into trade sizes — Kelly Criterion (full and fractional), ML-probability-to-position-size (López de Prado), concurrency-adjusted sizing, vol targeting, and discrete sizing for whole-share constraints. Use whenever the user has a model output (probability, expected return, signal score) and asks "how big should the position be", mentions Kelly, sizes by conviction or probability, scales by volatility, or coordinates concurrent positions. Bet sizing is where ML alpha meets P&L — even a great signal can be ruined by bad sizing.
---

# Bet Sizing

## When to Use This Skill

Trigger whenever:

- A signal exists and the question is "how many shares / what notional / what %"
- "Kelly", "fractional Kelly", "vol targeting" come up
- An ML model outputs probabilities and the user wants to convert to a position
- Multiple positions overlap and the user wants to size each
- The user asks "should I bet more on high-conviction signals"

For **risk-based stop-loss-distance sizing** of a single equity trade, the existing `position-sizer` (in `portfolio/`) is the practitioner version. This skill covers the **mathematical / ML-output** angle.

## Methodology

### 1. Kelly Criterion (1956)

For a binary bet with win probability `p`, win payoff `b`, lose payoff `-a`:

$$f^* = \frac{p \cdot b - (1-p) \cdot a}{a \cdot b}$$

For a continuous return with mean μ and variance σ²:

$$f^* = \frac{\mu}{\sigma^2}$$

(both express the fraction of bankroll to bet)

**Full Kelly is too aggressive** in practice — high variance and assumes perfect probability estimates. Most practitioners use **fractional Kelly**: bet `0.25 × f*` or `0.5 × f*`. Half-Kelly reaches ~75% of full-Kelly's growth with ~half the volatility.

### 2. ML Probability → Position Size (López de Prado 2018, ch. 10)

Given a meta-model probability `p > 0.5` (probability the trade is profitable), convert to a position size via:

$$z = \frac{p - 0.5}{\sqrt{p (1 - p)}}$$

$$\text{size} = 2 \cdot \Phi(z) - 1 \quad \in [-1, +1]$$

(Φ = standard normal CDF.) The size scales smoothly from 0 (at p=0.5) to 1 (at p→1). Combine with the model's predicted side to get signed size.

### 3. Volatility Targeting

Scale exposure inversely to recent volatility:

$$w_t = \frac{\sigma_{\text{target}}}{\hat\sigma_t}$$

Keeps the *risk* of the strategy roughly constant. Sharpe stays the same in theory, but **realized drawdowns are much smoother**. Standard in CTA / trend-following.

### 4. Concurrency Adjustment

When multiple positions overlap (TBM events with t1 > next t0), they share risk. Adjust sizes:

$$\text{size}_i = \frac{\text{raw size}_i}{c_i}$$

where `c_i` = number of concurrent positions at the time of bet i.

### 5. Bet Sizing from Continuous Signal

If signal is a continuous score (not probability), z-score it cross-sectionally or across time, then apply `tanh` or rank-to-quantile mapping.

### 6. Discrete Sizing (Whole Shares)

After computing target notional, round to whole shares but ensure rounding doesn't change side. For multi-leg trades (pairs), preserve hedge ratio after rounding.

## Required Libraries

```bash
pip install numpy pandas scipy
```

All algorithms below are self-implemented.

## Code Templates

### Kelly for Single Bet

```python
import numpy as np

def kelly_binary(p: float, b: float, a: float = 1.0) -> float:
    """Kelly fraction for binary bet. b: win payoff, a: lose payoff."""
    f = (p * b - (1 - p) * a) / (a * b)
    return max(0.0, f)  # never bet if Kelly < 0

def kelly_continuous(mu: float, sigma: float) -> float:
    """Kelly for continuous return with mean mu, stddev sigma."""
    return mu / (sigma ** 2) if sigma > 0 else 0.0

def fractional_kelly(f_star: float, fraction: float = 0.5) -> float:
    return fraction * f_star
```

### ML Probability → Size

```python
from scipy.stats import norm

def prob_to_size(prob: float, side: int) -> float:
    """
    prob: probability that the trade is profitable (from meta-model), > 0.5
    side: +1 (long) or -1 (short)
    Returns signed size in [-1, +1].
    """
    if prob <= 0.5:
        return 0.0
    z = (prob - 0.5) / np.sqrt(prob * (1 - prob))
    size = 2 * norm.cdf(z) - 1
    return size * side
```

### Vectorized Vol Targeting

```python
def vol_target_weights(returns: pd.Series, target_ann_vol: float = 0.15,
                       lookback: int = 60, cap: float = 3.0) -> pd.Series:
    """
    target_ann_vol: e.g., 0.15 = 15% annualized
    cap: maximum leverage
    Returns leverage to apply at each time t (using t-1 vol).
    """
    realized = returns.rolling(lookback).std() * np.sqrt(252)
    leverage = (target_ann_vol / realized).shift(1).clip(upper=cap)
    return leverage.fillna(0)
```

### Concurrency-Adjusted Sizing

```python
def concurrency_count(t0: pd.Series, t1: pd.Series) -> pd.Series:
    """
    t0: event start times (index)
    t1: event end times (Series, same index as events)
    Returns count of concurrent events at each event start.
    """
    counts = pd.Series(0, index=t0)
    for i, start in enumerate(t0):
        end_i = t1.iloc[i]
        # other events active at `start` to `end_i`
        active = ((t0 < end_i) & (t1 > start)).sum()
        counts.iloc[i] = active
    return counts

def adjust_for_concurrency(raw_sizes: pd.Series, t0, t1) -> pd.Series:
    c = concurrency_count(t0, t1)
    return raw_sizes / c.clip(lower=1)
```

### Continuous Signal → Position (Cross-Sectional)

```python
def signal_to_weights(signal: pd.DataFrame, gross_leverage: float = 1.0,
                     dollar_neutral: bool = True) -> pd.DataFrame:
    """
    signal: date x asset DataFrame of factor values
    Returns weights summing to ±gross_leverage, dollar-neutral if requested.
    """
    # Cross-sectional z-score, then rank, then scale
    z = signal.sub(signal.mean(axis=1), axis=0).div(signal.std(axis=1), axis=0)
    rank = z.rank(axis=1, pct=True) - 0.5  # [-0.5, 0.5]
    weights = rank * 2  # [-1, 1]
    # Normalize gross
    weights = weights.div(weights.abs().sum(axis=1) / gross_leverage, axis=0)
    if dollar_neutral:
        weights = weights.sub(weights.mean(axis=1), axis=0)
    return weights
```

### Discrete Sizing with Hedge Preservation

```python
def discrete_shares(target_notional: float, price: float, lot: int = 1) -> int:
    """Round to whole lot, preserving sign."""
    raw = target_notional / price
    sign = np.sign(raw)
    shares = int(abs(raw) // lot) * lot
    return int(sign * shares)

def pair_shares(target_notional: float, prices: tuple, beta: float):
    """For pair trade Y - β*X with target notional in dollars on the Y leg."""
    p_y, p_x = prices
    sh_y = discrete_shares(target_notional, p_y)
    # Hedge X with beta-adjusted shares
    sh_x = -discrete_shares(beta * sh_y * p_y / p_x * p_x, p_x)
    return sh_y, sh_x
```

### Putting It Together: ML Signal → Sized Trade

```python
def ml_to_trade_size(prob_profit: float, predicted_side: int,
                     equity: float, vol_annualized: float,
                     target_ann_vol: float = 0.15,
                     kelly_fraction: float = 0.5) -> float:
    """
    Composite sizing:
      1. Convert prob → unit size in [-1, +1]
      2. Apply vol targeting
      3. Apply fractional Kelly cap
    """
    unit_size = prob_to_size(prob_profit, predicted_side)
    vol_lever = target_ann_vol / max(vol_annualized, 1e-6)
    raw_dollar = unit_size * vol_lever * equity
    # Kelly cap based on unit-size Sharpe (proxy)
    # (conservative ceiling: never exceed kelly_fraction × full Kelly given p)
    kelly_ceiling = kelly_fraction * (prob_profit - (1 - prob_profit)) * equity
    return float(np.sign(raw_dollar) * min(abs(raw_dollar), abs(kelly_ceiling)))
```

## Pitfalls

- **Full Kelly ruin** — Kelly assumes you know `p` exactly. Estimation error makes full Kelly aggressive; expected drawdown is ~50% on full Kelly even for a true edge.
- **Probability calibration** — `predict_proba` from a tree-based classifier is poorly calibrated. Apply Platt scaling or isotonic regression on a held-out set before using as `p`.
- **Negative-edge sizing** — if your model's calibrated `p < 0.5`, sizing is 0 (not "short"). Side comes from a separate model.
- **Vol targeting after fact** — using same-day vol to size today's position is lookahead. Always use yesterday's-or-earlier vol.
- **Compounding ruin** — vol targeting can demand leverage > 1 after a drawdown; cap.
- **Concurrency double-count** — if you don't adjust for overlap, sample-weight regularization is doing the opposite job (also adjusting). Don't double-correct.
- **Whole-share rounding can break dollar neutrality** in cross-sectional strategies; rebalance occasionally to restore.

## References

- Kelly (1956). *A New Interpretation of Information Rate*.
- Thorp (2006). *The Kelly Criterion in Blackjack, Sports Betting, and the Stock Market*.
- MacLean, Thorp & Ziemba (2010). *The Kelly Capital Growth Investment Criterion*.
- López de Prado (2018) ch. 10 — Bet Sizing from ML predictions.

## Related Skills

- `labeling` — meta-labels feed `prob_to_size`
- `risk-metrics` — vol estimates feed vol targeting
- `position-sizer` (in `portfolio/`) — ATR-based practitioner sizing
- `portfolio-optimization` — multi-asset version of sizing
