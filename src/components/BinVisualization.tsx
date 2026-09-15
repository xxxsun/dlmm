"use client";
import { useMemo } from "react";

export function BinVisualization({ bins, activeBin, currentPrice }: { bins: any[]; activeBin: number; currentPrice: number }) {
  const maxLiq = useMemo(()=> Math.max(...bins.map(b=>b.liquidityUSD), 1), [bins]);
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="text-sm font-bold text-white">BIN LIQUIDITY DISTRIBUTION</div>
        <div className="text-xs text-zinc-500">Active bin: <span className="text-white font-mono">{activeBin}</span> • Price <span className="text-white">${currentPrice?.toFixed(4)}</span></div>
      </div>
      <div className="p-4">
        <div className="relative h-[220px] flex items-end gap-[1px] justify-center overflow-hidden bg-black/40 rounded-lg p-2 border border-zinc-800">
          {bins.map((b, i)=>{
            const h = (b.liquidityUSD / maxLiq) * 180 + 6;
            const isActive = b.isActive;
            return (
              <div key={b.binId} className="flex-1 flex flex-col items-center justify-end group relative" style={{ minWidth: 2 }}>
                <div
                  className={`w-full rounded-t-sm transition-all ${isActive ? "bg-gradient-to-t from-violet-600 to-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.6)]" : "bg-zinc-700 group-hover:bg-zinc-600"}`}
                  style={{ height: h }}
                  title={`Bin ${b.binId} • $${b.price.toFixed(4)} • ${b.liquidityUSD.toLocaleString()} USD`}
                />
                {isActive && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-violet-500" />}
              </div>
            );
          })}
          {/* active bin marker */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest bg-violet-600 text-white px-2 py-0.5 rounded">ACTIVE BIN ▲</div>
        </div>
        <div className="flex justify-between text-[10px] text-zinc-600 mt-2 font-mono">
          <span>{bins[0]?.price.toFixed(3)}</span>
          <span className="text-violet-400 font-bold">${currentPrice?.toFixed(4)} PRICE</span>
          <span>{bins[bins.length-1]?.price.toFixed(3)}</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <div className="bg-black/40 rounded-lg p-3 border border-zinc-800">
            <div className="text-zinc-500 text-[10px] font-bold tracking-widest">BINS IN VIEW</div>
            <div className="text-white font-bold text-lg">{bins.length}</div>
          </div>
          <div className="bg-black/40 rounded-lg p-3 border border-zinc-800">
            <div className="text-zinc-500 text-[10px] font-bold tracking-widest">LIQ AT ACTIVE</div>
            <div className="text-white font-bold text-lg">${bins.find(b=>b.isActive)?.liquidityUSD.toLocaleString()}</div>
          </div>
          <div className="bg-black/40 rounded-lg p-3 border border-zinc-800">
            <div className="text-zinc-500 text-[10px] font-bold tracking-widest">CONCENTRATION</div>
            <div className="text-white font-bold text-lg">{(bins.find(b=>b.isActive)!.liquidityUSD / maxLiq *100).toFixed(0)}% of max</div>
          </div>
        </div>
      </div>
    </div>
  );
}
