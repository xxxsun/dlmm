import { NextRequest, NextResponse } from "next/server";
import { generateMockPools } from "@/lib/data/mockData";
import { FeeEngine } from "@/lib/engines/FeeEngine";
export const dynamic="force-dynamic";
export async function GET(req: NextRequest, { params }: { params: Promise<{address:string}>}) {
  const { address } = await params;
  const pools = generateMockPools(30);
  const pool = pools.find(p=>p.address===address) || pools[0];
  const history = Array.from({length:48},(_,i)=>({timestamp:Date.now()-(48-i)*3600*1000, fees: 800+Math.random()*4000+i*30, liquidity: pool.liquidityUSD}));
  const snap = FeeEngine.calculateFeeMetrics(address, history);
  return NextResponse.json({ ...snap, history: history.slice(-24) });
}
