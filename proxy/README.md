# AO3 proxy worker

Optional. Lets the deployed Fic Board fill in title, author, fandom, ship and word count from a pasted AO3 link. Without it the add sheet falls back to manual entry.

AO3 sends no CORS headers, so a browser cannot read a work page directly. This Cloudflare Worker forwards `GET /works/<id>` to AO3, adds CORS headers for the origins in `ALLOWED_ORIGINS`, and caches each page for an hour.

## Deploy

Needs a free Cloudflare account.

```sh
cd proxy
npx wrangler login
npx wrangler deploy
```

Wrangler prints the worker URL, for example `https://ao3-kanban-proxy.<account>.workers.dev`.

Then in the GitHub repository: Settings → Secrets and variables → Actions → Variables → add `VITE_AO3_PROXY` with that URL. The next deploy to `main` builds with it.

## Limits

- Only the origins in `wrangler.toml` may call it. Add or change them there and redeploy.
- Only `GET /works/<id>` is proxied. Everything else is a 404.
- Works restricted to logged-in users, and works AO3 hides behind a warning that `view_adult=true` does not cover, come back as a login page. The app then falls back to manual entry.
- Be gentle with AO3. The board makes one request per pasted link, and the cache absorbs repeats.
