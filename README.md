# Fic Board

A kanban board for tracking AO3 fanfiction, for someone who both reads and writes.

Two boards, switched by a segmented control:

- **Reading**: Rec'd → To Read → Reading → Finished → Dropped
- **Writing**: Ideas → Drafting → Editing → Posted

Cards hold title, author, fandom, ship, word count and a personal note. Add a fic by pasting an AO3 work URL. Move cards by drag-and-drop (mouse or touch) or from the "Move to" row in the card sheet. Filter by fandom or ship.

## Where your data lives

- **Always**: in the browser's `localStorage` (`ficboard.v1`, plus a timestamp in `ficboard.updatedAt.v1`). Per browser, per device, per site address. Clearing site data removes it.
- **Backup**: the Sync sheet (header button) exports the board as a JSON file and imports one back. Import replaces the whole board.
- **Sync (optional)**: the same sheet takes a worker URL and a token. The board is then stored in Cloudflare KV through the worker in `proxy/`, and every device with the same token sees one board. Last write wins, decided by the timestamp. Local changes are pushed two seconds after you stop editing; the board keeps working offline and catches up when the network returns. See `proxy/README.md` for setup.

## Stack

React 19 + Vite + TypeScript. No UI framework: the app uses the Photo Card Design System (PCDS) tokens, fonts and the six components it needs (`Tabs`, `Button`, `Tag`, `Badge`, `Input`, `Select`), ported from the design handoff into `src/pcds/`.

## Run

Node 22 (see `.nvmrc`).

```sh
npm install
npm run dev          # http://localhost:5173
npm run check        # typecheck + lint + format check + unit tests
npm run test:e2e     # Playwright, builds and serves dist/ first (npx playwright install chromium once)
npm run build        # static site in dist/
npm run format       # prettier --write
```

CI runs the same checks on every pull request and on pushes to `main`.

## Conventions

- TypeScript strict mode with `noUncheckedIndexedAccess`.
- ESLint (typescript-eslint, react-hooks) plus a design-system rule: app code must use the PCDS `Button`, `Input` and `Select` instead of raw `<button>`, `<input>` and `<select>`. Only `src/pcds/` may use the raw elements.
- Prettier formats everything except the vendored PCDS tokens and fonts, which stay verbatim from the handoff.
- Sheets lock page scroll, trap focus, close on Escape and return focus to the opener.
- The sample seed is only written to `localStorage` after the first real change.

## Deploy

Every push to `main` builds the site and publishes it to GitHub Pages at **fic.jianxin.tw** (see `.github/workflows/deploy.yml`). `public/CNAME` documents the hostname, but GitHub ignores that file for Actions-based deploys; the domain is set in the repository settings.

One-time setup:

1. In the repository: Settings → Pages → Source: **GitHub Actions**. This must be done by hand once; the workflow token is not allowed to enable Pages.
2. At the DNS host (Gandi), add a record: `fic` `CNAME` `sudgalag.github.io.` A TTL of 1800 seconds is fine.
3. Settings → Pages → Custom domain: enter `fic.jianxin.tw` and save. GitHub checks DNS, then requests a Let's Encrypt certificate itself; nothing to upload.
4. Once the domain shows a green check and the certificate exists (minutes, sometimes up to an hour), turn on **Enforce HTTPS**.

Optional: deploy the AO3 proxy worker in `proxy/` so "Fetch details" works on the live site. See `proxy/README.md`.

## Fetching AO3 metadata

AO3 has no public API and sends no CORS headers, so a browser cannot read a work page directly.

- **Dev server**: `vite.config.ts` proxies `/ao3/*` to `https://archiveofourown.org`, so "Fetch details" fills in title, author, fandom, ship and word count.
- **Deployed build**: set `VITE_AO3_PROXY` at build time to the base URL of a proxy that forwards `GET <base>/works/<id>` to AO3 and adds CORS headers. `proxy/` contains a ready-made Cloudflare Worker. Without it, the sheet asks you to fill in the details by hand.

Works that are restricted to logged-in users, or hidden behind the adult-content wall in ways `view_adult=true` does not cover, fall back to manual entry as well.

Be gentle with AO3: the app makes one request per pasted link and nothing else.

## Layout

```
src/
  pcds/          design tokens, vendored fonts, ported components
  lib/           board config, formatting, storage, AO3 parsing, first-run seed
  hooks/         useCardDrag — pointer-event drag, touch pan, auto-scroll
  components/    Header, FilterRow, Column, FicCard, DragGhost, sheets
  App.tsx        state: board, cards, filter, open sheet
e2e/             Playwright tests (desktop and mobile profiles)
```

`App` takes two optional props: `defaultBoard` (`"Reading"` | `"Writing"`) and `compact` (hides notes on cards).

## First run

With nothing in `localStorage`, the board shows eleven sample cards from the design so the layout has something to render. Remove them from the card sheet or clear `ficboard.v1` in dev tools; the seed lives in `src/lib/seed.ts`.
