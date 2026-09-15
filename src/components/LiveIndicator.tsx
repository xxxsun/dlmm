"use client";
import { useEffect, useState } from "react";

export function LiveIndicator({ status = "live", lastEventMs = 800 }: { status?: "live"|"reconnecting"|"stale"|"offline"; lastEventMs?: number }) {
  const [ago, setAgo] = useState(lastEventMs);
  useEffect(()=>{
    const id=setInterval(()=>setAgo(prev=> prev+100), 100);
    return ()=>clearInterval(id);
  },[]);
  // allow parent to override via prop sync? simple interval

  const cfg = {
    live: { label: "LIVE", color: "bg-emerald-500", text: "text-emerald-400", dot: "animate-pulse", desc: `Last event: ${(ago/1000).toFixed(1)}s ago` },
    reconnecting: { label: "RECONNECTING", color: "bg-amber-500", text: "text-amber-400", dot: "animate-ping", desc: "Reconnecting..." },
    stale: { label: "STALE", color: "bg-orange-500", text: "text-orange-400", dot: "", desc: `Updated ${Math.floor(ago/1000)}s ago` },
    offline: { label: "OFFLINE", color: "bg-red-500", text: "text-red-400", dot: "", desc: "Realtime offline" },
  }[status];

  return (
    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5">
      <span className="relative flex h-2.5 w-2.5">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.color} ${cfg.dot}`}></span>
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cfg.color}`}></span>
      </span>
      <span className={`text-xs font-bold tracking-widest ${cfg.text}`}>● {cfg.label}</span>
      <span className="text-xs text-zinc-500 border-l border-zinc-800 pl-3 hidden sm:inline">{cfg.desc}</span>
      <span className="text-xs text-zinc-600 hidden sm:inline">SOLANA • Meteora DLMM • {new Date().toLocaleTimeString()}</span>
    </div>
  );
}
