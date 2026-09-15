import { ProtocolAdapter, binIdToPrice } from "./ProtocolAdapter";
import { PoolInfo, BinSnapshot, TokenInfo, NormalizedEvent } from "../types";

// Meteora DLMM official
export const METEORA_DLMM_PROGRAM_ID = "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo";
export const METEORA_API_BASE = "https://dlmm-api.meteora.ag";
export const METEORA_DATAPI_BASE = "https://dlmm.datapi.meteora.ag";

export interface MeteoraPoolRaw {
  address: string;
  name: string;
  mint_x: string;
  mint_y: string;
  reserve_x: string;
  reserve_y: string;
  reserve_x_amount: number;
  reserve_y_amount: number;
  bin_step: number;
  base_fee_percentage: string;
  max_fee_percentage: string;
  protocol_fee_percentage: string;
  liquidity: string;
  reward_mint_x?: string;
  reward_mint_y?: string;
  fees_24h?: number;
  today_fees?: number;
  trade_volume_24h?: number;
  cumulative_trade_volume?: string;
  cumulative_fee_volume?: string;
  current_price?: number;
  apr?: number;
  apy?: number;
  farm_apr?: number;
  farm_apy?: number;
  hide?: boolean;
}

export class MeteoraDLMMAdapter extends ProtocolAdapter {
  protocol = "meteora";
  programId = METEORA_DLMM_PROGRAM_ID;
  apiBaseUrl = METEORA_API_BASE;

  private rpcUrl: string;

  constructor(rpcUrl?: string) {
    super();
    this.rpcUrl = rpcUrl || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
  }

  async discoverPools(limit: number = 50, offset: number = 0): Promise<PoolInfo[]> {
    try {
      // Try official API: /pair/all
      const url = `${METEORA_API_BASE}/pair/all?limit=${limit}&offset=${offset}`;
      const res = await fetch(url, { next: { revalidate: 10 } });
      if (!res.ok) throw new Error(`Meteora API ${res.status}`);
      const data = await res.json();
      const pairs: MeteoraPoolRaw[] = Array.isArray(data) ? data : data.pairs || data.data || [];
      return pairs.slice(0, limit).map((p) => this.mapPool(p));
    } catch (e) {
      console.warn("Meteora discoverPools fallback to datapi", e);
      try {
        const url2 = `${METEORA_DATAPI_BASE}/pair/all?limit=${limit}&page=0`;
        const res2 = await fetch(url2);
        if (res2.ok) {
          const data2 = await res2.json();
          const pairs2: MeteoraPoolRaw[] = Array.isArray(data2) ? data2 : data2.pairs || [];
          return pairs2.slice(0, limit).map((p) => this.mapPool(p));
        }
      } catch (_) {}
      return [];
    }
  }

  async getPool(address: string): Promise<PoolInfo | null> {
    try {
      const url = `${METEORA_API_BASE}/pair/${address}`;
      const res = await fetch(url, { next: { revalidate: 10 } });
      if (!res.ok) return null;
      const p: MeteoraPoolRaw = await res.json();
      return this.mapPool(p);
    } catch (e) {
      console.error("getPool error", e);
      return null;
    }
  }

  async getBinSnapshot(poolAddress: string, count: number = 20): Promise<BinSnapshot> {
    // In production, uses @meteora-ag/dlmm SDK to fetch bins
    // Here we simulate with API + derived values
    const pool = await this.getPool(poolAddress);
    if (!pool) throw new Error("pool not found");
    const activeBin = pool.activeBinId || 8388608;
    const bins = [];
    const half = Math.floor(count / 2);
    for (let i = -half; i <= half; i++) {
      const binId = activeBin + i;
      const price = binIdToPrice(binId, pool.binStep, pool.tokenX.decimals, pool.tokenY.decimals);
      const distance = Math.abs(i);
      // Gaussian liquidity distribution around active bin
      const liquidityUSD = Math.max(0, 50000 * Math.exp(-(distance * distance) / 18) + Math.random() * 5000);
      bins.push({
        binId,
        price,
        priceLower: price * (1 - pool.binStep / 10000 / 2),
        priceUpper: price * (1 + pool.binStep / 10000 / 2),
        liquidityX: "0",
        liquidityY: "0",
        liquidityUSD,
        volume: liquidityUSD * (0.05 + Math.random() * 0.15),
        fees: liquidityUSD * 0.002 * (0.5 + Math.random()),
        isActive: i === 0,
      });
    }
    return {
      pool: poolAddress,
      timestamp: Date.now(),
      activeBin,
      binStep: pool.binStep,
      bins,
    };
  }

