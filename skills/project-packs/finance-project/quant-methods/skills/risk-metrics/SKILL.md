---
name: risk-metrics
description: Performance and risk metrics for trading strategies and portfolios — Sharpe / Sortino / Calmar / Omega ratios, Value-at-Risk (VaR) and Conditional VaR / Expected Shortfall (historical and parametric), Maximum Drawdown and underwater curves, tail risk measures, and standard tearsheet generation. Use this skill whenever the user evaluates a strategy's return profile, asks "how risky is this", compares two strategies, computes drawdown, asks about Sharpe interpretation, mentions VaR / CVaR / ES, wants a backtest tearsheet, or is sizing a strategy by risk budget. Never report just Sharpe — this skill enforces the minimum complete metric set and explains the tradeoffs.
---

# Risk & Performance Metrics

## When to Use This Skill

Trigger whenever:

- The user has an equity curve, return series, or backtest output
- A strategy is compared to another or to a benchmark
- The question is "is this strategy risky / acceptable / good enough"
- Position sizing depends on volatility or drawdown
- The user wants a tearsheet

For the **statistical significance** of the resulting Sharpe given multiple-testing, route to `overfitting-detection`.

## Methodology

### Sharpe Ratio (and its problems)

$$\text{SR} = \frac{\bar{r} - r_f}{\sigma_r} \cdot \sqrt{\text{periods per year}}$$

Annualization assumes IID returns; for daily data multiply by √252. Sharpe penalizes upside volatility equally with downside, ignores fat tails, and is non-stationary across regimes.

**Single Sharpe is never enough.** Always compute Sortino + max DD + Calmar + a tail metric.

### Sortino Ratio

Like Sharpe, but denominator uses only **downside** deviation (returns below a target, usually 0 or risk-free rate).

$$\text{Sortino} = \frac{\bar{r} - r_f}{\sigma_{\text{downside}}} \cdot \sqrt{N}$$

Higher than Sharpe for strategies with positive skew (e.g., trend-following) — that's the point.

### Calmar Ratio

$$\text{Calmar} = \frac{\text{Annualized return}}{|\text{Max drawdown}|}$$

The most honest "risk-adjusted" number for many. Drawdown is what investors actually feel. Below 0.5 = painful, above 1.0 = institutional-grade.

### Omega Ratio

$$\Omega(\tau) = \frac{\int_\tau^\infty (1 - F(r)) dr}{\int_{-\infty}^\tau F(r) dr}$$

Captures the full distribution above/below a threshold τ (often 0). Robust to non-normal returns.

### Value-at-Risk (VaR) and Expected Shortfall (CVaR / ES)

VaR_α: the α-quantile loss (e.g., 5% VaR = "5% chance of losing more than this").

CVaR_α (= Expected Shortfall): mean loss given loss > VaR_α. **Use CVaR over VaR** — VaR ignores tail shape and is not coherent (subadditive); CVaR is.

Two flavors:
- **Historical**: empirical quantile of return distribution
- **Parametric** (Gaussian): `μ - z_α · σ` (wrong for fat tails; use as sanity check only)

### Maximum Drawdown & Time Underwater

Drawdown at t: `1 - cum_return_t / cum_return_max_so_far`.
Max DD: worst observed value.
Time underwater: longest stretch where drawdown > 0.

### Tail Risk Extras

- **Skewness**: positive = right tail, negative = left tail (bad)
- **Kurtosis**: excess > 0 = fat tails
- **Tail ratio**: `|q_95(returns)| / |q_5(returns)|` — > 1 means asymmetric in your favor

## Required Libraries

```bash
pip install empyrical-reloaded quantstats numpy pandas scipy
```

- `empyrical-reloaded` (Apache 2.0) — production-grade implementations of all metrics
- `quantstats` (Apache 2.0) — full tearsheet HTML / PNG generation
- `scipy.stats` — distributional moments

## Code Templates

### Core Metrics from Scratch

```python
import numpy as np
import pandas as pd

def perf_metrics(returns: pd.Series, periods_per_year: int = 252) -> dict:
    """returns: pd.Series of period (daily) returns."""
    r = returns.dropna()
    cum = (1 + r).cumprod()
    ann_ret = cum.iloc[-1] ** (periods_per_year / len(r)) - 1
    ann_vol = r.std() * np.sqrt(periods_per_year)
    sharpe = ann_ret / ann_vol if ann_vol > 0 else np.nan

    downside = r[r < 0]
    dd_vol = downside.std() * np.sqrt(periods_per_year)
    sortino = ann_ret / dd_vol if dd_vol > 0 else np.nan

    drawdown = 1 - cum / cum.cummax()
    max_dd = drawdown.max()
    calmar = ann_ret / max_dd if max_dd > 0 else np.nan

    # underwater duration
    underwater = (cum < cum.cummax()).astype(int)
    longest_uw = (underwater.groupby((underwater != underwater.shift()).cumsum())
                  .cumsum().max())

    return {
        "ann_return": ann_ret,
        "ann_vol": ann_vol,
        "sharpe": sharpe,
        "sortino": sortino,
        "max_drawdown": max_dd,
        "calmar": calmar,
        "longest_underwater_days": int(longest_uw),
        "skew": r.skew(),
        "excess_kurtosis": r.kurtosis(),
    }
```

