---
name: factor-analysis
description: Cross-sectional factor analysis for alpha research — Information Coefficient (IC), Information Ratio (IR), quintile / decile portfolio returns, Spearman rank IC, factor decay, and factor combination. Use whenever the user is building or evaluating a stock-selection factor, mentions IC / IR / quintile spread / alphalens, ranks stocks by a signal, or tests "does this number predict next-month returns". This is the standard equity-research workflow for testing whether a cross-sectional signal has alpha before it goes into a portfolio.
---

# Factor Analysis

## When to Use This Skill

Trigger whenever:

- The user has a **cross-sectional** signal (one number per stock per period)
- They want to test "does this signal predict returns"
- "IC", "IR", "quintile", "factor", or "alpha decay" comes up
- They're building a multi-factor stock-selection model
- The portfolio is **dollar-neutral long-short** based on a ranking

For **single-asset time-series signals**, route to `time-series-stats`. For **portfolio combining**, route to `portfolio-optimization`.

## Methodology

### 1. Information Coefficient (IC)

Correlation between the factor at time t and forward returns. Two flavors:

- **Pearson IC**: linear correlation `corr(factor_t, fwd_ret_{t+1})`
- **Spearman IC**: rank correlation — preferred (less sensitive to outliers, captures monotonic relationships)

Compute **per-period** (e.g., daily), then look at the time series.

### 2. Information Ratio (IR)

$$IR = \frac{\text{mean}(IC_t)}{\text{std}(IC_t)} \cdot \sqrt{N}$$

(N = periods per year for annualization)

- IR > 0.5 → real signal, can build a strategy
- IR > 1.0 → strong factor (rare and decays fast)
- IR < 0.3 → likely noise

### 3. Quintile / Decile Portfolios

Sort stocks into N buckets by factor value each period. Compute equal-weighted returns of each bucket.

- **Top minus Bottom (TMB)** spread should be positive and monotonic across quintiles
- Hockey-stick patterns (only Q1 vs Q5 differs, middle is flat) = unstable

### 4. Factor Decay

How far forward does the factor predict? Plot IC for forward windows 1, 5, 10, 20, 60 days. Most factors decay sharply after 5-20 days.

### 5. Sector / Beta Neutralization

Raw factors often have unintended industry or beta exposure. Two fixes:

- **Demean within sector**: subtract sector mean from factor before ranking
- **Regress out beta**: residualize factor on beta and use residuals

### 6. Multi-Factor Combination

When you have several validated factors:

- Z-score each, then average (simplest)
- Regress forward returns on multi-factor matrix; use t-stats as weights
- Build a covariance-aware weighted combination

## Required Libraries

```bash
pip install pandas numpy scipy alphalens-reloaded
```

- `alphalens-reloaded` (Apache 2.0) — full tearsheet for factor analysis
- `scipy.stats.spearmanr` — rank IC

## Code Templates

### Data Shape Required

```python
# factor: DataFrame
#   index = (date, asset)  MultiIndex
#   single column "factor"
# returns: DataFrame
#   index = date
#   columns = asset tickers
# prices: same shape as returns
```

### IC and IR from Scratch

```python
import numpy as np
import pandas as pd
from scipy.stats import spearmanr

def factor_ic(factor: pd.DataFrame, returns: pd.DataFrame,
              periods: tuple = (1, 5, 10, 20)) -> pd.DataFrame:
    """
    factor: MultiIndex (date, asset) DataFrame with column 'factor'
    returns: date x asset DataFrame of period returns
    Returns: DataFrame with daily IC for each forward horizon.
    """
    f_wide = factor["factor"].unstack(level="asset")  # date x asset
    out = pd.DataFrame(index=f_wide.index, columns=[f"IC_{p}d" for p in periods])

    for p in periods:
        fwd_ret = returns.rolling(p).sum().shift(-p)
        # align
        common_dates = f_wide.index.intersection(fwd_ret.index)
        for d in common_dates:
            f = f_wide.loc[d].dropna()
            r = fwd_ret.loc[d].reindex(f.index).dropna()
            common = f.index.intersection(r.index)
            if len(common) > 10:
                ic, _ = spearmanr(f.loc[common], r.loc[common])
                out.at[d, f"IC_{p}d"] = ic
    return out.astype(float)

def ic_summary(ic_df: pd.DataFrame, periods_per_year: int = 252) -> pd.DataFrame:
    summary = pd.DataFrame({
        "mean_IC": ic_df.mean(),
        "std_IC": ic_df.std(),
        "IR": ic_df.mean() / ic_df.std() * np.sqrt(periods_per_year),
        "hit_rate": (ic_df > 0).mean(),
    })
    return summary
```

