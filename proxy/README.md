# Fic Board worker

Optional Cloudflare Worker with two jobs:

1. **AO3 proxy**: lets the deployed board fill in title, author, fandom, ship and word count from a pasted link. AO3 sends no CORS headers, so a browser cannot read a work page directly. The worker forwards `GET /works/<id>`, adds CORS headers for the origins in `ALLOWED_ORIGINS`, and caches each page for an hour. Without it the add sheet falls back to manual entry.
2. **Board sync**: `GET /board` and `PUT /board` store one board per token in Cloudflare KV, so every device with the token sees the same cards.

## Deploy

Needs a free Cloudflare account.

```sh
cd proxy
npx wrangler login
npx wrangler kv namespace create BOARD      # paste the printed id into wrangler.toml
npx wrangler secret put SYNC_TOKEN          # a long random string; this is the board's password
npx wrangler deploy
```

Wrangler prints the worker URL, for example `https://ao3-kanban-proxy.<account>.workers.dev`.

- For AO3 fetching: in the GitHub repository, Settings → Secrets and variables → Actions → Variables → add `VITE_AO3_PROXY` with that URL. The next deploy to `main` builds with it.
- For sync: open the board, press **Sync** in the header, paste the URL and the token, and press Connect. Repeat on each device.

A token generated with `openssl rand -base64 32` is fine. To lock everyone out, run `wrangler secret put SYNC_TOKEN` again with a new value.

## Limits

- Only the origins in `wrangler.toml` may call it. Add or change them there and redeploy.
- Only `GET /works/<id>` is proxied. Everything else is a 404.
- Sync holds one board of at most 1 MB. Anyone with the token can read and replace it; there are no accounts. KV's free tier allows 1,000 writes a day, and the app writes once per pause in editing.
- Works restricted to logged-in users, and works AO3 hides behind a warning that `view_adult=true` does not cover, come back as a login page. The app then falls back to manual entry.
- Be gentle with AO3. The board makes one request per pasted link, and the cache absorbs repeats.
