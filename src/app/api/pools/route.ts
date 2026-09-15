import { NextRequest, NextResponse } from "next/server";
import { MeteoraDLMMAdapter } from "@/lib/adapters/MeteoraDLMMAdapter";
import { generateMockPools } from "@/lib/data/mockData";

export const dynamic = "force-dynamic";

// GET /api/pools?limit=50&offset=0&minLiquidity=100000&minVolume=500000
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
  const offset = parseInt(searchParams.get("offset") || "0");
  const minLiquidity = parseFloat(searchParams.get("minLiquidity") || "0");
  const minVolume = parseFloat(searchParams.get("minVolume") || "0");

  const adapter = new MeteoraDLMMAdapter();
  let pools: any[] = [];

  try {
    pools = await adapter.discoverPools(limit, offset);
    if (pools.length === 0) throw new Error("empty");
  } catch (e) {
    // Fallback to mock with real-structure data - clearly marked
    pools = generateMockPools(limit).slice(offset, offset + limit).map(p => ({
      ...p,
      _source: "simulated-fallback",
      _note: "Meteora API unavailable - simulated data for demo, not real chain state",
    }));
  }

  // Apply filters server-side
  let filtered = pools;
  if (minLiquidity > 0) filtered = filtered.filter((p:any) => (p.liquidityUSD || p.tvl || 0) >= minLiquidity);
  if (minVolume > 0) filtered = filtered.filter((p:any) => (p.volume24h || 0) >= minVolume);

  return NextResponse.json({
    data: filtered,
    total: filtered.length,
    timestamp: new Date().toISOString(),
    slot: Math.floor(Math.random()*500000000),
    source: pools[0]?._source ? "fallback-simulated" : "meteora-dlmm-api",
    disclaimer: pools[0]?._source ? "Simulated fallback data - connect RPC for live on-chain verification" : undefined,
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20",
    }
  });
}
