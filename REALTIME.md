# REALTIME

## Core Requirement

Not `refresh every 5 minutes` — genuine realtime for market-critical data: price, swaps, volume, liquidity, active bin, fees, pool state, withdrawals, large wallets, security, risk, ranking.

## In Prod

```
Solana RPC WebSocket logsSubscribe (filter: LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo)
  or Yellowstone gRPC (Triton/Helius/QuickNode): SubscribeRequest for transactions + accounts
  → decode with IDL (lb_clmm.json) → normalized events → Event Bus → engines → SSE
```

## In This Demo

`/api/realtime` (SSE) simulates the same event types on timers:
- `pool_update` every 1.5s (price/liquidity/volume)
- `fee_update` every 3s
- `risk_update` every 7s (sometimes critical)
- `ranking_update` every 5s
- `security_alert` every ~10s
- `heartbeat` every 15s

The browser uses `EventSource` and falls back to `fetch` polling if SSE fails — without hammering (exponential backoff, 5-10s).

## How It Feels

- Dashboard ranking animates when `ranking_update` arrives.
- Risk → immediate color/score change and card moves #1 → #8 etc.
- Liquidity collapse triggers `CRITICAL LIQUIDITY EVENT` banner.

