import { NextRequest, NextResponse } from "next/server";
import { generateMockPools, generateOpportunities } from "@/lib/data/mockData";
import { MeteoraDLMMAdapter } from "@/lib/adapters/MeteoraDLMMAdapter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
  const profile = (searchParams.get("profile") || "BALANCED") as any;
  const minLiquidity = parseFloat(searchParams.get("minLiquidity") || "0");
  const maxRisk = parseFloat(searchParams.get("maxRisk") || "100");
  const minSecurity = parseFloat(searchParams.get("minSecurity") || "0");

  // Try live pools, fallback to mock
  let pools: any[] = [];
  try {
    const adapter = new MeteoraDLMMAdapter();
    pools = await adapter.discoverPools(30, 0);
    if (pools.length === 0) throw new Error("empty");
  } catch {
    pools = generateMockPools(30);
  }

  let opps = generateOpportunities(pools);

  // Apply filters
  opps = opps.filter(o => {
    const pool = pools.find(p=>p.address===o.pool);
    const liq = pool?.liquidityUSD || 0;
    if (liq < minLiquidity) return false;
    if (o.riskScore > maxRisk) return false;
    if (o.tokenSecurity < minSecurity) return false;
    return true;
  });

  // Sort already ranked
  opps = opps.slice(0, limit);

  return NextResponse.json({
    data: opps,
    pools, // include pool meta for convenience
    timestamp: new Date().toISOString(),
    slot: 310000000 + Math.floor(Math.random()*1000000),
    profile,
    weights: profile,
    disclaimer: "Risk-adjusted scores are estimates, not guarantees. DYOR. No guaranteed profit/safety.",
  }, {
    headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10" }
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // screener custom filters
  const { minLiquidity=50000, minVolume=100000, minFees=500, maxRisk=40, minSecurity=70, minConfidence=60, protocol="meteora" } = body;
  let pools = generateMockPools(40);
  let opps = generateOpportunities(pools);
  // Apply hard filters
  opps = opps.filter(o=>{
    const p = pools.find(x=>x.address===o.pool);
    if (!p) return false;
    if ((p.liquidityUSD||0) < minLiquidity) return false;
    if ((p.volume24h||0) < minVolume) return false;
    if (o.riskScore > maxRisk) return false;
    if (o.tokenSecurity < minSecurity) return false;
    if (o.confidence < minConfidence) return false;
    return true;
  });
  return NextResponse.json({ data: opps, pools, timestamp: new Date().toISOString() });
}
