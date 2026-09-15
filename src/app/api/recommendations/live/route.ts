import { NextResponse } from "next/server";
import { generateMockPools, generateOpportunities } from "@/lib/data/mockData";
export const dynamic="force-dynamic";
export async function GET() {
  const pools = generateMockPools(25);
  let opps = generateOpportunities(pools);
  // add slight jitter to simulate live
  opps = opps.map(o=> ({ ...o, riskAdjustedScore: Math.max(0, Math.min(100, o.riskAdjustedScore + (Math.random()-0.5)*1.2)), lastUpdated: Date.now() - Math.floor(Math.random()*4000) }));
  opps.sort((a,b)=> b.riskAdjustedScore - a.riskAdjustedScore);
  return NextResponse.json({ data: opps, pools, timestamp: new Date().toISOString(), slot: 310000000+Math.floor(Math.random()*500000), source:"realtime-cache" }, { headers:{ "Cache-Control":"no-store" } });
}
