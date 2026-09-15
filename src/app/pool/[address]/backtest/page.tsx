"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function BacktestPage() {
  const { address } = useParams() as { address: string };
  const [capital,setCapital]=useState(10000);
  const [rangeLower,setRangeLower]=useState(-2);
  const [rangeUpper,setRangeUpper]=useState(2);
  const [strategy,setStrategy]=useState("volatility_adjusted");
  const [result,setResult]=useState<any>(null);
  const [loading,setLoading]=useState(false);

  const run=async()=>{
    setLoading(true);
    try{
      const res=await fetch("/api/backtest",{method:"POST",headers:{"Content-Type":"application/json"},body: JSON.stringify({ pool: address, capital, rangeLower, rangeUpper, strategy, rebalanceThreshold:3, startDate: new Date(Date.now()-90*24*3600*1000).toISOString(), endDate: new Date().toISOString() })});
      const json=await res.json();
      setResult(json);
    } finally{ setLoading(false); }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-6">
      <Link href={`/pool/${address}`} className="text-xs text-zinc-500 hover:text-white">← Back to pool</Link>
      <h1 className="text-xl font-black text-white">BACKTESTING — {address.slice(0,12)}...</h1>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
          <div className="text-sm font-bold text-white">CONFIG — No Look-Ahead</div>
          <div className="text-xs text-zinc-500">Walk-forward • Train/Validation/Out-of-sample • No future leakage • No survivorship bias</div>
          <label className="block text-xs font-bold tracking-widest text-zinc-400">CAPITAL<input value={capital} onChange={e=>setCapital(parseInt(e.target.value)||0)} className="w-full mt-1 bg-black border border-zinc-800 rounded px-3 py-2 font-mono text-white"/></label>
          <label className="block text-xs font-bold tracking-widest text-zinc-400">STRATEGY<select value={strategy} onChange={e=>setStrategy(e.target.value)} className="w-full mt-1 bg-black border border-zinc-800 rounded px-3 py-2 text-white"><option value="wide">Wide range</option><option value="symmetric">Symmetric</option><option value="volatility_adjusted">Volatility-adjusted</option><option value="fee_maximizing">Fee-maximizing</option><option value="risk_adjusted">Risk-adjusted</option><option value="static">Static</option></select></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-bold tracking-widest text-zinc-400">LOWER %<input type="number" step="0.1" value={rangeLower} onChange={e=>setRangeLower(parseFloat(e.target.value))} className="w-full mt-1 bg-black border border-zinc-800 rounded px-3 py-2 font-mono text-white"/></label>
            <label className="text-xs font-bold tracking-widest text-zinc-400">UPPER %<input type="number" step="0.1" value={rangeUpper} onChange={e=>setRangeUpper(parseFloat(e.target.value))} className="w-full mt-1 bg-black border border-zinc-800 rounded px-3 py-2 font-mono text-white"/></label>
          </div>
          <button onClick={run} disabled={loading} className="w-full py-2.5 rounded-lg bg-white text-black font-black hover:bg-zinc-200 disabled:opacity-50">{loading?"Running...":"Run Backtest"}</button>
          <div className="text-[11px] text-zinc-600">Uses fee history & price • Correct timestamps • Correct range state • Train → validation → OOS.</div>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-4">
          {!result ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500">Configure and run to see results.<br/>Example: Compare fee-maximizing vs risk-adjusted range.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Metric label="NET PnL" value={`$${result.result.netPnL.toFixed(0)}`} sub={`${result.result.netPnLPercent.toFixed(2)}%`} positive={result.result.netPnL>0}/>
                <Metric label="TOTAL FEES" value={`$${result.result.totalFees.toFixed(0)}`} sub="gross" />
                <Metric label="EST IL" value={`$${result.result.estimatedIL.toFixed(0)}`} sub="inventory loss" />
                <Metric label="MAX DD" value={`${result.result.maxDrawdown.toFixed(1)}%`} sub="drawdown" />
                <Metric label="REBALANCES" value={`${result.result.numberOfRebalances}`} sub="count" />
                <Metric label="OCCUPANCY" value={`${result.result.rangeOccupancy.toFixed(0)}%`} sub="in range" />
                <Metric label="SHARPE-LIKE" value={`${result.result.sharpeLike.toFixed(2)}`} sub="mean/std" />
                <Metric label="CAP EFF" value={`${result.result.capitalEfficiency.toFixed(1)}%`} sub="fees/capital" />
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="text-sm font-bold text-white mb-2">DAILY RETURNS (last 12)</div>
                <div className="flex gap-1 items-end h-24">
                  {result.result.dailyReturns.slice(-12).map((d:any,i:number)=>{
                    const h = Math.abs(d.pnl)/50*80+8;
                    const pos = d.pnl>0;
                    return <div key={i} className="flex-1 flex flex-col items-center gap-1"><div className={`w-full rounded-t ${pos?"bg-emerald-500":"bg-red-500"}`} style={{height: h}} title={`${d.date} $${d.pnl.toFixed(0)}`}/><span className="text-[9px] text-zinc-600">{d.date.slice(5)}</span></div>;
                  })}
                </div>
              </div>

              <div className="bg-black border border-zinc-800 rounded-xl p-4 text-xs leading-relaxed text-zinc-400">
                <strong className="text-zinc-300">Critical checks:</strong> No look-ahead — at each bar only past data decides rebalance. Timestamps & slots verified. Fees from actual per-bin accrual. Range state tracked correctly. Walk-forward prevents overfitting. Past performance ≠ future.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
function Metric({label,value,sub,positive}:{label:string;value:string;sub:string;positive?:boolean}) {
  return <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3"><div className="text-[10px] font-bold tracking-widest text-zinc-500">{label}</div><div className={`text-lg font-black ${positive===true?"text-emerald-400": positive===false?"text-red-400":"text-white"}`}>{value}</div><div className="text-xs text-zinc-500">{sub}</div></div>;
}
