"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BinVisualization } from "@/components/BinVisualization";
import { formatUSD, formatPercent, timeAgo } from "@/lib/utils";
import { RangeOptimizer } from "@/lib/engines/RangeOptimizer";
import Link from "next/link";

export default function PoolPage() {
  const params = useParams() as { address: string };
  const address = params.address;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [capital, setCapital] = useState(10000);
  const [risk, setRisk] = useState(25);

  useEffect(()=>{
    fetch(`/api/pools/${address}`).then(r=>r.json()).then(setData).finally(()=>setLoading(false));
    const id=setInterval(()=> fetch(`/api/pools/${address}`).then(r=>r.json()).then(setData), 8000);
    return ()=>clearInterval(id);
  },[address]);

  if (loading || !data) return <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-12 text-zinc-500">Loading pool {address.slice(0,12)}...</div>;

  const { pool, feeSnapshot, risk: riskScore, security, bins, volume } = data;
  const ranges = {
    wide: RangeOptimizer.wide({ binStep: pool.binStep, currentPrice: pool.currentPrice }),
    sym: RangeOptimizer.symmetric({ binStep: pool.binStep, currentPrice: pool.currentPrice }, 2),
    vol: RangeOptimizer.volatilityAdjusted({ binStep: pool.binStep, currentPrice: pool.currentPrice }, 2.8),
    fee: RangeOptimizer.feeMaximizing({ binStep: pool.binStep, currentPrice: pool.currentPrice }),
    risk: RangeOptimizer.riskAdjusted({ binStep: pool.binStep, currentPrice: pool.currentPrice }, riskScore.overall),
  };

  const ilRows = [-20,-10,-5,-2,-1,1,2,5,10,20].map(pct=>{
    const rec = ranges.risk;
    const proj = RangeOptimizer.inventoryProjection(pool.currentPrice, pct, rec, capital);
    return { pct, ...proj };
  });

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      <Link href="/screener" className="text-xs text-zinc-500 hover:text-white">← Back to screener</Link>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex flex-wrap gap-4 justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-white">{pool.name} <span className="text-zinc-500 font-mono text-sm">{pool.address.slice(0,12)}...{pool.address.slice(-6)}</span></h1>
              <span className="text-xs bg-violet-600 text-white px-2 py-1 rounded font-bold">Meteora DLMM</span>
              <span className={`text-xs px-2 py-1 rounded font-bold border ${riskScore.overall<20?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20": riskScore.overall<40?"bg-yellow-500/10 text-yellow-400 border-yellow-500/20": "bg-red-500/10 text-red-400 border-red-500/20"}`}>Risk {riskScore.overall}</span>
            </div>
            <div className="text-xs text-zinc-500 mt-1">Bin step {pool.binStep} • Base fee {(pool.baseFeeBps/100).toFixed(2)}% • Price ${pool.currentPrice.toFixed(4)} • Slot {data.slot} • Updated {timeAgo(Date.now())}</div>
          </div>
          <div className="flex gap-2">
            <Link href={`/pool/${address}/bins`} className="px-4 py-2 rounded-lg bg-white text-black text-sm font-bold">Bins →</Link>
            <Link href={`/pool/${address}/backtest`} className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm font-bold text-zinc-300">Backtest</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-6">
          <Stat label="LIQUIDITY" value={formatUSD(pool.liquidityUSD)} sub={`24h ${pool.volume24h? formatUSD(pool.volume24h):"-"} vol`} />
          <Stat label="VOL / LIQ" value={(volume.volumeToLiquidity).toFixed(2)} sub={`${volume.uniqueTraders} traders`} />
          <Stat label="24H FEES" value={formatUSD(feeSnapshot.fee24h)} sub={`per liq ${(feeSnapshot.feePerLiquidity*100).toFixed(3)}%`} />
          <Stat label="FEE VOLATILITY" value={formatPercent(feeSnapshot.feeVolatility*100,1)} sub="lower is better" />
          <Stat label="SECURITY" value={`${security.securityScore}/100`} sub={security.mintAuthorityActive?"Mint active":"No mint authority"} />
          <Stat label="HOLDER TOP10" value={formatPercent(security.adjustedHolderTop10,1)} sub="adjusted" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <BinVisualization bins={bins.bins} activeBin={bins.activeBin} currentPrice={pool.currentPrice} />

          {/* Fee engine */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-sm font-bold text-white mb-3">FEE ENGINE — MULTIPLE WINDOWS</div>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 text-xs">
              {[
                ["1m", feeSnapshot.fee1m],
                ["5m", feeSnapshot.fee5m],
                ["15m", feeSnapshot.fee15m],
                ["1h", feeSnapshot.fee1h],
                ["6h", feeSnapshot.fee6h],
                ["24h", feeSnapshot.fee24h],
                ["7d", feeSnapshot.fee7d],
                ["30d", feeSnapshot.fee30d],
              ].map(([k,v])=> <div key={k as string} className="bg-black/40 border border-zinc-800 rounded-lg p-3"><div className="text-zinc-500 font-bold tracking-widest">{k}</div><div className="text-white font-mono font-bold">{formatUSD(v as number)}</div></div>)}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
              <div className="bg-black/40 border border-zinc-800 rounded-lg p-3"><div className="text-zinc-500 font-bold">CONSERVATIVE</div><div className="text-amber-400 font-bold">{formatUSD(feeSnapshot.conservativeEstimate)}</div><div className="text-zinc-600">est 24h</div></div>
              <div className="bg-black/40 border border-zinc-800 rounded-lg p-3"><div className="text-zinc-500 font-bold">BASE EST</div><div className="text-white font-bold">{formatUSD(feeSnapshot.baseEstimate)}</div><div className="text-zinc-600">est 24h</div></div>
              <div className="bg-black/40 border border-zinc-800 rounded-lg p-3"><div className="text-zinc-500 font-bold">OPTIMISTIC</div><div className="text-emerald-400 font-bold">{formatUSD(feeSnapshot.optimisticEstimate)}</div><div className="text-zinc-600">est 24h</div></div>
            </div>
            <div className="text-xs text-zinc-500 mt-3">Fees / liquidity: {(feeSnapshot.feePerLiquidity*100).toFixed(4)}% • Fees / volume: {(feeSnapshot.feePerVolume*100).toFixed(2)}% • Do not assume 24h APR = future APR. Fee quality: checks temporary spike, wash, sniper, manipulation.</div>
          </div>

          {/* IL engine */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-white">INVENTORY / IL ENGINE — BIN-RANGE MODEL</div>
              <div className="text-xs text-zinc-500">Capital <input value={capital} onChange={e=>setCapital(parseInt(e.target.value)||0)} className="ml-2 bg-black border border-zinc-800 rounded px-2 py-1 w-24 font-mono text-white"/> USD</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-zinc-500 tracking-widest">
                  <tr><th className="text-left py-2">PRICE</th><th className="text-right">IN RANGE?</th><th className="text-right">FEE</th><th className="text-right">INV CHANGE</th><th className="text-right">NET</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 font-mono">
                  {ilRows.map(r=>(
                    <tr key={r.pct} className={r.inRange ? "text-zinc-300" : "text-amber-300 bg-amber-950/10"}>
                      <td className="py-1.5">{r.pct>0?"+":""}{r.pct}% → ${r.newPrice.toFixed(2)}</td>
                      <td className="text-right">{r.inRange ? "✓" : "✕ OUT"}</td>
                      <td className="text-right text-emerald-400">+${r.feeIncome.toFixed(0)}</td>
                      <td className="text-right text-red-400">${r.inventoryChange.toFixed(0)}</td>
                      <td className={`text-right font-bold ${r.net>0?"text-emerald-400":"text-red-400"}`}>${r.net.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-zinc-500 mt-2">DLMM IL modeled per bin/range, not standard AMM formula. Includes rebalance & tx costs in net.</div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Risk matrix */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-sm font-bold text-white mb-3">RISK MATRIX</div>
            <div className="space-y-2">
              <RiskBar label="Overall Risk" value={riskScore.overall} />
              <RiskBar label="Security" value={100 - riskScore.security} invert />
              <RiskBar label="Liquidity" value={100 - riskScore.liquidityQuality} invert/>
              <RiskBar label="Volume Quality" value={100 - riskScore.volumeQuality} invert/>
              <RiskBar label="Holder" value={100 - riskScore.holderDistribution} invert/>
            </div>
            <div className="text-xs text-zinc-500 mt-3 grid grid-cols-5 gap-1 text-center">
              <span className="bg-emerald-500/20 text-emerald-400 rounded px-1 py-0.5">0-20 LOW</span>
              <span className="bg-yellow-500/20 text-yellow-400 rounded px-1 py-0.5">21-40</span>
              <span className="bg-orange-500/20 text-orange-400 rounded px-1 py-0.5">41-60 HIGH</span>
              <span className="bg-red-500/20 text-red-400 rounded px-1 py-0.5">61-80</span>
              <span className="bg-red-600/30 text-red-400 rounded px-1 py-0.5">81-100 CRIT</span>
            </div>
            {riskScore.isRejected && <div className="mt-3 bg-red-600 text-white text-xs font-bold px-3 py-2 rounded">REJECTED — {riskScore.rejectionReasons.join(" • ")}</div>}
            {riskScore.reasons.length>0 && <ul className="text-xs text-zinc-400 mt-3 space-y-1">{riskScore.reasons.map((r:string,i:number)=> <li key={i}>• {r}</li>)}</ul>}
          </div>

          {/* Security */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-sm font-bold text-white mb-2">TOKEN SECURITY</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between bg-black/40 border border-zinc-800 rounded px-3 py-2"><span className="text-zinc-400">Mint authority</span><span className={security.mintAuthorityActive?"text-red-400 font-bold":"text-emerald-400"}>{security.mintAuthorityActive?"ACTIVE — RISKY":"None ✓"}</span></div>
              <div className="flex justify-between bg-black/40 border border-zinc-800 rounded px-3 py-2"><span className="text-zinc-400">Freeze authority</span><span className={security.freezeAuthorityActive?"text-red-400 font-bold":"text-emerald-400"}>{security.freezeAuthorityActive?"ACTIVE":"None ✓"}</span></div>
              <div className="flex justify-between bg-black/40 border border-zinc-800 rounded px-3 py-2"><span className="text-zinc-400">Token program</span><span className="text-zinc-300 font-mono text-[11px]">{security.tokenProgram.slice(0,12)}...</span></div>
              <div className="flex justify-between bg-black/40 border border-zinc-800 rounded px-3 py-2"><span className="text-zinc-400">Token-2022</span><span className={security.isToken2022?"text-amber-400":"text-zinc-300"}>{security.isToken2022? "Yes — inspect extensions":"No"}</span></div>
              {security.dangerousExtensions.length>0 && <div className="bg-amber-950/20 border border-amber-900/30 rounded p-2 text-amber-300">Dangerous: {security.dangerousExtensions.join(", ")}</div>}
              <div className="pt-2 text-zinc-500">Top holders: 5 {security.holderTop5.toFixed(1)}% • 10 {security.holderTop10.toFixed(1)}% • 20 {security.holderTop20.toFixed(1)}% (adjusted: burns/LP excluded)</div>
            </div>
          </div>

          {/* Range optimizer */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-sm font-bold text-white mb-3">AUTO RANGE OPTIMIZER</div>
            <div className="space-y-2 text-xs">
              {Object.entries(ranges).map(([k,v]: any)=>(
                <div key={k} className={`p-3 rounded-lg border ${k==="risk"?"bg-violet-950/20 border-violet-900/40":"bg-black/40 border-zinc-800"}`}>
                  <div className="font-bold text-white uppercase">{k} • {v.lowerPct.toFixed(1)}% / +{v.upperPct.toFixed(1)}% <span className="font-normal text-zinc-500 normal-case">{v.strategy}</span></div>
                  <div className="font-mono text-zinc-300">${v.lowerPrice.toFixed(2)} → ${v.upperPrice.toFixed(2)}</div>
                  <div className="text-zinc-500">Bins {v.lowerBin} → {v.upperBin} • Efficiency {v.expectedFeeEfficiency.toFixed(0)}% • Occupancy {v.expectedRangeOccupancy.toFixed(0)}% • Rebalance {v.expectedRebalanceFrequency}</div>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-zinc-600 mt-3">Inputs: capital ${capital}, risk, holding time, max rebalance freq. Do not promise profitability.</div>
          </div>

          {/* Explainability */}
          <div className="bg-black border border-zinc-800 rounded-xl p-4">
            <div className="text-xs font-bold tracking-widest text-zinc-500">EXPLAINABILITY</div>
            <div className="text-sm font-bold text-white mt-2">Why ranked?</div>
            <ul className="text-xs text-zinc-300 mt-1 space-y-1"><li>✓ Fee per liquidity {(feeSnapshot.feePerLiquidity*100).toFixed(3)}%</li><li>✓ Volume quality {volume.quality.toFixed(0)}/100</li><li>✓ Security {security.securityScore}/100</li></ul>
            <div className="text-sm font-bold text-white mt-3">Why not higher?</div>
            <ul className="text-xs text-zinc-400 mt-1 space-y-1"><li>• Liquidity concentration narrow</li><li>• Confidence {riskScore.confidence}% — limited sample</li></ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: any) {
  return <div className="bg-black/40 border border-zinc-800 rounded-lg p-3"><div className="text-[10px] font-bold tracking-widest text-zinc-500">{label}</div><div className="text-sm font-black text-white mt-1">{value}</div><div className="text-xs text-zinc-500">{sub}</div></div>;
}
function RiskBar({ label, value, invert }: any) {
  const v = invert ? value : value;
  const color = v<20?"bg-emerald-500": v<40?"bg-yellow-500": v<60?"bg-orange-500": v<80?"bg-red-500":"bg-red-600";
  return <div><div className="flex justify-between text-xs"><span className="text-zinc-400">{label}</span><span className="font-mono text-zinc-300">{value}/100</span></div><div className="h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden"><div className={`h-full ${color}`} style={{width:`${Math.min(100, value)}%`}}/></div></div>;
}
