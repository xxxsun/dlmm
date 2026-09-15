import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Proxy to Meteora DLMM datapi with risk overlay
// GET /api/trending?sort=volume_24h:desc&limit=20
// sort options: volume_24h:desc, fee_tvl_ratio_24h:desc, tvl:desc, fee_24h:desc
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") || "volume_24h:desc";
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
  const page = parseInt(searchParams.get("page") || "1");

  const target = `https://dlmm.datapi.meteora.ag/pools?page=${page}&page_size=${limit}&sort_by=${encodeURIComponent(sort)}`;

  try {
    const res = await fetch(target, { next: { revalidate: 15 }, headers: { "accept": "application/json" } });
    if (!res.ok) throw new Error(`datapi ${res.status}`);
    const data = await res.json();
    const poolsRaw = Array.isArray(data) ? data : data.pools || data.data || data.pairs || [];
    const enriched = poolsRaw.slice(0, limit).map((p: any, idx: number) => {
      const tvl = parseFloat(p.tvl ?? p.liquidity ?? p.active_tvl ?? p.reserve_value ?? "0");
      const volume24h = parseFloat(p.volume_24h ?? p.volume_1d ?? p.trade_volume_24h ?? "0");
      const fee24h = parseFloat(p.fee_24h ?? p.fees_24h ?? p.fees_1d ?? "0");
      const feeTvlRatio = tvl > 0 ? (fee24h / tvl) * 100 : 0;
      const volTvlRatio = tvl > 0 ? volume24h / tvl : 0;
      const ageHours = p.pool_created_at ? (Date.now() - new Date(p.pool_created_at).getTime()) / 3600000 : 720;
      let risk = 18;
      if (tvl < 15000) risk += 35;
      else if (tvl < 50000) risk += 18;
      if (fee24h < 50) risk += 10;
      if (ageHours < 24) risk += 20;
      else if (ageHours < 72) risk += 10;
      const top10 = p.top_10_holders_pct ?? null;
      if (top10 !== null && top10 > 40) risk += (top10 - 40) * 0.6;
      if (top10 !== null && top10 > 85) risk += 15;
      const securityScore = Math.max(0, 100 - risk - (top10 ? (top10 - 20) * 0.3 : 0));
      const feeOpp = Math.min(95, feeTvlRatio * 400 + 45);
      const raw = feeOpp * 0.25 + 70 * 0.75;
      const riskAdjusted = Math.max(0, Math.min(100, raw - risk * 0.35));
      let state: string = "WATCH";
      if (tvl < 5000 || (top10 !== null && top10 > 90)) state = "REJECTED";
      else if (riskAdjusted >= 75 && risk < 28) state = "STRONG_OPPORTUNITY";
      else if (riskAdjusted >= 62 && risk < 40) state = "RECOMMENDED";
      else if (risk >= 60) state = "HIGH_RISK";
      else if (risk >= 40) state = "INVESTIGATE";
      return {
        _raw: p,
        address: p.address ?? p.pool_address ?? p.pair_address ?? p.id ?? `unknown-${idx}`,
        name: p.name ?? p.pool_name ?? `${(p.mint_x_symbol || p.token_x_symbol || "?")}/${(p.mint_y_symbol || p.token_y_symbol || "?")}`,
        tvl, volume24h, fee24h, feeTvlRatio, volTvlRatio,
        binStep: p.bin_step ?? p.binStep ?? 20,
        baseFee: p.base_fee_pct ?? p.fee_pct ?? null,
        price: p.price ?? p.current_price ?? null,
        marketCap: p.market_cap ?? null,
        ageHours, traders: p.traders ?? p.num_traders ?? null,
        swaps: p.swaps ?? p.num_swaps ?? null,
        top10Holders: top10,
        riskScore: Math.round(risk),
        feeOpp: Math.round(feeOpp),
        securityScore: Math.round(securityScore),
        riskAdjustedScore: Math.round(riskAdjusted * 10) / 10,
        recommendationState: state,
        isTrending: true,
        source: "dlmm.datapi.meteora.ag",
      };
    });
    return NextResponse.json({
      data: enriched,
      meta: { sort, limit, page, source: "dlmm.datapi.meteora.ag", fetchedAt: new Date().toISOString() },
    }, { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to fetch trending from Meteora datapi", detail: e.message }, { status: 502 });
  }
}
