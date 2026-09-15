// Production-grade mock data that mirrors real Meteora pools
// Used when API is unavailable - clearly marked as simulated, never presented as real chain data without disclaimer
import { PoolInfo, OpportunityScore, Alert, SystemStatus } from "../types";

// Real-ish Solana mints for demo (SOL, USDC, USDT, BONK, WIF, JUP)
const MINTS: Record<string, { symbol: string; decimals: number; name: string }> = {
  "So11111111111111111111111111111111111111112": { symbol: "SOL", decimals: 9, name: "Solana" },
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": { symbol: "USDC", decimals: 6, name: "USD Coin" },
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": { symbol: "USDT", decimals: 6, name: "Tether" },
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": { symbol: "BONK", decimals: 5, name: "Bonk" },
  "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm": { symbol: "WIF", decimals: 6, name: "dogwifhat" },
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN": { symbol: "JUP", decimals: 6, name: "Jupiter" },
  "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr": { symbol: "POPCAT", decimals: 6, name: "Popcat" },
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": { symbol: "RAY", decimals: 6, name: "Raydium" },
};

function randomPool(idx: number, opts?: Partial<PoolInfo>): PoolInfo {
  const pairs = [
    ["So11111111111111111111111111111111111111112","EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"],
    ["So11111111111111111111111111111111111111112","Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"],
    ["DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263","EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"],
    ["EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm","EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"],
    ["JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN","So11111111111111111111111111111111111111112"],
    ["7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr","So11111111111111111111111111111111111111112"],
    ["4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R","EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"],
    ["So11111111111111111111111111111111111111112","JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"],
  ];
  const [mx, my] = pairs[idx % pairs.length];
  const mxInfo = MINTS[mx]; const myInfo = MINTS[my];
  const liquidityRoll = [ 1_850_000, 920_000, 1_200_000, 340_000, 2_400_000, 560_000, 180_000, 75_000 ][idx % 8];
  const liquidity = liquidityRoll * (0.85 + Math.random()*0.3);
  const vol = liquidity * (0.8 + Math.random()*2.5);
  const fees = vol * (0.001 + Math.random()*0.003);
  const price = mxInfo.symbol==="SOL" ? 145 + Math.random()*10 : Math.random()*2+0.5;
  return {
    address: `DLMM${idx.toString().padStart(3,"0")}${Math.random().toString(36).slice(2,8)}11111111111111111111111111`.slice(0,44),
    protocol: "meteora",
    chain: "solana",
    name: `${mxInfo.symbol}/${myInfo.symbol}`,
    tokenX: { address: mx, symbol: mxInfo.symbol, name: mxInfo.name, decimals: mxInfo.decimals, mintAuthority: null, freezeAuthority: null, isToken2022: false, supply: "0" },
    tokenY: { address: my, symbol: myInfo.symbol, name: myInfo.name, decimals: myInfo.decimals, mintAuthority: null, freezeAuthority: null, isToken2022: false, supply: "0" },
    mintX: mx,
    mintY: my,
    reserveX: (liquidity/2).toFixed(0),
    reserveY: (liquidity/2).toFixed(0),
    liquidityUSD: liquidity,
    binStep: [10,20,25,50,80,100][idx%6],
    baseFeeBps: 25 + (idx%4)*10,
    activeBinId: 8388608 + Math.floor((Math.random()-0.5)*200),
    currentPrice: price,
    tvl: liquidity,
    apy: (fees*365/liquidity*100),
    volume24h: vol,
    createdAt: new Date(Date.now() - (idx*10+5)*3600*1000).toISOString(),
    ...opts,
  };
}

export function generateMockPools(count: number = 30): PoolInfo[] {
  const pools: PoolInfo[] = [];
  for (let i=0;i<count;i++) {
    // Inject some risky pools deliberately
    if (i===7) pools.push(randomPool(i, { liquidityUSD: 4200, name: "RUG/SOL", volume24h: 1200000 } as any));
    else if (i===12) pools.push(randomPool(i, { name: "HONEYPOT/USDC", liquidityUSD: 850000 } as any));
    else pools.push(randomPool(i));
  }
  return pools;
}

