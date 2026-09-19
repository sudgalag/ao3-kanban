import type { Card } from "./types";
import { isBoardName } from "./boards";

export const STORE_KEY = "ficboard.v1";

function isCard(v: unknown): v is Card {
  if (!v || typeof v !== "object") return false;
  const c = v as Record<string, unknown>;
  return typeof c.id === "number" && isBoardName(c.board) && typeof c.col === "string" && typeof c.title === "string";
}

/** Returns the persisted cards, or null when nothing valid is stored. */
export function loadCards(): Card[] | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
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
  } catch {
    return null;
  }
}

export function saveCards(cards: Card[]): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(cards));
  } catch {
    // Storage may be unavailable (private mode, quota). The board still works in memory.
  }
}
