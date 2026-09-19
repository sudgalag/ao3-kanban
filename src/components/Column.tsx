import type { PointerEvent } from "react";
import { DOTS, EMPTY_COPY } from "../lib/boards";
import type { Card } from "../lib/types";
import { FicCard } from "./FicCard";

interface Props {
  name: string;
  index: number;
  cards: Card[];
  compact: boolean;
  over: boolean;
  dragId: number | null;
  onPointerDown: (e: PointerEvent<HTMLElement>, card: Card) => void;
  onOpen: (card: Card) => void;
}

export function Column({ name, index, cards, compact, over, dragId, onPointerDown, onOpen }: Props) {
  return (
    <section className={"column" + (over ? " column--over" : "")} data-col={name} aria-label={name}>
      <div className="column__head">
        <div className="column__label">
          <span className="column__dot" style={{ background: DOTS[index % DOTS.length] }} />
          <span className="column__name">{name}</span>
        </div>
        <span className="column__count">{cards.length}</span>
      </div>
      {cards.map((c) => (
        <FicCard key={c.id} card={c} compact={compact} dragging={dragId === c.id} onPointerDown={onPointerDown} onOpen={onOpen} />
      ))}
      {cards.length === 0 && <div className="column__empty">{EMPTY_COPY[name] ?? "Empty."}</div>}
    </section>
  );
}
