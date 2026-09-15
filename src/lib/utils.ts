import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatUSD(n: number): string {
  if (n >= 1_000_000_000) return `$${(n/1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n/1000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `${(n/1000).toFixed(1)}K`;
  return n.toFixed(2);
}
export function formatPercent(n: number, digits=1): string {
  return `${n.toFixed(digits)}%`;
}
export function formatAddress(a: string, chars=4): string {
  if (!a) return "";
  return `${a.slice(0,chars)}...${a.slice(-chars)}`;
}
export function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  if (d < 1000) return `${d}ms ago`;
  if (d < 60000) return `${(d/1000).toFixed(1)}s ago`;
  if (d < 3600000) return `${Math.floor(d/60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d/3600000)}h ago`;
  return `${Math.floor(d/86400000)}d ago`;
}
