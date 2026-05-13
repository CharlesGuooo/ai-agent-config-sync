---
name: time-series-cv
description: Leakage-safe cross-validation for financial time series — Purged K-Fold, Combinatorial Purged Cross-Validation (CPCV), Embargo, and Walk-Forward Analysis. Use whenever the user does cross-validation on financial data, trains an ML model on returns/prices, evaluates a predictive model, splits train/test on time-ordered data, worries about lookahead bias, asks "why is my model great in CV but terrible live", or is preparing to hyperparameter-tune anything that touches returns. sklearn's KFold and even TimeSeriesSplit leak information for overlapping labels — this skill explains why and what to use instead.
---

# Time-Series Cross-Validation (Leakage-Safe)

## When to Use This Skill

Trigger eagerly whenever:

- The target variable `y` is derived from **future** price action (next-N-bar return, Triple Barrier outcome, etc.)
- Features have lookback windows (rolling means, technical indicators) — they can leak across fold boundaries
- The user is calling `sklearn.model_selection.KFold(shuffle=True)` on financial data (almost always wrong)
- A model gets > 60% accuracy in CV but fails live
- Hyperparameter search needs to be done honestly
- The user mentions López de Prado, AFML, or "purging"

## Why Standard CV Leaks for Finance

In standard K-Fold with shuffling, training samples can come from periods *after* validation samples. Even without shuffling, when labels overlap in time (e.g., a 5-bar return label at time t uses prices through t+5), train and validation sets share information.

`sklearn.TimeSeriesSplit` blocks future-leak but does not handle **label overlap** or **feature lookback overlap** at fold boundaries.

The fix has two parts:

1. **Purge** training samples whose labels overlap (in time) with the test set.
2. **Embargo** training samples for a short period *after* the test set, to prevent autocorrelation leakage.

## Methodology

### 1. Walk-Forward Analysis (baseline)

Expanding or rolling window: train on `[t0, t1]`, test on `[t1, t2]`, then slide. The most conservative, simplest method. Use as a sanity baseline.

### 2. Purged K-Fold (López de Prado 2018, ch. 7)

K-Fold but:
- Compute the **time span** of each label (e.g., a TBM label uses bars `[t_event, t_event + horizon]`)
- For each fold, drop training samples whose label-span overlaps the test set
- Add an **embargo** period after test to drop trailing samples too

### 3. Combinatorial Purged CV (CPCV) — López de Prado 2018, ch. 12

K-Fold gives one OOS path per sample. CPCV gives many. Split into N groups, choose k groups for test, leaves C(N, k) possible test combinations. For each, compute purged training set, get OOS predictions, reassemble into multiple OOS backtest paths.

CPCV is the **only honest way** to combine cross-validation with hyperparameter tuning on finance data: pick hyperparameters on one set of paths, evaluate the final strategy on held-out paths.

### 4. Embargo: How Long?

Should cover the autocorrelation horizon of features. For daily bars with EMA(20) features, embargo ≥ 20 days. For minute bars, ≥ a few hours.

## Required Libraries

```bash
pip install timeseriescv scikit-learn numpy pandas
```

- `timeseriescv` (BSD-3) — provides `CombPurgedKFoldCV` and `PurgedWalkForwardCV`
- Self-implement Purged K-Fold if you don't want a new dep — ~30 lines

## Code Templates

### Purged K-Fold (self-implemented)

