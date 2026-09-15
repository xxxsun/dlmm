# FEE MODEL

- Windows: `1m, 5m, 15m, 1h, 6h, 24h, 7d, 30d` — calculated as deltas from fee snapshots.
- Metrics: `fees/liquidity`, `fees/volume`, `fee efficiency` (normalized 0-100, penalized by volatility), fee consistency (volatility), `currentRate` vs `historicalRate`.
- Estimates: `conservative` = min(current, historical)*0.7, `base` = avg, `optimistic` = max*1.1 — never assume 24h APR = future APR.
- Anomaly detection: temporary spike (24h >> 7d avg), volume collapse, wash (repeated same-size swaps, circular), sniper, liquidity manipulation, extreme spike.
- Example: $15k fees on $100k liquidity is **not** auto-ranked high — fee quality engine checks organicity.

## Expected Net Return

```
conservative/base/optimistic fees (annualized) − IL − rebalance − tx costs
```

IL modeled per DLMM bin/range behavior (closed-form bin price steps `price = (1+binStep/10000)^(binId-8388608) * 10^(decX-decY)`), not generic AMM formula. Each IL table includes in/out-of-range flag, fee income, inventory change, net.

