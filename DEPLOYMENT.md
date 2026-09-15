# DEPLOYMENT

## Netlify Free (primary)

- Framework: Next.js 16 with `@netlify/plugin-nextjs` (auto-detected).
- `netlify.toml` sets `NODE_VERSION=20`, publish `.next`, includes plugin.
- Netlify handles: frontend, API proxy (`/api/*`), lightweight serverless endpoints.

**Do NOT run a permanent blockchain listener inside Netlify Functions** — they are ephemeral.

## Realtime Worker (separate)

Deploy persistent ingestion as a small Node process elsewhere:

- **Fly.io** (`fly launch` + Dockerfile running `node worker/index.js`)
- **Railway / Render** (background worker service)
- **Helius webhooks** (webhook → your API → Event Bus)

Worker code lives in `src/lib/realtime/RealtimeWorker.ts` (simulated here; prod would use `@solana/web3.js` `onLogs` + Yellowstone gRPC client).

Worker pushes to Redis / DB, Next.js API reads and fans out via SSE.

## Low-Cost / Free-Tier MVP

- Netlify Free (100GB bandwidth, 125k func invocations)
- Neon/Supabase Free PostgreSQL
- Upstash Free Redis
- Public RPC (free) + Helius free tier or Alchemy for streams

All prefer WebSocket streaming + batching + caching + incremental updates over full rescans.

## Env

Set in Netlify dashboard: `SOLANA_RPC_URL`, `DATABASE_URL`, `REDIS_URL`, `INDEXER_API_KEY`. Never commit `.env.local`.

