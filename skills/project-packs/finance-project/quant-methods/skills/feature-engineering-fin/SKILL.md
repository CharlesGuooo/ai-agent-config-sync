---
name: feature-engineering-fin
description: Financial feature engineering — Fractional Differentiation (memory-preserving stationarization), structural break features (CUSUM, Chow), market microstructure features (Roll spread, Kyle's lambda, VPIN, Amihud illiquidity), and information-driven bars (tick / volume / dollar / imbalance bars). Use whenever the user is building features for a financial ML model, mentions fractional differencing, asks how to make a price series stationary "without losing memory", explores microstructure / order-book features, or wants alternatives to time-bars. Most financial ML features are misspecified at the very first step — this skill fixes that.
---

# Financial Feature Engineering

## When to Use This Skill

Trigger whenever:

- The user is preparing X (features) for a financial ML model
- "Stationarize" or "differencing" comes up — they're probably about to lose all the memory
- Order-book or trade-tape data is available and being aggregated
- Time-bars feel like they don't reflect actual market activity
- They want microstructure features for HFT or execution work

For **labels (y)**, route to `labeling`. For **validation**, route to `time-series-cv`.

## Methodology

### 1. Fractional Differentiation (López de Prado 2018, ch. 5)

Plain first differencing makes a series stationary but destroys long-memory structure. Fractional differentiation removes the **minimum** memory needed:

$$\tilde{X}_t = (1 - L)^d X_t = \sum_{k=0}^\infty (-1)^k \binom{d}{k} X_{t-k}$$

For `d ∈ (0, 1)`, you get a stationary series that still encodes past levels. Procedure: find the **smallest d** that passes ADF.

### 2. Information-Driven Bars (López de Prado 2018, ch. 2)

Time bars (1-minute, 1-day) sample arbitrary intervals — markets are not uniform in time.

- **Tick bars**: every N trades
- **Volume bars**: every N shares traded
- **Dollar bars**: every $N of notional traded
- **Imbalance bars**: triggered when signed-volume imbalance exceeds a threshold (captures information events)

Dollar bars are the most useful default — they're scale-invariant and capture "real" activity.

### 3. Market Microstructure Features

- **Roll spread**: bid-ask spread proxy from autocovariance of price changes
- **Kyle's λ**: price impact per unit signed volume — `λ = cov(Δp, signed_vol) / var(signed_vol)`
- **VPIN (Volume-Synchronized Probability of Informed Trading)**: toxicity measure used by HFT
- **Amihud illiquidity**: `|return| / dollar_volume` — rolling average; classic illiquidity proxy
- **Realized variance** & jump components

### 4. Structural Break Features

- **CUSUM filter**: detects level shifts; useful as a binary event feature
- **Chow test stats** over a window
- **Change-point dummies** from the `regime-detection` skill

### 5. Technical Indicator Care

Most technical indicators (RSI, MACD, Bollinger) have implicit lookback parameters. When building features:

- Compute over **multiple horizons** (5, 20, 60), let the model pick
- Be paranoid about **lookahead**: an indicator at time t can only use data through t-1 if you're trading at t's open
- Normalize cross-sectionally if running cross-section ML

## Required Libraries

```bash
pip install pandas numpy scipy statsmodels pandas-ta
```

- `pandas-ta` — wide library of technical indicators
- `scipy.special` — for binomial coefficients in frac diff
- All microstructure features: hand-rolled

## Code Templates

### Fractional Differentiation — Find Optimal d

```python
import numpy as np
import pandas as pd
from statsmodels.tsa.stattools import adfuller

def frac_diff_weights(d: float, threshold: float = 1e-5) -> np.ndarray:
    """Generate weights for fractional difference operator (1-L)^d.
    Truncates when |w_k| < threshold."""
    w = [1.0]
    k = 1
    while True:
        w_k = -w[-1] * (d - k + 1) / k
        if abs(w_k) < threshold:
            break
        w.append(w_k)
        k += 1
    return np.array(w[::-1])  # most recent weight last

def frac_diff(series: pd.Series, d: float, threshold: float = 1e-5) -> pd.Series:
    weights = frac_diff_weights(d, threshold)
    width = len(weights) - 1
    out = pd.Series(index=series.index, dtype=float)
    for i in range(width, len(series)):
        out.iloc[i] = np.dot(weights, series.iloc[i - width:i + 1])
    return out.dropna()

def find_min_d_stationary(series: pd.Series, ds=np.arange(0, 1.05, 0.05),
                          alpha: float = 0.05) -> float:
    """Smallest d such that ADF rejects unit root."""
    for d in ds:
        fd = frac_diff(series, d)
        if len(fd) < 30:
            continue
        adf_p = adfuller(fd)[1]
        if adf_p < alpha:
            return d
    return 1.0  # fall back to first differencing
```

### Dollar Bars

```python
def dollar_bars(ticks: pd.DataFrame, threshold: float) -> pd.DataFrame:
    """
    ticks: DataFrame with columns ['timestamp', 'price', 'volume'].
    Returns OHLCV-like bars triggered every `threshold` dollars of volume.
    """
    bars = []
    cumdv = 0.0
    bar = {"open": None, "high": -np.inf, "low": np.inf,
           "close": None, "volume": 0, "start": None, "end": None}

    for _, t in ticks.iterrows():
        if bar["open"] is None:
            bar["open"] = t["price"]
            bar["start"] = t["timestamp"]
        bar["high"] = max(bar["high"], t["price"])
        bar["low"] = min(bar["low"], t["price"])
        bar["close"] = t["price"]
        bar["volume"] += t["volume"]
        bar["end"] = t["timestamp"]
        cumdv += t["price"] * t["volume"]
        if cumdv >= threshold:
            bars.append(bar)
            cumdv = 0.0
            bar = {"open": None, "high": -np.inf, "low": np.inf,
                   "close": None, "volume": 0, "start": None, "end": None}

    return pd.DataFrame(bars)
```

### Microstructure Features

```python
def roll_spread(price: pd.Series, window: int = 20) -> pd.Series:
    """Roll's serial-covariance bid-ask spread proxy."""
    dp = price.diff()
    cov = dp.rolling(window).apply(lambda x: np.cov(x[:-1], x[1:])[0, 1], raw=True)
    return 2 * np.sqrt(-cov.clip(upper=0))

def kyle_lambda(price: pd.Series, signed_volume: pd.Series, window: int = 50) -> pd.Series:
    """Kyle's lambda: price impact per unit signed volume."""
    dp = price.diff()
    cov = dp.rolling(window).cov(signed_volume)
    var = signed_volume.rolling(window).var()
    return cov / var

def amihud_illiquidity(returns: pd.Series, dollar_vol: pd.Series,
                       window: int = 20) -> pd.Series:
    """|return| / dollar volume, rolling mean."""
    return (returns.abs() / dollar_vol).rolling(window).mean()

def realized_variance(returns: pd.Series, window: int = 5) -> pd.Series:
    return (returns ** 2).rolling(window).sum()
```

### CUSUM Event Filter

```python
def cusum_events(price: pd.Series, h: float) -> pd.DatetimeIndex:
    """
    Detect timestamps where cumulative return crosses ±h.
    Used to sample events for Triple Barrier labeling.
    """
    events = []
    s_pos = s_neg = 0.0
    log_p = np.log(price)
    dlp = log_p.diff().dropna()
    for t, r in dlp.items():
        s_pos = max(0, s_pos + r)
        s_neg = min(0, s_neg + r)
        if s_pos > h:
            events.append(t); s_pos = 0
        elif s_neg < -h:
            events.append(t); s_neg = 0
    return pd.DatetimeIndex(events)
```

### Multi-Horizon Feature Block

```python
def make_features(prices: pd.Series, dollar_vol: pd.Series) -> pd.DataFrame:
    feats = {}
    for h in [5, 20, 60]:
        feats[f"ret_{h}d"] = prices.pct_change(h)
        feats[f"vol_{h}d"] = prices.pct_change().rolling(h).std()
        feats[f"mom_{h}d"] = prices / prices.shift(h) - 1
        feats[f"amihud_{h}d"] = amihud_illiquidity(prices.pct_change(),
                                                    dollar_vol, h)
    feats["roll_spread_20"] = roll_spread(prices, 20)
    df = pd.DataFrame(feats)
    # Important: shift by 1 to avoid using same-bar close for current-bar decisions
    return df.shift(1).dropna()
```

## Pitfalls

- **Lookahead in indicators** — `df['rsi'] = ta.rsi(df['close'])` uses today's close. If you trade at today's open, shift by 1.
- **Stationarity destruction** — `df.diff()` loses memory. Test if fractional differencing keeps more info.
- **Survivorship in features** — sector-mean features computed on the current index leak future information about which stocks survived.
- **Feature lookback ≠ embargo** — features with long lookback (e.g., 252-day vol) require equally long embargoes in CV. See `time-series-cv`.
- **Tick bars need adjustment for after-hours / pre-market** — splits and dividends can create artifact bars.
- **Microstructure features need clean data** — bad ticks, locked/crossed quotes, exchange-specific issues. Filter aggressively.
- **Don't normalize across time** — z-scoring a feature using full-sample stats leaks. Use rolling stats.

## References

- López de Prado (2018). *Advances in Financial Machine Learning*, ch. 2 (bars) and 5 (frac diff).
- Roll (1984). *A Simple Implicit Measure of the Effective Bid-Ask Spread*.
- Kyle (1985). *Continuous Auctions and Insider Trading*.
- Easley et al. (2012). *Flow Toxicity and Liquidity in a High-Frequency World* (VPIN).
- Amihud (2002). *Illiquidity and Stock Returns*.

## Related Skills

- `labeling` — pairs with these features to produce (X, y)
- `time-series-cv` — embargo must match feature lookback
- `time-series-stats` — stationarity tests called from frac diff routine
- `volatility-modeling` — realized vol features
