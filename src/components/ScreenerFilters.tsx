"use client";
import { useState } from "react";

export interface FilterState {
  minLiquidity: number;
  maxLiquidity?: number;
  minVolume: number;
  minFees: number;
  maxRisk: number;
  minSecurity: number;
  minConfidence: number;
  profile: "CONSERVATIVE"|"BALANCED"|"AGGRESSIVE";
}

export function ScreenerFilters({ value, onChange }: { value: FilterState; onChange: (v: FilterState)=>void }) {
  const [local, setLocal] = useState(value);
  const update = (k: keyof FilterState, v:any) => {
    const nv = { ...local, [k]: v };
    setLocal(nv);
    onChange(nv);
  };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-white">SMART FILTERS</div>
        <div className="text-xs text-zinc-500">Balance: liquidity • security • fees</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold tracking-widest text-zinc-400">MIN LIQUIDITY</label>
          <input type="range" min={10000} max={2000000} step={10000} value={local.minLiquidity} onChange={e=>update("minLiquidity", parseInt(e.target.value))} className="w-full accent-violet-600" />
          <div className="text-xs text-zinc-300 font-mono">${local.minLiquidity.toLocaleString()}</div>
        </div>
        <div>
          <label className="text-xs font-bold tracking-widest text-zinc-400">MIN VOLUME 24H</label>
          <input type="range" min={0} max={5000000} step={50000} value={local.minVolume} onChange={e=>update("minVolume", parseInt(e.target.value))} className="w-full accent-violet-600" />
          <div className="text-xs text-zinc-300 font-mono">${local.minVolume.toLocaleString()}</div>
        </div>
        <div>
          <label className="text-xs font-bold tracking-widest text-zinc-400">MAX RISK</label>
          <input type="range" min={10} max={100} step={1} value={local.maxRisk} onChange={e=>update("maxRisk", parseInt(e.target.value))} className="w-full accent-red-600" />
          <div className="text-xs font-bold" style={{color: local.maxRisk<30?'#10b981': local.maxRisk<60?'#f59e0b':'#ef4444'}}>{local.maxRisk} / 100</div>
        </div>
        <div>
          <label className="text-xs font-bold tracking-widest text-zinc-400">MIN SECURITY</label>
          <input type="range" min={0} max={100} step={1} value={local.minSecurity} onChange={e=>update("minSecurity", parseInt(e.target.value))} className="w-full accent-emerald-600" />
          <div className="text-xs text-zinc-300">{local.minSecurity} / 100</div>
        </div>
        <div>
          <label className="text-xs font-bold tracking-widest text-zinc-400">MIN CONFIDENCE</label>
          <input type="range" min={0} max={100} step={1} value={local.minConfidence} onChange={e=>update("minConfidence", parseInt(e.target.value))} className="w-full accent-cyan-600" />
          <div className="text-xs text-zinc-300">{local.minConfidence}%</div>
        </div>
        <div>
          <label className="text-xs font-bold tracking-widest text-zinc-400">PROFILE</label>
          <select value={local.profile} onChange={e=>update("profile", e.target.value)} className="w-full mt-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white">
            <option value="CONSERVATIVE">CONSERVATIVE</option>
            <option value="BALANCED">BALANCED</option>
            <option value="AGGRESSIVE">AGGRESSIVE</option>
          </select>
          <div className="text-[10px] text-zinc-500 mt-1">Aggressive never bypasses hard security filters.</div>
        </div>
      </div>

      <div className="text-[11px] text-zinc-500 bg-black/40 border border-zinc-800 rounded-lg p-3">
        <strong className="text-zinc-300">Default Smart Filter:</strong> Liquidity &gt; $100k • 24h vol &gt; $500k • 24h fees &gt; $1k • Risk &lt; 30 • Security &gt; 75 • Confidence &gt; 70 — prioritizes security + organic volume over raw APR.
      </div>
    </div>
  );
}
