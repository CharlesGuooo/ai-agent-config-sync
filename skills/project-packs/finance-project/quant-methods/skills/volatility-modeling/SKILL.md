---
name: volatility-modeling
description: Volatility forecasting and modeling for financial returns — GARCH family (GARCH, EGARCH, GJR-GARCH), Realized Volatility, HAR-RV models, and volatility forecasting evaluation. Use whenever the user models or forecasts volatility, sizes positions by volatility, analyzes volatility clustering, mentions GARCH / EGARCH / EWMA / realized vol, computes risk on rolling windows, asks about VIX vs realized, or needs forward-looking vol for option pricing or VaR. Volatility forecasting is one of the few financial forecasting problems where models genuinely work — but only if you pick the right one.
---

# Volatility Modeling

## When to Use This Skill

Trigger whenever:

- The user wants a vol forecast (1-day, 1-week, 1-month ahead)
- Position sizing is volatility-scaled
- GARCH / EGARCH / EWMA come up
- High-frequency data is available and they want realized vol
- Risk metrics (VaR, ES) need forward-looking vol
- Implied vs realized vol comparison is being made

For **option pricing surface analysis**, route to the existing `option-vol-analysis` skill. This skill is about **time-series of returns volatility**.

## Methodology

### 1. Realized Volatility (RV)

Sum of squared high-frequency returns over a day. With T 5-min returns in a day:

$$RV_d = \sum_{i=1}^T r_{i}^2 \quad ; \quad \text{Daily vol} = \sqrt{RV_d}$$

Lower variance than squared daily returns; should be your default if you have intraday data.

### 2. GARCH(p, q) — Bollerslev 1986

Conditional variance evolves as:

$$\sigma_t^2 = \omega + \sum_{i=1}^q \alpha_i r_{t-i}^2 + \sum_{j=1}^p \beta_j \sigma_{t-j}^2$$

GARCH(1,1) is the workhorse — usually all you need:

$$\sigma_t^2 = \omega + \alpha r_{t-1}^2 + \beta \sigma_{t-1}^2$$

With α + β close to 1: persistence. Most equity indices: α≈0.05, β≈0.93.

### 3. EGARCH (Nelson 1991) and GJR-GARCH (Glosten et al. 1993)

Both model the **leverage effect**: negative returns increase vol more than positive returns of the same size.

- **GJR**: adds an asymmetric term `γ I(r_{t-1} < 0) r_{t-1}^2`
- **EGARCH**: models log-variance, no parameter sign constraints

For equities, both beat plain GARCH out-of-sample. For FX, the asymmetry is weaker.

### 4. HAR-RV (Corsi 2009)

Cascade model over daily, weekly, and monthly realized vol:

$$RV_{t+1} = c + \beta_d RV_t^{(d)} + \beta_w RV_t^{(w)} + \beta_m RV_t^{(m)} + \epsilon$$

Simple OLS, no MLE convergence issues. Often beats GARCH at horizons > 1 day. Use this when you have realized vol.

### 5. EWMA (RiskMetrics)

$$\sigma_t^2 = \lambda \sigma_{t-1}^2 + (1-\lambda) r_{t-1}^2$$

Classic JPM RiskMetrics with λ=0.94 for daily. Restricted GARCH (ω=0, α+β=1). Stable but biased downward in crises.

### 6. Stochastic Volatility (SV)

Vol itself is a latent process (e.g., AR(1) on log-vol). More flexible than GARCH but needs MCMC. Use only when GARCH/HAR-RV can't fit the data.

## Required Libraries

```bash
pip install arch pandas numpy statsmodels
```

- `arch` (Sheppard) — gold standard for GARCH family in Python
- `statsmodels.tsa.arima_model` for VAR-based vol
- HAR-RV: hand-rolled OLS

## Code Templates

### GARCH(1,1) with `arch`

```python
import pandas as pd
import numpy as np
from arch import arch_model

returns = prices.pct_change().dropna() * 100  # arch expects pct

# GARCH(1,1) with constant mean and Student-t residuals
am = arch_model(returns, mean="Constant", vol="GARCH", p=1, q=1, dist="t")
res = am.fit(disp="off")
print(res.summary())

# 5-day-ahead vol forecast
fcst = res.forecast(horizon=5)
print("Forecast variance:\n", fcst.variance.iloc[-1])
print("Forecast vol:\n", np.sqrt(fcst.variance.iloc[-1]))
```

### EGARCH / GJR

