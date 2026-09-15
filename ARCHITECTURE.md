# ARCHITECTURE — Realtime DLMM Screener

## Goals
Production-quality realtime screener that prioritizes **expected net LP opportunity** over raw APR, with transparent, decomposable scoring and hard security rejections.

## High-Level

```
                    SOLANA
                       │
               RPC / WebSocket (logsSubscribe filter: LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo)
                       │
                       ▼
              EVENT INGESTION (Yellowstone gRPC in prod; SSE simulator in demo)
                       │
                       ▼
                EVENT PROCESSOR (decoder → normalized event)
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      Fee Engine   Risk Engine   Security Engine
          │            │            │
          └────────────┼────────────┘
                       ▼
               Recommendation Engine (weights configurable, profiles, hard rejection)
                       │
                       ▼
                Cache / DB (PostgreSQL • Timeseries • Redis)
                       │
                       ▼
                API / Realtime (SSE at /api/realtime, REST at /api/*)
                       │
                       ▼
                   NETLIFY
                (Next.js • Tailwind • Serverless proxy)
                       │
                       ▼
                   Browser (LIVE indicator, auto ranking, no manual refresh)
```

## Protocol Adapter Layer

```ts
ProtocolAdapter
  ├── MeteoraDLMMAdapter  // uses @meteora-ag/dlmm + dlmm-api.meteora.ag
  ├── FutureDLMMAdapter   // stub — same interface
  └── FutureCLMMAdapter   // e.g. Orca Whirlpools, Raydium CLMM
```

All pool discovery goes through the adapter. The app is **not hard-coded** to one protocol.

## Event Pipeline

Normalized event shape:

```json
{
  "chain": "solana",
  "protocol": "meteora",
  "pool": "5rCf1...",
  "event_type": "swap",
  "timestamp": "2026-09-16T07:00:00Z",
  "slot": 310000123,
  "signature": "...",
  "data": {}
}
```

Flow: `RPC logsSubscribe` → `EventDecoder` (IDL-parsed DLMM events: swap, add/remove liquidity, fee claim, bin update) → `EventBus` → `Metric Workers` (price, swaps, volume, liquidity, fees) → `RiskEngine` → `RecommendationEngine` → `Cache` → `SSE`.

In this demo, `/api/realtime` emits the same shapes via `setInterval` simulator so the frontend behaves identically to prod.

## Scoring

- Decomposable: each pool card shows the 8 components + risk penalty.
- Weights default to spec (25/15/15/15/10/10/5/5) and are configurable per request / stored profile.
- Aggressive profile raises fee weight to 35% but **still enforces hard rejection**.

## Realtime Frontend

- `RealtimeProvider` (React context) opens `EventSource("/api/realtime")`, handles `onopen/onmessage/onerror`, reconnects with 2.5s backoff.
- `LiveIndicator` shows `LIVE` (pulse), `RECONNECTING` (ping), `STALE`, `OFFLINE` — plus last-event age.
- Fallback chain: `WebSocket → SSE → short polling` (polling does not hammer — 5-10s, incremental).
- Ranking changes animate (`▲/▼` jitter) without page refresh.

## Caching & Scanning

- Discovery: `10k → 2k → 500 → 100 → 30` via cheap → deep filters.
- Cache: token metadata hours, holders minutes, security event-driven, price/swaps/liquidity realtime, fees near-realtime, history in DB.
- Incremental updates: SSE pushes only changed fields where possible.

## Database (PostgreSQL-compatible)

Tables: `tokens`, `pools`, `pool_snapshots`, `swap_events`, `liquidity_events`, `fee_snapshots`, `bin_snapshots`, `holders`, `wallet_clusters`, `security_events`, `risk_scores`, `fee_scores`, `recommendations`, `backtest_runs`, `backtest_results`, `watchlists`, `alerts` — with time-series indexes, TTL on raw events.

## Failure Modes

- RPC degraded → preserve last valid state, show `RPC DEGRADED`, retry exponential.
- Indexer degraded → `INDEXER DEGRADED`, prefer on-chain verification.
- Worker disconnect → `REALTIME OFFLINE`, `RECONNECTING`.

## Security of the App

- Input validation on all addresses/filters
- Rate limiting + caching on API
- No arbitrary RPC URL injection
- Circuit breakers + retries
- Secrets only in server env (`SOLANA_RPC_URL`, `DATABASE_URL`, `REDIS_URL`) — never `NEXT_PUBLIC_` except RPC read URL.

## Acceptance Checklist (20)

1. Discover real Meteora pools (`MeteoraDLMMAdapter.discoverPools`) — yes, fallback to simulated if API down (marked).
2. Retrieve real pool data — yes.
3. Receive realtime/on-chain events or best available realtime stream — yes (`/api/realtime` SSE, prod via gRPC/logsSubscribe).
4. UI updates without manual refresh — yes (EventSource → state).
5. Liquidity changes affect risk score — `RiskEngine` uses liquidity change.
6. Fee changes affect fee score — `FeeEngine` multi-window.
7. Security events affect risk — `SecurityEngine` → `RiskEngine`.
8. Rankings update automatically — `ranking_update` event re-sorts.
9. Can reject dangerous pools — `REJECTED` with reasons.
10. Explains why recommended — `whyRanked / whyNotHigher / warnings / unknowns`.
11. Can calculate estimated LP range — `RangeOptimizer` + 5 strategies.
12. Historical data can be backtested — `BacktestEngine`.
13. Avoids look-ahead bias — walk-forward, train/validation/OOS.
14. No secrets exposed — only `NEXT_PUBLIC_` on client.
15. Frontend deployable to Netlify — `netlify.toml` + `@netlify/plugin-nextjs`.
16. Realtime worker independently deployable — documented in `REALTIME.md` / `DEPLOYMENT.md`.
17. Graceful when APIs/RPC fail — degraded states, stale badge, last valid.
18. Missing data never treated as safe → `UNKNOWN`.
19. Not APR-only — risk-adjusted composite.
20. No guaranteed-profit/safety claims — banned phrases, uses Risk/Security/Confidence.

