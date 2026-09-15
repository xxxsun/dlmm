# DATA SOURCES — Verified

Do not invent API endpoints. All below verified Sept 2026.

## Solana / Meteora

| Item | Value | Verified |
|------|-------|----------|
| DLMM Program ID | `LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo` | Meteora docs + npm + pkg.go.dev |
| DLMM TS SDK | `npm install @meteora-ag/dlmm @solana/web3.js` then `DLMM.create(connection, poolAddress)` | docs.meteora.ag |
| DLMM API (public) | `https://dlmm-api.meteora.ag/pair/all`, `/pair/:address`, OHLCV, volume, fees, groups, metrics | Meteora + third-party analysis: 30 RPS, REST-only, no WebSocket |
| DLMM DatAPI (alt) | `https://dlmm.datapi.meteora.ag` | Go SDK wrappers |
| DAMM v2 Program | `cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG` | Bitquery docs |
| Solana RPC WebSocket | `logsSubscribe` filtered on DLMM program ID → parse base64 logs; Yellowstone gRPC for multiplexed streams | Official Solana docs + vendor docs |

## Details

- **Meteora REST** is polling-only, aggregates updated 5-30s behind chain. Useful for pool list/OHLCV/volume, not for bin-level freshness.
- **Realtime (prod):** subscribe to program logs via `Connection.onLogs(programId)` or Yellowstone gRPC `SubscribeRequest` for transactions + account updates filtered by program ID. Pre-decode DLMM events (swap, add/remove liquidity) with IDL (`lb_clmm.json`).
- **Rate limits:** Meteora REST 30 RPS (earlier docs say 10 RPS — current verified 30). No WebSocket/gRPC on official — use third-party providers (Helius, QuickNode, Triton) for streams.
- **No invented endpoints:** all `fetch` URLs in `MeteoraDLMMAdapter` match `dlmm-api.meteora.ag` paths.

## Freshness

- Price/swaps/liquidity/active bin: **realtime** (WebSocket/gRPC → event bus)
- Fees: **near-realtime** (5-30s aggregates + on-chain fee account polling)
- Holders/security: **event-driven / minutes / hours** (cached, invalidated on mint authority change, large transfers)
- Metadata: **hours**

## Multi-source validation

If Source A says $1.2M liquidity and Source B says $1.19M → acceptable. If $1.2M vs $300K → flag discrepancy, do not blindly pick one; show lower confidence + `UNKNOWN` if unresolved.

## Fallback

If API is unavailable, response includes `_source: simulated-fallback` and disclaimer; security defaults to `UNKNOWN` (never safe). Frontend shows stale/offline badges.

