---
name: backtesting-frameworks
description: Selection guide and minimal working examples for major open-source Python backtesting frameworks — backtrader, vectorbt, backtesting.py, NautilusTrader, zipline-reloaded. Use whenever the user wants to backtest a trading strategy in Python, asks "which framework should I use", is starting a new strategy project, mentions event-driven vs vectorized backtesting, or asks how to validate a strategy idea on historical data. Also enforces the anti-bias checklist (lookahead, survivorship, point-in-time data, costs) that applies regardless of framework. The right framework depends on what you're testing — picking wrong wastes weeks.
---

# Backtesting Framework Selection

## When to Use This Skill

Trigger whenever the user:

- Asks how to backtest a strategy idea
- Compares backtrader vs vectorbt vs anything
- Is about to write a custom backtest from scratch (usually a mistake)
- Wants to test 10,000 parameter combinations (vectorbt) vs simulate a realistic execution path (backtrader)
- Has a strategy in TradingView/PineScript and wants to validate it more rigorously

For the **methodology** of validating *whether* the result is real, route to `overfitting-detection` and `time-series-cv`. This skill is about **wiring the simulation correctly**.

## Framework Comparison

| Framework | Style | Speed | Strength | Use When |
|---|---|---|---|---|
| **backtrader** | Event-driven, bar-by-bar | Slow (~1k bars/sec) | Realistic execution, full broker simulation | Single strategy with complex order types, live trading planned |
| **vectorbt** (or vectorbt-pro) | Vectorized, NumPy/Numba | Very fast (~10M bars/sec) | Massive parameter sweeps, portfolio-level | Grid search, factor analysis, many assets at once |
| **backtesting.py** | Event-driven, simpler than BT | Medium | Pedagogical clarity, built-in plotting | Quick prototypes, teaching, small projects |
| **NautilusTrader** | Event-driven, Rust core | Fast | Nanosecond timestamps, professional grade | HFT, multi-venue, production-bound |
| **zipline-reloaded** | Event-driven, US equities focus | Slow | Quantopian-era patterns, factor pipeline | Legacy projects, Quantopian-style research |

### Decision Tree

- "I want to test 1 strategy with 50 parameter combos on 100 stocks" → **vectorbt**
- "I want a realistic simulation with limit orders, partial fills, commissions" → **backtrader**
- "I want to teach myself backtesting in a weekend" → **backtesting.py**
- "I'm going to deploy this with real money, low-latency" → **NautilusTrader**
- "Cross-sectional factor research on the US equities universe" → **zipline-reloaded** or **vectorbt**

## Minimum Working Examples

### vectorbt — fastest path to "is there a signal here"

```python
import vectorbt as vbt
import numpy as np

price = vbt.YFData.download("SPY", start="2015-01-01").get("Close")
fast = vbt.MA.run(price, window=10).ma
slow = vbt.MA.run(price, window=30).ma
entries = fast > slow
exits = fast < slow

pf = vbt.Portfolio.from_signals(
    price, entries, exits,
    fees=0.0005, slippage=0.0002, freq="1D"
)
print(pf.stats())
pf.plot().show()

# Grid search over many windows in one shot
grid = vbt.MA.run_combs(price, windows=[5, 10, 20, 50, 100], r=2)
fast_grid, slow_grid = grid
entries = fast_grid.ma_above(slow_grid)
exits = fast_grid.ma_below(slow_grid)
pf_grid = vbt.Portfolio.from_signals(price, entries, exits, fees=0.0005)
print(pf_grid.sharpe_ratio().sort_values(ascending=False).head())
```

### backtrader — when you need realistic execution

```python
import backtrader as bt

class MovingAvgCross(bt.Strategy):
    params = (("fast", 10), ("slow", 30),)
    def __init__(self):
        self.fast = bt.ind.SMA(self.data.close, period=self.p.fast)
        self.slow = bt.ind.SMA(self.data.close, period=self.p.slow)
        self.crossover = bt.ind.CrossOver(self.fast, self.slow)
    def next(self):
        if not self.position and self.crossover > 0:
            self.buy(size=100)
        elif self.position and self.crossover < 0:
            self.close()

cerebro = bt.Cerebro()
data = bt.feeds.YahooFinanceCSVData(dataname="SPY.csv")
cerebro.adddata(data)
cerebro.addstrategy(MovingAvgCross)
cerebro.broker.setcash(100000.0)
cerebro.broker.setcommission(commission=0.0005)
cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name="sharpe")
cerebro.addanalyzer(bt.analyzers.DrawDown, _name="dd")
results = cerebro.run()
print(f"Sharpe: {results[0].analyzers.sharpe.get_analysis()['sharperatio']:.3f}")
```

