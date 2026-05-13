---
name: execution-modeling
description: Realistic execution cost modeling for backtests and live trading — slippage models (fixed bp, vol-scaled, square-root-impact), market impact (Almgren-Chriss), TWAP / VWAP / POV scheduling, and post-trade transaction cost analysis (TCA). Use whenever the user is computing or applying transaction costs in a backtest, asks "how much does slippage matter", sizes a strategy large enough that impact matters, mentions VWAP / TWAP / Almgren-Chriss / participation rate, or analyzes whether realized costs match modeled. Cost realism turns most "amazing" backtests into break-even ones — model it honestly.
---

# Execution Modeling

## When to Use This Skill

Trigger whenever:

- The user has a backtest with zero or naive (constant bp) costs
- Position size is large relative to daily volume
- Live execution is being scheduled (TWAP / VWAP / participation)
- The strategy is HFT / mid-frequency and impact dominates
- A post-trade TCA report is requested

For **regression-based pair/spread trade sizing** with hedging, route to `bet-sizing`. For **framework wiring**, route to `backtesting-frameworks`.

## Methodology

### 1. Cost Decomposition

Total execution cost has three parts:

- **Explicit costs**: commissions, exchange fees, regulatory fees, borrow (for shorts)
- **Spread cost**: half-spread for taking liquidity, negative for making
- **Market impact**: temporary (transient quote dislocation) + permanent (the trade itself moves the equilibrium price)

For small retail trades on liquid names, explicit + spread dominate. For institutional sizes, impact dominates.

### 2. Simple Cost Models

- **Fixed bp**: `cost = side × notional × bp/10000` — wrong for any non-trivial size
- **Vol-scaled**: `cost = side × notional × k × (σ_minute)` — scales with how "fast" the market is
- **Spread-based**: `cost = side × shares × spread/2` — accurate if spread data is available

### 3. Square-Root Impact Model

Empirically, market impact scales sub-linearly with size:

$$\text{Impact} = \eta \cdot \sigma \cdot \sqrt{\frac{Q}{V}}$$

- Q = shares to execute
- V = daily volume (or volume in execution window)
- σ = daily vol
- η = stock-specific constant (typical equity: 0.5–1.5)

Use this when Q / V > 1%. Below that, fixed bp is fine.

### 4. Almgren-Chriss (2000)

Optimal execution schedule minimizing expected cost + variance:

$$C(x) = \int_0^T \left[ \dot{x}(t) g(\dot{x}(t)) \right] dt + \lambda \int_0^T \sigma^2 x(t)^2 dt$$

- `x(t)` = remaining shares at time t
- `g(·)` = impact function (linear or sqrt)
- `λ` = risk aversion

With linear permanent + linear temporary impact and quadratic urgency, the optimal trajectory is exponential decay between start and end. Closed-form formulas in original paper.

### 5. Execution Algorithms

- **TWAP**: equal volume per time slice. Predictable; bad if volume profile is U-shaped (open/close vs midday).
- **VWAP**: volume-weighted to match the day's volume curve. Standard institutional benchmark.
- **POV (Participation)**: trade at fixed % of real-time volume. Reactive; can extend beyond target window.
- **Implementation Shortfall (IS)**: minimize cost vs decision-time price (Almgren-Chriss output)

### 6. Post-Trade TCA

Compare each fill to a benchmark:

- **Arrival price**: implementation shortfall
- **VWAP**: did we beat or lag the day's VWAP
- **TWAP**: same vs uniform schedule

Decompose costs into delay, impact, opportunity, timing.

## Required Libraries

```bash
pip install numpy pandas
```

All algorithms below are self-implemented; specialized impact models can use academic packages (e.g., `pyabm`, `quantfin-tca`) but none are universally adopted.

## Code Templates

### Cost Models

```python
import numpy as np
import pandas as pd

def fixed_bp_cost(notional: float, bp: float = 5) -> float:
    """5 bp ≈ liquid US equity retail."""
    return abs(notional) * bp / 10000

def spread_cost(shares: int, half_spread: float) -> float:
    """half_spread in dollars per share."""
    return abs(shares) * half_spread

def sqrt_impact_cost(shares: int, daily_vol: float,
                     sigma_daily: float, eta: float = 0.1,
                     price: float = 100.0) -> float:
    """
    Square-root model.
    sigma_daily: e.g., 0.02 = 2% daily vol
    Returns dollar cost.
    """
    participation = abs(shares) / max(daily_vol, 1)
    impact_pct = eta * sigma_daily * np.sqrt(participation)
    return abs(shares) * price * impact_pct
```

### Almgren-Chriss Optimal Schedule

```python
def almgren_chriss_schedule(X: float, T: int, sigma: float,
                            eta: float, gamma: float, lam: float):
    """
    X: total shares to execute (positive=sell, negative=buy)
    T: number of time steps
    sigma: per-period vol of price ($/sqrt period)
    eta: temporary impact coefficient ($/share/(share/period))
    gamma: permanent impact coefficient ($/share^2)
    lam: risk aversion (dollar units)
    Returns trajectory x(t) = shares remaining at each step.
    """
    eta_tilde = eta - 0.5 * gamma  # adjusted temporary impact
    if eta_tilde <= 0:
        raise ValueError("eta must exceed gamma/2")
    kappa_sq = (lam * sigma ** 2) / eta_tilde
    kappa = np.sqrt(kappa_sq)
    # Trajectory: x(t) = X · sinh(κ(T-t)) / sinh(κT)
    t = np.arange(T + 1)
    if kappa * T < 1e-3:  # near-zero risk aversion → linear (TWAP)
        return X * (1 - t / T)
    return X * np.sinh(kappa * (T - t)) / np.sinh(kappa * T)
```

