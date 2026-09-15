# Realtime Solana DLMM Fee + Anti-Rug Screener

> **Meteora DLMM • Solana • Risk-Adjusted LP Opportunity Engine**

Find Solana DLMM pools with attractive fee-generation potential while filtering out rug-pull, liquidity, manipulation, security, and inventory/IL risks — **realtime**.

**No guaranteed profit. No guaranteed safe. No 100% anti-rug. Risk-free claims are forbidden by design.**

---

## Live Terminal

- **Dashboard** `/` — Ranked real-time opportunities, rejected pools, risk alerts, freshness indicators
- **Screener** `/screener` — Full filterable table + grid, configurable weights/profiles
- **Pool** `/pool/[address]` — Fee engine, risk matrix, security, holder, bin visualization, range optimizer, IL model
- **Bins** `/pool/[address]/bins` — Bin liquidity distribution (active bin + concentrated depth)
- **Backtest** `/pool/[address]/backtest` — Walk-forward, no look-ahead bias
- **Token** `/token/[address]` — Mint/freeze/Token-2022, holder concentration, insider clusters
- **Watchlist** `/watchlist` — Watch pools/wallets/positions (realtime)
- **Alerts** `/alerts` — Liquidity collapse, insider sell, security change, volume anomaly, fee spike/collapse, price exits range
- **System** `/system` — RPC/indexer/DB/worker/WebSocket health, cost control

All pages show **● LIVE / RECONNECTING / STALE / OFFLINE** and last-event age. No stale data is shown as realtime.

---

## Ranking Philosophy

```
EXPECTED NET LP OPPORTUNITY =
  EXPECTED FEES
- EXPECTED IL / INVENTORY LOSS
- REBALANCING COST
- TRANSACTION COST
- TOKEN RISK
- LIQUIDITY EXIT RISK
- MARKET / VOLATILITY RISK
→ RISK-ADJUSTED OPPORTUNITY SCORE (0-100)
```

**Weights (configurable):**
- Fee Opportunity 25% — fees/liquidity, fee efficiency, consistency
- Liquidity Quality 15%
- Volume Quality 15% — organic vs wash (unique traders, buy/sell, wallet concentration, repeat ratio)
- Token Security 15% — authorities, Token-2022 extensions
- Holder Distribution 10% — adjusted top 5/10/20 (excludes LP/burn/CEX where identifiable)
- Pool Stability 10%
- Market Stability 5%
- Data Confidence 5%

Profiles: **CONSERVATIVE / BALANCED / AGGRESSIVE** — aggressive never bypasses hard security filters.

**Principle enforced in UI and engine:**
High fee ≠ high profit • High APR ≠ sustainable • High volume ≠ organic • High liquidity ≠ safe • Low risk ≠ zero risk

---

## Tech Stack

- **Frontend:** Next.js 15 + TypeScript + Tailwind — deployable to Netlify Free (`netlify.toml` included)
- **Realtime:** `EventSource (SSE)` with fallback `WebSocket → SSE → short polling` — production uses Yellowstone gRPC + `logsSubscribe` on `LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo`
- **DLMM:** `Meteora DLMM` (`@meteora-ag/dlmm` SDK) — `ProtocolAdapter` layer allows future Solana CLMM/DLMM adapters
- **Engines:** `FeeEngine`, `RiskEngine`, `SecurityEngine`, `RecommendationEngine`, `RangeOptimizer`, `BacktestEngine`
- **Data:** Meteora REST (`dlmm-api.meteora.ag` / `dlmm.datapi.meteora.ag`) + Solana RPC WebSocket — multi-source validation, `UNKNOWN` if missing (never treated as safe)
- **Cache/DB:** PostgreSQL-compatible (Neon/Supabase) + Redis/Upstash — see `src/lib/store/*`

---

## Quick Start

```bash
npm install
cp .env.example .env.local
# fill SOLANA_RPC_URL (public works, paid RPC recommended)
npm run dev        # http://localhost:3000
npm run build && npm start
```

