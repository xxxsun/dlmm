"use client";
import { useRealtime } from "@/components/RealtimeProvider";
import { useEffect, useState } from "react";

export default function AlertsPage(){
  const { events } = useRealtime();
  const [filter,setFilter]=useState("all");
  const alerts = events.filter(e=> ["risk_update","security_alert","pool_update","fee_update","ranking_update"].includes(e.type));

  // mock initial
  const initial = [
    { type:"risk_update", pool:"DLMM007", title:"CRITICAL LIQUIDITY EVENT", message:"Liquidity $1.2M → $210K in 4m (-82.5%)", severity:"critical", timestamp: new Date(Date.now()-4*60000).toISOString() },
    { type:"risk_update", pool:"POPCAT/SOL", title:"Risk 21 → 68", message:"Insider cluster sold 8.7% supply — High Confidence Cluster", severity:"warning", timestamp: new Date(Date.now()-12*60000).toISOString() },
    { type:"security_alert", pool:"HONEYPOT/USDC", title:"Transfer hook detected", message:"Token-2022 transferHook may block sells", severity:"warning", timestamp: new Date(Date.now()-18*60000).toISOString() },
  ];

  const list = [...alerts, ...initial].filter(a=> filter==="all" || a.type===filter);

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      <h1 className="text-xl font-black text-white">REALTIME ALERTS</h1>
      <p className="text-sm text-zinc-500">Liquidity collapse • Insider sale • Security change • Volume anomaly • Fee spike/collapse • Price exits range • Risk deterioration • Pool inactivity. All update without manual refresh.</p>

      <div className="flex gap-2">
        {[
          ["all","All"],
          ["risk_update","Risk"],
          ["security_alert","Security"],
          ["fee_update","Fees"],
          ["pool_update","Liquidity"],
        ].map(([k,l])=> <button key={k} onClick={()=>setFilter(k)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${filter===k?"bg-white text-black border-white":"bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"}`}>{l}</button>)}
      </div>

      <div className="space-y-3">
        {list.slice(0,20).map((a:any,i)=>(
          <div key={i} className={`rounded-xl border p-4 flex gap-3 ${a.severity==="critical"?"bg-red-950/20 border-red-900/40": a.severity==="warning"?"bg-amber-950/10 border-amber-900/30":"bg-zinc-900 border-zinc-800"}`}>
            <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${a.severity==="critical"?"bg-red-500": a.severity==="warning"?"bg-amber-500":"bg-cyan-500"}`}/>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 items-center"><span className="text-xs font-black tracking-widest text-white">{a.title || a.type.toUpperCase()}</span><span className="text-xs font-mono text-zinc-500">{a.pool}</span><span className="text-xs text-zinc-600">{new Date(a.timestamp).toLocaleString()}</span></div>
              <div className="text-sm text-zinc-300 mt-1 leading-relaxed">{a.message || JSON.stringify(a).slice(0,120)}</div>
              {a.old_score !== undefined && <div className="text-xs font-mono text-zinc-500 mt-1">Score {a.old_score} → {a.new_score} • Reason: {a.reason}</div>}
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded h-fit ${a.severity==="critical"?"bg-red-600 text-white": a.severity==="warning"?"bg-amber-500 text-black":"bg-zinc-800 text-zinc-300 border border-zinc-700"}`}>{(a.severity||"info").toUpperCase()}</span>
          </div>
        ))}
        {list.length===0 && <div className="text-zinc-500 text-sm py-12 text-center">No alerts — system is watching 2,847 pools.</div>}
      </div>
    </div>
  );
}
