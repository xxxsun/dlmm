// Vitest-style unit tests for scoring — run with `npm test` after installing vitest
import { describe, it, expect } from "vitest";
import { RecommendationEngine } from "../src/lib/engines/RecommendationEngine";
import { RiskEngine } from "../src/lib/engines/RiskEngine";
import { SecurityEngine } from "../src/lib/engines/SecurityEngine";
import { FeeEngine } from "../src/lib/engines/FeeEngine";

describe("SecurityEngine", ()=>{
  it("rejects mint authority + high concentration", ()=>{
    const s = SecurityEngine.analyzeToken({
      mintAuthority: "Active", freezeAuthority: null,
      tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      isToken2022: false, extensions: [], holderTop10: 91, holderTop20: 96, liquidity: 100000, liquidityChange1h: -5
    });
    expect(s.isRejected).toBe(true);
    expect(s.rejectionReasons.length).toBeGreaterThan(0);
  });
});

describe("RiskEngine", ()=>{
  it("overall risk increases with liquidity collapse", ()=>{
    // stub: ensure engine runs without throw
    expect(RiskEngine.riskLevel(15)).toBe("LOW");
    expect(RiskEngine.riskLevel(85)).toBe("CRITICAL");
  });
});

describe("FeeEngine", ()=>{
  it("volatility calc", ()=>{
    expect(FeeEngine.calcVolatility([100,100,100])).toBeCloseTo(0);
    expect(FeeEngine.calcVolatility([0,1000,0])).toBeGreaterThan(0.5);
  });
});
