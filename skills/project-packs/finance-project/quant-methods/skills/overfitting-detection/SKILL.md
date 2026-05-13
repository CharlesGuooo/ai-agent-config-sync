---
name: overfitting-detection
description: Statistical tests for diagnosing backtest overfitting and inflated Sharpe ratios — Probability of Backtest Overfitting (PBO), Deflated Sharpe Ratio (DSR), White's Reality Check, Hansen's SPA test, and Haircut Sharpe. Use this skill whenever the user mentions backtest validation, "is this strategy real", overfitting concerns, suspiciously high Sharpe ratios, multiple-testing problems, strategy selection from a parameter sweep, hyperparameter optimization on returns, or claims of edge from limited data — even if they don't explicitly say "overfitting". Trigger eagerly before any strategy comes out of optimization or selection: most backtests are overfit, and the methods here are the only honest way to know.
---

# Overfitting Detection

## When to Use This Skill

Activate whenever you face any of these red flags:

- A strategy was selected after testing **many variations** (parameter grids, feature sets, model architectures)
- Reported Sharpe is **> 1.5 with < 5 years of data** and a complex model
- The user says "I tried N strategies and picked the best"
- Hyperparameter tuning happened **on the same data** used to evaluate the result
- Multiple strategies are being compared and one looks "obviously best"
- "Walk-forward" was used but the parameter search itself happened on full history

The unifying theme: **selection bias inflates performance metrics**. Sharpe ratios computed over the survivor of a search are biased upward; the more you searched, the more bias. The methods below correct for this.

## Methodology

### 1. Probability of Backtest Overfitting (PBO) — Bailey et al. 2014

Given N trial strategies' OOS returns, PBO answers: **"What is the probability that the strategy selected as best in-sample underperforms the median strategy out-of-sample?"** A PBO of 0.5 = pure luck. PBO < 0.2 is the rough acceptance threshold.

The technique: combinatorial symmetric cross-validation (CSCV). Split the time period into S buckets, choose all C(S, S/2) ways to form an IS/OOS split, rank strategies on IS, look at rank of the IS-winner on OOS, count how often it falls below median.

### 2. Deflated Sharpe Ratio (DSR) — Bailey & López de Prado 2014

Standard Sharpe is biased upward when many strategies were tried. DSR adjusts:

$$\text{DSR} = \text{Prob}\left(\hat{SR} > SR_0 \mid \text{non-normal returns, skew, kurt, N trials, T samples}\right)$$

where `SR_0` is the expected maximum Sharpe under the null of zero true skill across N trials. If DSR > 0.95, the strategy survives the multiple-testing correction.

### 3. White's Reality Check (Bootstrap) — 2000

Tests whether the **best** strategy from a universe of strategies has a true expected return > benchmark. Uses stationary bootstrap on the returns matrix. Null: best strategy has expected return ≤ benchmark.

### 4. Hansen's Superior Predictive Ability (SPA) — 2005

Refinement of Reality Check; less conservative because it down-weights strategies that perform poorly under the null. **Preferred over Reality Check in practice.**

### 5. Haircut Sharpe — Harvey & Liu 2015

Applies multiple-testing correction (Bonferroni, Holm, BHY) to a reported Sharpe to produce an "honest" haircut Sharpe given the number of tests run.

## Required Libraries

```bash
pip install numpy scipy pandas arch statsmodels
```

- `arch.bootstrap.SPA` — Hansen's SPA test (MIT license)
- `arch.bootstrap.StationaryBootstrap` — for Reality Check
- `statsmodels.stats.multitest` — for Bonferroni/BH/Holm corrections
- PBO and DSR: implement from scratch (papers are open access)

## Code Templates

### PBO from scratch (~60 lines)

```python
import numpy as np
import pandas as pd
from itertools import combinations

def pbo(returns_matrix: pd.DataFrame, S: int = 16) -> float:
    """
    Probability of Backtest Overfitting (Bailey et al. 2014).

    returns_matrix: rows = time, cols = strategy returns
    S: number of submatrices (even, typically 10-16)
    Returns PBO in [0, 1]. < 0.2 is acceptable; 0.5 = pure luck.
    """
    T, N = returns_matrix.shape
    rows_per_chunk = T // S
    chunks = [returns_matrix.iloc[i*rows_per_chunk:(i+1)*rows_per_chunk]
              for i in range(S)]

    logits = []
    for is_idx in combinations(range(S), S // 2):
        oos_idx = tuple(i for i in range(S) if i not in is_idx)
        is_returns = pd.concat([chunks[i] for i in is_idx])
        oos_returns = pd.concat([chunks[i] for i in oos_idx])

        is_sharpe = is_returns.mean() / is_returns.std()
        oos_sharpe = oos_returns.mean() / oos_returns.std()

        best_is = is_sharpe.idxmax()
        oos_rank = oos_sharpe.rank(pct=True)[best_is]  # in (0, 1]
        # avoid 0/1 → log(0); shift slightly
        oos_rank = np.clip(oos_rank, 1e-6, 1 - 1e-6)
        logits.append(np.log(oos_rank / (1 - oos_rank)))

    logits = np.array(logits)
    return float((logits < 0).mean())  # frac below median
```

