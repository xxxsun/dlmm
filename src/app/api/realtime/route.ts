import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// SSE endpoint for realtime updates - emits pool_update, risk_update, ranking_update etc.
// In production, this proxies Yellowstone gRPC / RPC websocket. Here we simulate with randomized deltas.
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Initial hello
      send({ type: "connected", timestamp: new Date().toISOString(), slot: 310000123, message: "Realtime feed connected (SSE). In production: Yellowstone gRPC + logsSubscribe on LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo" });

      let cnt = 0;
      const intervals: NodeJS.Timeout[] = [];

      // Price/pool updates every 1.5s
      intervals.push(setInterval(()=> {
        cnt++;
        const poolIdx = Math.floor(Math.random()*8)+1;
        send({
          type: "pool_update",
          pool: `DLMM00${poolIdx}`,
          price: 145 + Math.sin(cnt/5)*2 + (Math.random()-0.5)*0.8,
          liquidity: 800000 + Math.random()*600000,
          volume1h: 120000 + Math.random()*400000,
          slot: 310000123 + cnt,
          timestamp: new Date().toISOString(),
        });
      }, 1500));

      // Fee update every 3s
      intervals.push(setInterval(()=>{
        send({
          type: "fee_update",
          pool: `DLMM00${Math.floor(Math.random()*5)+1}`,
          fee1h: 400 + Math.random()*2000,
          fee24h: 4000 + Math.random()*8000,
          source: "onchain+api",
          timestamp: new Date().toISOString(),
        });
      }, 3000));

      // Risk update every 7s - sometimes critical
      intervals.push(setInterval(()=>{
        if (Math.random() < 0.35) {
          const isCritical = Math.random() < 0.3;
          send({
            type: "risk_update",
            pool: isCritical ? "DLMM007" : `DLMM00${Math.floor(Math.random()*6)+1}`,
            old_score: 22,
            new_score: isCritical ? 68 : 28 + Math.floor(Math.random()*20),
            reason: isCritical ? "liquidity_withdrawal" : "volume_anomaly",
            severity: isCritical ? "critical" : "warning",
            timestamp: new Date().toISOString(),
          });
        }
      }, 7000));

      // Ranking update every 5s
      intervals.push(setInterval(()=>{
        if (Math.random() < 0.5) {
          send({
            type: "ranking_update",
            changes: [
              { pool: "DLMM002", from: 3, to: 1, score: 91.2 },
              { pool: "DLMM001", from: 1, to: 2, score: 89.4 },
            ],
            timestamp: new Date().toISOString(),
          });
        }
      }, 5000));

      // Security alert rarely
      intervals.push(setInterval(()=>{
        if (Math.random() < 0.12) {
          send({
            type: "security_alert",
            pool: "HONEYPOT/USDC",
            title: "Transfer hook detected",
            message: "Token-2022 transferHook may block sells - inspect before LP",
            severity: "warning",
            timestamp: new Date().toISOString(),
          });
        }
      }, 10000));

      // Heartbeat
      intervals.push(setInterval(()=>{
        send({ type: "heartbeat", timestamp: new Date().toISOString(), slot: 310000123 + cnt });
      }, 15000));

      req.signal.addEventListener("abort", ()=>{
        intervals.forEach(clearInterval);
        try { controller.close(); } catch {}
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
