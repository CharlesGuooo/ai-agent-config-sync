---
name: time-series-stats
description: Statistical tests and tools for financial time series — stationarity (ADF, KPSS, Phillips-Perron), cointegration (Engle-Granger, Johansen), Granger causality, Hurst exponent / R/S analysis, and structural break detection. Use whenever the user is building a mean-reversion / pairs trade, checks if a series is stationary, mentions cointegration, models a spread, asks "are these two stocks related", needs to detect a regime change, or tests trend persistence. These are the statistical foundations for almost any non-trivial trading hypothesis.
---

# Time-Series Statistics for Finance

## When to Use This Skill

Trigger whenever:

- The user is building a **pairs trade** or statistical arbitrage strategy
- A model assumes a stationary mean or stationary spread
- "Cointegration", "ADF", "Johansen", "Granger" come up
- Long-memory or trending behavior is being tested
- Two or more series are being compared for relationship

For just **modeling volatility**, route to `volatility-modeling`. For **state classification**, route to `regime-detection`.

## Methodology

### 1. Stationarity Tests

Most time-series models (ARIMA, OLS regressions, mean-reversion strategies) require stationarity. Raw prices are non-stationary; log-returns usually are.

- **ADF (Augmented Dickey-Fuller)** — null = unit root (non-stationary). Reject = stationary.
- **KPSS** — null = stationarity. Reject = non-stationary. Use **both** ADF and KPSS; they have different nulls.
- **Phillips-Perron** — like ADF but handles serial correlation differently.

**Interpretation matrix:**

| ADF reject? | KPSS reject? | Verdict |
|---|---|---|
| Yes | No | Stationary ✓ |
| No | Yes | Non-stationary |
| No | No | Inconclusive — likely trend-stationary |
| Yes | Yes | Conflicting — try differencing or detrending |

### 2. Cointegration

Two non-stationary series `X, Y` are **cointegrated** if some linear combination `Z = Y - β X` is stationary. The economic meaning: they drift together, with a stationary "spread". Foundation of pairs trading.

- **Engle-Granger 2-step**: regress `Y ~ X`, test residuals for stationarity (ADF). Works for 2 series.
- **Johansen test**: VAR-based, handles N ≥ 2 series and identifies the number of cointegrating vectors (rank).

Always use Johansen if you have 3+ assets. Engle-Granger is fine for clean 2-asset pairs.

### 3. Granger Causality

X "Granger-causes" Y if past X improves prediction of Y beyond what past Y alone provides. **Not** true causality — predictive precedence only. Useful for lead-lag exploration.

### 4. Hurst Exponent / R/S Analysis

Measures long-range dependence:
- H = 0.5 → random walk
- H > 0.5 → trending / persistent (momentum-friendly)
- H < 0.5 → mean-reverting (pairs-friendly)

Estimate via rescaled range (R/S) or detrended fluctuation analysis (DFA).

### 5. Structural Breaks

CUSUM, Chow test, Bai-Perron detect dates when the data-generating process changed. Critical for backtests spanning regime changes (2008, 2020).

## Required Libraries

```bash
pip install statsmodels arch numpy pandas scipy
```

- `statsmodels.tsa.stattools` — ADF, KPSS, coint, grangercausalitytests
- `statsmodels.tsa.vector_ar.vecm` — Johansen
- `arch.unitroot` — alternative ADF/KPSS/PP with cleaner API
- `hurst` package (optional) — Hurst exponent estimators

## Code Templates

### Stationarity Battery

```python
import numpy as np
import pandas as pd
from statsmodels.tsa.stattools import adfuller, kpss

def stationarity_report(series: pd.Series) -> dict:
    s = series.dropna()
    adf_stat, adf_p, *_ = adfuller(s, autolag="AIC")
    kpss_stat, kpss_p, *_ = kpss(s, regression="c", nlags="auto")
    # Lower kpss_p than 0.05 = reject stationary; lower adf_p = reject unit root
    verdict = (
        "stationary" if adf_p < 0.05 and kpss_p > 0.05
        else "non-stationary" if adf_p > 0.05 and kpss_p < 0.05
        else "inconclusive"
    )
    return {"adf_p": adf_p, "kpss_p": kpss_p, "verdict": verdict}

print(stationarity_report(np.log(prices["SPY"])))         # likely non-stat
print(stationarity_report(np.log(prices["SPY"]).diff()))  # likely stat
```

### Engle-Granger Cointegration (2 series)

