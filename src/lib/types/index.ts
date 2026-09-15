// Core types for DLMM Screener - production-grade

export type Chain = "solana";
export type Protocol = "meteora" | "orca" | "raydium" | "future";
export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH" | "CRITICAL";
export type RecommendationState = "WATCH" | "RECOMMENDED" | "STRONG_OPPORTUNITY" | "INVESTIGATE" | "HIGH_RISK" | "REJECTED";

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  isToken2022: boolean;
  token2022Extensions?: string[];
  supply: string;
  createdAt?: string;
}

export interface PoolInfo {
  address: string;
  protocol: Protocol;
  chain: Chain;
  name: string; // e.g. "SOL/USDC"
  tokenX: TokenInfo;
  tokenY: TokenInfo;
  mintX: string;
  mintY: string;
  reserveX: string;
  reserveY: string;
  liquidityUSD: number;
  binStep: number;
  baseFeeBps: number;
  activeBinId: number;
  currentPrice: number;
  createdAt?: string;
  // extended
  tvl?: number;
  apy?: number;
  volume24h?: number;
}

export interface FeeSnapshot {
  timestamp: number;
  slot?: number;
  source: string;
  pool: string;
  fee1m: number;
  fee5m: number;
  fee15m: number;
  fee1h: number;
  fee6h: number;
  fee24h: number;
  fee7d: number;
  fee30d: number;
  feePerLiquidity: number;
  feePerVolume: number;
  feeVolatility: number;
  currentRate: number;
  historicalRate: number;
  conservativeEstimate: number;
  baseEstimate: number;
  optimisticEstimate: number;
}

export interface LiquiditySnapshot {
  timestamp: number;
  pool: string;
  liquidity: number;
  change1m: number;
  change5m: number;
  change15m: number;
  change1h: number;
  change6h: number;
  change24h: number;
  change7d: number;
  riskScore: number; // 0 dangerous, 100 healthy
}

export interface VolumeMetrics {
  volume1h: number;
  volume24h: number;
  volume7d?: number;
  volumeToLiquidity: number;
  acceleration: number;
  uniqueTraders: number;
  buySellRatio: number;
  avgTradeSize: number;
  medianTradeSize: number;
  walletConcentration: number; // top5 share
  repeatTraderRatio: number;
  quality: number; // 0-100
}

export interface SecuritySignals {
  mintAuthorityActive: boolean;
  freezeAuthorityActive: boolean;
  updateAuthority?: string | null;
  tokenProgram: string;
  isToken2022: boolean;
  token2022Extensions: string[];
  dangerousExtensions: string[];
  holderTop5: number;
  holderTop10: number;
  holderTop20: number;
  holderTop50?: number;
  holderTop100?: number;
  adjustedHolderTop10: number;
  securityScore: number; // 0-100 (high is safe)
  riskReasons: string[];
  isRejected: boolean;
  rejectionReasons: string[];
}

export interface HolderDistribution {
  totalHolders: number;
  top5: number;
  top10: number;
  top20: number;
  top50: number;
  top100: number;
  adjustedTop10: number;
  concentrationRisk: number;
}

export interface BinInfo {
  binId: number;
  price: number;
  priceLower: number;
  priceUpper: number;
  liquidityX: string;
  liquidityY: string;
  liquidityUSD: number;
  volume: number;
  fees: number;
  isActive: boolean;
}

export interface BinSnapshot {
  pool: string;
  timestamp: number;
  activeBin: number;
  binStep: number;
  bins: BinInfo[];
}

export interface RiskScore {
  pool: string;
  timestamp: number;
  overall: number; // 0 low risk, 100 critical. inverted in UI? spec says 0 dangerous, 100 healthy for liquidity, but overall risk 0-100 where lower is safer. We'll use 0-100 risk where 0 = safe, 100 = critical.
  security: number;
  liquidityQuality: number;
  volumeQuality: number;
  holderDistribution: number;
  poolStability: number;
  marketStability: number;
  confidence: number;
  reasons: string[];
  isRejected: boolean;
  rejectionReasons: string[];
}

