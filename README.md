# Fic Board

A kanban board for tracking AO3 fanfiction, for someone who both reads and writes.

Two boards, switched by a segmented control:

- **Reading**: Rec'd → To Read → Reading → Finished → Dropped
- **Writing**: Ideas → Drafting → Editing → Posted

Cards hold title, author, fandom, ship, word count and a personal note. Add a fic by pasting an AO3 work URL. Move cards by drag-and-drop (mouse or touch) or from the "Move to" row in the card sheet. Filter by fandom or ship. Everything is saved in `localStorage` under the key `ficboard.v1`.

## Stack

React 19 + Vite + TypeScript. No UI framework: the app uses the Photo Card Design System (PCDS) tokens, fonts and the six components it needs (`Tabs`, `Button`, `Tag`, `Badge`, `Input`, `Select`), ported from the design handoff into `src/pcds/`.

## Run

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # vitest
npm run typecheck
npm run build      # static site in dist/
```

## Fetching AO3 metadata

AO3 has no public API and sends no CORS headers, so a browser cannot read a work page directly.

- **Dev server**: `vite.config.ts` proxies `/ao3/*` to `https://archiveofourown.org`, so "Fetch details" fills in title, author, fandom, ship and word count.
- **Deployed build**: set `VITE_AO3_PROXY` at build time to the base URL of a proxy that forwards `GET <base>/works/<id>` to AO3 and adds CORS headers (for example a small Cloudflare Worker). Without it, the sheet asks you to fill in the details by hand.

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
```

`App` takes two optional props: `defaultBoard` (`"Reading"` | `"Writing"`) and `compact` (hides notes on cards).

## First run

With nothing in `localStorage`, the board shows eleven sample cards from the design so the layout has something to render. Remove them from the card sheet or clear `ficboard.v1` in dev tools; the seed lives in `src/lib/seed.ts`.
