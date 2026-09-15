"use client";
import { useEffect, useState } from "react";

export default function SystemPage(){
  const [status,setStatus]=useState<any>(null);
  useEffect(()=>{
    fetch("/api/system/status").then(r=>r.json()).then(setStatus);
    const id=setInterval(()=> fetch("/api/system/status").then(r=>r.json()).then(setStatus), 4000);
    return ()=>clearInterval(id);
  },[]);
  if (!status) return <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-12 text-zinc-500">Loading system health...</div>;
  const badge = (s:string)=> s==="online"||s==="connected" ? "bg-emerald-500 text-black" : s==="degraded"||s==="reconnecting" ? "bg-amber-500 text-black" : "bg-red-600 text-white";
  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      <h1 className="text-xl font-black text-white">SYSTEM HEALTH</h1>
      <p className="text-sm text-zinc-500">RPC • Indexer • Database • Realtime Worker • WebSocket — with graceful degradation. Never silently show stale as live.</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          ["RPC STATUS", status.rpcStatus],
          ["INDEXER", status.indexerStatus],
          ["DATABASE", status.databaseStatus],
          ["REALTIME WORKER", status.realtimeWorkerStatus],
          ["WEBSOCKET", status.websocketStatus],
        ].map(([k,v])=>(
          <div key={k as string} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-[10px] font-bold tracking-widest text-zinc-500">{k}</div>
            <div className={`inline-block mt-2 text-xs font-black px-2 py-1 rounded ${badge(v as string)}`}>{(v as string).toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Events/sec" value={status.eventsPerSec} />
        <Stat label="Pools monitored" value={status.poolsMonitored} />
        <Stat label="Pools analyzed" value={status.poolsAnalyzed} />
        <Stat label="Uptime" value={status.uptime} />
        <Stat label="API requests" value={status.apiRequests.toLocaleString()} />
        <Stat label="RPC requests" value={status.rpcRequests.toLocaleString()} />
        <Stat label="DB writes" value={status.dbWrites.toLocaleString()} />
        <Stat label="Last event" value={new Date(status.lastEvent).toLocaleTimeString()} sub={status.lastEvent} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="text-sm font-bold text-white">FAILURE HANDLING</div>
        <div className="grid md:grid-cols-3 gap-3 mt-3 text-xs">
          <div className="bg-black/40 border border-zinc-800 rounded-lg p-3"><div className="font-bold text-white">RPC fails → RPC DEGRADED</div><div className="text-zinc-500 mt-1">Preserve last valid state, show stale badge, retry with exponential backoff + circuit breaker.</div></div>
          <div className="bg-black/40 border border-zinc-800 rounded-lg p-3"><div className="font-bold text-white">Indexer fails → INDEXER DEGRADED</div><div className="text-zinc-500 mt-1">Fallback to on-chain verification where possible.</div></div>
          <div className="bg-black/40 border border-zinc-800 rounded-lg p-3"><div className="font-bold text-white">Worker disconnects → REALTIME OFFLINE</div><div className="text-zinc-500 mt-1">Reconnect via WebSocket → SSE → short polling (no hammering).</div></div>
        </div>
      </div>

      <div className="bg-black border border-zinc-800 rounded-xl p-4">
        <div className="text-sm font-bold text-white">COST CONTROL</div>
        <div className="text-xs text-zinc-500 mt-2">Tracks RPC calls, WebSocket connections, API calls, DB reads/writes, function invocations, bandwidth. Minimized via batching, caching, incremental updates, event-driven calcs — not constant full rescans.</div>
        <div className="text-xs text-zinc-600 mt-2 font-mono">Env: SOLANA_RPC_URL • INDEXER_API_KEY • DATABASE_URL • REDIS_URL — never exposed to frontend. See .env.example</div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 text-sm font-bold text-white">ARCHITECTURE</div>
        <pre className="p-4 text-xs font-mono text-zinc-400 leading-relaxed overflow-x-auto">
{`                    SOLANA
                       │
               RPC / WebSocket (logsSubscribe on LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo)
                       │
                       ▼
              EVENT INGESTION  (Yellowstone gRPC / Helius / QuickNode in prod)
                       │
                       ▼
                EVENT PROCESSOR
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      Fee Engine   Risk Engine   Security
          │            │            │
          └────────────┼────────────┘
                       ▼
               Recommendation Engine
                       │
                       ▼
                Cache / DB (PostgreSQL • Timeseries)
                       │
                       ▼
                API / Realtime (SSE → WebSocket)
                       │
                       ▼
                   NETLIFY
                  (Next.js • Tailwind • Serverless proxy)
                       │
                       ▼
                   Browser (LIVE indicator, no manual refresh)`}
        </pre>
      </div>
    </div>
  );
}
function Stat({label,value,sub}:any){
  return <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"><div className="text-[10px] font-bold tracking-widest text-zinc-500">{label}</div><div className="text-lg font-black text-white mt-1">{value}</div>{sub && <div className="text-xs text-zinc-600 font-mono truncate">{sub}</div>}</div>;
}