### Quintile Portfolios

```python
def quintile_returns(factor: pd.DataFrame, returns: pd.DataFrame,
                     n_quintiles: int = 5, holding_days: int = 5) -> pd.DataFrame:
    """Equal-weighted returns of each quintile."""
    f_wide = factor["factor"].unstack(level="asset")
    fwd_ret = returns.rolling(holding_days).sum().shift(-holding_days)
    quintile_rets = pd.DataFrame(index=f_wide.index, columns=range(1, n_quintiles + 1))

    for d in f_wide.index.intersection(fwd_ret.index):
        f = f_wide.loc[d].dropna()
        r = fwd_ret.loc[d].reindex(f.index).dropna()
        df = pd.DataFrame({"f": f, "r": r}).dropna()
        if len(df) < n_quintiles * 5:
            continue
        df["q"] = pd.qcut(df["f"], n_quintiles, labels=False, duplicates="drop") + 1
        for q in range(1, n_quintiles + 1):
            mask = df["q"] == q
            if mask.any():
                quintile_rets.at[d, q] = df.loc[mask, "r"].mean()

    quintile_rets = quintile_rets.astype(float)
    quintile_rets["TMB"] = quintile_rets[n_quintiles] - quintile_rets[1]
    return quintile_rets
```

### Sector Neutralization

```python
def neutralize_sector(factor: pd.Series, sector_map: pd.Series) -> pd.Series:
    """
    factor: Series indexed by asset
    sector_map: Series indexed by asset, values are sector codes
    Returns sector-demeaned factor.
    """
    df = pd.DataFrame({"f": factor, "s": sector_map}).dropna()
    df["f_neut"] = df.groupby("s")["f"].transform(lambda x: x - x.mean())
    return df["f_neut"]
```

### Full Workflow with alphalens-reloaded

```python
import alphalens as al

# factor: MultiIndex (date, asset) Series
# prices: date x asset DataFrame
factor_data = al.utils.get_clean_factor_and_forward_returns(
    factor=factor["factor"],
    prices=prices,
    quantiles=5,
    periods=(1, 5, 10, 20),
    groupby=sector_map,
    binning_by_group=True,  # quintiles within sector
)

# Generate full tearsheet (info ratio, quantile returns, IC heatmap, decay)
al.tears.create_full_tear_sheet(factor_data, by_group=True)
```

### Multi-Factor Z-Score Combination

```python
def combine_factors(factor_dict: dict, weights: dict | None = None) -> pd.DataFrame:
    """
    factor_dict: {name: MultiIndex (date, asset) Series}
    weights: optional name -> weight; default equal
    """
    if weights is None:
        weights = {k: 1 / len(factor_dict) for k in factor_dict}
    z_scored = {}
    for name, f in factor_dict.items():
        # z-score within each date (cross-sectional)
        f_wide = f.unstack(level="asset")
        z = (f_wide.sub(f_wide.mean(axis=1), axis=0)
             .div(f_wide.std(axis=1), axis=0))
        z_scored[name] = z.stack()
    combined = sum(weights[k] * v for k, v in z_scored.items())
    return combined
```

## Pitfalls

- **Look-ahead via factor definition** — make sure factor at date t uses ONLY data available at t (e.g., earnings filed but not yet released don't count).
- **Survivorship in stock universe** — testing on the current S&P 500 means you only test winners. Use point-in-time index membership.
- **Quintile look-ahead** — `pd.qcut` on the cross-section is fine (intra-date); on a time series it's lookahead.
- **Cap-weighting vs equal-weight** — quintile spreads usually shown equal-weighted; cap-weighted is often weaker because small caps drive the signal.
- **Reporting one IC point estimate without IR** — high IC with high std is luck. Always report IR.
- **Cross-sectional vs time-series factors** — this skill is cross-sectional. A "value factor" that varies over time but not across stocks is a different beast.
- **Decay is your friend**: a factor that works only at 60-day horizon may be uninvestable due to transaction costs.
- **Crowding**: famous factors (value, momentum, quality) are crowded and have lower IR than 20 years ago. Plot rolling 1-year IR.

## References

- Grinold & Kahn (1999). *Active Portfolio Management* — definitive on IC/IR.
- alphalens-reloaded: https://github.com/stefan-jansen/alphalens-reloaded
- Fama & French (1992, 1993, 2015) — canonical factor papers.
- Asness et al. (2013). *Value and Momentum Everywhere*.

## Related Skills

- `portfolio-optimization` — combining validated factors into a portfolio
- `time-series-cv` — when factor is fed into an ML model
- `time-series-stats` — for time-series factor properties
- `idea-generation` (in `research/`) — sourcing candidate factors
