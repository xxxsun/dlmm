"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BinVisualization } from "@/components/BinVisualization";
import Link from "next/link";

export default function BinsPage() {
  const { address } = useParams() as { address: string };
  const [data, setData] = useState<any>(null);
  useEffect(()=>{ fetch(`/api/pools/${address}/bins`).then(r=>r.json()).then(setData); },[address]);
  if (!data) return <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-12 text-zinc-500">Loading bins...</div>;
  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      <Link href={`/pool/${address}`} className="text-xs text-zinc-500 hover:text-white">← Back to pool</Link>
      <h1 className="text-xl font-black text-white">BIN VISUALIZATION — {address.slice(0,12)}...</h1>
      <BinVisualization bins={data.bins} activeBin={data.activeBin} currentPrice={data.currentPrice} />
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 text-sm font-bold text-white">BIN TABLE — {data.bins.length} bins</div>
        <div className="overflow-x-auto max-h-[520px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-black border-b border-zinc-800 text-zinc-500 tracking-widest">
              <tr><th className="text-left px-3 py-2">BIN ID</th><th className="text-right px-3 py-2">PRICE</th><th className="text-right px-3 py-2">LIQ USD</th><th className="text-right px-3 py-2">VOL</th><th className="text-right px-3 py-2">FEES</th><th className="text-center px-3 py-2">ACTIVE</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 font-mono">
              {data.bins.map((b:any)=><tr key={b.binId} className={b.isActive?"bg-violet-950/20 text-white":"text-zinc-400"}><td className="px-3 py-1.5">{b.binId}</td><td className="text-right">${b.price.toFixed(4)}</td><td className="text-right">${b.liquidityUSD.toLocaleString()}</td><td className="text-right">${b.volume.toLocaleString()}</td><td className="text-right">${b.fees.toLocaleString()}</td><td className="text-center">{b.isActive?"●":""}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