```python
from statsmodels.tsa.stattools import coint

def cointegration_eg(y: pd.Series, x: pd.Series) -> dict:
    """Returns hedge ratio, spread, ADF p-value of spread."""
    # OLS regression y = α + β x
    import statsmodels.api as sm
    X = sm.add_constant(x)
    model = sm.OLS(y, X).fit()
    beta = model.params[x.name]
    spread = y - beta * x
    coint_stat, p_value, _ = coint(y, x)
    return {"beta": beta, "spread": spread, "p_value": p_value,
            "cointegrated": p_value < 0.05}

result = cointegration_eg(prices["KO"], prices["PEP"])
print(f"Hedge ratio: {result['beta']:.3f}, p={result['p_value']:.4f}")
```

### Johansen (N series)

```python
from statsmodels.tsa.vector_ar.vecm import coint_johansen

# data: DataFrame with multiple asset prices
jres = coint_johansen(data, det_order=0, k_ar_diff=1)
print("Trace statistics:", jres.lr1)
print("Critical values (90/95/99%):", jres.cvt)
# r = number of stat > 95% cv
n_coint = sum(jres.lr1 > jres.cvt[:, 1])
print(f"Cointegrating rank: {n_coint}")

# Cointegrating vectors (eigenvectors)
print("Cointegrating vectors:\n", jres.evec[:, :n_coint])
```

### Granger Causality

```python
from statsmodels.tsa.stattools import grangercausalitytests

# Returns dict: lag -> tests
results = grangercausalitytests(data[["Y", "X"]], maxlag=5, verbose=False)
for lag, (tests, _) in results.items():
    p = tests["ssr_ftest"][1]
    print(f"Lag {lag}: F-test p = {p:.4f}")
```

### Hurst Exponent (R/S)

```python
def hurst_rs(series: pd.Series, min_chunk: int = 8, max_chunks: int = 100) -> float:
    """Rescaled range Hurst estimate."""
    series = series.dropna().values
    N = len(series)
    chunk_sizes = np.unique(np.logspace(np.log10(min_chunk),
                                         np.log10(N // 2), 20).astype(int))
    rs_means = []
    for size in chunk_sizes:
        rs_list = []
        for start in range(0, N - size + 1, size):
            chunk = series[start:start + size]
            mean = chunk.mean()
            cumdev = (chunk - mean).cumsum()
            r = cumdev.max() - cumdev.min()
            s = chunk.std()
            if s > 0:
                rs_list.append(r / s)
        if rs_list:
            rs_means.append(np.mean(rs_list))
    log_n = np.log(chunk_sizes[:len(rs_means)])
    log_rs = np.log(rs_means)
    slope, _ = np.polyfit(log_n, log_rs, 1)
    return float(slope)

h = hurst_rs(prices["SPY"])
print(f"Hurst: {h:.3f}  "
      f"({'trending' if h > 0.55 else 'mean-rev' if h < 0.45 else 'random'})")
```

### Structural Break (CUSUM)

```python
from statsmodels.stats.diagnostic import breaks_cusumolsresid
import statsmodels.api as sm

# OLS of returns on a constant, then CUSUM
X = sm.add_constant(pd.Series(1, index=returns.index))
res = sm.OLS(returns, X).fit()
cusum_stat, p, crit = breaks_cusumolsresid(res.resid)
print(f"CUSUM stat={cusum_stat:.3f}, p={p:.4f}")
```

For multi-break detection, use the `ruptures` library:

```python
import ruptures as rpt
algo = rpt.Binseg(model="rbf").fit(returns.values)
breaks = algo.predict(n_bkps=3)  # 3 breakpoints
print(returns.index[breaks[:-1]])
```

## Pitfalls

- **Stationarity is a sample property** — a "stationary" pair from 2010-2020 can break in 2021. Test on out-of-sample.
- **Cointegration ≠ correlation** — two highly correlated stocks may not be cointegrated, and vice versa.
- **Hedge ratio drifts** — Engle-Granger β is estimated; use rolling regression or Kalman filter for live trading.
- **Multiple testing** — testing 1000 pairs for cointegration at p < 0.05 yields ~50 false positives. Adjust α or use Johansen with a screening prior.
- **Granger ≠ cause** — X may Granger-cause Y because both depend on an omitted Z.
- **Stationarity of returns vs prices** — daily log-returns are usually I(0); prices are usually I(1). Use the right one.
- **Lookback for live ADF** — use a rolling window, not the full history, or you compute future-informed p-values.

## References

- Hamilton (1994). *Time Series Analysis*.
- Engle & Granger (1987). *Co-Integration and Error Correction*.
- Johansen (1991). *Estimation and Hypothesis Testing of Cointegration Vectors*.
- López de Prado (2018) ch. 17 — Structural breaks.

## Related Skills

- `pair-trade-screener` (in `trading/`) — applies cointegration to pairs
- `volatility-modeling` — GARCH for the stationary returns
- `regime-detection` — when structural breaks become more than a one-off
- `factor-analysis` — when N > 2 series share common drivers
