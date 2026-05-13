---
name: regime-detection
description: Detect and classify market regimes — Hidden Markov Models (HMM), Markov Switching regression, change-point detection (Bai-Perron, ruptures), volatility regime states, and clustering-based regime identification. Use whenever the user mentions market regimes, regime switching, risk-on / risk-off, bear vs bull state, market regime detection, "is the regime changing", crisis vs normal periods, or wants to gate a strategy by market state. Most strategies work in some regimes and fail in others — detecting the current regime is often more profitable than improving the strategy.
---

# Regime Detection

## When to Use This Skill

Trigger whenever:

- The user mentions market regimes, regime switching, "the regime changed"
- A strategy works in some periods and fails in others; they want to gate it
- "Risk-on / risk-off", "bull / bear / crisis" states are discussed
- A structural break is suspected (also see `time-series-stats`)
- Vol regimes or correlation regimes are being modeled

For **single structural break tests**, route to `time-series-stats`. For the **macro / business cycle** flavor, route to existing `macro-regime-detector`. This skill is the **statistical / ML toolkit**.

## Methodology

### 1. Hidden Markov Model (HMM)

Latent state `s_t ∈ {1, ..., K}` evolves as a Markov chain; observations (returns, vol, indicators) are state-dependent. Fit via Baum-Welch (EM). Output: posterior probability of each regime at each time.

**Common configurations:**
- 2 states: `low_vol` vs `high_vol`
- 3 states: `bull`, `range-bound`, `bear`
- Observations: log-returns, realized vol, term-structure spread

### 2. Markov Switching Regression (Hamilton 1989)

Like HMM but the **mean and variance** of returns are state-dependent and parameters fit by MLE. Less flexible than HMM but more interpretable. `statsmodels.tsa.regime_switching.MarkovRegression`.

### 3. Change-Point Detection

Identifies dates where the data-generating process changes. Two flavors:
- **Offline (retrospective)**: PELT, Binary Segmentation, Bottom-Up — find all change points in the full series. Use `ruptures`.
- **Online (sequential)**: Bayesian Online Changepoint Detection (BOCD) — probability of a change at each step in real time. Use `bocd` or self-implement.

### 4. Volatility Regime Classification

Cluster on rolling vol features (5d, 20d, 60d realized vol). K-means or GMM. Simple, fast, decent baseline before reaching for HMM.

### 5. Correlation Regime

Dynamic Conditional Correlation (DCC-GARCH) or rolling correlation matrices, then cluster. Useful for diversification breakdown detection (crisis = correlations → 1).

## Required Libraries

```bash
pip install hmmlearn statsmodels ruptures scikit-learn
```

- `hmmlearn` (BSD-3) — Gaussian HMM
- `statsmodels.tsa.regime_switching` — Hamilton-style switching
- `ruptures` (BSD) — change-point detection
- `sklearn.cluster.KMeans`, `sklearn.mixture.GaussianMixture`

## Code Templates

### 2-State Gaussian HMM on Returns

```python
import numpy as np
import pandas as pd
from hmmlearn.hmm import GaussianHMM

# returns: pd.Series of daily log-returns
X = returns.values.reshape(-1, 1)
hmm = GaussianHMM(n_components=2, covariance_type="full",
                  n_iter=500, random_state=42)
hmm.fit(X)
states = hmm.predict(X)
posterior = hmm.predict_proba(X)

# Identify which state is "calm" vs "stress" by variance
state_var = [hmm.covars_[i, 0, 0] for i in range(2)]
calm = int(np.argmin(state_var))
stress = 1 - calm
print(f"Calm state μ={hmm.means_[calm, 0]:.5f}, σ²={state_var[calm]:.6f}")
print(f"Stress state μ={hmm.means_[stress, 0]:.5f}, σ²={state_var[stress]:.6f}")

regime_df = pd.DataFrame({
    "state": states,
    "p_calm": posterior[:, calm],
    "p_stress": posterior[:, stress],
}, index=returns.index)
```

### Markov Switching Regression (Hamilton)

```python
import statsmodels.api as sm

# 2-regime model: mean and variance switch
mod = sm.tsa.MarkovRegression(returns, k_regimes=2,
                              switching_variance=True, trend="c")
res = mod.fit()
print(res.summary())

# Smoothed regime probabilities
smooth_probs = res.smoothed_marginal_probabilities
smooth_probs.plot(title="Smoothed regime probabilities")
```

### Offline Change-Point Detection

```python
import ruptures as rpt

# Detect changes in mean OR variance
signal = returns.values

# Pelt with L2 (mean change)
algo = rpt.Pelt(model="rbf", min_size=20).fit(signal)
penalty = 10  # tune by sweep
breaks = algo.predict(pen=penalty)
print("Breakpoints:", [returns.index[i-1] for i in breaks[:-1]])

# Alternative: Binary Segmentation with fixed n_bkps
algo2 = rpt.Binseg(model="rbf", min_size=20).fit(signal)
breaks2 = algo2.predict(n_bkps=4)
```

