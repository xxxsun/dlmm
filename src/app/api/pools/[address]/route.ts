import { NextRequest, NextResponse } from "next/server";
import { generateMockPools, generateOpportunities, mockFeeHistory } from "@/lib/data/mockData";
import { FeeEngine } from "@/lib/engines/FeeEngine";
import { SecurityEngine } from "@/lib/engines/SecurityEngine";
import { RiskEngine } from "@/lib/engines/RiskEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const pools = generateMockPools(30);
  let pool = pools.find(p=>p.address===address) || pools[0];
  // override address to requested for demo
  pool = { ...pool, address };

  // Simulate fee history
  const feeHistory = Array.from({length: 24}, (_,i)=> ({ timestamp: Date.now()- (24-i)*3600*1000, fees: 1000 + Math.random()*5000 + i*200, liquidity: pool.liquidityUSD }));
  const feeSnapshot = FeeEngine.calculateFeeMetrics(pool.address, feeHistory);

  const liquiditySnap = {
    timestamp: Date.now(),
    pool: pool.address,
    liquidity: pool.liquidityUSD,
    change1m: (Math.random()-0.5)*2,
    change5m: (Math.random()-0.5)*4,
    change15m: (Math.random()-0.5)*6,
    change1h: (Math.random()-0.5)*10,
    change6h: (Math.random()-0.5)*18,
    change24h: (Math.random()-0.5)*25,
    change7d: (Math.random()-0.5)*40,
    riskScore: 85 + Math.random()*10,
  };

  const volume = {
    volume1h: (pool.volume24h||0)/24 * (0.7+Math.random()*0.6),
    volume24h: pool.volume24h||0,
    volumeToLiquidity: (pool.volume24h||0)/Math.max(1,pool.liquidityUSD),
    acceleration: (Math.random()-0.5)*30,
    uniqueTraders: 120 + Math.floor(Math.random()*800),
    buySellRatio: 0.52 + (Math.random()-0.5)*0.2,
    avgTradeSize: 1200 + Math.random()*5000,
    medianTradeSize: 800 + Math.random()*2000,
    walletConcentration: 18 + Math.random()*25,
    repeatTraderRatio: 0.22 + Math.random()*0.2,
    quality: 82 + Math.random()*15,
  };

  const security = SecurityEngine.analyzeToken({
    mintAuthority: Math.random()<0.15 ? "Active" : null,
    freezeAuthority: Math.random()<0.1 ? "Active" : null,
    tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    isToken2022: Math.random()<0.2,
    extensions: Math.random()<0.2 ? ["transferFee"] : [],
    holderTop10: 22 + Math.random()*18,
    holderTop20: 35 + Math.random()*20,
    liquidity: pool.liquidityUSD,
    liquidityChange1h: liquiditySnap.change1h,
  });

  const risk = RiskEngine.computeRiskScore({
    pool: pool.address,
    security,
    liquidity: liquiditySnap,
    volume,
    feeVolatility: feeSnapshot.feeVolatility,
    poolAgeHours: 240 + Math.random()*600,
    holderConcentration: security.adjustedHolderTop10,
  });

  // Bin snapshot mock
  const bins = Array.from({length: 35}, (_,i)=>{
    const binId = (pool.activeBinId||8388608) -17 + i;
    const distance = Math.abs(i-17);
    const price = pool.currentPrice * Math.pow(1+pool.binStep/10000, i-17);
    return {
      binId,
      price,
      priceLower: price*(1- pool.binStep/10000/2),
      priceUpper: price*(1+ pool.binStep/10000/2),
      liquidityUSD: Math.max(0, 90000*Math.exp(-distance*distance/20) + Math.random()*8000),
      isActive: i===17,
      volume: 0, fees: 0,
    };
  });

  return NextResponse.json({
    pool,
    feeSnapshot,
    liquidity: liquiditySnap,
    volume,
    security,
    risk,
    bins: { pool: pool.address, activeBin: pool.activeBinId, binStep: pool.binStep, bins, timestamp: Date.now() },
    timestamp: new Date().toISOString(),
    slot: 310000000 + Math.floor(Math.random()*500000),
    disclaimer: "Data is simulated for demonstration; connect RPC + Meteora API for live verification. Never treat missing data as safe.",
  });
}
