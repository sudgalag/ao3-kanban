import { Badge, Button, Input, Tag } from "../pcds";
import { byline, fmtWords, shipTone } from "../lib/format";
import type { Card } from "../lib/types";
import { Sheet } from "./Sheet";

interface Props {
  card: Card;
  columns: readonly string[];
  onUpdate: (id: number, patch: Partial<Card>) => void;
  onRemove: (id: number) => void;
  onClose: () => void;
}

export function DetailSheet({ card, columns, onUpdate, onRemove, onClose }: Props) {
  return (
    <Sheet onClose={onClose} label={card.title}>
      <div className="detail__head">
        <div className="detail__meta">
          {card.fandom} · {fmtWords(card.words)}
        </div>
        <div className="detail__title">{card.title}</div>
        <div className="detail__byline">{byline(card.author)}</div>
        <div className="detail__badge">
          <Badge tone={shipTone(card.ship)} label={card.ship} />
        </div>
      </div>
      <Input
        label="Notes"
        placeholder="Add a note…"
        value={card.notes}
        onChange={(v) => onUpdate(card.id, { notes: v })}
      />
      <div className="detail__move">
        <div className="eyebrow">Move to</div>
        <div className="detail__move-row">
          {columns.map((name) => (
            <Tag
              key={name}
              label={name}
              selected={card.col === name}
              onClick={() => onUpdate(card.id, { col: name })}
            />
          ))}
        </div>
      </div>
      <div className="detail__foot">
        <Button variant="ghost" size="sm" label="Remove" onClick={() => onRemove(card.id)} />
        <div className="detail__foot-right">
          {card.url && (
            <a className="ao3-link" href={card.url} target="_blank" rel="noopener noreferrer">
              Open on AO3 ↗
            </a>
          )}
          <Button variant="primary" size="sm" label="Done" onClick={onClose} />
        </div>
      </div>
    </Sheet>
  );
}
