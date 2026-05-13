---
name: economic-indicators
description: Construct quantitative features from macro / economic data — yield curve features (10Y-2Y, 10Y-3M, level, slope, curvature), leading indicators (Conference Board LEI components), business cycle phase classification (NBER), inflation surprises, and credit / financial conditions indices. Use whenever the user wants to feature-engineer macro data for a model, mentions FRED / yield curve / recession indicator / NBER / financial conditions, asks "is a recession coming", builds a macro overlay for an equity strategy, or constructs a top-down / regime feature set. Macro features are noisy and slow-moving — this skill explains which ones actually carry signal.
---

# Economic Indicators (Quant Features)

## When to Use This Skill

Trigger whenever:

- The user is **feature-engineering** macro inputs for a model
- Yield-curve features (2s10s, etc.) come up
- Recession probability / NBER phase classification is being computed
- Financial conditions index (Chicago Fed NFCI / Goldman FCI) is referenced
- Inflation surprises, CPI/PCE diff, are being modeled

For **regime classification on returns / vol**, route to `regime-detection`. For **fetching macro data**, the existing `fred-economic-data` / `economic-calendar-fetcher` skills handle data IO. This skill is the **feature construction** layer.

## Methodology

### 1. Yield Curve Features

The Treasury curve is the canonical leading indicator.

- **2s10s** (`UST10Y - UST2Y`): inversion historically precedes recession by 6-18 months
- **3m10y** (`UST10Y - UST3M`): NY Fed model favorite — slightly better recession predictor than 2s10s
- **Level**: average of 2-30Y yields
- **Slope**: long minus short
- **Curvature** (butterfly): `2 × UST5Y - UST2Y - UST10Y`

These three PCA-decompose almost all variance in the curve.

### 2. Recession Probability — NY Fed Model

Logit on the 10Y-3M spread, lagged 12 months. Cleanest possible recession model — surprisingly hard to beat.

### 3. Conference Board LEI (Leading Economic Index)

10-component composite: average weekly hours, initial jobless claims, new orders, building permits, S&P 500, FCI, consumer expectations. Falls before recessions.

### 4. Business Cycle Phase

Four phases by GDP YoY × inflation YoY:

- **Recovery**: GDP↑, inflation↓
- **Expansion**: GDP↑, inflation↑
- **Slowdown**: GDP↓, inflation↑
- **Recession**: GDP↓, inflation↓

Standard rotation: stocks favor recovery/expansion, bonds favor slowdown/recession.

### 5. Inflation Surprise

`CPI_actual - CPI_consensus`. Acts asymmetrically — upside surprises generally hurt risk assets more than downside surprises help.

### 6. Financial Conditions Indices

- **Chicago Fed NFCI**: weekly, 105 financial indicators, mean-zero std-1. Positive = tighter than average.
- **Goldman FCI**: corporate spread + equity vol + USD + rates + housing.

These tend to lead activity by 3-12 months.

### 7. Credit Features

- **High-yield OAS** (`BAMLH0A0HYM2` on FRED): widening = stress
- **TED / SOFR-Fed Funds spread**: short-term funding stress
- **Term premium**: ACM model from NY Fed

## Required Libraries

```bash
pip install fredapi pandas-datareader pandas numpy
```

- `fredapi` — FRED data (free, requires API key)
- `pandas-datareader` — alternative for non-FRED sources

## Code Templates

### Yield Curve Feature Construction

```python
import pandas as pd
import numpy as np
from fredapi import Fred

fred = Fred(api_key="YOUR_FRED_KEY")

def yield_curve_features(start="1990-01-01") -> pd.DataFrame:
    series = {
        "3M":  "DGS3MO",
        "2Y":  "DGS2",
        "5Y":  "DGS5",
        "10Y": "DGS10",
        "30Y": "DGS30",
    }
    df = pd.DataFrame({k: fred.get_series(v, start) for k, v in series.items()})
    df = df.ffill().dropna()
    feats = pd.DataFrame(index=df.index)
    feats["level"] = df.mean(axis=1)
    feats["slope_2s10s"] = df["10Y"] - df["2Y"]
    feats["slope_3m10y"] = df["10Y"] - df["3M"]
    feats["curv_2s5s10s"] = 2 * df["5Y"] - df["2Y"] - df["10Y"]
    feats["inversion_2s10s"] = (feats["slope_2s10s"] < 0).astype(int)
    return feats
```

### NY Fed Recession Probability