```python
import numpy as np
import pandas as pd

def purged_kfold_splits(label_end_times: pd.Series, k: int = 5,
                        embargo_pct: float = 0.01):
    """
    label_end_times: pd.Series indexed by event start time t1,
                     values = label end time t2 (when the label is observable)
    k: number of folds
    embargo_pct: fraction of total samples to embargo after test set
    Yields (train_idx, test_idx) tuples of positional indices.
    """
    n = len(label_end_times)
    fold_size = n // k
    embargo = int(n * embargo_pct)
    test_ranges = [(i * fold_size, (i + 1) * fold_size if i < k - 1 else n)
                   for i in range(k)]

    times = label_end_times.values

    for start, end in test_ranges:
        test_start_time = label_end_times.index[start]
        test_end_time = times[end - 1]

        # train = all samples whose label-span doesn't overlap test window
        train_mask = np.ones(n, dtype=bool)
        train_mask[start:end] = False

        # purge: training labels that end after test_start
        for i in range(n):
            if train_mask[i] and times[i] >= test_start_time \
               and label_end_times.index[i] < test_start_time:
                train_mask[i] = False

        # embargo: drop training samples just after test
        embargo_end = min(n, end + embargo)
        train_mask[end:embargo_end] = False

        yield np.where(train_mask)[0], np.arange(start, end)
```

### Using `timeseriescv` library

```python
from timeseriescv.cross_validation import CombPurgedKFoldCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# X: features, y: labels, t1: pd.Series of label end times (same index as X)
cv = CombPurgedKFoldCV(n_splits=6, n_test_splits=2, embargo_td=pd.Timedelta(days=5))

scores = []
for train_idx, test_idx in cv.split(X, y, pred_times=X.index, eval_times=t1):
    model = RandomForestClassifier(n_estimators=100, n_jobs=-1)
    model.fit(X.iloc[train_idx], y.iloc[train_idx])
    pred = model.predict(X.iloc[test_idx])
    scores.append(accuracy_score(y.iloc[test_idx], pred))

print(f"CPCV mean acc: {np.mean(scores):.3f} ± {np.std(scores):.3f}")
```

### Walk-Forward (simple)

```python
def walk_forward_splits(n: int, train_size: int, test_size: int, step: int = None):
    step = step or test_size
    pos = train_size
    while pos + test_size <= n:
        yield np.arange(pos - train_size, pos), np.arange(pos, pos + test_size)
        pos += step
```

### Hyperparameter Tuning Under CPCV

```python
from sklearn.model_selection import ParameterGrid

grid = ParameterGrid({"max_depth": [3, 5, 7], "min_samples_leaf": [10, 20]})

best = (-np.inf, None)
for params in grid:
    fold_scores = []
    for train_idx, test_idx in cv.split(X, y, pred_times=X.index, eval_times=t1):
        m = RandomForestClassifier(**params, n_jobs=-1)
        m.fit(X.iloc[train_idx], y.iloc[train_idx])
        fold_scores.append(m.score(X.iloc[test_idx], y.iloc[test_idx]))
    mean_score = np.mean(fold_scores)
    if mean_score > best[0]:
        best = (mean_score, params)

# WARNING: even with CPCV, tuning then reporting the best score is
# overfit to the CV. Hold out a final test set or use nested CV.
```

## Pitfalls

- **The `t1` series is the crux**: if your label is "5-day return from t", then `t1[t] = t + 5 days`. Get this wrong and purging does nothing.
- **Embargo too short**: features with long lookback (e.g., 200-day MA) leak past short embargoes. Match embargo to your slowest feature.
- **Reporting CV score as final performance**: tuning on CV inflates score. Always hold out a final test period for the chosen hyperparameters, or use nested CV (CPCV-of-CPCV).
- **Sample weights for overlapping labels**: in addition to purging, López de Prado recommends sample weighting by uniqueness (inverse of how many concurrent labels overlap). See `labeling` skill.
- **Shuffling**: never shuffle a financial time series for ML CV.
- **Asymmetric label horizons**: TBM labels have variable end times — `t1` is a Series, not a single horizon.

## References

- López de Prado (2018). *Advances in Financial Machine Learning*, ch. 7 and 12.
- `timeseriescv` docs: https://github.com/sam31415/timeseriescv

## Related Skills

- `labeling` — produces the `t1` series needed here
- `overfitting-detection` — what to do *after* CPCV gives you OOS returns
- `feature-engineering-fin` — features that demand long embargo windows
