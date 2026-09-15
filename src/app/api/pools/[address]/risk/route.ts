import { NextRequest, NextResponse } from "next/server";
import { generateMockPools } from "@/lib/data/mockData";
import { SecurityEngine } from "@/lib/engines/SecurityEngine";
import { RiskEngine } from "@/lib/engines/RiskEngine";
import { FeeEngine } from "@/lib/engines/FeeEngine";
export const dynamic="force-dynamic";
export async function GET(req: NextRequest, { params }: { params: Promise<{address:string}>}) {
  const { address } = await params;
  const pools = generateMockPools(30);
  const pool = pools.find(p=>p.address===address) || pools[0];
  const feeHistory = Array.from({length:24},(_,i)=>({timestamp:Date.now()-(24-i)*3600*1000, fees: 1000+Math.random()*5000, liquidity: pool.liquidityUSD}));
  const feeSnapshot = FeeEngine.calculateFeeMetrics(pool.address, feeHistory);
  const liquiditySnap:any={ timestamp:Date.now(), pool:address, liquidity: pool.liquidityUSD, change1m:(Math.random()-0.5)*2, change5m:(Math.random()-0.5)*4, change15m:(Math.random()-0.5)*6, change1h:(Math.random()-0.5)*10, change6h:(Math.random()-0.5)*18, change24h:(Math.random()-0.5)*25, riskScore:85 };
  const volume:any={ volume1h: (pool.volume24h||0)/24, volume24h: pool.volume24h||0, volumeToLiquidity:(pool.volume24h||0)/pool.liquidityUSD, acceleration:0, uniqueTraders: 340, buySellRatio:0.52, avgTradeSize:1200, medianTradeSize:800, walletConcentration: 22, repeatTraderRatio:0.25, quality: 82+Math.random()*15 };
  const security = SecurityEngine.analyzeToken({ mintAuthority: Math.random()<0.15?"Active":null, freezeAuthority: null, tokenProgram:"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", isToken2022:false, extensions:[], holderTop10: 24, holderTop20:36, liquidity: pool.liquidityUSD, liquidityChange1h: liquiditySnap.change1h });
  const risk = RiskEngine.computeRiskScore({ pool:address, security, liquidity:liquiditySnap, volume, feeVolatility: feeSnapshot.feeVolatility, poolAgeHours: 320, holderConcentration: 24 });
  return NextResponse.json({ risk, security, liquidity: liquiditySnap, volume, timestamp: new Date().toISOString() });
}
