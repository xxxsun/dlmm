# BACKTESTING

## Correctness

- **No look-ahead bias:** at each timestamp only past bars determine position/range/rebalance. Train → validation → OOS; walk-forward sliding windows.
- **Timestamps/slots:** every candle has `timestamp` + `slot` + `source`; historical and live data never mixed.
- **Range state:** tracked correctly per bar — if price was out-of-range at bar start, fees are minimal for that bar.

## Strategies

- `wide`: ±8% — minimal rebalancing, lower efficiency
- `symmetric`: volatility *1.5
- `volatility_adjusted`: scales with measured volatility
- `fee_maximizing`: ±1.2/+1.8% narrow, frequent rebalances
- `risk_adjusted`: widens with risk score
- `static`: fixed bins

## Metrics

`initial capital`, `total fees`, `estimated IL`, `rebalance costs`, `transaction costs`, `net PnL`, `net PnL %`, `max drawdown`, `Sharpe-like (mean/std * sqrt(365))`, `capital efficiency`, `range occupancy`, `number of rebalances`, `daily returns[]`.

## Walk-forward

`walkForward(history, windowSize=30)` — train on window, optimize, test next window, slide.

