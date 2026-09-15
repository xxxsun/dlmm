// PostgreSQL-compatible schema (Neon / Supabase / self-hosted)
// This file documents the schema; in MVP the app uses in-memory + fetch, not a real DB connection.
// To enable, install `pg` or `@vercel/postgres` and set DATABASE_URL.

export const schemaSQL = `
-- Tokens
CREATE TABLE IF NOT EXISTS tokens (
  address TEXT PRIMARY KEY,
  symbol TEXT, name TEXT, decimals INT,
  mint_authority TEXT, freeze_authority TEXT,
  token_program TEXT, is_token2022 BOOLEAN,
  extensions TEXT[],
  created_at TIMESTAMPTZ
);

-- Pools
CREATE TABLE IF NOT EXISTS pools (
  address TEXT PRIMARY KEY,
  protocol TEXT, chain TEXT, name TEXT,
  mint_x TEXT, mint_y TEXT,
  reserve_x TEXT, reserve_y TEXT,
  liquidity_usd DOUBLE PRECISION,
  bin_step INT, base_fee_bps INT,
  active_bin_id INT, current_price DOUBLE PRECISION,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
);

-- Time-series snapshots (hypertable if TimescaleDB)
CREATE TABLE IF NOT EXISTS pool_snapshots (
  pool TEXT, timestamp TIMESTAMPTZ, slot BIGINT,
  liquidity DOUBLE PRECISION, volume_24h DOUBLE PRECISION, fees_24h DOUBLE PRECISION,
  price DOUBLE PRECISION, active_bin INT
);
CREATE INDEX ON pool_snapshots (pool, timestamp DESC);

CREATE TABLE IF NOT EXISTS swap_events (
  signature TEXT PRIMARY KEY, pool TEXT, timestamp TIMESTAMPTZ, slot BIGINT,
  amount_in TEXT, amount_out TEXT, fee TEXT, trader TEXT
);

CREATE TABLE IF NOT EXISTS liquidity_events (
  signature TEXT PRIMARY KEY, pool TEXT, timestamp TIMESTAMPTZ, slot BIGINT,
  type TEXT, amount_usd DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS fee_snapshots (
  pool TEXT, timestamp TIMESTAMPTZ, slot BIGINT,
  fee_1m DOUBLE PRECISION, fee_5m DOUBLE PRECISION, fee_15m DOUBLE PRECISION,
  fee_1h DOUBLE PRECISION, fee_6h DOUBLE PRECISION, fee_24h DOUBLE PRECISION,
  fee_7d DOUBLE PRECISION, fee_30d DOUBLE PRECISION,
  fee_per_liquidity DOUBLE PRECISION, fee_per_volume DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS bin_snapshots (
  pool TEXT, timestamp TIMESTAMPTZ, active_bin INT, bin_step INT, bins JSONB
);

CREATE TABLE IF NOT EXISTS holders (
  token TEXT, wallet TEXT, amount TEXT, pct DOUBLE PRECISION, updated_at TIMESTAMPTZ,
  PRIMARY KEY (token, wallet)
);

CREATE TABLE IF NOT EXISTS wallet_clusters (
  cluster_id TEXT PRIMARY KEY, wallets TEXT[], confidence TEXT, reason TEXT
);

CREATE TABLE IF NOT EXISTS security_events (
  pool TEXT, timestamp TIMESTAMPTZ, type TEXT, severity TEXT, message TEXT
);

CREATE TABLE IF NOT EXISTS risk_scores (
  pool TEXT, timestamp TIMESTAMPTZ, overall INT, security INT, liquidity_quality INT,
  volume_quality INT, holder_distribution INT, pool_stability INT, market_stability INT,
  confidence INT, is_rejected BOOLEAN, reasons JSONB
);

CREATE TABLE IF NOT EXISTS recommendations (
  pool TEXT, timestamp TIMESTAMPTZ, risk_adjusted_score DOUBLE PRECISION,
  recommendation_state TEXT, weights JSONB
);

CREATE TABLE IF NOT EXISTS backtest_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool TEXT, config JSONB, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backtest_results (
  run_id UUID REFERENCES backtest_runs(id),
  net_pnl DOUBLE PRECISION, total_fees DOUBLE PRECISION, max_drawdown DOUBLE PRECISION,
  sharpe_like DOUBLE PRECISION, daily_returns JSONB
);

CREATE TABLE IF NOT EXISTS watchlists (
  user_id TEXT, pool TEXT, created_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, pool)
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY, pool TEXT, type TEXT, severity TEXT,
  title TEXT, message TEXT, timestamp TIMESTAMPTZ, read BOOLEAN DEFAULT false
);
`;
