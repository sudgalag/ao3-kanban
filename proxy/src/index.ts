/**
 * Cloudflare Worker: a narrow proxy so the Fic Board can read AO3 work pages
 * from the browser. AO3 sends no CORS headers, so the browser cannot fetch
 * them directly.
 *
 * It only answers GET /works/<id>, only for origins listed in ALLOWED_ORIGINS,
 * and caches each page for an hour so repeated pastes do not hit AO3 again.
 *
 * Deploy: cd proxy && npx wrangler deploy
 * Then set the repository variable VITE_AO3_PROXY to the worker URL.
 */

interface Env {
  ALLOWED_ORIGINS: string;
}

const WORK_PATH = /^\/works\/(\d+)\/?$/;
const CACHE_SECONDS = 3600;

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";
    const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
    if (!allowed.includes(origin)) return new Response("Forbidden", { status: 403 });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });

    const url = new URL(request.url);
    const m = url.pathname.match(WORK_PATH);
    if (!m) return new Response("Not found", { status: 404, headers: corsHeaders(origin) });

    const upstream = new Request(`https://archiveofourown.org/works/${m[1]}?view_adult=true`, {
      headers: { "User-Agent": "ao3-kanban-proxy (+https://github.com/sudgalag/ao3-kanban)", Accept: "text/html" },
      cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true },
    } as RequestInit);
    const res = await fetch(upstream);

    const headers = new Headers(corsHeaders(origin));
    headers.set("Content-Type", "text/html; charset=utf-8");
    headers.set("Cache-Control", `public, max-age=${CACHE_SECONDS}`);
    return new Response(res.body, { status: res.status, headers });
  },
};
