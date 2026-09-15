"use client";
import Link from "next/link";
import { OpportunityScore, PoolInfo } from "@/lib/types";
import { formatUSD, formatPercent, timeAgo } from "@/lib/utils";
import { RiskEngine } from "@/lib/engines/RiskEngine";

export function OpportunityCard({ opp, pool, rank, liveDelta }: { opp: OpportunityScore; pool?: PoolInfo; rank: number; liveDelta?: number }) {
  const riskColor = RiskEngine.riskColor(opp.riskScore);
  const stateColor: Record<string,string> = {
    STRONG_OPPORTUNITY: "bg-emerald-500 text-black",
    RECOMMENDED: "bg-emerald-600 text-white",
    WATCH: "bg-zinc-800 text-zinc-300 border border-zinc-700",
    INVESTIGATE: "bg-amber-500 text-black",
    HIGH_RISK: "bg-orange-600 text-white",
    REJECTED: "bg-red-600 text-white",
  };
  const stateLabel: Record<string,string> = {
    STRONG_OPPORTUNITY: "STRONG OPPORTUNITY",
    RECOMMENDED: "RECOMMENDED",
    WATCH: "WATCH",
    INVESTIGATE: "INVESTIGATE",
    HIGH_RISK: "HIGH RISK",
    REJECTED: "REJECTED",
  };

  const isRejected = opp.recommendationState === "REJECTED";
  const jitter = liveDelta !== undefined ? (liveDelta > 0 ? "▲" : liveDelta < 0 ? "▼" : "") : "";

  return (
    <div className={`relative rounded-xl border overflow-hidden flex flex-col ${isRejected ? "bg-red-950/20 border-red-900/50" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"} transition`}>
      {/* rank header */}
      <div className={`h-1 w-full ${rank===1 ? "bg-gradient-to-r from-violet-600 to-indigo-600" : rank===2 ? "bg-zinc-700" : rank===3? "bg-zinc-800":"bg-zinc-900"}`} />
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${rank<=3 ? "bg-white text-black" : "bg-zinc-800 text-zinc-400 border border-zinc-700"}`}>{rank}</div>
            <div>
              <div className="flex items-center gap-2">
                <Link href={`/pool/${opp.pool}`} className="font-bold text-white hover:text-violet-400 transition text-[15px] tracking-tight">{opp.token}</Link>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">Meteora DLMM</span>
                {jitter && <span className={`text-xs ${liveDelta! >0 ? "text-emerald-400":"text-red-400"}`}>{jitter}</span>}
              </div>
              <div className="text-xs text-zinc-500 font-mono">{opp.pool.slice(0,12)}...{opp.pool.slice(-6)}</div>
            </div>
          </div>
          <span className={`text-[10px] font-black tracking-widest px-2 py-1 rounded-md ${stateColor[opp.recommendationState]}`}>{stateLabel[opp.recommendationState]}</span>
        </div>

        {isRejected ? (
          <div className="bg-red-950/40 border border-red-900/40 rounded-lg p-3">
            <div className="text-xs font-black tracking-widest text-red-400 mb-1">REJECTED</div>
            <div className="text-xs text-red-300/90 leading-relaxed">Reasons:</div>
            <ul className="text-xs text-red-300 list-none space-y-1 mt-1">
              {opp.warnings.slice(0,4).map((w,i)=> <li key={i}>✕ {w}</li>)}
              {opp.warnings.length===0 && <li>✕ Fails hard security filters</li>}
            </ul>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Risk Score" value={`${opp.riskScore}/100`} sub={RiskEngine.riskLevel(opp.riskScore)} color={riskColor} />
              <Metric label="Fee Opp" value={`${opp.feeOpportunity}/100`} sub="per liq" color="text-violet-400 bg-violet-500/10 border-violet-500/20" />
              <Metric label="Risk-Adj" value={`${opp.riskAdjustedScore}`} sub="final" color="text-cyan-400 bg-cyan-500/10 border-cyan-500/20" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-black/40 rounded-lg p-2.5 border border-zinc-800">
                <div className="text-zinc-500 text-[10px] tracking-widest font-bold">SECURITY</div>
                <div className={`text-sm font-bold ${opp.tokenSecurity>80?"text-emerald-400":opp.tokenSecurity>60?"text-yellow-400":"text-red-400"}`}>{opp.tokenSecurity}/100</div>
              </div>
              <div className="bg-black/40 rounded-lg p-2.5 border border-zinc-800">
                <div className="text-zinc-500 text-[10px] tracking-widest font-bold">LIQUIDITY</div>
                <div className="text-sm font-bold text-white">{opp.liquidityQuality}/100 <span className="text-xs text-zinc-500">{pool? formatUSD(pool.liquidityUSD):""}</span></div>
              </div>
              <div className="bg-black/40 rounded-lg p-2.5 border border-zinc-800">
                <div className="text-zinc-500 text-[10px] tracking-widest font-bold">VOLUME QUALITY</div>
                <div className="text-sm font-bold text-white">{opp.volumeQuality}/100</div>
              </div>
              <div className="bg-black/40 rounded-lg p-2.5 border border-zinc-800">
                <div className="text-zinc-500 text-[10px] tracking-widest font-bold">CONFIDENCE</div>
                <div className="text-sm font-bold text-white">{opp.confidence}%</div>
              </div>
            </div>

            {pool && (
              <div className="flex flex-wrap gap-1.5 text-xs">
                <span className="px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">{formatUSD(pool.liquidityUSD)} liq</span>
                <span className="px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">{formatUSD(pool.volume24h||0)} vol 24h</span>
                <span className="px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">bin {pool.binStep}</span>
                <span className="px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">${pool.currentPrice.toFixed(2)}</span>
              </div>
            )}

            {opp.whyRanked.length>0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold tracking-widest text-zinc-500">WHY RANKED</div>
                <ul className="text-xs text-zinc-300 space-y-0.5">
                  {opp.whyRanked.map((w,i)=> <li key={i} className="flex gap-1.5"><span className="text-emerald-500">✓</span> {w}</li>)}
                </ul>
              </div>
            )}
            {opp.warnings.length>0 && (
              <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-2">
                <div className="text-[10px] font-bold tracking-widest text-amber-400">WARNINGS</div>
                <ul className="text-xs text-amber-200/80 space-y-0.5">
                  {opp.warnings.map((w,i)=> <li key={i} className="flex gap-1.5"><span>⚠</span> {w}</li>)}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1 text-[11px]">
              <Link href={`/pool/${opp.pool}`} className="flex-1 text-center py-2 rounded-lg bg-white text-black font-bold hover:bg-zinc-200 transition">View Pool →</Link>
              <Link href={`/pool/${opp.pool}/bins`} className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700">Bins</Link>
              <Link href={`/pool/${opp.pool}/backtest`} className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700">Backtest</Link>
            </div>

            <div className="text-[10px] text-zinc-600 flex items-center justify-between pt-1 border-t border-zinc-800">
              <span>Updated {timeAgo(opp.lastUpdated)}</span>
              <span className="font-mono">slot {opp.slot}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, sub, color }: { label:string; value:string; sub:string; color:string }) {
  return (
    <div className={`rounded-lg border p-2.5 bg-black/30 ${color.includes("bg-") ? color : "bg-zinc-900 border-zinc-800 "+color}`}>
      <div className="text-[10px] tracking-widest font-bold opacity-70">{label}</div>
      <div className="text-sm font-black tracking-tight">{value}</div>
      <div className="text-[10px] opacity-60">{sub}</div>
    </div>
  );
}
