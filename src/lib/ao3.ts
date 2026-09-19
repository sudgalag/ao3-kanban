/** AO3 work-link parsing and metadata fetching. */

export interface WorkMeta {
  title: string;
  author: string;
  fandom: string;
  ship: string;
  words: number;
}

const WORK_RE = /archiveofourown\.org\/works\/(\d+)/;

/** Returns the numeric work ID from an AO3 work URL, or null when the link is not a work link. */
export function parseWorkId(url: string): string | null {
  const m = url.trim().match(WORK_RE);
  return m ? m[1] : null;
}

/** Canonical work URL for a work ID. */
export function workUrl(id: string): string {
  return `https://archiveofourown.org/works/${id}`;
}

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();

/**
 * Extracts metadata from an AO3 work page. Returns null when the HTML is not a
 * work page (login wall, "restricted" notice, error page, ...).
 */
export function parseWorkHtml(html: string): WorkMeta | null {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const titleEl = doc.querySelector("#workskin h2.title") ?? doc.querySelector("h2.title.heading");
  const title = text(titleEl);
  if (!title) return null;

  const authorLinks = [...doc.querySelectorAll("#workskin h3.byline a[rel='author']")];
  const author = authorLinks.length ? authorLinks.map(text).join(", ") : text(doc.querySelector("#workskin h3.byline")) || "Anonymous";

  const fandom = text(doc.querySelector("dd.fandom.tags a.tag"));
  const ship = text(doc.querySelector("dd.relationship.tags a.tag"));
  const words = parseInt(text(doc.querySelector("dd.words")).replace(/[^0-9]/g, ""), 10) || 0;

  return { title, author, fandom, ship, words };
}

/**
 * Base URL that proxies to archiveofourown.org. AO3 sends no CORS headers, so
 * the browser cannot read the page directly. The Vite dev server proxies
 * /ao3 → archiveofourown.org; for a deployed build set VITE_AO3_PROXY.
 */
export function proxyBase(): string | null {
  const env = import.meta.env.VITE_AO3_PROXY as string | undefined;
  if (env) return env.replace(/\/$/, "");
  return import.meta.env.DEV ? "/ao3" : null;
}

/** Fetches work metadata through the proxy. Resolves null when unavailable. */
export async function fetchWorkMeta(id: string, signal?: AbortSignal): Promise<WorkMeta | null> {
  const base = proxyBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/works/${id}?view_adult=true`, { signal, credentials: "omit" });
    if (!res.ok) return null;
    return parseWorkHtml(await res.text());
  } catch {
    return null;
  }
}