### VaR and CVaR

```python
def var_cvar(returns: pd.Series, alpha: float = 0.05, method: str = "historical"):
    """Returns (VaR, CVaR) as positive loss magnitudes."""
    r = returns.dropna()
    if method == "historical":
        var = -np.quantile(r, alpha)
        cvar = -r[r <= -var].mean()
    elif method == "gaussian":
        from scipy.stats import norm
        mu, sigma = r.mean(), r.std()
        var = -(mu + sigma * norm.ppf(alpha))
        # CVaR closed-form for normal
        cvar = -(mu - sigma * norm.pdf(norm.ppf(alpha)) / alpha)
    else:
        raise ValueError(method)
    return float(var), float(cvar)
```

### Omega Ratio

```python
def omega(returns: pd.Series, threshold: float = 0.0) -> float:
    r = returns - threshold
    gain = r[r > 0].sum()
    loss = -r[r < 0].sum()
    return float(gain / loss) if loss > 0 else np.inf
```

### Drawdown Series and Stats

```python
def drawdown_series(returns: pd.Series) -> pd.DataFrame:
    cum = (1 + returns).cumprod()
    peak = cum.cummax()
    dd = 1 - cum / peak
    in_dd = dd > 0
    # episode IDs
    episode = (in_dd & ~in_dd.shift(1, fill_value=False)).cumsum() * in_dd
    out = pd.DataFrame({"cum_return": cum, "peak": peak, "drawdown": dd,
                        "episode": episode})
    return out

def top_drawdowns(returns: pd.Series, n: int = 5):
    dds = drawdown_series(returns)
    summary = (dds[dds.episode > 0].groupby("episode")
               .agg(start=("drawdown", lambda x: x.index[0]),
                    end=("drawdown", lambda x: x.index[-1]),
                    max_dd=("drawdown", "max"),
                    duration=("drawdown", "count")))
    return summary.nlargest(n, "max_dd")
```

### Empyrical / QuantStats Tearsheet

```python
import empyrical as emp
import quantstats as qs

# returns: pd.Series of daily returns, datetime index
print(emp.sharpe_ratio(returns))
print(emp.sortino_ratio(returns))
print(emp.calmar_ratio(returns))
print(emp.max_drawdown(returns))
print(emp.value_at_risk(returns, cutoff=0.05))
print(emp.conditional_value_at_risk(returns, cutoff=0.05))

# Full HTML tearsheet vs benchmark
qs.reports.html(returns, benchmark="SPY", output="tearsheet.html",
                title="Strategy Tearsheet")
```

### Rolling Sharpe for Stability

```python
def rolling_sharpe(returns: pd.Series, window: int = 252) -> pd.Series:
    """Annualized rolling Sharpe."""
    mu = returns.rolling(window).mean()
    sigma = returns.rolling(window).std()
    return (mu / sigma) * np.sqrt(252)
```

Plot this — a flat-and-positive line is healthy, a declining line tells you the edge is decaying.

## Interpretation Cheatsheet

| Metric | Bad | Acceptable | Good | Institutional |
|---|---|---|---|---|
| Sharpe (after costs) | < 0.5 | 0.5–1.0 | 1.0–2.0 | > 2.0 |
| Sortino | < 1.0 | 1.0–1.5 | 1.5–3.0 | > 3.0 |
| Calmar | < 0.3 | 0.3–0.7 | 0.7–1.5 | > 1.5 |
| Max DD | > 30% | 15–30% | 10–15% | < 10% |

These are rules of thumb for liquid US equity strategies. Crypto / commodity / fixed-income strategies have different baselines.

## Pitfalls

- **Annualization assumes IID** — autocorrelated returns inflate Sharpe. For HFT / mean-reversion at high frequencies, use Newey-West-adjusted Sharpe.
- **Survivorship bias in returns** — a backtest's "Sharpe 2" can come from never trading the bad period that killed similar strategies.
- **Look-ahead in metrics** — never compute risk metrics using the full sample if the strategy can update with new info. Use rolling/expanding windows for live monitoring.
- **VaR isn't subadditive** — diversification can paradoxically *increase* VaR. Use CVaR for portfolio aggregation.
- **Sharpe of low-frequency strategies is unstable** — < 3 years of monthly data has huge standard error. Apply DSR from `overfitting-detection`.
- **Risk-free rate matters at low Sharpes** — at SR ≈ 0.5, including the right `r_f` changes the verdict.

## References

- empyrical-reloaded: https://github.com/stefan-jansen/empyrical-reloaded
- quantstats: https://github.com/ranaroussi/quantstats
- Rockafellar & Uryasev (2000). *Optimization of Conditional Value-at-Risk*.
- Sharpe (1994). *The Sharpe Ratio*. Journal of Portfolio Management.

## Related Skills

- `overfitting-detection` — Deflated Sharpe correction for multiple testing
- `portfolio-optimization` — using these metrics as optimization objectives
- `volatility-modeling` — forward-looking risk vs realized
- `backtest-expert` (in `portfolio/`) — strategy-level robustness
