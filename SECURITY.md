# SECURITY

## Token Authorities

- `mint authority`: can mint new supply → inflation/rug
- `freeze authority`: can freeze accounts
- `update/metadata authority`: can change metadata if present
- `Token program`: SPL vs Token-2022

## Token-2022 Extensions (risk only if dangerous)

- `transferFee` — fee on every transfer (check rate/max)
- `transferHook` — custom program, may block sells
- `permanentDelegate` — can transfer/burn any holder's tokens
- `defaultAccountState` — frozen by default
- `mintCloseAuthority`, `confidentialTransfer`, etc.

UI explains each extension; not all Token-2022 tokens are malicious.

## Holder & Insider

- Top 5/10/20/50/100 adjusted concentration; excludes LP/burn/protocol/CEX.
- Deployer/funding/early/LP creator/large seller graph — funding wallet → multiple wallets → accumulation → coordinated selling. Labels: `Possible / Likely / High Confidence Cluster`.

## Hard Rejection (REJECTED)

Extreme concentration, dangerous authority, severe withdrawal, strong malicious pattern, severe sell restriction, extremely low liquidity, extreme manipulation, insufficient data. Shown with ✕ reasons.

## App Security

- Input validation + address validation
- Rate limiting + request caching + API timeout + exponential retry + circuit breaker
- No arbitrary RPC URL injection
- Logging + error boundaries