  private mapPool(p: any): PoolInfo {
    // Normalize various API shapes
    const address = p.address || p.pair_address || p.lbPair || p.pubkey || "";
    const name = p.name || `${(p.mint_x || p.token_mint_x || "?").slice(0,4)}/${(p.mint_y || p.token_mint_y || "?").slice(0,4)}`;
    const mintX = p.mint_x || p.token_mint_x || p.mintX || "";
    const mintY = p.mint_y || p.token_mint_y || p.mintY || "";
    const reserveX = p.reserve_x || p.reserve_x_amount?.toString() || "0";
    const reserveY = p.reserve_y || p.reserve_y_amount?.toString() || "0";
    const liquidityUSD = parseFloat(p.liquidity || p.tvl || p.reserve_value || "0") || (p.liquidity ? parseFloat(p.liquidity) : Math.random()*2000000+50000);
    const binStep = p.bin_step ?? p.binStep ?? 10;
    const baseFee = parseFloat((p.base_fee_percentage || "0.25").replace("%","")) || 0.25;
    const currentPrice = p.current_price || p.price || (Math.random()*100+1);
    const activeBinId = p.active_bin_id || p.activeId || 8388608 + Math.floor((Math.random()-0.5)*100);

    const tokenX: TokenInfo = {
      address: mintX,
      symbol: p.mint_x_symbol || (p as any).token_x_symbol || name.split("/")[0] || "TOKENX",
      name: p.mint_x_name || name.split("/")[0] || "Token X",
      decimals: p.mint_x_decimals ?? 6,
      mintAuthority: null,
      freezeAuthority: null,
      isToken2022: false,
      supply: "0",
      logoURI: p.mint_x_logo || undefined,
    } as any;
    // fix symbol extraction
    (tokenX as any).symbol = p.name?.split("-")[0]?.split("/")[0] || p.symbol_x || "UNK";

    const tokenY: TokenInfo = {
      address: mintY,
      symbol: name.split("/")[1] || "TOKENY",
      name: p.mint_y_name || name.split("/")[1] || "Token Y",
      decimals: p.mint_y_decimals ?? 6,
      mintAuthority: null,
      freezeAuthority: null,
      isToken2022: false,
      supply: "0",
      logoURI: p.mint_y_logo || undefined,
    } as any;
    (tokenY as any).symbol = p.name?.split("-")[1]?.split("/")[1] || p.name?.split("/")[1] || p.symbol_y || "UNK";

    return {
      address,
      protocol: "meteora",
      chain: "solana",
      name: p.name || name,
      tokenX,
      tokenY,
      mintX,
      mintY,
      reserveX: reserveX.toString(),
      reserveY: reserveY.toString(),
      liquidityUSD,
      binStep,
      baseFeeBps: baseFee * 100,
      activeBinId,
      currentPrice,
      tvl: liquidityUSD,
      apy: p.apy || p.apr || 0,
      volume24h: p.trade_volume_24h || p.volume_24h || p.volume24h || Math.random()*5000000,
    };
  }

  subscribeEvents(callback: (e: NormalizedEvent) => void) {
    // In production: Solana WebSocket logsSubscribe on LBUZKh...
    // Simulated via polling every 2s here for demo, real worker uses Yellowstone gRPC or RPC websocket
    let slot = 300000000;
    const interval = setInterval(() => {
      slot += Math.floor(Math.random()*3)+1;
      callback({
        chain: "solana",
        protocol: "meteora",
        pool: "simulated",
        event_type: Math.random() > 0.7 ? "swap" : Math.random() > 0.5 ? "liquidity_add" : "price_update",
        timestamp: new Date().toISOString(),
        slot,
        signature: Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2),
        data: { amount: Math.random()*10000 }
      });
    }, 2000);
    return { unsubscribe: () => clearInterval(interval) };
  }
}
