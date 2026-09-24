import { useCallback, useEffect, useRef, useState } from "react";
import type { Card } from "../lib/types";
import {
  fetchRemoteBoard,
  isNewer,
  pushRemoteBoard,
  SyncError,
  type RemoteBoard,
  type SyncSettings,
} from "../lib/sync";

export type SyncStatus = "off" | "syncing" | "synced" | "offline" | "error";

export interface BoardState {
  cards: Card[];
  updatedAt: string;
  /** Where the current value came from. Only "local" changes are pushed. */
  origin: "initial" | "local" | "remote";
}

const PUSH_DELAY_MS = 2000;

function describe(e: unknown): { status: SyncStatus; message: string } {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { status: "offline", message: "You are offline." };
  if (e instanceof SyncError) return { status: "error", message: e.message };
  if (e instanceof TypeError) return { status: "offline", message: "Could not reach the sync worker." };
  return { status: "error", message: "Sync failed." };
}

/**
 * Keeps the board in step with the worker. On connect and on reconnect it
 * compares timestamps and lets the newer side win. Local changes are pushed
 * after a short pause.
 */
export function useBoardSync(
  settings: SyncSettings | null,
  board: BoardState,
  applyRemote: (remote: RemoteBoard) => void,
) {
  // `phase` is only written from the async sync flows; "off" is derived from the settings.
  const [phase, setStatus] = useState<SyncStatus>("syncing");
  const [message, setMessage] = useState<string | null>(null);
  const boardRef = useRef(board);
  const applyRef = useRef(applyRemote);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);
  useEffect(() => {
    applyRef.current = applyRemote;
  }, [applyRemote]);

  const push = useCallback(async () => {
    if (!settings) return;
    const { cards, updatedAt } = boardRef.current;
    setStatus("syncing");
    try {
      await pushRemoteBoard(settings, { cards, updatedAt });
      setStatus("synced");
      setMessage(null);
    } catch (e) {
      const d = describe(e);
      setStatus(d.status);
      setMessage(d.message);
    }
  }, [settings]);

  const reconcile = useCallback(async () => {
    if (!settings) return;
    setStatus("syncing");
    try {
      const remote = await fetchRemoteBoard(settings);
      const local = boardRef.current;
      if (remote && isNewer(remote.updatedAt, local.updatedAt)) {
        applyRef.current(remote);
        setStatus("synced");
        setMessage(null);
      } else if (!remote || isNewer(local.updatedAt, remote.updatedAt)) {
        if (local.updatedAt) await pushRemoteBoard(settings, { cards: local.cards, updatedAt: local.updatedAt });
        setStatus("synced");
        setMessage(null);
      } else {
        setStatus("synced");
        setMessage(null);
      }
    } catch (e) {
      const d = describe(e);
      setStatus(d.status);
      setMessage(d.message);
    }
  }, [settings]);

  // Connect (and re-connect when the settings change). Deferred a tick so the
  // status update happens outside the effect itself.
  useEffect(() => {
    if (!settings) return;
    const id = setTimeout(() => void reconcile(), 0);
    return () => clearTimeout(id);
  }, [settings, reconcile]);

  // Push local changes after a pause.
  useEffect(() => {
    if (!settings || board.origin !== "local") return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void push();
    }, PUSH_DELAY_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [settings, board, push]);

  // Retry when the network comes back.
  useEffect(() => {
    if (!settings) return;
    const onOnline = () => void reconcile();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [settings, reconcile]);

  const status: SyncStatus = settings ? phase : "off";
  return { status, message: settings ? message : null, syncNow: reconcile };
}
