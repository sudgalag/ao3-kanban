/**
 * Cloudflare Worker for the Fic Board.
 *
 * Routes (all require an Origin listed in ALLOWED_ORIGINS):
 *   GET  /works/<id>   Narrow proxy to an AO3 work page, cached for an hour.
 *   GET  /board        The synced board, as {cards, updatedAt}. Requires the token.
 *   PUT  /board        Replace the synced board. Requires the token.
 *
 * Token: "Authorization: Bearer <SYNC_TOKEN>". Set it with `wrangler secret put SYNC_TOKEN`.
 * Storage: the BOARD KV namespace (see wrangler.toml).
 *
 * Deploy: cd proxy && npx wrangler deploy
 */

interface Env {
  ALLOWED_ORIGINS: string;
  SYNC_TOKEN?: string;
  BOARD?: KVNamespace;
}

// Minimal KV surface so this file needs no @cloudflare/workers-types.
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

const WORK_PATH = /^\/works\/(\d+)\/?$/;
const CACHE_SECONDS = 3600;
const BOARD_KEY = "board";
const MAX_BOARD_BYTES = 1_000_000;

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(origin: string, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/** Constant-time string comparison. */
function sameToken(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function proxyWork(origin: string, id: string): Promise<Response> {
  const upstream = new Request(`https://archiveofourown.org/works/${id}?view_adult=true`, {
    headers: { "User-Agent": "ao3-kanban-proxy (+https://github.com/sudgalag/ao3-kanban)", Accept: "text/html" },
    cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true },
  } as RequestInit);
  const res = await fetch(upstream);
  const headers = new Headers(corsHeaders(origin));
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", `public, max-age=${CACHE_SECONDS}`);
  return new Response(res.body, { status: res.status, headers });
}

async function board(request: Request, env: Env, origin: string): Promise<Response> {
  if (!env.SYNC_TOKEN || !env.BOARD) return json(origin, 503, { error: "sync not configured" });
  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !sameToken(token, env.SYNC_TOKEN)) return json(origin, 401, { error: "bad token" });

  if (request.method === "GET") {
    const stored = await env.BOARD.get(BOARD_KEY);
    if (stored === null) return json(origin, 404, { error: "no board yet" });
    return new Response(stored, {
      status: 200,
      headers: {
        ...corsHeaders(origin),
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  if (request.method === "PUT") {
    const length = Number(request.headers.get("Content-Length") ?? "0");
    if (length > MAX_BOARD_BYTES) return json(origin, 413, { error: "board too large" });
    let body: { cards?: unknown; updatedAt?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return json(origin, 400, { error: "invalid JSON" });
    }
    if (!Array.isArray(body.cards) || typeof body.updatedAt !== "string") {
      return json(origin, 400, { error: "expected {cards: [], updatedAt: string}" });
    }
    const value = JSON.stringify({ cards: body.cards, updatedAt: body.updatedAt });
    if (value.length > MAX_BOARD_BYTES) return json(origin, 413, { error: "board too large" });
    await env.BOARD.put(BOARD_KEY, value);
    return json(origin, 200, { updatedAt: body.updatedAt });
  }

  return json(origin, 405, { error: "method not allowed" });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";
    const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
    if (!allowed.includes(origin)) return new Response("Forbidden", { status: 403 });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });

    const url = new URL(request.url);
    if (url.pathname === "/board") return board(request, env, origin);

    const m = url.pathname.match(WORK_PATH);
    if (m && request.method === "GET") return proxyWork(origin, m[1]!);

    return new Response("Not found", { status: 404, headers: corsHeaders(origin) });
  },
};
