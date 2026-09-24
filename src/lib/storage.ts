import type { Card } from "./types";
import { isBoardName } from "./boards";

export const STORE_KEY = "ficboard.v1";
export const UPDATED_KEY = "ficboard.updatedAt.v1";

export function isCard(v: unknown): v is Card {
  if (!v || typeof v !== "object") return false;
  const c = v as Record<string, unknown>;
  return typeof c.id === "number" && isBoardName(c.board) && typeof c.col === "string" && typeof c.title === "string";
}

/** Keeps only well-formed cards and fills in missing optional fields. Returns null when the input is not an array. */
export function normalizeCards(parsed: unknown): Card[] | null {
  if (!Array.isArray(parsed)) return null;
  return parsed.filter(isCard).map((c) => ({
    ...c,
    author: c.author ?? "",
    fandom: c.fandom ?? "",
    ship: c.ship ?? "",
    words: typeof c.words === "number" ? c.words : 0,
    notes: c.notes ?? "",
    url: c.url ?? "",
  }));
}

/** Returns the persisted cards, or null when nothing valid is stored. */
export function loadCards(): Card[] | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    return normalizeCards(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** ISO timestamp of the last local change, or "" when unknown. */
export function loadUpdatedAt(): string {
  try {
    return localStorage.getItem(UPDATED_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveCards(cards: Card[], updatedAt: string): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(cards));
    localStorage.setItem(UPDATED_KEY, updatedAt);
  } catch {
    // Storage may be unavailable (private mode, quota). The board still works in memory.
  }
}

/** Backup file format. */
export interface BoardExport {
  version: 1;
  exportedAt: string;
  cards: Card[];
}

export function serializeExport(cards: Card[], now = new Date()): string {
  const data: BoardExport = { version: 1, exportedAt: now.toISOString(), cards };
  return JSON.stringify(data, null, 2);
}

/** Parses a backup file (or a bare card array). Returns null when nothing usable is inside. */
export function parseImport(text: string): Card[] | null {
  try {
    const parsed: unknown = JSON.parse(text);
    const list = Array.isArray(parsed) ? parsed : (parsed as { cards?: unknown } | null)?.cards;
    const cards = normalizeCards(list);
    return cards && cards.length > 0 ? cards : null;
  } catch {
    return null;
  }
}