```python
from scipy.stats import norm

# Source: NY Fed prob recession = 12 months ahead from 10Y-3M spread
# Probit coefficients (from NY Fed published model)
def ny_fed_recession_prob(slope_3m10y: pd.Series) -> pd.Series:
    """
    Probit P(recession in 12 months) = Φ(α + β · slope_lag_12m)
    NY Fed coefficients: α = -0.5333, β = -0.6330
    """
    alpha, beta = -0.5333, -0.6330
    spread_lag = slope_3m10y.shift(252)  # ~12 months business days
    z = alpha + beta * spread_lag
    return pd.Series(norm.cdf(z), index=z.index, name="p_recession_12m")
```

### Business Cycle Phase Classifier

```python
def cycle_phase(gdp_yoy: pd.Series, cpi_yoy: pd.Series) -> pd.Series:
    """
    Returns one of {recovery, expansion, slowdown, recession} per period.
    Uses 3-month rolling change to smooth.
    """
    g = gdp_yoy.rolling(3).mean()
    p = cpi_yoy.rolling(3).mean()
    g_up = g > g.shift(3)
    p_up = p > p.shift(3)
    phase = pd.Series(index=g.index, dtype=object)
    phase[g_up & ~p_up] = "recovery"
    phase[g_up & p_up] = "expansion"
    phase[~g_up & p_up] = "slowdown"
    phase[~g_up & ~p_up] = "recession"
    return phase
```

### Inflation Surprise

```python
def inflation_surprise(cpi_actual: pd.Series, cpi_consensus: pd.Series) -> pd.Series:
    """Both series indexed by release date."""
    common = cpi_actual.index.intersection(cpi_consensus.index)
    return (cpi_actual.loc[common] - cpi_consensus.loc[common]).rename("surprise")
```

### Financial Conditions Features

```python
def financial_conditions(start="2000-01-01") -> pd.DataFrame:
    series = {
        "nfci": "NFCI",                  # Chicago Fed NFCI
        "anfci": "ANFCI",                # Adjusted NFCI
        "hy_oas": "BAMLH0A0HYM2",        # HY OAS
        "ig_oas": "BAMLC0A0CM",          # IG OAS
        "move": "MOVE",                  # bond vol (not always on FRED — use Yahoo)
    }
    df = pd.DataFrame({k: fred.get_series(v, start) for k, v in series.items()
                       if k != "move"})
    return df.resample("W").last().ffill()
```

### Composite Macro Feature Block

```python
def macro_features(start="2000-01-01") -> pd.DataFrame:
    yc = yield_curve_features(start)
    fc = financial_conditions(start)
    # Resample to monthly business-end
    out = pd.concat([yc.resample("M").last(), fc.resample("M").last()], axis=1)
    # Z-scores for ML
    z = (out - out.expanding(36).mean()) / out.expanding(36).std()
    z.columns = [f"z_{c}" for c in z.columns]
    return pd.concat([out, z], axis=1)
```

### As-Of Reality: Vintages Matter

Many macro series are **revised**. The number you see for GDP Q1 today is not the number markets knew on May 1. For honest backtests use **ALFRED** (Archival FRED) to fetch as-of-date vintages:

```python
# fredapi: use vintage_dates parameter
# Note: not all series have vintages; document which are real-time vs revised.
```

Or: lag all macro series by their typical release delay (CPI by 2 weeks, GDP by 1 month, payrolls by 1 week).

## Pitfalls

- **Vintage data** — backtest using the value you see today, not the value released that day, and your "macro alpha" is impressive. Use ALFRED or release-date-aligned data.
- **Release timing** — payrolls publish at 8:30 AM EST first Friday. Using that day's open or close gives lookahead. Use next available trading day.
- **Frequency mismatch** — most macro is monthly/quarterly, stocks are daily. Forward-fill, don't interpolate.
- **Stationarity** — yield levels are I(1); yield changes are I(0). Spreads are usually I(0). Apply `time-series-stats` checks.
- **Multicollinearity in macro features** — most features cluster. PCA the curve to 3 factors, FCI to 1-2, etc.
- **Backtest length** — recession indicators may have 2-5 events in 30 years. Significance is illusory.
- **Look-ahead in seasonal adjustment** — "SA" series are revised retroactively. Use NSA + your own SA if possible.

## References

- NY Fed Recession Probability: https://www.newyorkfed.org/research/capital_markets/ycfaq
- Estrella & Mishkin (1996, 1998) — yield curve recession papers.
- Stock & Watson (1989). *New Indexes of Coincident and Leading Economic Indicators*.
- Adrian, Crump, Moench (2013) — ACM term premium model.
- López de Prado (2018) — caveats on macro signal extraction.

## Related Skills

- `regime-detection` — macro features feed regime classifiers
- `time-series-stats` — stationarity checks
- `fred-economic-data` (database side) — data fetching
- `macro-regime-detector` (in `macro/`) — applied workflow
- `economic-calendar-fetcher` (in `macro/`) — release scheduling
