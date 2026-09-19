import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BOARDS } from "./lib/boards";
import { SEED } from "./lib/seed";
import { loadCards, saveCards } from "./lib/storage";
import type { BoardName, Card, Draft } from "./lib/types";
import { useCardDrag } from "./hooks/useCardDrag";
import { Header } from "./components/Header";
import { FilterRow } from "./components/FilterRow";
import { Column } from "./components/Column";
import { PageDots } from "./components/PageDots";
import { DragGhost } from "./components/DragGhost";
import { AddSheet } from "./components/AddSheet";
import { DetailSheet } from "./components/DetailSheet";

export interface AppProps {
  /** Board shown on load. */
  defaultBoard?: BoardName;
  /** Hide notes on cards. */
  compact?: boolean;
}

type Modal = null | "add" | "detail";

/** Unique, increasing numeric id (ids are numbers in the stored format). */
function nextId(cards: Card[]): number {
  return Math.max(Date.now(), ...cards.map((c) => c.id + 1));
}

export default function App({ defaultBoard = "Reading", compact = false }: AppProps) {
  const [board, setBoard] = useState<BoardName>(defaultBoard);
  const [cards, setCards] = useState<Card[]>(() => loadCards() ?? SEED);
  const initialCards = useRef(cards);
  const [filter, setFilter] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [selId, setSelId] = useState<number | null>(null);

  // Persist after the first real change, so the sample seed is not written until touched.
  useEffect(() => {
    if (cards !== initialCards.current) saveCards(cards);
  }, [cards]);

  const columns = BOARDS[board];
  const mine = useMemo(() => cards.filter((c) => c.board === board), [cards, board]);
  const facets = useMemo(() => [...new Set(mine.flatMap((c) => [c.fandom, c.ship]))].filter(Boolean), [mine]);
  const shown = useMemo(
    () => (filter ? mine.filter((c) => c.fandom === filter || c.ship === filter) : mine),
    [mine, filter],
  );

  const update = useCallback((id: number, patch: Partial<Card>) => {
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);
  const move = useCallback((id: number, col: string) => update(id, { col }), [update]);
  const remove = useCallback((id: number) => {
    setCards((cs) => cs.filter((c) => c.id !== id));
    setModal(null);
    setSelId(null);
  }, []);

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
      <Header board={board} onBoardChange={switchBoard} onAdd={() => setModal("add")} />
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
    </div>
  );
}
