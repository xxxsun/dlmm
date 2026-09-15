import { NextRequest, NextResponse } from "next/server";
import { SecurityEngine } from "@/lib/engines/SecurityEngine";
export const dynamic="force-dynamic";
export async function GET(req: NextRequest, { params }: { params: Promise<{address:string}>}) {
  const { address } = await params;
  const security = SecurityEngine.analyzeToken({ mintAuthority: Math.random()<0.12?"Active":null, freezeAuthority: Math.random()<0.08?"Active":null, tokenProgram:"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", isToken2022: Math.random()<0.18, extensions: Math.random()<0.18?["transferFee"]: [], holderTop10: 28+Math.random()*15, holderTop20: 42+Math.random()*12, liquidity: 850000+Math.random()*800000, liquidityChange1h: (Math.random()-0.5)*8 });
  return NextResponse.json({ pool: address, security, holderAnalysis:{ top5: security.holderTop5, top10: security.holderTop10, top20: security.holderTop20, adjustedTop10: security.adjustedHolderTop10 }, token2022: security.isToken2022 ? { extensions: security.token2022Extensions, dangerous: security.dangerousExtensions, explanations: security.dangerousExtensions.map(SecurityEngine.explainExtension)} : null, timestamp: new Date().toISOString() });
}