### K-Means on Vol Features

```python
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

# Build vol-regime features
vol_feats = pd.DataFrame({
    "vol_5d": returns.rolling(5).std(),
    "vol_20d": returns.rolling(20).std(),
    "vol_60d": returns.rolling(60).std(),
    "kurt_60d": returns.rolling(60).kurt(),
}).dropna()

scaled = StandardScaler().fit_transform(vol_feats)
km = KMeans(n_clusters=3, n_init=10, random_state=42).fit(scaled)
regime_labels = pd.Series(km.labels_, index=vol_feats.index, name="regime")

# Label clusters by mean of vol_20d
cluster_vol = vol_feats.groupby(km.labels_)["vol_20d"].mean()
order = cluster_vol.sort_values().index
name_map = {order[0]: "low_vol", order[1]: "med_vol", order[2]: "high_vol"}
regime_labels_named = regime_labels.map(name_map)
```

### Bayesian Online Change-Point (Light)

```python
def bocd_step_gaussian(x, hazard=1/100, mu0=0, kappa0=1, alpha0=1, beta0=1):
    """
    Minimal online Bayesian changepoint detector for Gaussian data with
    unknown mean and variance (Normal-Inverse-Gamma conjugate prior).
    Returns posterior over run length r_t.
    """
    from scipy.stats import t as student_t
    # State (one row per active run length)
    runs = {0: (mu0, kappa0, alpha0, beta0)}
    posteriors = []

    for x_t in x:
        # Predictive prob for each run
        probs = {}
        for r, (mu, k, a, b) in runs.items():
            # Student-t predictive
            scale = np.sqrt(b * (k + 1) / (a * k))
            p = student_t.pdf(x_t, df=2 * a, loc=mu, scale=scale)
            probs[r] = p

        # Posterior over run length
        growth = {r + 1: probs[r] * (1 - hazard) for r in runs}
        cp = sum(probs[r] * hazard for r in runs)
        new = {0: cp, **growth}
        # Normalize
        Z = sum(new.values())
        new = {r: v / Z for r, v in new.items()}
        posteriors.append(new)

        # Update sufficient stats
        new_runs = {}
        for r in new:
            if r == 0:
                new_runs[r] = (mu0, kappa0, alpha0, beta0)
            else:
                old_r = r - 1
                mu, k, a, b = runs[old_r]
                k_new = k + 1
                mu_new = (k * mu + x_t) / k_new
                a_new = a + 0.5
                b_new = b + (k * (x_t - mu) ** 2) / (2 * k_new)
                new_runs[r] = (mu_new, k_new, a_new, b_new)
        runs = new_runs

    return posteriors
```

### Gating a Strategy by Regime

```python
def regime_gated_returns(strategy_returns: pd.Series,
                        regime: pd.Series,
                        allowed_regimes: set) -> pd.Series:
    """Return strategy returns only when regime is in allowed set."""
    mask = regime.isin(allowed_regimes)
    return strategy_returns.where(mask, 0.0)

# Example: only trade momentum in calm-mean-positive regime
gated = regime_gated_returns(momentum_returns, regime_labels, {"calm_bull"})
print(f"Original Sharpe: {momentum_returns.mean() / momentum_returns.std() * 16:.2f}")
print(f"Gated Sharpe:    {gated.mean() / gated.std() * 16:.2f}")
```

## Pitfalls

- **Lookahead in regime labels** — HMM `.predict()` uses smoothed states with future info. For live trading, use **filtered** (Viterbi forward-only) probabilities, not smoothed.
- **In-sample fitting** — fitting an HMM on the whole history then evaluating a gated strategy is doubly cheating. Re-fit periodically.
- **Number of regimes K** — AIC/BIC help, but interpretability matters. K=2 (calm/stress) is robust; K=4+ overfits.
- **Regime persistence** — without strong transition probabilities, the model will flip-flop. Tune via priors or post-processing (smoothing, minimum duration filters).
- **Change-point penalty tuning** — `ruptures` results are sensitive to the penalty / `n_bkps`. Show sensitivity.
- **Stationarity within regime** — if you assume stationary within regime, GARCH inside regime is fine; if not, two-stage models help.
- **Regime labels are estimates** — confidence intervals on the state are wider than they look.

## References

- Hamilton (1989). *A New Approach to the Economic Analysis of Nonstationary Time Series*.
- Rabiner (1989). *A Tutorial on Hidden Markov Models*.
- Adams & MacKay (2007). *Bayesian Online Changepoint Detection*.
- Killick et al. (2012). *Optimal Detection of Changepoints With a Linear Computational Cost* (PELT).

## Related Skills

- `time-series-stats` — single structural break tests
- `volatility-modeling` — vol features feed regime detection
- `macro-regime-detector` (in `macro/`) — macro/business-cycle regimes
- `feature-engineering-fin` — regime indicators as ML features
