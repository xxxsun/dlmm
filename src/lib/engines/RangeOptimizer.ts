import { RangeRecommendation, BinSnapshot } from "../types";

// Range optimizer with 5 strategies
export class RangeOptimizer {
  static wide(pool: { binStep: number; currentPrice: number }): RangeRecommendation {
    const pct = 8;
    return RangeOptimizer.make(pct, pct, pool, "Wide Range - minimal rebalancing, lower fee efficiency");
  }
  static symmetric(pool: { binStep: number; currentPrice: number }, volatility: number = 2): RangeRecommendation {
    const pct = Math.max(1, Math.min(6, volatility * 1.5));
    return RangeOptimizer.make(pct, pct, pool, "Symmetric Range - balanced");
  }
  static volatilityAdjusted(pool: { binStep: number; currentPrice: number }, volatility: number): RangeRecommendation {
    const base = Math.max(1.2, volatility * 2);
    return RangeOptimizer.make(base*0.8, base*1.2, pool, "Volatility-Adjusted - wider on downside if momentum bearish");
  }
  static feeMaximizing(pool: { binStep: number; currentPrice: number }): RangeRecommendation {
    return RangeOptimizer.make(1.2, 1.8, pool, "Fee-Maximizing - narrow, high yield but frequent rebalance");
  }
  static riskAdjusted(pool: { binStep: number; currentPrice: number }, riskScore: number): RangeRecommendation {
    const widen = riskScore > 50 ? 2 : riskScore > 30 ? 1.3 : 1;
    return RangeOptimizer.make(1.5*widen, 2.0*widen, pool, "Risk-Adjusted - widens with risk");
  }

  private static make(lowerPct: number, upperPct: number, pool: { binStep: number; currentPrice: number }, strategy: string): RangeRecommendation {
    const current = pool.currentPrice;
    const lowerPrice = current * (1 - lowerPct/100);
    const upperPrice = current * (1 + upperPct/100);
    const lowerBin = Math.round(8388608 + Math.log(lowerPrice/current)/Math.log(1+pool.binStep/10000));
    const upperBin = Math.round(8388608 + Math.log(upperPrice/current)/Math.log(1+pool.binStep/10000));
    const rangeWidth = upperPct + lowerPct;
    const expectedFeeEfficiency = Math.max(20, 100 - rangeWidth * 6);
    const expectedRangeOccupancy = Math.max(40, 95 - rangeWidth * 2);
    const estimatedInventoryRisk = Math.min(100, rangeWidth * 4 + 10);
    const expectedRebalanceFrequency = rangeWidth < 4 ? "Every few hours if volatile" : rangeWidth < 8 ? "Daily to every few days" : "Weekly";
    return {
      lowerBin, upperBin, lowerPrice, upperPrice, lowerPct, upperPct,
      expectedFeeEfficiency, expectedRangeOccupancy, estimatedInventoryRisk, expectedRebalanceFrequency, strategy
    };
  }

  // Inventory / IL model for DLMM bins
  static inventoryProjection(currentPrice: number, changePct: number, range: RangeRecommendation, capital: number) {
    const newPrice = currentPrice * (1 + changePct/100);
    const inRange = newPrice >= range.lowerPrice && newPrice <= range.upperPrice;
    // Simplified fee income proportional to occupancy and volatility
    const feeIncome = inRange ? capital * 0.0008 * Math.abs(changePct) : capital * 0.0002;
    // IL for DLMM: if price exits range, inventory becomes 100% one side; estimate
    let inventoryChange = 0;
    if (!inRange) {
      // Outside range: impermanent loss approx
      inventoryChange = -capital * Math.min(0.15, Math.abs(changePct)/100 * 0.5);
    } else {
      inventoryChange = -capital * Math.pow(changePct/100,2) * 0.4; // small concave loss
    }
    const net = feeIncome + inventoryChange - capital*0.0005; // tx cost
    return { newPrice, inRange, feeIncome, inventoryChange, net };
  }
}
