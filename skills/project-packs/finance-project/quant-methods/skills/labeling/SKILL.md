---
name: labeling
description: Generate ML training labels from financial time series in ways that match trading reality — Triple Barrier Method, Meta-Labeling, Fixed-Time-Horizon, and Trend-Scanning labels. Use whenever the user is preparing the target variable y for a financial ML model, defining "success" for a trade, training a classifier on price action, asks "what should I predict", or is wrestling with imbalanced classes / weak signals in finance. The choice of labeling scheme often matters more than the choice of model, and naively predicting "next-bar return sign" is one of the most common reasons financial ML models fail.
---

# Financial Labeling for ML

## When to Use This Skill

Trigger whenever:

- The user is setting up a supervised learning problem on price/return data
- The label is currently "did price go up next bar" (the worst common default)
- Trade exit logic involves take-profit, stop-loss, and time-stop — but the label ignores them
- The user wants a second-stage model to filter signals (meta-labeling)
- Class imbalance is a problem
- Overlapping labels are creating dependent samples (relates to `time-series-cv`)

## Why Naive Labels Fail

Predicting the sign of `r_{t+1}` ignores:

- **Transaction costs**: a +0.05% prediction that's correct earns nothing after costs
- **Risk asymmetry**: a +1% move that came after a -5% drawdown is unprofitable
- **Path dependence**: stops would have exited before the "predicted" bar
- **Variable holding**: fixed-time labels force a horizon irrelevant to the strategy

Better labels embed the **decision logic** of the strategy.

## Methodology

### 1. Triple Barrier Method (López de Prado 2018)

For each event time `t_event`, define three barriers:

- **Upper barrier**: `entry_price * (1 + take_profit)` — TP target
- **Lower barrier**: `entry_price * (1 - stop_loss)` — SL
- **Vertical barrier**: `t_event + max_holding_days` — time stop

The label is which barrier is hit first:
- `+1` if upper barrier first → win
- `-1` if lower barrier first → loss
- `0` if vertical barrier first → time stop

Barriers can be **dynamic** (e.g., set TP/SL as multiples of recent ATR or rolling volatility), which makes labels scale-invariant across regimes.

### 2. Meta-Labeling (López de Prado 2018, ch. 3.6)

Two-stage architecture:

1. **Primary model**: produces side (+1 long / -1 short / 0 no-trade). Can be a rule-based system (MA crossover, mean-reversion signal) or a separate ML model.
2. **Secondary (meta) model**: given the primary model fired, predicts the *probability* it will be profitable. Output is "trade size", not "trade direction".

The meta-model only sees periods when the primary fires — it learns to filter false positives. Massively improves precision without sacrificing recall on the strong signals.

### 3. Fixed-Time Horizon (FTH)

`y_t = sign(p_{t+H} / p_t - 1)` for horizon H. Simplest. Use only as a baseline or when the strategy itself has a fixed holding period.

### 4. Trend-Scanning Labels (López de Prado 2018)

Fit linear regression on a rolling forward window, label by sign and significance of slope. Captures "is there a tradable trend starting here", regardless of magnitude.

## Required Libraries

```bash
pip install numpy pandas scikit-learn statsmodels
```

No mlfinlab needed — all algorithms below are self-implemented from public papers.

## Code Templates

### Triple Barrier (~70 lines)

```python
import numpy as np
import pandas as pd

def triple_barrier_labels(
    prices: pd.Series,
    events: pd.DatetimeIndex,
    sl_pct: float | pd.Series,
    tp_pct: float | pd.Series,
    max_holding: pd.Timedelta,
) -> pd.DataFrame:
    """
    Triple Barrier Method (López de Prado 2018).

    prices: pd.Series of close prices, datetime index
    events: timestamps when we entered a hypothetical trade
    sl_pct, tp_pct: stop-loss / take-profit thresholds.
        Can be scalar or pd.Series indexed by event (dynamic barriers).
    max_holding: time barrier (e.g., pd.Timedelta(days=5))

    Returns DataFrame indexed by event time with columns:
        t1: which barrier hit first (timestamp)
        bin: label in {-1, 0, +1}
        ret: realized return at t1
    """
    out = pd.DataFrame(index=events, columns=["t1", "bin", "ret"])

    if np.isscalar(sl_pct):
        sl_pct = pd.Series(sl_pct, index=events)
    if np.isscalar(tp_pct):
        tp_pct = pd.Series(tp_pct, index=events)

    for t in events:
        entry = prices.loc[t]
        upper = entry * (1 + tp_pct.loc[t])
        lower = entry * (1 - sl_pct.loc[t])
        vert_t = t + max_holding

        window = prices.loc[t:vert_t]
        up_hit = window[window >= upper].index.min() if (window >= upper).any() else pd.NaT
        dn_hit = window[window <= lower].index.min() if (window <= lower).any() else pd.NaT

        candidates = {
            "upper": up_hit, "lower": dn_hit, "vert": vert_t
        }
        first = min(candidates, key=lambda k: candidates[k] if pd.notna(candidates[k]) else pd.Timestamp.max)
        t1 = candidates[first]

        out.at[t, "t1"] = t1
        out.at[t, "ret"] = prices.loc[t1] / entry - 1
        out.at[t, "bin"] = {"upper": 1, "lower": -1, "vert": 0}[first]

    return out.astype({"bin": int})
```

