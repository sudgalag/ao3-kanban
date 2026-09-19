import type { Ghost } from "../hooks/useCardDrag";

export function DragGhost({ ghost }: { ghost: Ghost }) {
  return (
    <div className="ghost" style={{ left: ghost.x, top: ghost.y, width: ghost.w }} aria-hidden="true">
      <div className="card__fandom">{ghost.fandom}</div>
      <div className="card__title">{ghost.title}</div>
      <div className="card__byline">{ghost.byline}</div>
    </div>
  );
}