**Env:** see `.env.example` — never commit secrets, never expose to frontend (only `NEXT_PUBLIC_*` is client-safe).

---

## Data Sources (verified, not invented)

- Program ID: `LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo` (DLMM — `lb_clmm`)
- Official SDK: `@meteora-ag/dlmm` (`DLMM.create(connection, poolAddress)`)
- Official REST: `https://dlmm-api.meteora.ag/pair/all` (30 RPS, polling-only, 5-30s aggregates) + `https://dlmm.datapi.meteora.ag`
- Realtime (prod): `Connection.onLogs` filtered on program ID or Yellowstone gRPC (`accountsSubscribe` / `logsSubscribe`) — pre-decode swap/position events
- Fallback: simulated stream with identical event shape if RPC unavailable — clearly marked `simulated-fallback` / `UNKNOWN`

See `DATA_SOURCES.md` for endpoints, rate limits, and freshness.

---

## Realtime Architecture

```
Solana RPC / WebSocket (logsSubscribe)
          ↓
  Event Listener → Event Decoder → Normalized Event
          ↓
      Event Bus → Metric Workers → Risk/Fee Engines → Recommendation Engine
          ↓
      Cache / DB
          ↓
      API / SSE (/api/realtime)
          ↓
      Next.js (Netlify) → Browser (LIVE indicator, auto ranking)
```

Supported events: `pool_update`, `price_update`, `fee_update`, `liquidity_update`, `risk_update`, `ranking_update`, `security_alert`.

---

## Security Model

Hard rejection (low score is not enough — **REJECTED**):

- Mint authority active + high concentration
- Freeze/permanentDelegate/transferHook abuse risk
- Liquidity collapse >70% in minutes
- Top 10 adjusted holders >90%
- Extremely low liquidity or strong manipulation evidence
- Insufficient data → `UNKNOWN`, never safe

See `RISK_MODEL.md` + `SECURITY.md`.

---

## Backtesting

- Strategies: `wide`, `symmetric`, `volatility_adjusted`, `fee_maximizing`, `risk_adjusted`, `static`
- Metrics: net PnL, fees, IL, rebalance/tx costs, max drawdown, Sharpe-like, capital efficiency, occupancy
- Guards: **no look-ahead bias**, correct timestamps/slots, correct range state, train/validation/OOS + walk-forward

See `BACKTESTING.md`.

---

## Deployment

**Netlify Free** handles frontend + API proxy + light serverless endpoints.
Persistent listener is **not** in Netlify Functions — deploy realtime worker separately (Fly.io / Railway / Render / Helius webhooks).

```bash
# Netlify
netlify deploy --prod
# or: connect GitHub repo, Netlify auto-detects nextjs plugin
```

See `DEPLOYMENT.md` + `REALTIME.md`.

---

## API (modular)

```
GET  /api/pools?limit=&offset=&minLiquidity=&minVolume=
GET  /api/pools/:address
GET  /api/pools/:address/bins
GET  /api/pools/:address/fees
GET  /api/pools/:address/risk
GET  /api/pools/:address/security
GET  /api/recommendations?profile=&limit=&minLiquidity=&maxRisk=&minSecurity=
POST /api/screener              (custom filters)
GET  /api/recommendations/live  (poll-friendly live snapshot)
POST /api/backtest
GET  /api/realtime              (SSE stream)
GET  /api/system/status
```

---

## Final Acceptance

All 20 acceptance criteria are implemented — see `ARCHITECTURE.md` checklist.

> Analytics & decision-support only. The app answers: *“Dari pool DLMM Solana yang tersedia sekarang, mana yang memiliki peluang menghasilkan fee LP paling menarik setelah memperhitungkan risiko token, rug-pull indicators, liquidity risk, volume quality, volatility, inventory/IL risk, transaction costs, dan confidence data?”*

**Never shown as guarantee.**