### Dynamic Barriers from Rolling Volatility

```python
def dynamic_barriers(prices: pd.Series, span: int = 20,
                     sl_mult: float = 1.0, tp_mult: float = 2.0):
    """Volatility-scaled SL/TP. Daily prices."""
    rets = prices.pct_change()
    vol = rets.ewm(span=span).std()
    return sl_mult * vol, tp_mult * vol  # series of pct stops/targets
```

### Meta-Labeling

```python
# Step 1: primary model fires (rule-based example)
def primary_signal(prices):
    """Trivial moving-average crossover."""
    fast = prices.rolling(20).mean()
    slow = prices.rolling(50).mean()
    return pd.Series(np.where(fast > slow, 1, -1), index=prices.index)

# Step 2: only label when primary fires
side = primary_signal(prices)
events = side[side != 0].index

# Step 3: Triple Barrier on these events
labels = triple_barrier_labels(prices, events, sl_pct=0.02, tp_pct=0.04,
                                max_holding=pd.Timedelta(days=5))

# Step 4: meta label is "did this primary signal make money?"
# bin=+1 means TP hit (matches our side); -1 means SL hit
labels["meta"] = (labels["bin"] * side.loc[labels.index] > 0).astype(int)

# Step 5: train meta-classifier on features known at t to predict meta
# from sklearn.ensemble import RandomForestClassifier
# X_meta = features.loc[labels.index]
# y_meta = labels["meta"]
# clf.fit(X_meta, y_meta)
# At inference: take primary signal only if meta_proba > threshold
```

### Sample Weights for Overlapping Labels

```python
def sample_weights_by_uniqueness(label_end_times: pd.Series, bars_index: pd.DatetimeIndex):
    """
    Down-weight events whose label horizon overlaps with many others.
    label_end_times: Series of t1 (event end times), indexed by event start.
    """
    n_events = len(label_end_times)
    overlap = pd.Series(0.0, index=bars_index)
    for t0, t1 in label_end_times.items():
        overlap.loc[t0:t1] += 1.0
    weights = pd.Series(0.0, index=label_end_times.index)
    for t0, t1 in label_end_times.items():
        weights[t0] = (1.0 / overlap.loc[t0:t1]).mean()
    return weights / weights.sum() * n_events  # normalized
```

### Trend Scanning

```python
from scipy.stats import linregress

def trend_scanning_labels(prices: pd.Series, look_forward: int = 20,
                          t_threshold: float = 2.0):
    """
    Label by significance of forward-looking linear trend.
    """
    log_p = np.log(prices)
    labels = pd.Series(index=prices.index[:-look_forward], dtype=int)
    for i in range(len(labels)):
        y = log_p.iloc[i:i+look_forward].values
        x = np.arange(look_forward)
        slope, _, _, _, stderr = linregress(x, y)
        t = slope / stderr if stderr > 0 else 0
        labels.iloc[i] = int(np.sign(t)) if abs(t) > t_threshold else 0
    return labels
```

## Pitfalls

- **TBM with single horizon vs vertical barrier hit** — when the time stop fires often, you have a 3-class problem; consider binary `{win, not-win}` instead.
- **Class imbalance** — wide TP barriers produce few +1 labels; balance with `class_weight='balanced'` or focal loss, don't oversample (breaks time ordering).
- **Barrier multiplier choice** — TP/SL multipliers (1× / 2× vol) determine the risk-reward your model is being trained on. Match strategy intent.
- **Forgetting `t1`** — TBM produces variable label end times. You MUST pass these to `time-series-cv` for purging, or you leak.
- **Meta-labeling without primary diversity** — if the primary fires every bar, meta-labeling is just supervised classification with extra steps. The primary needs to be selective.
- **Lookahead in dynamic barriers** — volatility for setting TP/SL must use **trailing** windows, not forward.

## References

- López de Prado (2018). *Advances in Financial Machine Learning*, ch. 3 (TBM, sample weights) and 5 (meta-labeling).
- Original meta-labeling paper: Joubert & López de Prado (2022). *Meta-Labeling: Theory and Framework*. SSRN.

## Related Skills

- `time-series-cv` — uses the `t1` series produced here
- `feature-engineering-fin` — produces the X for these labels
- `bet-sizing` — converts meta-model probabilities to position sizes
