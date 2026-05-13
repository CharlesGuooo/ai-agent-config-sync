---
name: portfolio-optimization
description: Portfolio construction methods — Mean-Variance (Markowitz), Hierarchical Risk Parity (HRP), Black-Litterman, Risk Parity / Equal Risk Contribution, and CVaR optimization. Use whenever the user wants to combine multiple assets / strategies into a portfolio, asks "how much should I allocate to each", builds an efficient frontier, mentions Markowitz / Black-Litterman / risk parity / HRP, needs covariance shrinkage, or is sizing positions across a multi-asset universe. The naive 60/40 and equal-weight are usually starting points only — these methods do better when the inputs are honest.
---

# Portfolio Optimization

## When to Use This Skill

Trigger whenever:

- The user has N assets / strategies and asks "what weights"
- Mean-variance, efficient frontier, or Markowitz comes up
- They want to combine signals or sub-strategies into a portfolio
- Risk parity or equal risk contribution is mentioned
- They've heard "Markowitz is broken in practice" (it is — for reasons covered below)

For **risk-budget sizing of a single strategy**, route to `bet-sizing`. This skill is multi-asset.

## Methodology

### 1. Mean-Variance (Markowitz 1952)

Minimize portfolio variance subject to target return:

$$\min_w \quad w^T \Sigma w \quad \text{s.t.} \quad w^T \mu = \mu_{\text{target}}, \quad \sum w_i = 1$$

**The problem**: the optimization is hyper-sensitive to estimates of μ (expected returns). Tiny errors in μ produce wildly different weights. In practice, **MV with sample μ is unusable**. Two fixes:

- **Drop μ**: minimize variance only (Global Minimum Variance, GMV)
- **Shrink μ + shrink Σ**: Black-Litterman for views, Ledoit-Wolf for covariance

### 2. Ledoit-Wolf Covariance Shrinkage

Sample covariance is noisy when N (assets) ≈ T (time). Shrink toward a structured target (identity or constant correlation):

$$\hat{\Sigma}_{\text{shrink}} = (1-\delta) \Sigma_{\text{sample}} + \delta F$$

`sklearn.covariance.LedoitWolf` chooses δ analytically. **Always shrink covariance** before MV.

### 3. Black-Litterman (1991)

Start from market-implied equilibrium returns; blend in the investor's "views" via Bayesian update. Outputs much more stable weights than raw-μ MV.

Views can be absolute ("AAPL will return 10%") or relative ("Tech will beat Energy by 3%"). Each view has a confidence τ.

### 4. Risk Parity / Equal Risk Contribution (ERC)

Each asset contributes equally to total portfolio risk:

$$w_i \cdot (\Sigma w)_i = \frac{1}{N} \cdot w^T \Sigma w \quad \forall i$$

No expected returns needed. Widely used by macro funds (Bridgewater All Weather). Tends to overweight low-vol bonds — usually levered up.

### 5. Hierarchical Risk Parity (HRP) — López de Prado 2016

Cluster assets by correlation distance, recursively bisect, allocate inversely to volatility within clusters. Robust to noisy covariance and pseudo-singular matrices. Performs well out-of-sample versus MV in many studies.

### 6. CVaR / Mean-CVaR Optimization (Rockafellar-Uryasev 2000)

Minimize tail risk instead of variance. Linear programming formulation; available in `Riskfolio-Lib`. Better for assets with non-normal returns (commodities, crypto, options).

## Required Libraries

```bash
pip install PyPortfolioOpt Riskfolio-Lib scikit-learn cvxpy numpy pandas
```

- `PyPortfolioOpt` (MIT) — MV, BL, HRP, GMV
- `Riskfolio-Lib` (BSD-3) — CVaR, CDaR, risk parity, more constraints
- `sklearn.covariance.LedoitWolf` — shrinkage

## Code Templates

### Mean-Variance with Shrinkage

```python
import numpy as np
import pandas as pd
from pypfopt import EfficientFrontier, expected_returns, risk_models

# prices: DataFrame, datetime index, columns = tickers
mu = expected_returns.mean_historical_return(prices)
S = risk_models.CovarianceShrinkage(prices).ledoit_wolf()

ef = EfficientFrontier(mu, S, weight_bounds=(0, 0.3))  # 30% cap per asset
ef.add_objective(lambda w: 0.001 * sum(w**2))  # L2 regularization
weights = ef.max_sharpe(risk_free_rate=0.04)
clean = ef.clean_weights()
print(clean)
ef.portfolio_performance(verbose=True)
```

### Global Minimum Variance (no μ needed)

```python
ef = EfficientFrontier(None, S)  # ignore returns
ef.min_volatility()
print(ef.clean_weights())
```

