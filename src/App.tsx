import { useCallback, useEffect, useMemo, useState } from "react";
import { BOARDS } from "./lib/boards";
import { SEED } from "./lib/seed";
import { loadCards, loadUpdatedAt, saveCards } from "./lib/storage";
import { loadSyncSettings, saveSyncSettings, type RemoteBoard, type SyncSettings } from "./lib/sync";
import type { BoardName, Card, Draft } from "./lib/types";
import { useCardDrag } from "./hooks/useCardDrag";
import { useBoardSync, type BoardState, type SyncStatus } from "./hooks/useBoardSync";
import { Header } from "./components/Header";
import { FilterRow } from "./components/FilterRow";
import { Column } from "./components/Column";
import { PageDots } from "./components/PageDots";
import { DragGhost } from "./components/DragGhost";
import { AddSheet } from "./components/AddSheet";
import { DetailSheet } from "./components/DetailSheet";
import { SyncSheet } from "./components/SyncSheet";

export interface AppProps {
  /** Board shown on load. */
  defaultBoard?: BoardName;
  /** Hide notes on cards. */
  compact?: boolean;
}

type Modal = null | "add" | "detail" | "sync";

const SYNC_LABEL: Record<SyncStatus, string> = {
  off: "Sync",
  syncing: "Syncing…",
  synced: "Synced",
  offline: "Offline",
  error: "Sync error",
};

function initialBoard(): BoardState {
  const cards = loadCards();
  return cards
    ? { cards, updatedAt: loadUpdatedAt(), origin: "initial" }
    : { cards: SEED, updatedAt: "", origin: "initial" };
}

/** Unique, increasing numeric id (ids are numbers in the stored format). */
function nextId(cards: Card[]): number {
  return Math.max(Date.now(), ...cards.map((c) => c.id + 1));
}

export default function App({ defaultBoard = "Reading", compact = false }: AppProps) {
  const [board, setBoard] = useState<BoardName>(defaultBoard);
  const [state, setState] = useState<BoardState>(initialBoard);
  const [syncSettings, setSyncSettings] = useState<SyncSettings | null>(loadSyncSettings);
  const [filter, setFilter] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [selId, setSelId] = useState<number | null>(null);
  const cards = state.cards;

  /** Every local edit goes through here so it gets a fresh timestamp. */
  const setCards = useCallback((fn: (cs: Card[]) => Card[]) => {
    setState((s) => ({ cards: fn(s.cards), updatedAt: new Date().toISOString(), origin: "local" }));
  }, []);
  const applyRemote = useCallback((remote: RemoteBoard) => {
    setState({ cards: remote.cards, updatedAt: remote.updatedAt, origin: "remote" });
  }, []);

  // Persist after the first real change, so the sample seed is not written until touched.
  useEffect(() => {
    if (state.origin !== "initial") saveCards(state.cards, state.updatedAt);
  }, [state]);

  const sync = useBoardSync(syncSettings, state, applyRemote);
  const connectSync = (s: SyncSettings) => {
    saveSyncSettings(s);
    setSyncSettings(s);
  };
  const disconnectSync = () => {
    saveSyncSettings(null);
    setSyncSettings(null);
  };

  const columns = BOARDS[board];
  const mine = useMemo(() => cards.filter((c) => c.board === board), [cards, board]);
  const facets = useMemo(() => [...new Set(mine.flatMap((c) => [c.fandom, c.ship]))].filter(Boolean), [mine]);
  const shown = useMemo(
    () => (filter ? mine.filter((c) => c.fandom === filter || c.ship === filter) : mine),
    [mine, filter],
  );

  const update = useCallback(
    (id: number, patch: Partial<Card>) => {
      setCards((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    },
    [setCards],
  );
  const move = useCallback((id: number, col: string) => update(id, { col }), [update]);
  const remove = useCallback(
    (id: number) => {
      setCards((cs) => cs.filter((c) => c.id !== id));
      setModal(null);
      setSelId(null);
    },
    [setCards],
  );

  const drag = useCardDrag(move);

  const openCard = useCallback(
    (c: Card) => {
      if (drag.clickSuppressed()) return;
      setSelId(c.id);
      setModal("detail");
    },
    [drag],
  );
  const closeModal = useCallback(() => {
    setModal(null);
    setSelId(null);
  }, []);

  const switchBoard = (b: BoardName) => {
    setBoard(b);
    setFilter(null);
  };

  const addCard = (d: Draft, url: string) => {
    const card: Card = {
      id: nextId(cards),
      board,
      col: columns.includes(d.col) ? d.col : (columns[0] ?? ""),
      title: d.title.trim() || "Untitled",
      author: d.author.trim() || "unknown",
      fandom: d.fandom.trim() || "—",
      ship: d.ship.trim() || "Gen",
      words: parseInt(d.words.replace(/[^0-9]/g, ""), 10) || 0,
      notes: d.notes.trim(),
      url,
    };
    setCards((cs) => [...cs, card]);
    closeModal();
  };

  const sel = selId === null ? undefined : cards.find((c) => c.id === selId);

  return (
    <div className="app">
      <Header
        board={board}
        syncLabel={SYNC_LABEL[sync.status]}
        onBoardChange={switchBoard}
        onAdd={() => setModal("add")}
        onSync={() => setModal("sync")}
      />
      <FilterRow facets={facets} filter={filter} onChange={setFilter} />
      <main className="board">
        {columns.map((name, i) => (
          <Column
            key={name}
            name={name}
            index={i}
            cards={shown.filter((c) => c.col === name)}
            compact={compact}
            over={drag.over === name}
            dragId={drag.dragId}
            onPointerDown={drag.onPointerDown}
            onOpen={openCard}
          />
        ))}
      </main>
      <PageDots count={columns.length} />
      {drag.ghost && <DragGhost ghost={drag.ghost} />}
      {modal === "add" && <AddSheet columns={columns} onAdd={addCard} onClose={closeModal} />}
      {modal === "detail" && sel && (
        <DetailSheet card={sel} columns={columns} onUpdate={update} onRemove={remove} onClose={closeModal} />
      )}
      {modal === "sync" && (
        <SyncSheet
          settings={syncSettings}
          status={sync.status}
          message={sync.message}
          cards={cards}
          onSave={connectSync}
          onDisconnect={disconnectSync}
          onSyncNow={() => void sync.syncNow()}
          onImport={(imported) => setCards(() => imported)}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