### Deflated Sharpe Ratio (~30 lines)

```python
import numpy as np
from scipy.stats import norm, skew, kurtosis

def deflated_sharpe_ratio(returns: np.ndarray, n_trials: int,
                          sharpe_trials_std: float = None) -> float:
    """
    Bailey-López de Prado 2014.
    returns: 1D array of the selected strategy's returns
    n_trials: number of strategies tested
    sharpe_trials_std: stddev of Sharpes across trials (estimate if None)
    Returns DSR in [0, 1]; > 0.95 means significant after correction.
    """
    sr = returns.mean() / returns.std()
    T = len(returns)
    g = skew(returns)
    k = kurtosis(returns, fisher=False)  # non-excess

    if sharpe_trials_std is None:
        sharpe_trials_std = 1.0  # conservative default

    emc = 0.5772156649  # Euler-Mascheroni
    # E[max Sharpe] under null (Bailey-LdP eq 8)
    sr0 = sharpe_trials_std * (
        (1 - emc) * norm.ppf(1 - 1/n_trials) +
        emc * norm.ppf(1 - 1/(n_trials * np.e))
    )

    # variance of estimator
    sr_std = np.sqrt((1 - g*sr + (k-1)/4 * sr**2) / (T - 1))
    dsr = norm.cdf((sr - sr0) / sr_std)
    return float(dsr)
```

### Hansen's SPA via `arch`

```python
from arch.bootstrap import SPA

# returns: DataFrame, cols = strategy returns
# benchmark: 1D, e.g., zero or buy-and-hold
spa = SPA(benchmark, returns.values, reps=2000, block_size=10)
spa.compute()
print(f"Consistent p-value: {spa.pvalues['consistent']:.4f}")
# Reject null (no strategy beats benchmark) if p < 0.05
```

### Haircut Sharpe — Harvey & Liu 2015

```python
from statsmodels.stats.multitest import multipletests

def haircut_sharpe(sharpe: float, T: int, n_tests: int,
                   method: str = 'fdr_bh') -> dict:
    """
    Returns multiple-testing-adjusted Sharpe.
    method: 'bonferroni' | 'holm' | 'fdr_bh' (Benjamini-Hochberg)
    """
    # t-stat from Sharpe (assuming returns are annualized)
    t_stat = sharpe * np.sqrt(T)
    p_value = 2 * (1 - norm.cdf(abs(t_stat)))
    # apply correction across N tests
    pvals = np.array([p_value] + [0.5] * (n_tests - 1))  # dummy others
    _, adj_pvals, _, _ = multipletests(pvals, method=method)
    adj_t = norm.ppf(1 - adj_pvals[0] / 2)
    haircut_sr = adj_t / np.sqrt(T)
    haircut_pct = 1 - haircut_sr / sharpe if sharpe else 0
    return {"raw": sharpe, "haircut": haircut_sr, "pct_cut": haircut_pct}
```

## Pitfalls

- **Forgotten trials**: PBO/DSR only correct for trials you remember. Strategies abandoned mentally still bias selection. Be honest about N.
- **Block bootstrap size matters**: For autocorrelated returns (most strategies), set bootstrap block size to a few weeks of bars at minimum.
- **Sharpe is non-normal**: DSR explicitly corrects skew/kurtosis — don't skip those terms.
- **In-sample annual ≠ OOS annual**: Sharpe scales with sqrt(T); a 6-month backtest's "Sharpe 3" is much weaker than a 5-year "Sharpe 2".
- **Don't double-dip**: Reality Check/SPA assume the trial set is fixed before testing. Don't add strategies after seeing results.
- **Survivorship-fixed data**: All these tests assume the *price* data has no survivorship bias. Use point-in-time databases for stocks.

## References

- Bailey, Borwein, López de Prado, Zhu (2014). *The Probability of Backtest Overfitting*. https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2326253
- Bailey & López de Prado (2014). *The Deflated Sharpe Ratio*. https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2460551
- White (2000). *A Reality Check for Data Snooping*. Econometrica.
- Hansen (2005). *A Test for Superior Predictive Ability*. JBES.
- Harvey & Liu (2015). *Backtesting*. Journal of Portfolio Management.
- López de Prado (2018). *Advances in Financial Machine Learning*, ch. 11.

## Related Skills

- `time-series-cv` — proper cross-validation feeds these tests honest OOS returns
- `risk-metrics` — Sharpe / Sortino / DD definitions used here
- `backtest-expert` (in `portfolio/`) — strategy-level robustness workflow
