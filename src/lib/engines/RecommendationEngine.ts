import { OpportunityScore, ScoringWeights, DEFAULT_WEIGHTS, PROFILE_WEIGHTS, ScoringProfile, RiskScore, FeeSnapshot, VolumeMetrics } from "../types";

export class RecommendationEngine {
  static scorePool(params: {
    pool: string;
    token: string;
    protocol: any;
    feeSnapshot: FeeSnapshot;
    riskScore: RiskScore;
    volume: VolumeMetrics;
    liquidityUSD: number;
    volume24h: number;
    weights?: ScoringWeights;
    profile?: ScoringProfile;
  }): OpportunityScore {
    const weights = params.weights || (params.profile ? PROFILE_WEIGHTS[params.profile] : DEFAULT_WEIGHTS);

    // Fee opportunity 0-100
    const feeOpp = Math.min(100, (params.feeSnapshot.feePerLiquidity * 100000) + Math.min(30, params.feeSnapshot.fee24h / 1000));
    // Liquidity quality from risk engine
    const liquidityQuality = params.riskScore.liquidityQuality;
    const volumeQuality = params.riskScore.volumeQuality;
    const tokenSecurity = params.riskScore.security;
    const holderDistribution = params.riskScore.holderDistribution;
    const poolStability = params.riskScore.poolStability;
    const marketStability = params.riskScore.marketStability;
    const confidence = params.riskScore.confidence;

    // Risk penalty: higher risk reduces score
    const riskPenalty = params.riskScore.overall * 0.5; // up to 50 pts penalty

    const raw =
      feeOpp * (weights.feeOpportunity/100) +
      liquidityQuality * (weights.liquidityQuality/100) +
      volumeQuality * (weights.volumeQuality/100) +
      tokenSecurity * (weights.tokenSecurity/100) +
      holderDistribution * (weights.holderDistribution/100) +
      poolStability * (weights.poolStability/100) +
      marketStability * (weights.marketStability/100) +
      confidence * (weights.dataConfidence/100);

    const riskAdjusted = Math.max(0, Math.min(100, raw - riskPenalty * 0.3));

    // Hard filters override score
    let finalScore = riskAdjusted;
    let state: OpportunityScore["recommendationState"] = "WATCH";
    if (params.riskScore.isRejected) {
      finalScore = Math.min(finalScore, 15);
      state = "REJECTED";
    } else if (finalScore >= 80 && params.riskScore.overall <= 25) state = "STRONG_OPPORTUNITY";
    else if (finalScore >= 65 && params.riskScore.overall <= 40) state = "RECOMMENDED";
    else if (params.riskScore.overall >= 60) state = "HIGH_RISK";
    else if (params.riskScore.overall >= 40) state = "INVESTIGATE";
    else state = "WATCH";

    // Explainability
    const whyRanked: string[] = [];
    const whyNotHigher: string[] = [];
    const warnings: string[] = [];
    const unknowns: string[] = [];

    if (feeOpp > 70) whyRanked.push("Strong fee generation per liquidity");
    else if (feeOpp > 50) whyRanked.push("Moderate fee generation");
    else whyNotHigher.push("Low fee generation efficiency");

    if (liquidityQuality > 80) whyRanked.push("Deep, stable liquidity");
    else if (liquidityQuality < 50) warnings.push("Liquidity risk elevated");

    if (volumeQuality > 80) whyRanked.push("Organic-looking volume distribution");
    else if (volumeQuality < 50) warnings.push("Volume quality low - possible wash trading");

    if (tokenSecurity > 85) whyRanked.push("No major authority warnings");
    else warnings.push("Token authority risks present");

    if (holderDistribution > 80) whyRanked.push("Healthy holder distribution");
    else warnings.push(`Holder concentration high`);

    if (confidence < 70) unknowns.push("Limited historical data - confidence reduced");
    if (params.riskScore.reasons.length) warnings.push(...params.riskScore.reasons.slice(0,2));

    // Expected net return scenarios (simplified)
    const feeAnnual = params.feeSnapshot.baseEstimate * 365;
    const liquidity = params.liquidityUSD;
    const feeYield = feeAnnual / Math.max(1, liquidity);
    const expectedNetReturn = {
      conservative: feeYield * 0.5 - 0.02,
      base: feeYield * 0.75 - 0.01,
      optimistic: feeYield * 0.95,
    };

    return {
      pool: params.pool,
      token: params.token,
      protocol: params.protocol,
      feeOpportunity: Math.round(feeOpp),
      liquidityQuality: Math.round(liquidityQuality),
      volumeQuality: Math.round(volumeQuality),
      tokenSecurity: Math.round(tokenSecurity),
      holderDistribution: Math.round(holderDistribution),
      poolStability: Math.round(poolStability),
      marketStability: Math.round(marketStability),
      confidence: Math.round(confidence),
      riskScore: params.riskScore.overall,
      riskAdjustedScore: Math.round(finalScore * 10) / 10,
      recommendationState: state,
      expectedNetReturn,
      whyRanked,
      whyNotHigher,
      warnings,
      unknowns,
      lastUpdated: Date.now(),
      source: "fee+ risk engine v1",
    };
  }

  static rank(pools: OpportunityScore[]): OpportunityScore[] {
    return [...pools].sort((a,b) => b.riskAdjustedScore - a.riskAdjustedScore);
  }
}
