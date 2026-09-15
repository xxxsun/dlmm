import { FeeSnapshot } from "../types";

export class FeeEngine {
  // Calculate fee metrics from raw snapshots
  static calculateFeeMetrics(pool: string, history: { timestamp: number; fees: number; liquidity: number }[]): FeeSnapshot {
    const now = Date.now();
    const getFeeWindow = (ms: number) => {
      const cutoff = now - ms;
      const relevant = history.filter(h => h.timestamp >= cutoff);
      if (relevant.length < 2) return 0;
      const fees = relevant.reduce((acc, cur, idx, arr) => {
        if (idx === 0) return 0;
        return acc + Math.max(0, cur.fees - arr[idx-1].fees);
      }, 0);
      // Alternative: sum fees directly if history is incremental snapshots
      // For mock, we approximate
      return relevant[relevant.length-1]?.fees - relevant[0]?.fees || 0;
    };

    const fee1m = getFeeWindow(60 * 1000);
    const fee5m = getFeeWindow(5 * 60 * 1000);
    const fee15m = getFeeWindow(15 * 60 * 1000);
    const fee1h = getFeeWindow(60 * 60 * 1000);
    const fee6h = getFeeWindow(6 * 60 * 60 * 1000);
    const fee24h = getFeeWindow(24 * 60 * 60 * 1000);
    const fee7d = getFeeWindow(7 * 24 * 60 * 60 * 1000);
    const fee30d = getFeeWindow(30 * 24 * 60 * 60 * 1000);

    const latestLiquidity = history[history.length-1]?.liquidity || 1;
    const feePerLiquidity = fee24h / Math.max(1, latestLiquidity);
    const feePerVolume = 0.0025; // placeholder derived from swap fees
    const feeVolatility = FeeEngine.calcVolatility(history.map(h => h.fees));

    // Estimates
    const currentRate = (fee1h * 24); // extrapolate 1h to 24h
    const historicalRate = fee24h;
    const conservativeEstimate = Math.min(currentRate, historicalRate) * 0.7;
    const baseEstimate = (currentRate + historicalRate) / 2;
    const optimisticEstimate = Math.max(currentRate, historicalRate) * 1.1;

    return {
      timestamp: now,
      source: "meteora-dlmm-api+onchain",
      pool,
      fee1m, fee5m, fee15m, fee1h, fee6h, fee24h, fee7d, fee30d,
      feePerLiquidity,
      feePerVolume,
      feeVolatility,
      currentRate,
      historicalRate,
      conservativeEstimate,
      baseEstimate,
      optimisticEstimate,
    };
  }

  static calcVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a,b)=>a+b,0)/values.length;
    const variance = values.reduce((a,b)=> a + Math.pow(b-mean,2),0)/values.length;
    const std = Math.sqrt(variance);
    return mean === 0 ? 0 : std / mean;
  }

  static feeEfficiencyScore(feePerLiquidity: number, volatility: number): number {
    // higher fee per liquidity is better, lower volatility is better
    const feeScore = Math.min(100, feePerLiquidity * 10000 * 100); // scale
    const volPenalty = Math.min(40, volatility * 100);
    return Math.max(0, Math.min(100, feeScore - volPenalty));
  }

  static detectAnomaly(snapshot: FeeSnapshot): { type: string; severity: string } | null {
    if (snapshot.fee24h > snapshot.fee7d / 7 * 5) return { type: "temporary fee spike", severity: "warning" };
    if (snapshot.fee1h < snapshot.fee24h / 24 * 0.1) return { type: "fee collapse", severity: "critical" };
    if (snapshot.feeVolatility > 1.5) return { type: "extreme fee volatility", severity: "warning" };
    return null;
  }
}