export interface OpportunityScore {
  pool: string;
  token: string;
  protocol: Protocol;
  feeOpportunity: number; // 0-100
  liquidityQuality: number;
  volumeQuality: number;
  tokenSecurity: number;
  holderDistribution: number;
  poolStability: number;
  marketStability: number;
  confidence: number;
  riskScore: number;
  riskAdjustedScore: number; // 0-100 final
  recommendationState: RecommendationState;
  expectedNetReturn?: {
    conservative: number;
    base: number;
    optimistic: number;
  };
  whyRanked: string[];
  whyNotHigher: string[];
  warnings: string[];
  unknowns: string[];
  lastUpdated: number;
  slot?: number;
  source: string;
}

// Scoring weights
export interface ScoringWeights {
  feeOpportunity: number;
  liquidityQuality: number;
  volumeQuality: number;
  tokenSecurity: number;
  holderDistribution: number;
  poolStability: number;
  marketStability: number;
  dataConfidence: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  feeOpportunity: 25,
  liquidityQuality: 15,
  volumeQuality: 15,
  tokenSecurity: 15,
  holderDistribution: 10,
  poolStability: 10,
  marketStability: 5,
  dataConfidence: 5,
};

export type ScoringProfile = "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";

export const PROFILE_WEIGHTS: Record<ScoringProfile, ScoringWeights> = {
  CONSERVATIVE: { feeOpportunity: 18, liquidityQuality: 20, volumeQuality: 12, tokenSecurity: 20, holderDistribution: 12, poolStability: 10, marketStability: 5, dataConfidence: 3 },
  BALANCED: DEFAULT_WEIGHTS,
  AGGRESSIVE: { feeOpportunity: 35, liquidityQuality: 12, volumeQuality: 18, tokenSecurity: 10, holderDistribution: 8, poolStability: 8, marketStability: 5, dataConfidence: 4 },
};

// Normalized event
export interface NormalizedEvent {
  chain: Chain;
  protocol: Protocol;
  pool: string;
  event_type: "swap" | "liquidity_add" | "liquidity_remove" | "fee_claim" | "price_update" | "security_event" | "bin_update";
  timestamp: string; // ISO
  slot: number;
  signature: string;
  data: Record<string, any>;
}

// Alert
export interface Alert {
  id: string;
  type: "liquidity_collapse" | "insider_sale" | "security_change" | "volume_anomaly" | "fee_spike" | "fee_collapse" | "price_exits_range" | "risk_deterioration" | "pool_inactivity";
  pool: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  timestamp: number;
  oldValue?: any;
  newValue?: any;
}

// Backtest
export interface BacktestConfig {
  pool: string;
  capital: number;
  strategy: "wide" | "symmetric" | "volatility_adjusted" | "fee_maximizing" | "risk_adjusted" | "static";
  rangeLower: number; // in percent, e.g. -2
  rangeUpper: number;
  startDate: string;
  endDate: string;
  rebalanceThreshold?: number;
}

export interface BacktestResult {
  initialCapital: number;
  totalFees: number;
  estimatedIL: number;
  rebalanceCosts: number;
  transactionCosts: number;
  netPnL: number;
  netPnLPercent: number;
  maxDrawdown: number;
  sharpeLike: number;
  capitalEfficiency: number;
  rangeOccupancy: number;
  numberOfRebalances: number;
  dailyReturns: { date: string; pnl: number }[];
}

// Range optimizer
export interface RangeRecommendation {
  lowerBin: number;
  upperBin: number;
  lowerPrice: number;
  upperPrice: number;
  lowerPct: number;
  upperPct: number;
  expectedFeeEfficiency: number;
  expectedRangeOccupancy: number;
  estimatedInventoryRisk: number;
  expectedRebalanceFrequency: string;
  strategy: string;
}

// System status
export interface SystemStatus {
  rpcStatus: "online" | "degraded" | "offline";
  indexerStatus: "online" | "degraded" | "offline";
  databaseStatus: "online" | "offline";
  realtimeWorkerStatus: "online" | "offline" | "reconnecting";
  websocketStatus: "connected" | "disconnected" | "reconnecting" | "stale";
  eventsPerSec: number;
  poolsMonitored: number;
  poolsAnalyzed: number;
  apiRequests: number;
  rpcRequests: number;
  dbWrites: number;
  lastEvent: string | null;
  lastSuccessfulScan: string | null;
  uptime: string;
}
