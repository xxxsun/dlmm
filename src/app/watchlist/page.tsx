"use client";
import { useState } from "react";
import Link from "next/link";

export default function WatchlistPage(){
  const [items,setItems]=useState([
    { pool:"SOL/USDC", addr:"5rCf1...", price:145.23, change:"+0.8%", risk:18, fees:"$4,820 24h" },
    { pool:"WIF/USDC", addr:"EKpQ...", price:1.42, change:"-1.2%", risk:32, fees:"$2,100 24h", warn:"Price near range edge" },
    { pool:"BONK/USDC", addr:"DezX...", price:0.000023, change:"+4.1%", risk:22, fees:"$8,420 24h" },
  ]);
  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      <h1 className="text-xl font-black text-white">WATCHLIST — Real-time</h1>
      <p className="text-sm text-zinc-500">Watch tokens, pools, wallet clusters, positions. Updates realtime without refresh.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it)=>(
          <div key={it.pool} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex justify-between"><span className="font-bold text-white">{it.pool}</span><span className={`text-xs px-2 py-1 rounded-full font-bold ${it.risk<30?"bg-emerald-500/20 text-emerald-400":"bg-yellow-500/20 text-yellow-400"}`}>Risk {it.risk}</span></div>
            <div className="text-xs text-zinc-500 font-mono">{it.addr} • ${it.price} <span className={it.change.startsWith("+")?"text-emerald-400":"text-red-400"}>{it.change}</span></div>
            <div className="text-xs text-zinc-300 mt-2">{it.fees}</div>
            {it.warn && <div className="text-xs text-amber-400 bg-amber-950/20 border border-amber-900/30 rounded px-2 py-1 mt-2">⚠ {it.warn}</div>}
            <div className="flex gap-2 mt-3"><Link href={`/pool/${it.addr}`} className="flex-1 text-center py-2 rounded-lg bg-white text-black text-xs font-bold">Open</Link><button onClick={()=>setItems(items.filter(x=>x.pool!==it.pool))} className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-400">Remove</button></div>
          </div>
        ))}
        <div className="bg-black border border-dashed border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <div className="text-sm font-bold text-white">Add pool</div>
          <div className="text-xs text-zinc-500 mt-1">Paste DLMM address to watch</div>
          <div className="flex gap-2 mt-3 w-full"><input placeholder="Pool address" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white"/><button className="px-3 py-2 rounded-lg bg-violet-600 text-white text-xs font-bold">Add</button></div>
        </div>
      </div>
    </div>
  );
}
