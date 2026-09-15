import { NextRequest, NextResponse } from "next/server";
import { generateMockPools } from "@/lib/data/mockData";
export const dynamic="force-dynamic";
export async function GET(req: NextRequest, { params }: { params: Promise<{address:string}>}) {
  const { address } = await params;
  const pools = generateMockPools(30);
  const pool = pools.find(p=>p.address===address) || pools[0];
  const bins = Array.from({length: 69}, (_,i)=>{
    const center=34;
    const distance=Math.abs(i-center);
    const price = pool.currentPrice * Math.pow(1+pool.binStep/10000, i-center);
    const liq = Math.max(0, 85000*Math.exp(-distance*distance/22) + (Math.random()-0.5)*6000);
    return { binId: (pool.activeBinId||8388608)-center+i, price, priceLower: price*0.9995, priceUpper: price*1.0005, liquidityX:"0", liquidityY:"0", liquidityUSD: Math.round(liq), volume: Math.round(liq*0.08+Math.random()*4000), fees: Math.round(liq*0.0025+Math.random()*120), isActive: i===center };
  });
  return NextResponse.json({ pool: address, activeBin: pool.activeBinId, binStep: pool.binStep, currentPrice: pool.currentPrice, bins, timestamp: Date.now(), slot: 310000000+Math.floor(Math.random()*500000) });
}
