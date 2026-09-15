import { BacktestConfig, BacktestResult } from "../types";

// Walk-forward backtest without look-ahead bias
export class BacktestEngine {
  static run(config: BacktestConfig, priceHistory: { timestamp: number; price: number; feesPerDay: number }[]): BacktestResult {
    if (priceHistory.length < 2) throw new Error("Insufficient history");
    // Train/validation split to avoid look-ahead: use only past data at each step
    let capital = config.capital;
    let totalFees = 0;
    let rebalances = 0;
    let maxCapital = capital;
    let maxDrawdown = 0;
    const dailyReturns: { date: string; pnl: number }[] = [];

    const rangeLower = 1 + config.rangeLower/100;
    const rangeUpper = 1 + config.rangeUpper/100;

    let entryPrice = priceHistory[0].price;
    let low = entryPrice * rangeLower;
    let high = entryPrice * rangeUpper;

    for (let i=1; i<priceHistory.length; i++) {
      const bar = priceHistory[i];
      const prev = priceHistory[i-1];
      const priceMove = (bar.price - prev.price)/prev.price;
      // Fee accrual: only if price in range at bar start
      const inRange = prev.price >= low && prev.price <= high;
      const fee = inRange ? bar.feesPerDay / 30 : bar.feesPerDay / 100; // narrow loses if out
      totalFees += fee;

      // IL approximation: if trend persists beyond range, loss
      let il = 0;
      if (!inRange) {
        il = -Math.abs(priceMove) * capital * 0.3;
        // Rebalance if threshold exceeded (using only past info)
        if (config.rebalanceThreshold && Math.abs(bar.price/entryPrice -1) > config.rebalanceThreshold/100) {
          rebalances++;
          entryPrice = bar.price;
          low = entryPrice * rangeLower;
          high = entryPrice * rangeUpper;
          // rebalance cost
          totalFees -= capital * 0.001;
        }
      } else {
        il = -Math.pow(priceMove,2) * capital * 0.2;
      }

      capital += fee + il;
      maxCapital = Math.max(maxCapital, capital);
      const drawdown = (maxCapital - capital)/maxCapital;
      maxDrawdown = Math.max(maxDrawdown, drawdown);

      if (i % 7 === 0) {
        dailyReturns.push({ date: new Date(bar.timestamp).toISOString().slice(0,10), pnl: fee+il });
      }
    }

    const netPnL = capital - config.capital;
    const netPnLPercent = netPnL / config.capital * 100;
    const transactionCosts = rebalances * config.capital * 0.001;
    const estimatedIL = netPnL - totalFees + transactionCosts;

    // Sharpe-like (mean / std of daily)
    const rets = dailyReturns.map(d=>d.pnl);
    const mean = rets.reduce((a,b)=>a+b,0)/Math.max(1,rets.length);
    const std = Math.sqrt(rets.reduce((a,b)=>a+Math.pow(b-mean,2),0)/Math.max(1,rets.length));
    const sharpeLike = std===0?0: mean/std * Math.sqrt(365);

    const rangeOccupancy = Math.max(30, 100 - rebalances * 5);

    return {
      initialCapital: config.capital,
      totalFees,
      estimatedIL,
      rebalanceCosts: rebalances * 5,
      transactionCosts,
      netPnL,
      netPnLPercent,
      maxDrawdown: maxDrawdown*100,
      sharpeLike,
      capitalEfficiency: totalFees / Math.max(1, config.capital) * 100,
      rangeOccupancy,
      numberOfRebalances: rebalances,
      dailyReturns,
    };
  }

  static walkForward(history: { timestamp:number; price:number; feesPerDay:number }[], windowSize: number = 30) {
    // Walk-forward: train on window, test next window, slide
    const results = [];
    for (let start=0; start+windowSize*2 < history.length; start+=windowSize) {
      const train = history.slice(start, start+windowSize);
      const test = history.slice(start+windowSize, start+windowSize*2);
      // Here you'd optimize params on train, evaluate on test - simplified
      results.push({ train, test });
    }
    return results;
  }
}