### Black-Litterman

```python
from pypfopt import BlackLittermanModel, black_litterman

# Market-cap weights as prior
market_caps = pd.Series({"AAPL": 3e12, "MSFT": 3e12, "GOOG": 2e12, "BND": 1e12})
delta = 2.5  # risk aversion
prior = black_litterman.market_implied_prior_returns(
    market_caps=market_caps, risk_aversion=delta, cov_matrix=S
)

# Views: "AAPL will return 12%", "MSFT beats GOOG by 3%"
views = {"AAPL": 0.12, "MSFT": 0.03}  # absolute or relative
bl = BlackLittermanModel(S, pi=prior, absolute_views=views,
                        view_confidences=[0.7, 0.5])
post_mu = bl.bl_returns()
post_cov = bl.bl_cov()

ef = EfficientFrontier(post_mu, post_cov)
ef.max_sharpe()
print(ef.clean_weights())
```

### Hierarchical Risk Parity

```python
from pypfopt import HRPOpt

hrp = HRPOpt(returns=prices.pct_change().dropna())
hrp.optimize()
print(hrp.clean_weights())
hrp.portfolio_performance(verbose=True)
```

### Risk Parity (ERC) via Riskfolio-Lib

```python
import riskfolio as rp

returns = prices.pct_change().dropna()
port = rp.Portfolio(returns=returns)
port.assets_stats(method_mu="hist", method_cov="ledoit")

# Risk parity over standard deviation
w_rp = port.rp_optimization(model="Classic", rm="MV", rf=0.04, b=None,
                             hist=True)
print(w_rp)

# Hierarchical Risk Parity (Riskfolio version)
w_hrp = port.hrp_optimization(model="HRP", correlation="pearson", rm="MV")
```

### CVaR Optimization

```python
port = rp.Portfolio(returns=returns)
port.assets_stats(method_mu="hist", method_cov="ledoit")

w_cvar = port.optimization(model="Classic", rm="CVaR", obj="MinRisk",
                          hist=True, rf=0.04, l=0)
print(w_cvar)
```

### Rolling Rebalance Backtest

```python
def rolling_optimize(prices: pd.DataFrame, lookback: int = 252,
                    rebalance: int = 21, method="hrp") -> pd.DataFrame:
    """Yields a weight series for backtesting."""
    weights_history = {}
    for i in range(lookback, len(prices), rebalance):
        window = prices.iloc[i - lookback:i]
        if method == "hrp":
            hrp = HRPOpt(returns=window.pct_change().dropna())
            hrp.optimize()
            w = hrp.clean_weights()
        elif method == "mv":
            mu = expected_returns.mean_historical_return(window)
            S = risk_models.CovarianceShrinkage(window).ledoit_wolf()
            ef = EfficientFrontier(mu, S)
            ef.max_sharpe()
            w = ef.clean_weights()
        weights_history[prices.index[i]] = w
    return pd.DataFrame.from_dict(weights_history, orient="index").fillna(0)
```

## Pitfalls

- **MV with sample μ is garbage** — produces "corner" portfolios (100% in one asset). Either shrink, drop μ, or use BL.
- **N >> T danger** — if you have more assets than time periods, sample covariance is singular. Shrinkage is mandatory.
- **In-sample optimization** — optimizing weights on data also used for evaluation is double-dipping. Use rolling windows.
- **Risk parity needs leverage** — unlevered risk parity is bond-heavy and low-return. Most users apply 2-3× leverage to bring up the return.
- **Constraints matter** — unconstrained MV may short heavily; enforce `weight_bounds` and concentration limits.
- **HRP is robust but not optimal** — it's a heuristic. In stable regimes, MV+shrink can beat it.
- **Transaction costs** — frequent rebalancing erodes returns. Add costs to the backtest of any optimization workflow.

## References

- Markowitz (1952). *Portfolio Selection*. Journal of Finance.
- Black & Litterman (1991). *Asset Allocation: Combining Investor Views with Market Equilibrium*.
- Ledoit & Wolf (2004). *Honey, I Shrunk the Sample Covariance Matrix*.
- López de Prado (2016). *Building Diversified Portfolios that Outperform Out-of-Sample*. JPM.
- Rockafellar & Uryasev (2000). *Optimization of Conditional Value-at-Risk*.

## Related Skills

- `risk-metrics` — Sharpe / drawdown / CVaR definitions used here
- `bet-sizing` — single-strategy sizing within an allocated bucket
- `factor-analysis` — when assets are factor portfolios
- `portfolio-manager` (in `portfolio/`) — Alpaca-integrated execution