### backtesting.py — minimal and clear

```python
from backtesting import Backtest, Strategy
from backtesting.lib import crossover
from backtesting.test import SMA, GOOG

class SmaCross(Strategy):
    n1 = 10
    n2 = 30
    def init(self):
        self.sma1 = self.I(SMA, self.data.Close, self.n1)
        self.sma2 = self.I(SMA, self.data.Close, self.n2)
    def next(self):
        if crossover(self.sma1, self.sma2):
            self.buy()
        elif crossover(self.sma2, self.sma1):
            self.sell()

bt = Backtest(GOOG, SmaCross, cash=10000, commission=0.0005)
print(bt.run())
bt.plot()
```

## Universal Anti-Bias Checklist

Apply regardless of framework. Most "amazing" backtests fail one of these.

### 1. Lookahead Bias

- Are features computed using ONLY information available at decision time?
- `df['signal'] = df['return'].rolling(20).mean() > 0` — wait, did you shift? If signal uses today's close to trade today's close, you've cheated by an entire bar.
- Pattern: shift signals by one bar before using them as entry triggers.

```python
# WRONG
df['entry'] = df['fast_ma'] > df['slow_ma']
# RIGHT (decision based on yesterday's MA, traded today's open)
df['entry'] = (df['fast_ma'].shift(1) > df['slow_ma'].shift(1))
```

### 2. Survivorship Bias

- Did your stock universe in 2015 include only stocks that still trade today?
- That's survivorship — you implicitly avoided every delisted name.
- Fix: use point-in-time databases (CRSP, Norgate, sharadar, Polygon flat files with delisted) or accept the bias and document it.

### 3. Look-ahead in fundamental data

- Earnings filed Feb 15 for Q4 ending Dec 31 cannot be used on Jan 1.
- Use the **filing date** as the "available at" timestamp, not the period end.

### 4. Slippage and Commission

- Equity retail: 0.5-2 bps commission, 1-5 bps slippage typical for liquid names
- Less liquid: 10-50 bps slippage, set vol-aware models
- Crypto: 1-10 bps each side typical
- **Never** run a backtest with zero costs; first thing you check is whether the strategy survives realistic costs

### 5. Execution Realism

- Limit orders may not fill — model as % chance of fill at the limit
- Stop orders trigger at the worst price within the bar — not the close
- Market-on-close orders fill at the NEXT day's open for retail

### 6. Sampling Frequency

- Strategy uses 1-minute bars but data has 5-minute? Be explicit about how decisions map.
- Day-trading strategy backtested on EOD data is meaningless.

### 7. Capacity

- Strategy makes 100% return on $100k but the strategy buys 50% of daily volume on a $5M-cap stock? Won't scale.
- Apply realistic position-size caps relative to ADV.

## Pitfalls Specific to Each Framework

- **vectorbt**: easy to leak via `entries` indexing — make sure entries[i] uses only data through i-1
- **backtrader**: `self.broker.getcash()` includes pending orders; use `getvalue()` for portfolio
- **backtesting.py**: assumes one asset; multi-asset requires manual concatenation
- **All frameworks**: default position sizing is often "all-in"; configure size explicitly

## Required Libraries

```bash
pip install vectorbt backtrader backtesting yfinance
# For NautilusTrader: pip install nautilus_trader (compile time)
```

## References

- backtrader: https://www.backtrader.com/docu/
- vectorbt: https://vectorbt.dev/
- backtesting.py: https://kernc.github.io/backtesting.py/
- NautilusTrader: https://docs.nautilustrader.io/
- López de Prado (2018) ch. 11 — "The Most Important Backtest Statistic" (PBO)

## Related Skills

- `overfitting-detection` — validate that the backtest result isn't noise
- `time-series-cv` — proper validation for ML-driven strategies
- `risk-metrics` — what to compute from backtest equity curves
- `execution-modeling` — realistic slippage / impact for sized positions
- `backtest-expert` (in `portfolio/`) — tradermonty workflow for stress-testing
