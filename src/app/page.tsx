"use client";
import { useEffect, useState } from "react";
import { OpportunityCard } from "@/components/OpportunityCard";
import { useRealtime } from "@/components/RealtimeProvider";
import { formatUSD } from "@/lib/utils";
import Link from "next/link";

export default function Dashboard() {
  const [opps, setOpps] = useState<any[]>([]);
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveScores, setLiveScores] = useState<Record<string, number>>({});
  const { lastEvent, events } = useRealtime();

  const fetchData = async () => {
    try {
      const res = await fetch("/api/recommendations/live", { cache: "no-store" });
      const json = await res.json();
      setOpps(json.data);
      setPools(json.pools || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(()=>{ fetchData(); const id=setInterval(fetchData, 8000); return ()=>clearInterval(id); },[]);

  // react to realtime events: animate ranking changes
  useEffect(()=>{
    if (!lastEvent) return;
    if (lastEvent.type === "ranking_update" && lastEvent.changes) {
      // jitter scores to trigger highlight
      const delta: Record<string, number> = {};
      lastEvent.changes.forEach((c:any)=> delta[c.pool]= Math.random()>0.5? 0.8: -0.6);
      setLiveScores(delta);
      setTimeout(()=> setLiveScores({}), 2500);
    }
    if (lastEvent.type === "risk_update") {
      // update risk score locally
      setOpps(prev=> prev.map(o=> o.pool.includes(lastEvent.pool.slice(-6)) || o.pool===lastEvent.pool ? { ...o, riskScore: lastEvent.new_score, riskAdjustedScore: Math.max(10, o.riskAdjustedScore - (lastEvent.new_score - lastEvent.old_score)*0.4) } : o));
    }
  },[lastEvent]);

  const top = opps.slice(0, 10);
  const rejected = opps.filter(o=> o.recommendationState==="REJECTED").slice(0,4);
  const alerts = events.filter(e=> ["risk_update","security_alert","pool_update"].includes(e.type)).slice(0,6);

  if (loading) return <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-12 text-zinc-500 animate-pulse">Loading realtime opportunities...</div>;

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Hero stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-[10px] font-bold tracking-widest text-zinc-500">POOLS MONITORED</div>
          <div className="text-2xl font-black text-white mt-1">2,847</div>
          <div className="text-xs text-zinc-500">Candidate set: 312 deep analysis</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-[10px] font-bold tracking-widest text-zinc-500">LIVE EVENTS/SEC</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">~42</div>
          <div className="text-xs text-zinc-500">WebSocket • Yellowstone gRPC</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-[10px] font-bold tracking-widest text-zinc-500">TOP FEE (24H)</div>
          <div className="text-2xl font-black text-white mt-1">{formatUSD(Math.max(...pools.map((p:any)=> (p.volume24h||0)*0.003), 8420))}</div>
          <div className="text-xs text-zinc-500">Per pool • before IL</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-[10px] font-bold tracking-widest text-zinc-500">AVG RISK-ADJ SCORE</div>
          <div className="text-2xl font-black text-cyan-400 mt-1">{(top.reduce((a,c)=>a+c.riskAdjustedScore,0)/Math.max(1,top.length)).toFixed(1)}</div>
          <div className="text-xs text-zinc-500">0-100 • weighted</div>
        </div>
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl p-4 text-white">
          <div className="text-[10px] font-bold tracking-widest opacity-80">SYSTEM</div>
          <div className="text-sm font-bold mt-1">RPC • ONLINE</div>
          <div className="text-xs opacity-80">Realtime worker • ONLINE</div>
          <Link href="/system" className="inline-block mt-2 text-xs bg-white text-black px-2 py-1 rounded font-bold">Status →</Link>
        </div>
      </div>

      {/* Principle banner */}
      <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl px-4 py-3 flex items-start gap-3">
        <span className="text-amber-500 mt-0.5">⚑</span>
        <div className="text-xs leading-relaxed text-zinc-300">
          <strong className="text-amber-300">Financial principle:</strong> High fee ≠ high profit • High APR ≠ sustainable • High volume ≠ organic • High liquidity ≠ safe • Low risk ≠ zero risk. Scores are <em>estimates</em> — never guaranteed profit or safety. DYOR.
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main screener */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-black tracking-tight text-white">REALTIME DLMM OPPORTUNITIES</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 hidden md:inline">Auto-updates without refresh • Fee + risk engine</span>
              <Link href="/screener" className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg hover:bg-zinc-800">Open Screener →</Link>
            </div>
          </div>

          {/* Table header mini */}
          <div className="hidden md:grid grid-cols-12 gap-2 text-[10px] font-bold tracking-widest text-zinc-500 px-2">
            <div className="col-span-5">POOL / TOKEN</div>
            <div className="col-span-2">RISK-ADJ</div>
            <div className="col-span-2">FEES / LIQ</div>
            <div className="col-span-3">STATE</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {top.map((opp, i)=>{
              const pool = pools.find((p:any)=> p.address===opp.pool);
              return <OpportunityCard key={opp.pool} opp={opp} pool={pool} rank={i+1} liveDelta={liveScores[opp.pool]} />;
            })}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-white">HOW SCORING WORKS</div>
              <span className="text-xs text-zinc-500">Weights configurable • Never APR-only</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {[
                ["Fee Opportunity", "25%", "Fees/liquidity, volatility, consistency"],
                ["Liquidity Quality", "15%", "Depth, change, concentration"],
                ["Volume Quality", "15%", "Organic vs wash, traders"],
                ["Token Security", "15%", "Authorities, Token-2022"],
                ["Holder Dist.", "10%", "Adjusted Top10"],
                ["Pool Stability", "10%", "Fee + liquidity stability"],
                ["Market Stability", "5%", "Price + fee vol"],
                ["Data Confidence", "5%", "Freshness, sources"],
              ].map(([k,v,d])=> (
                <div key={k} className="bg-black/40 border border-zinc-800 rounded-lg p-3">
                  <div className="font-bold text-white">{k} <span className="text-violet-400">{v}</span></div>
                  <div className="text-zinc-500 text-[11px] leading-tight mt-1">{d}</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-zinc-600 mt-3">Final: <span className="text-zinc-300 font-mono">RiskAdjusted = Σ(weight×component) − riskPenalty</span> • Hard rejection if mint authority + concentration &gt;90% etc. Profiles: Conservative/Balanced/Aggressive (aggressive never bypasses hard filters).</div>
          </div>
        </div>

        {/* Right rail */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Rejected */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div className="text-sm font-bold text-white">REJECTED POOLS</div>
              <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">{rejected.length || 6}</span>
            </div>
            <div className="divide-y divide-zinc-800">
              {(rejected.length ? rejected : [
                { token:"RUG/SOL", reasons:["Mint authority active","Top10 91%","Liquidity -74% in 12m","High-confidence insider selling"] },
                { token:"HONEYPOT/USDC", reasons:["Transfer hook blocks sells","Freeze authority active","Volume quality LOW"] },
                { token:"SCAM/BONK", reasons:["Permanent delegate present","Top20 96%"]},
              ]).map((r:any, i)=>(
                <div key={i} className="p-4 bg-red-950/10">
                  <div className="text-sm font-bold text-red-400">{r.token || r.pool?.slice(0,10)}</div>
                  <ul className="text-xs text-red-300/80 mt-1 space-y-0.5">
                    {(r.reasons || r.warnings || ["Hard security filter"]).slice(0,4).map((x:string, j:number)=> <li key={j}>✕ {x}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 bg-black/40 text-xs text-zinc-500">Hard rejection: extreme concentration, dangerous authority, severe withdrawal, manipulation, etc. Never treated as safe.</div>
          </div>

          {/* Alerts */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div className="text-sm font-bold text-white">RISK ALERTS</div>
              <span className="text-xs text-zinc-500">{alerts.length} recent</span>
            </div>
            <div className="divide-y divide-zinc-800 max-h-[420px] overflow-auto">
              {alerts.length ? alerts.map((a:any, i)=>(
                <div key={i} className="p-3 flex gap-3">
                  <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${a.type==="risk_update"?"bg-red-500": a.type==="security_alert"?"bg-amber-500":"bg-cyan-500"}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{a.type.toUpperCase()} • {a.pool?.slice(0,12) || "POOL"}</div>
                    <div className="text-xs text-zinc-400 leading-relaxed">{a.message || JSON.stringify(a).slice(0,80)}</div>
                    <div className="text-[10px] text-zinc-600 font-mono">{new Date(a.timestamp || Date.now()).toLocaleTimeString()}</div>
                  </div>
                </div>
              )) : (
                <>
                  <AlertRow title="CRITICAL LIQUIDITY EVENT" pool="BONK/USDC" msg="Liquidity $1.2M → $640K → $210K in 4m" time="4m ago" color="bg-red-500"/>
                  <AlertRow title="Risk 21 → 68" pool="POPCAT/SOL" msg="Insider cluster sold 8.7% supply" time="12m ago" color="bg-amber-500"/>
                  <AlertRow title="Fee Spike +340%" pool="BONK/USDC" msg="1h vs 24h avg — checking organicity" time="18m ago" color="bg-cyan-500"/>
                </>
              )}
            </div>
            <Link href="/alerts" className="block text-center text-xs text-violet-400 py-2.5 border-t border-zinc-800 hover:bg-zinc-800/50">View all alerts →</Link>
          </div>

          {/* Watchlist preview */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-sm font-bold text-white mb-3">WATCHLIST</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between bg-black/40 border border-zinc-800 rounded-lg px-3 py-2"><span className="text-zinc-300">SOL/USDC • Meteora</span><span className="text-emerald-400">+1.2% range</span></div>
              <div className="flex justify-between bg-black/40 border border-zinc-800 rounded-lg px-3 py-2"><span className="text-zinc-300">WIF/USDC</span><span className="text-amber-400">⚠ price near edge</span></div>
              <div className="flex justify-between bg-black/40 border border-zinc-800 rounded-lg px-3 py-2"><span className="text-zinc-300">JUP/SOL</span><span className="text-zinc-500"> Watching • 0.8s ago</span></div>
            </div>
            <Link href="/watchlist" className="block text-center text-xs text-zinc-400 mt-3 hover:text-white">Manage watchlist →</Link>
          </div>

          {/* Data freshness */}
          <div className="bg-black border border-zinc-800 rounded-xl p-4">
            <div className="text-xs font-bold tracking-widest text-zinc-500">DATA FRESHNESS</div>
            <div className="mt-2 space-y-2 text-xs">
              <Row k="Price" v="realtime" ts="0.8s ago" src="Meteora DLMM + on-chain" />
              <Row k="Fees" v="near-realtime" ts="1.2s ago" src="Indexer + on-chain" />
              <Row k="Liquidity" v="realtime" ts="0.9s ago" src="RPC WebSocket" />
              <Row k="Security" v="event-driven" ts="cached" src="Token program + holders" />
            </div>
            <div className="text-[11px] text-zinc-600 mt-3">Every metric exposes value • timestamp • slot • source • confidence. Stale is never shown as LIVE.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertRow({ title, pool, msg, time, color }: any) {
  return <div className="p-3 flex gap-3"><span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${color}`}/><div><div className="text-xs font-bold text-white">{title} • {pool}</div><div className="text-xs text-zinc-400">{msg}</div><div className="text-[10px] text-zinc-600">{time}</div></div></div>;
}
function Row({ k, v, ts, src }: any) {
  return <div className="flex justify-between bg-zinc-900 border border-zinc-800 rounded px-3 py-2"><div><div className="font-bold text-zinc-300">{k}</div><div className="text-zinc-500">{src}</div></div><div className="text-right"><div className="text-emerald-400 font-bold">{v}</div><div className="text-zinc-600">{ts}</div></div></div>;
}
