import { NextResponse } from "next/server";
import { generateMockSystemStatus } from "@/lib/data/mockData";
export const dynamic = "force-dynamic";
export async function GET() {
  const status = generateMockSystemStatus();
  // Occasionally simulate degraded
  if (Math.random() < 0.05) status.rpcStatus = "degraded";
  return NextResponse.json({ ...status, timestamp: new Date().toISOString(), slot: 310000000 + Math.floor(Math.random()*100000) });
}