### TWAP / VWAP Schedules

```python
def twap_schedule(total_shares: int, n_slices: int) -> np.ndarray:
    """Equal shares per slice."""
    base = total_shares // n_slices
    extra = total_shares - base * n_slices
    sched = np.full(n_slices, base)
    sched[:extra] += 1  # distribute remainder
    return sched

def vwap_schedule(total_shares: int, volume_profile: np.ndarray) -> np.ndarray:
    """volume_profile: historical fraction of daily volume per slice."""
    fractions = volume_profile / volume_profile.sum()
    sched = np.round(fractions * total_shares).astype(int)
    sched[-1] += total_shares - sched.sum()  # rounding adjustment
    return sched
```

### Apply Costs to Backtest

```python
def apply_costs_to_trades(trades: pd.DataFrame, prices: pd.Series,
                          adv: pd.Series, vol: pd.Series,
                          eta: float = 0.1) -> pd.DataFrame:
    """
    trades: DataFrame with cols ['ticker', 'shares', 'timestamp']
    Returns trades + cost columns.
    """
    out = trades.copy()
    out["price"] = out["timestamp"].map(prices)
    out["notional"] = out["shares"] * out["price"]
    out["spread_cost"] = abs(out["shares"]) * out["price"] * 0.0001  # 1 bp half
    out["impact_cost"] = out.apply(
        lambda r: sqrt_impact_cost(
            r["shares"], adv.loc[r["timestamp"]],
            vol.loc[r["timestamp"]], eta=eta, price=r["price"]
        ), axis=1
    )
    out["total_cost"] = out["spread_cost"] + out["impact_cost"]
    return out
```

### Simple TCA Report

```python
def tca_report(fills: pd.DataFrame, decision_prices: pd.Series,
               vwap_benchmark: pd.Series) -> pd.DataFrame:
    """
    fills: DataFrame ['ticker', 'shares', 'price', 'decision_time', 'fill_time']
    Returns per-trade decomposition vs IS and VWAP.
    """
    fills = fills.copy()
    fills["arrival_price"] = fills["decision_time"].map(decision_prices)
    fills["vwap"] = fills["fill_time"].map(vwap_benchmark)
    side = np.sign(fills["shares"])
    fills["is_bps"] = side * (fills["price"] - fills["arrival_price"]) \
                      / fills["arrival_price"] * 10000
    fills["vwap_bps"] = side * (fills["price"] - fills["vwap"]) \
                        / fills["vwap"] * 10000
    summary = {
        "avg_is_bps": fills["is_bps"].mean(),
        "avg_vwap_bps": fills["vwap_bps"].mean(),
        "tot_shares": fills["shares"].abs().sum(),
        "tot_notional": (fills["shares"].abs() * fills["price"]).sum(),
    }
    return fills, summary
```

### Sanity Check: Cost as % of Edge

```python
def cost_vs_edge(annual_return: float, annual_cost: float) -> dict:
    """
    Quick check: is the strategy alive after costs?
    """
    return {
        "gross": annual_return,
        "cost": annual_cost,
        "net": annual_return - annual_cost,
        "cost_ratio": annual_cost / max(abs(annual_return), 1e-6),
        "verdict": ("alive" if (annual_return - annual_cost) > 0.02
                    else "marginal" if (annual_return - annual_cost) > 0
                    else "dead"),
    }
```

## Pitfalls

- **Backtest assumes mid-price fills** — real fills are at the offer (buy) or bid (sell). Spread alone is often 5-10 bp on liquid names.
- **Volume from your trade is excluded from ADV** — but your trade adds to volume too. For large size, model the loop.
- **Closing auctions ≠ TWAP slices** — last 5 minutes have nonlinear impact.
- **Commission tiers** — quoted bp is for prime accounts. Retail brokers often charge much more on options/futures.
- **Borrow cost for shorts** — varies wildly. Hard-to-borrow stocks: 5-50% annualized. Critical for short legs of pairs.
- **Half-spread inadequate** — limit orders that don't fill have **opportunity cost**; market orders pay full spread. Model both.
- **Currency conversion** — non-USD strategies need FX costs.
- **Path of execution matters** — a 5% participation order that executes opportunistically has lower impact than a forced TWAP.

## References

- Almgren & Chriss (2000). *Optimal Execution of Portfolio Transactions*. Journal of Risk.
- Kissell (2013). *The Science of Algorithmic Trading and Portfolio Management*.
- Tóth et al. (2011). *Anomalous Price Impact and the Critical Nature of Liquidity*. PRX.
- Lehalle & Laruelle (2018). *Market Microstructure in Practice*.

## Related Skills

- `backtesting-frameworks` — wire these costs into the simulator
- `bet-sizing` — size taking into account expected costs
- `feature-engineering-fin` — microstructure features (Kyle's λ, Amihud) used here
- `risk-metrics` — net-of-cost performance
