/**
 * Optional sync with the Cloudflare Worker in proxy/ (GET/PUT /board).
 * One board per token. Last write wins, decided by `updatedAt`.
 */
import type { Card } from "./types";
import { normalizeCards } from "./storage";

export const SYNC_SETTINGS_KEY = "ficboard.sync.v1";

export interface SyncSettings {
  /** Worker base URL, e.g. https://ao3-kanban-proxy.example.workers.dev */
  url: string;
  token: string;
}

export interface RemoteBoard {
  cards: Card[];
  updatedAt: string;
}

export function loadSyncSettings(): SyncSettings | null {
  try {
    const raw = localStorage.getItem(SYNC_SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SyncSettings>;
    if (typeof parsed.url !== "string" || typeof parsed.token !== "string") return null;
    return parsed.url && parsed.token ? { url: parsed.url, token: parsed.token } : null;
  } catch {
    return null;
  }
}

export function saveSyncSettings(settings: SyncSettings | null): void {
  try {
    if (settings) localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(settings));
    else localStorage.removeItem(SYNC_SETTINGS_KEY);
  } catch {
    // ignore
  }
}

/** Normalises a pasted worker URL: trims, strips a trailing slash and a trailing /board. */
export function normalizeSyncUrl(url: string): string {
  return url
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/board$/, "");
}

export class SyncError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "SyncError";
  }
}

function headers(settings: SyncSettings, json = false): HeadersInit {
  const h: Record<string, string> = { Authorization: `Bearer ${settings.token}` };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function explain(res: Response): Promise<SyncError> {
  if (res.status === 401 || res.status === 403) return new SyncError("The sync token was rejected.", res.status);
  if (res.status === 503) return new SyncError("Sync is not configured on the worker.", res.status);
  return new SyncError(`Sync failed (HTTP ${res.status}).`, res.status);
}

/** Fetches the remote board. Resolves null when the worker has nothing stored yet. */
export async function fetchRemoteBoard(settings: SyncSettings, signal?: AbortSignal): Promise<RemoteBoard | null> {
  const res = await fetch(`${settings.url}/board`, { headers: headers(settings), signal });
  if (res.status === 404) return null;
  if (!res.ok) throw await explain(res);
  const body = (await res.json()) as { cards?: unknown; updatedAt?: unknown };
  const cards = normalizeCards(body.cards);
  if (!cards || typeof body.updatedAt !== "string") throw new SyncError("The remote board is malformed.");
  return { cards, updatedAt: body.updatedAt };
}

export async function pushRemoteBoard(settings: SyncSettings, board: RemoteBoard, signal?: AbortSignal): Promise<void> {
  const res = await fetch(`${settings.url}/board`, {
    method: "PUT",
    headers: headers(settings, true),
    body: JSON.stringify(board),
    signal,
  });
  if (!res.ok) throw await explain(res);
}

/** True when `a` is a strictly newer ISO timestamp than `b`. Empty strings sort oldest. */
export function isNewer(a: string, b: string): boolean {
  return a > b;
}
