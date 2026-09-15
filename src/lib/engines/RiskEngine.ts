import { RiskScore, SecuritySignals, LiquiditySnapshot, VolumeMetrics } from "../types";

export class RiskEngine {
  static computeRiskScore(params: {
    pool: string;
    security: SecuritySignals;
    liquidity: LiquiditySnapshot;
    volume: VolumeMetrics;
    feeVolatility: number;
    poolAgeHours: number;
    holderConcentration: number;
  }): RiskScore {
    const { pool, security, liquidity, volume, feeVolatility, poolAgeHours, holderConcentration } = params;

    // Security risk 0-100 (high = risky)
    let securityRisk = 100 - security.securityScore;
    if (security.mintAuthorityActive) securityRisk += 25;
    if (security.freezeAuthorityActive) securityRisk += 20;
    if (security.dangerousExtensions.length > 0) securityRisk += 15 * security.dangerousExtensions.length;

    // Liquidity risk
    let liquidityRisk = 100 - liquidity.riskScore;
    if (liquidity.change1h < -30) liquidityRisk += 20;
    if (liquidity.change24h < -50) liquidityRisk += 25;
    if (liquidity.liquidity < 20000) liquidityRisk += 30;

    // Volume quality risk (low quality = high risk)
    const volumeRisk = 100 - volume.quality;
    // Holder concentration risk
    const holderRisk = holderConcentration; // 0-100 already
    // Age risk (very new = higher risk)
    const ageRisk = poolAgeHours < 24 ? 30 : poolAgeHours < 72 ? 15 : poolAgeHours < 168 ? 5 : 0;
    // Fee volatility risk
    const feeRisk = Math.min(30, feeVolatility * 20);

    // Weighted overall (lower is safer)
    const overall = Math.min(100, Math.max(0,
      securityRisk * 0.30 +
      liquidityRisk * 0.25 +
      volumeRisk * 0.15 +
      holderRisk * 0.15 +
      ageRisk * 0.10 +
      feeRisk * 0.05
    ));

    const reasons: string[] = [];
    if (security.mintAuthorityActive) reasons.push("Mint authority active");
    if (security.freezeAuthorityActive) reasons.push("Freeze authority active");
    if (security.dangerousExtensions.length) reasons.push(`Dangerous extensions: ${security.dangerousExtensions.join(", ")}`);
    if (liquidity.change1h < -20) reasons.push(`Liquidity ${liquidity.change1h.toFixed(1)}% in 1h`);
    if (volume.walletConcentration > 50) reasons.push(`Top 5 wallets ${volume.walletConcentration.toFixed(1)}% of volume`);
    if (holderConcentration > 70) reasons.push(`Top 10 holders ${holderConcentration.toFixed(1)}%`);

    const isRejected = security.isRejected || overall > 85 || holderConcentration > 90 || liquidity.liquidity < 5000;
    const rejectionReasons = security.rejectionReasons.slice();
    if (overall > 85) rejectionReasons.push(`Overall risk ${overall.toFixed(0)} critical`);
    if (holderConcentration > 90) rejectionReasons.push(`Extreme holder concentration ${holderConcentration.toFixed(1)}%`);
    if (liquidity.liquidity < 5000) rejectionReasons.push("Extremely low liquidity");

    // LiquidityQuality etc for scoring (inverted risk)
    const liquidityQuality = Math.max(0, 100 - liquidityRisk);
    const poolStability = Math.max(0, 100 - (liquidityRisk * 0.6 + feeRisk * 0.4));
    const marketStability = Math.max(0, 100 - (volumeRisk * 0.5 + feeRisk * 0.5));

    return {
      pool,
      timestamp: Date.now(),
      overall: Math.round(overall),
      security: Math.max(0, 100 - securityRisk),
      liquidityQuality: Math.round(liquidityQuality),
      volumeQuality: Math.round(volume.quality),
      holderDistribution: Math.max(0, 100 - holderRisk),
      poolStability: Math.round(poolStability),
      marketStability: Math.round(marketStability),
      confidence: 85, // placeholder, derived from data freshness
      reasons,
      isRejected,
      rejectionReasons,
    };
  }

  static riskLevel(score: number): string {
    if (score <= 20) return "LOW";
    if (score <= 40) return "MODERATE";
    if (score <= 60) return "HIGH";
    if (score <= 80) return "VERY_HIGH";
    return "CRITICAL";
  }

  static riskColor(score: number): string {
    if (score <= 20) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score <= 40) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    if (score <= 60) return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    if (score <= 80) return "text-red-400 bg-red-500/10 border-red-500/20";
    return "text-red-500 bg-red-500/20 border-red-500/30";
  }
}
