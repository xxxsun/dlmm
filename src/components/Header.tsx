"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LiveIndicator } from "./LiveIndicator";
import { useRealtime } from "./RealtimeProvider";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/screener", label: "Screener" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/alerts", label: "Alerts" },
  { href: "/system", label: "System" },
];

export function Header() {
  const pathname = usePathname();
  const { status, lastEventTs } = useRealtime();
  const ago = lastEventTs ? Date.now() - lastEventTs : 800;

  let indicatorStatus: "live"|"reconnecting"|"stale"|"offline" = "live";
  if (status === "connecting") indicatorStatus = "reconnecting";
  else if (status === "error") indicatorStatus = "offline";
  else if (ago > 15000) indicatorStatus = "stale";

  return (
    <header className="sticky top-0 z-40 bg-black/80 backdrop-blur border-b border-zinc-900">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 h-[56px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white text-sm">DL</div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight text-white">DLMM SCREENER</div>
              <div className="text-[10px] tracking-[0.18em] text-zinc-500 font-semibold">METEORA • SOLANA</div>
            </div>
            <span className="hidden md:inline ml-2 text-[10px] font-bold bg-violet-600 text-white px-1.5 py-0.5 rounded">BETA</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 ml-2">
            {nav.map(n=>{
              const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
              return <Link key={n.href} href={n.href} className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${active ? "bg-zinc-900 text-white border border-zinc-800" : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"}`}>{n.label}</Link>
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <LiveIndicator status={indicatorStatus} lastEventMs={ago} />
          <div className="hidden lg:flex items-center gap-2 text-xs">
            <span className="text-zinc-600">RPC</span><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/> 
            <span className="text-zinc-600">WS</span><span className={`w-2 h-2 rounded-full inline-block ${status==="connected"?"bg-emerald-500":"bg-amber-500"}`}/>
          </div>
        </div>
      </div>
      <div className="md:hidden border-t border-zinc-900 bg-zinc-950 px-2 py-1.5 flex gap-1 overflow-x-auto">
        {nav.map(n=>{
          const active = pathname === n.href;
          return <Link key={n.href} href={n.href} className={`whitespace-nowrap px-2.5 py-1 rounded text-xs font-semibold ${active?"bg-zinc-900 text-white":"text-zinc-500"}`}>{n.label}</Link>
        })}
      </div>
    </header>
  );
}
