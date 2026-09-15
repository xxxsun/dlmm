"use client";
import { useEffect, useState } from "react";
import { ScreenerFilters, FilterState } from "@/components/ScreenerFilters";
import { OpportunityCard } from "@/components/OpportunityCard";
import { formatUSD } from "@/lib/utils";

export default function ScreenerPage() {
  const [filters, setFilters] = useState<FilterState>({
    minLiquidity: 100000,
    minVolume: 500000,
    minFees: 1000,
    maxRisk: 40,
    minSecurity: 70,
    minConfidence: 70,
    profile: "BALANCED",
  });
  const [opps, setOpps] = useState<any[]>([]);
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"riskAdjustedScore"|"feeOpportunity"|"riskScore">("riskAdjustedScore");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recommendations?profile=" + filters.profile + `&minLiquidity=${filters.minLiquidity}&maxRisk=${filters.maxRisk}&minSecurity=${filters.minSecurity}&limit=30`);
      const json = await res.json();
      let data = json.data;
      // client-side extra filter for volume etc.
      data = data.filter((o:any)=>{
        const p = (json.pools||[]).find((x:any)=> x.address===o.pool);
        if (!p) return true;
        if ((p.volume24h||0) < filters.minVolume) return false;
        return true;
      });
      setOpps(data);
      setPools(json.pools||[]);
    } catch {} finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, [filters]);

  const sorted = [...opps].sort((a,b)=>{
    if (sortBy==="riskScore") return a.riskScore - b.riskScore;
    return (b[sortBy] as number) - (a[sortBy] as number);
  });

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white">REALTIME SCREENER</h1>
          <p className="text-sm text-zinc-500 max-w-2xl">Discovery → Cheap filter → Liquidity/Volume → Security → Deep wallet & DLMM analysis → Ranking. Realtime prioritizes candidate set; full scan is sampled & cached.</p>
        </div>
        <div className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">Scanning <span className="text-white font-bold">10k pools → 2k → 500 → 100 → 30 deep</span> • Incremental updates</div>
      </div>

      <ScreenerFilters value={filters} onChange={setFilters} />

      <div className="flex flex-wrap items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
        <span className="text-xs font-bold tracking-widest text-zinc-500">SORT BY</span>
        <div className="flex gap-1">
          {[
            ["riskAdjustedScore","RISK-ADJUSTED"],
            ["feeOpportunity","FEE OPP"],
            ["riskScore","LOWEST RISK"],
          ].map(([k,label])=> (
            <button key={k} onClick={()=>setSortBy(k as any)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${sortBy===k ? "bg-white text-black border-white" : "bg-black text-zinc-400 border-zinc-800 hover:text-white"}`}>{label}</button>
          ))}
        </div>
        <span className="text-xs text-zinc-600 ml-auto">{opps.length} pools match • {loading ? "scanning…" : "live"}</span>
      </div>

      {/* Table for desktop */}
      <div className="hidden lg:block bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/40 border-b border-zinc-800 text-xs tracking-widest text-zinc-500">
              <tr>
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">POOL</th>
                <th className="text-right px-3 py-3">PRICE</th>
                <th className="text-right px-3 py-3">LIQUIDITY</th>
                <th className="text-right px-3 py-3">VOL 24H</th>
                <th className="text-right px-3 py-3">FEES 24H</th>
                <th className="text-right px-3 py-3">RISK</th>
                <th className="text-right px-3 py-3">SCORE</th>
                <th className="text-left px-4 py-3">STATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {sorted.map((opp, i)=>{
                const p = pools.find(x=>x.address===opp.pool);
                return (
                  <tr key={opp.pool} className={`hover:bg-zinc-800/40 ${opp.recommendationState==="REJECTED" ? "bg-red-950/10" : ""}`}>
                    <td className="px-4 py-3 font-mono text-zinc-500">{i+1}</td>
                    <td className="px-4 py-3"><a href={`/pool/${opp.pool}`} className="font-bold text-white hover:text-violet-400">{opp.token}</a><div className="text-xs text-zinc-500 font-mono">{opp.pool.slice(0,8)}...</div></td>
                    <td className="px-3 py-3 text-right font-mono text-zinc-300">{p? `$${p.currentPrice.toFixed(4)}` : "-"}</td>
                    <td className="px-3 py-3 text-right font-mono text-zinc-300">{p? formatUSD(p.liquidityUSD) : "-"}</td>
                    <td className="px-3 py-3 text-right font-mono text-zinc-300">{p? formatUSD(p.volume24h||0) : "-"}</td>
                    <td className="px-3 py-3 text-right font-mono text-zinc-300">${(opp.feeOpportunity*42).toFixed(0)}</td>
                    <td className="px-3 py-3 text-right"><span className={`px-2 py-1 rounded-full text-xs font-bold border ${opp.riskScore<20?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20": opp.riskScore<40?"bg-yellow-500/10 text-yellow-400 border-yellow-500/20": opp.riskScore<60?"bg-orange-500/10 text-orange-400 border-orange-500/20":"bg-red-500/10 text-red-400 border-red-500/20"}`}>{opp.riskScore}</span></td>
                    <td className="px-3 py-3 text-right font-black text-cyan-400">{opp.riskAdjustedScore}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] font-black px-2 py-1 rounded ${opp.recommendationState==="REJECTED"?"bg-red-600 text-white": opp.recommendationState==="STRONG_OPPORTUNITY"?"bg-emerald-500 text-black": "bg-zinc-800 text-zinc-300 border border-zinc-700"}`}>{opp.recommendationState}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards for mobile + grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.slice(0,12).map((opp, i)=>{
          const p = pools.find(x=>x.address===opp.pool);
          return <OpportunityCard key={opp.pool} opp={opp} pool={p} rank={i+1} />;
        })}
      </div>

      <div className="text-xs text-zinc-600 bg-black border border-zinc-800 rounded-xl p-4">
        <strong className="text-zinc-400">Scanning strategy:</strong> Never deeply analyze every token on every tick. Event-driven deep analysis on candidate set; cheap filters prune 10k → 2k → 500 → 100 → 30. Realtime updates (price, swaps, liquidity, active bin) stream via RPC logsSubscribe + Yellowstone gRPC in production; this demo uses SSE with the same event shapes. Cache: token metadata hours, holders minutes, price/swaps realtime, fees near-realtime.
      </div>
    </div>
  );
}
