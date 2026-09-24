import { Button, Tabs } from "../pcds";
import { BOARD_NAMES, TAGLINE, isBoardName } from "../lib/boards";
import type { BoardName } from "../lib/types";

interface Props {
  board: BoardName;
  syncLabel: string;
  onBoardChange: (b: BoardName) => void;
  onAdd: () => void;
  onSync: () => void;
}

export function Header({ board, syncLabel, onBoardChange, onAdd, onSync }: Props) {
  return (
    <header className="header">
      <div className="header__left">
        <div className="eyebrow">AO3 · Binder</div>
        <div className="header__title-row">
          <span className="header__title">Fic Board</span>
          <span className="header__tagline">{TAGLINE[board]}</span>
        </div>
      </div>
      <Tabs tabs={BOARD_NAMES} active={board} onChange={(t) => isBoardName(t) && onBoardChange(t)} />
      <Button variant="ghost" size="sm" label={syncLabel} onClick={onSync} />
      <Button variant="accent" size="md" label="+ Paste link" onClick={onAdd} />
    </header>
  );
}