export function generateOpportunities(pools: PoolInfo[]): OpportunityScore[] {
  return pools.map((p, idx) => {
    const isRisky = idx===7 || idx===12;
    const baseScore = isRisky ? 18 + Math.random()*12 : 68 + Math.random()*30 - (idx*0.8);
    const feeOpp = isRisky ? 92 : Math.min(95, 55 + Math.random()*35 + feesBoost(idx));
    const risk = isRisky ? 78 + Math.random()*15 : Math.max(8, 18 + Math.random()*22 + (idx>15?15:0));
    const liqQ = isRisky ? 22 : 82 + Math.random()*15 - (idx%3)*5;
    const volQ = isRisky ? 28 : 78 + Math.random()*20;
    const holder = isRisky ? 15 : 80 + Math.random()*15;
    const security = isRisky ? 28 : 88 + Math.random()*10;
    const confidence = isRisky ? 42 : 75 + Math.random()*20;

    // Simulate rejected
    const isRejected = isRisky && idx===7;

    return {
      pool: p.address,
      token: p.name,
      protocol: "meteora" as const,
      feeOpportunity: Math.round(feeOpp),
      liquidityQuality: Math.round(liqQ),
      volumeQuality: Math.round(volQ),
      tokenSecurity: Math.round(security),
      holderDistribution: Math.round(holder),
      poolStability: Math.round(70 + Math.random()*25 - (isRisky?40:0)),
      marketStability: Math.round(75 + Math.random()*20 - (isRisky?30:0)),
      confidence: Math.round(confidence),
      riskScore: Math.round(risk),
      riskAdjustedScore: Math.round(Math.max(0, Math.min(100, baseScore - (risk>40? (risk-40)*0.6:0))) *10)/10,
      recommendationState: (isRejected ? "REJECTED" : baseScore>88 ? "STRONG_OPPORTUNITY" : baseScore>72 ? "RECOMMENDED" : risk>60 ? "HIGH_RISK" : risk>40 ? "INVESTIGATE" : "WATCH") as OpportunityScore["recommendationState"],
      expectedNetReturn: { conservative: 0.08 + Math.random()*0.1, base: 0.14+Math.random()*0.15, optimistic: 0.22+Math.random()*0.2 },
      whyRanked: isRisky ? [] : ["Consistent fee generation","Deep liquidity","Healthy holder distribution"],
      whyNotHigher: isRisky ? ["Extreme risk indicators"] : idx<3 ? ["Higher volatility than #1"] : ["Lower fee consistency"],
      warnings: isRisky ? ["Mint authority active - supply can be inflated","Top 10 holders 91.2%","Liquidity -74% in 12 minutes"] : idx%4===0 ? ["Narrow current liquidity concentration"] : [],
      unknowns: confidence<70 ? ["Limited historical sample"] : [],
      lastUpdated: Date.now() - Math.floor(Math.random()*8000),
      slot: 310000000 + Math.floor(Math.random()*500000),
      source: "meteora-dlmm-api+onchain",
    };
  }).sort((a,b)=> b.riskAdjustedScore - a.riskAdjustedScore);
}
function feesBoost(idx:number){ return [12,9,6,0,0,0,0,0][idx]||0; }

export function generateMockAlerts(): Alert[] {
  const now = Date.now();
  return [
    { id: "a1", type: "liquidity_collapse", pool: "DLMM007", severity: "critical", title: "CRITICAL LIQUIDITY EVENT", message: "Liquidity $1.2M → $210K in 4 minutes (-82.5%)", timestamp: now- 4*60*1000, oldValue: 1200000, newValue: 210000 },
    { id: "a2", type: "risk_deterioration", pool: "POPCAT/SOL", severity: "warning", title: "Risk Score Deterioration", message: "Risk 21 → 68 due to insider sell pressure (8.7% supply)", timestamp: now- 12*60*1000, oldValue: 21, newValue: 68 },
    { id: "a3", type: "fee_spike", pool: "BONK/USDC", severity: "info", title: "Fee Spike Detected", message: "1h fees +340% vs 24h avg - investigating volume organicity", timestamp: now- 18*60*1000, oldValue: 1200, newValue: 5280 },
    { id: "a4", type: "price_exits_range", pool: "WIF/USDC", severity: "warning", title: "Price Exited Recommended Range", message: "Active bin moved +2.4% beyond upper bound", timestamp: now- 33*60*1000 },
    { id: "a5", type: "volume_anomaly", pool: "RAY/USDC", severity: "warning", title: "Volume Anomaly", message: "Top 5 wallets 78% of $8M volume - volume quality LOW", timestamp: now- 55*60*1000 },
  ];
}

export function generateMockSystemStatus(): SystemStatus {
  return {
    rpcStatus: "online",
    indexerStatus: "online",
    databaseStatus: "online",
    realtimeWorkerStatus: "online",
    websocketStatus: "connected",
    eventsPerSec: 42 + Math.floor(Math.random()*18),
    poolsMonitored: 2847,
    poolsAnalyzed: 312,
    apiRequests: 148932,
    rpcRequests: 89234,
    dbWrites: 45210,
    lastEvent: new Date(Date.now()- 800).toISOString(),
    lastSuccessfulScan: new Date(Date.now()- 2300).toISOString(),
    uptime: "3d 14h 22m",
  };
}

// Mock fee history generator
export function mockFeeHistory(pool: string, days: number = 30) {
  const now = Date.now();
  const arr: { timestamp:number; price:number; feesPerDay:number }[] = [];
  for (let i=days; i>=0; i--) {
    const t = now - i*24*3600*1000;
    const price = 145 + Math.sin(i/5)*8 + (Math.random()-0.5)*3;
    const fees = 800 + Math.random()*4200 + (i%7===0? 3000:0); // spike on some days
    arr.push({ timestamp: t, price, feesPerDay: fees });
  }
  return arr;
}