```python
# EGARCH: vol="EGARCH"
egarch = arch_model(returns, mean="Zero", vol="EGARCH", p=1, q=1,
                    dist="t").fit(disp="off")

# GJR-GARCH: vol="GARCH", o=1 (asymmetry order)
gjr = arch_model(returns, mean="Zero", vol="GARCH", p=1, o=1, q=1,
                 dist="t").fit(disp="off")

# Compare fit
for name, r in [("GARCH", res), ("EGARCH", egarch), ("GJR", gjr)]:
    print(f"{name}: AIC={r.aic:.1f}, BIC={r.bic:.1f}")
```

### Rolling 1-Day-Ahead Vol Forecast

```python
def rolling_garch_forecast(returns: pd.Series, window: int = 1000) -> pd.Series:
    """Re-fit GARCH on rolling window, save 1-step-ahead vol."""
    forecasts = []
    for i in range(window, len(returns)):
        window_data = returns.iloc[i - window:i]
        try:
            r = arch_model(window_data, vol="GARCH", p=1, q=1,
                           dist="t").fit(disp="off")
            f = r.forecast(horizon=1)
            forecasts.append((returns.index[i], np.sqrt(f.variance.iloc[-1, 0])))
        except Exception:
            forecasts.append((returns.index[i], np.nan))
    return pd.Series(dict(forecasts))
```

This is slow (~10 mins for 5 years daily). For production, refit weekly and roll the forecast.

### Realized Volatility from Intraday Data

```python
def realized_vol(intraday_prices: pd.DataFrame, freq: str = "5min") -> pd.Series:
    """intraday_prices: timestamp index, 'close' column, multiple days."""
    log_ret = np.log(intraday_prices["close"]).diff()
    daily_rv = (log_ret ** 2).resample("1D").sum()
    return np.sqrt(daily_rv) * np.sqrt(252)  # annualized
```

### HAR-RV Model

```python
def har_rv(rv_daily: pd.Series, horizon: int = 1) -> pd.DataFrame:
    """Fit HAR-RV via OLS. Returns coefficients and forecast."""
    rv_w = rv_daily.rolling(5).mean()
    rv_m = rv_daily.rolling(22).mean()
    y = rv_daily.shift(-horizon)
    df = pd.DataFrame({"y": y, "d": rv_daily, "w": rv_w, "m": rv_m}).dropna()
    X = sm.add_constant(df[["d", "w", "m"]])
    import statsmodels.api as sm
    model = sm.OLS(df["y"], X).fit()
    return model
```

### EWMA

```python
def ewma_vol(returns: pd.Series, lam: float = 0.94) -> pd.Series:
    var = returns.var()
    out = []
    for r in returns:
        var = lam * var + (1 - lam) * r ** 2
        out.append(var)
    return np.sqrt(pd.Series(out, index=returns.index)) * np.sqrt(252)
```

### Forecast Evaluation

For vol forecasts, MSE isn't the right loss because vol is non-negative. Use:

- **QLIKE**: `mean(rv_actual / vol_forecast^2 + log(vol_forecast^2))` — penalizes proportional errors
- **MZ regression**: regress `rv_actual` on `vol_forecast`; intercept should be 0, slope should be 1

```python
def qlike(rv_actual: pd.Series, vol_forecast: pd.Series) -> float:
    v = vol_forecast ** 2
    return (rv_actual / v + np.log(v)).mean()
```

## Pitfalls

- **Scaling**: `arch` expects percent returns (×100). Wrong scale → bad ω estimate but α, β still fine.
- **GARCH on log-returns vs simple returns** — both work for daily; log is cleaner for compounding.
- **α + β > 1 is non-stationary** — model rejects but the fit "succeeds". Inspect output.
- **Heavy tails**: equity returns aren't Gaussian. Use `dist="t"` or `dist="ged"`.
- **News shocks**: GARCH treats all return shocks identically — large jumps from earnings won't be captured. Combine with realized vol or vol-of-vol estimators.
- **Daily vs intraday mismatch**: don't mix GARCH-on-daily with realized-vol-from-5min as the same quantity — they measure overlapping but distinct objects (RV includes intraday jumps GARCH misses).
- **In-sample vs out-of-sample**: report at minimum a rolling-fit out-of-sample QLIKE.

## References

- Bollerslev (1986). *Generalized Autoregressive Conditional Heteroskedasticity*.
- Nelson (1991). *Conditional Heteroskedasticity in Asset Returns: A New Approach* (EGARCH).
- Glosten, Jagannathan, Runkle (1993) (GJR-GARCH).
- Corsi (2009). *A Simple Approximate Long-Memory Model of Realized Volatility* (HAR-RV).
- Andersen et al. (2003). *Modeling and Forecasting Realized Volatility*.

## Related Skills

- `risk-metrics` — applies forecast vol to position sizing and VaR
- `option-vol-analysis` (in `portfolio/`) — implied vol vs realized comparison
- `time-series-stats` — stationarity of returns required for GARCH
- `regime-detection` — vol regime as a state variable
