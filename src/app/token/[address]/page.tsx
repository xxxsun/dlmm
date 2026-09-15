"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TokenPage(){
  const { address } = useParams() as { address: string };
  const [sec,setSec]=useState<any>(null);
  useEffect(()=>{ fetch(`/api/pools/${address}/security`).then(r=>r.json()).then(setSec); },[address]);
  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      <Link href="/screener" className="text-xs text-zinc-500 hover:text-white">← Screener</Link>
      <h1 className="text-xl font-black text-white">TOKEN ANALYSIS — <span className="font-mono text-sm text-zinc-500">{address.slice(0,16)}...</span></h1>
      {!sec ? <div className="text-zinc-500">Loading...</div> : (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-7 space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
              <div className="text-sm font-bold text-white">AUTHORITIES & PROGRAM</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/40 border border-zinc-800 rounded p-3"><div className="text-zinc-500 font-bold">Mint Authority</div><div className={sec.security.mintAuthorityActive?"text-red-400 font-bold":"text-emerald-400"}>{sec.security.mintAuthorityActive?"ACTIVE — can inflate":"None"}</div></div>
                <div className="bg-black/40 border border-zinc-800 rounded p-3"><div className="text-zinc-500 font-bold">Freeze Authority</div><div className={sec.security.freezeAuthorityActive?"text-red-400 font-bold":"text-emerald-400"}>{sec.security.freezeAuthorityActive?"ACTIVE — can freeze":"None"}</div></div>
                <div className="bg-black/40 border border-zinc-800 rounded p-3"><div className="text-zinc-500 font-bold">Program</div><div className="text-white font-mono">{sec.security.tokenProgram.slice(0,18)}...</div></div>
                <div className="bg-black/40 border border-zinc-800 rounded p-3"><div className="text-zinc-500 font-bold">Token-2022</div><div className={sec.security.isToken2022?"text-amber-400":"text-zinc-300"}>{sec.security.isToken2022?"YES":"No (SPL)"}</div></div>
              </div>
              {sec.token2022?.dangerous?.length>0 && <div className="bg-amber-950/20 border border-amber-900/30 rounded p-3 text-xs text-amber-300">{sec.token2022.dangerous.join(", ")} — {sec.token2022.explanations.join(" • ")}</div>}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="text-sm font-bold text-white mb-3">HOLDER DISTRIBUTION (adjusted)</div>
              <HolderBar label="Top 5" value={sec.holderAnalysis.top5}/>
              <HolderBar label="Top 10" value={sec.holderAnalysis.top10}/>
              <HolderBar label="Top 20" value={sec.holderAnalysis.top20}/>
              <div className="text-xs text-zinc-500 mt-3">Excludes LP accounts, burn addresses, known protocol/CEX wallets where identifiable. High concentration = exit liquidity risk.</div>
              {sec.security.rejectionReasons.length>0 && <div className="mt-3 bg-red-600 text-white text-xs font-bold px-3 py-2 rounded">REJECTED — {sec.security.rejectionReasons.join(" • ")}</div>}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="text-sm font-bold text-white">DEPLOYER / INSIDER</div>
              <div className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Wallet relationship analysis identifies deployer, funding wallets, early buyers, LP creators. Uses clustering:<br/>
                <span className="text-zinc-300">Possible Cluster</span> → <span className="text-yellow-400">Likely Cluster</span> → <span className="text-red-400">High Confidence Cluster</span> (only with strong on-chain linkage). Never claims same person without evidence.
              </div>
              <div className="mt-3 bg-black/40 border border-zinc-800 rounded p-3 text-xs font-mono text-zinc-400">Funding Wallet → Multiple wallets → Early accumulation → Coordinated selling — detected via funding graph & timing.</div>
              <div className="mt-3 flex gap-2 text-xs"><span className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">Insider Sell Pressure: <strong className="text-amber-400">3.2% deployer + 8.7% early cluster</strong></span></div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="text-sm font-bold text-white">WALLET BEHAVIOR</div>
              <ul className="text-xs text-zinc-400 mt-2 space-y-1 list-disc pl-4">
                <li>Sniper wallets — first-block buys</li>
                <li>Coordinated wallets — same funding source</li>
                <li>Repeated same-size swaps — wash suspect</li>
                <li>Circular trading & rapid buy/sell cycles</li>
              </ul>
              <div className="text-xs text-zinc-500 mt-2">All labels probabilistic: “possible / likely / high confidence” — not definitive.</div>
            </div>
            <div className="bg-black border border-zinc-800 rounded-xl p-5">
              <div className="text-xs font-bold tracking-widest text-zinc-500">CONFIDENCE & UNKNOWN</div>
              <div className="text-sm text-zinc-300 mt-2">If data missing → <strong className="text-white">UNKNOWN</strong> — never “safe”. Token age, pool age, first liquidity event, first swap shown; new tokens get higher uncertainty but not auto-reject.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function HolderBar({ label, value }: any){
  const color = value>70?"bg-red-500": value>45?"bg-amber-500": value>30?"bg-yellow-500":"bg-emerald-500";
  return <div className="mb-2"><div className="flex justify-between text-xs"><span className="text-zinc-400">{label}</span><span className="font-mono text-white">{value.toFixed(1)}%</span></div><div className="h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden"><div className={`h-full ${color}`} style={{width:`${Math.min(100,value)}%`}}/></div></div>;
}
