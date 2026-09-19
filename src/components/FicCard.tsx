import type { KeyboardEvent, PointerEvent } from "react";
import { Badge } from "../pcds";
import { byline, fmtWords, shipTone } from "../lib/format";
import type { Card } from "../lib/types";

interface Props {
  card: Card;
  compact: boolean;
  dragging: boolean;
  onPointerDown: (e: PointerEvent<HTMLElement>, card: Card) => void;
  onOpen: (card: Card) => void;
}

export function FicCard({ card, compact, dragging, onPointerDown, onOpen }: Props) {
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(card);
    }
  };
  return (
    <article
      className={"card" + (dragging ? " card--dragging" : "")}
      role="button"
      tabIndex={0}
      aria-label={`${card.title} by ${card.author}`}
      onPointerDown={(e) => onPointerDown(e, card)}
      onClick={() => onOpen(card)}
      onKeyDown={onKey}
    >
      <div className="card__fandom">{card.fandom}</div>
      <div className="card__title">{card.title}</div>
      <div className="card__byline">{byline(card.author)}</div>
      <div className="card__foot">
        <Badge tone={shipTone(card.ship)} label={card.ship} />
        <span className="card__words">{fmtWords(card.words)}</span>
      </div>
      {!compact && card.notes && <div className="card__note">{card.notes}</div>}
    </article>
  );
}
