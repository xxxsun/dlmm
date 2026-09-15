# RISK MODEL

## Risk Score (0-100)

- 0–20 LOW, 21–40 MODERATE, 41–60 HIGH, 61–80 VERY HIGH, 81–100 CRITICAL — thresholds configurable.

**Components:**
- **Security (30%):** mint authority, freeze authority, Token-2022 dangerous extensions (transferHook, permanentDelegate, etc.), holder concentration, liquidity change.
- **Liquidity (25%):** current liquidity, 1m/5m/15m/1h/6h/24h changes, withdrawal/migration/collapse, one-sided/concentrated.
- **Volume (15%):** volume/liquidity, acceleration, unique traders, buy/sell, avg/median trade size, wallet concentration, repeat trader ratio — wash detection.
- **Holder (15%):** Top 5/10/20/50/100 adjusted (excludes LP/burn/protocol/CEX where identifiable).
- **Age (10%):** <24h = high, <72h medium, <1w low.
- **Fee volatility (5%):** high fee vol = market instability.

`overall = weighted sum` (capped 0-100). `isRejected` if any hard filter triggers or overall >85 or concentration >90% or liquidity <5k.

## Liquidity Risk (0 dangerous, 100 healthy)

Inverse of liquidity risk portion. Withdrawal -38% in 3m → immediate risk spike (e.g., 21 → 68) and `CRITICAL LIQUIDITY EVENT`.

## Security

- SPL vs Token-2022: Token-2022 is not auto-malicious; only specific extensions raise risk, with explanations.
- Hard rejection reasons shown verbatim.

## Volume Quality

- Low quality if top 5 wallets >~70-78% of volume or high repeat trader ratio with low unique traders.

## Holder

- Adjusted concentration excludes program/burn/CEX wallets; if identifiable threshold >50, progressive penalty.

## Confidence

- Based on sources, freshness, historical sample size, completeness, RPC reliability. Missing data → UNKNOWN.

