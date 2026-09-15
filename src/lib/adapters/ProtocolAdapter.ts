import { PoolInfo, BinSnapshot, NormalizedEvent } from "../types";

// Abstract adapter for any DLMM/CLMM protocol
export abstract class ProtocolAdapter {
  abstract protocol: string;
  abstract programId: string;
  abstract apiBaseUrl: string;

  abstract discoverPools(limit?: number, offset?: number): Promise<PoolInfo[]>;
  abstract getPool(address: string): Promise<PoolInfo | null>;
  abstract getBinSnapshot(poolAddress: string, count?: number): Promise<BinSnapshot>;
  subscribeEvents?(callback: (e: NormalizedEvent) => void): { unsubscribe: () => void } { throw new Error("not implemented"); }
  fetchOHLCV?(pool: string, interval: string, limit?: number): Promise<any[]> { return Promise.resolve([]); }
  fetchVolumeHistory?(pool: string): Promise<any> { return Promise.resolve(null); }
}

// Helpers
export function binIdToPrice(binId: number, binStep: number, decimalsX: number, decimalsY: number): number {
  // Meteora DLMM price formula: price = (1 + binStep/10000) ^ (binId - 8388608)
  // Simplified: need decimals adjustment
  const base = 1 + binStep / 10000;
  const exponent = binId - 8388608;
  const raw = Math.pow(base, exponent);
  const decimalAdjust = Math.pow(10, decimalsX - decimalsY);
  return raw * decimalAdjust;
}

export function priceToBinId(price: number, binStep: number, decimalsX: number, decimalsY: number): number {
  const decimalAdjust = Math.pow(10, decimalsX - decimalsY);
  const raw = price / decimalAdjust;
  const base = 1 + binStep / 10000;
  return Math.round(Math.log(raw) / Math.log(base) + 8388608);
}
