import { NextRequest, NextResponse } from "next/server";
import { BacktestEngine } from "@/lib/engines/BacktestEngine";
import { mockFeeHistory } from "@/lib/data/mockData";
export const dynamic="force-dynamic";
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { pool="SOL/USDC", capital=10000, strategy="volatility_adjusted", rangeLower=-2, rangeUpper=2, startDate, endDate, rebalanceThreshold=3 } = body;
  const history = mockFeeHistory(pool, 90);
  // filter by date if provided
  let filtered = history;
  if (startDate) filtered = filtered.filter(h=> h.timestamp >= new Date(startDate).getTime());
  if (endDate) filtered = filtered.filter(h=> h.timestamp <= new Date(endDate).getTime());
  const result = BacktestEngine.run({ pool, capital, strategy, rangeLower, rangeUpper, startDate: startDate || new Date(filtered[0].timestamp).toISOString(), endDate: endDate || new Date(filtered[filtered.length-1].timestamp).toISOString(), rebalanceThreshold }, filtered);
  return NextResponse.json({ config: body, result, disclaimer: "Backtest avoids look-ahead bias: walk-forward, no future data leakage. Past performance is not indicative of future results." });
}
export async function GET() {
  return NextResponse.json({ message: "POST with {pool, capital, strategy, rangeLower, rangeUpper, startDate, endDate} to run backtest", strategies: ["wide","symmetric","volatility_adjusted","fee_maximizing","risk_adjusted","static"] });
}
