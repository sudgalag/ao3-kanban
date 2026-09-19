export type BoardName = "Reading" | "Writing";

export interface Card {
  id: number;
  board: BoardName;
  col: string;
  title: string;
  author: string;
  fandom: string;
  ship: string;
  /** Word count; 0 means "not started". */
  words: number;
  notes: string;
  url: string;
}

export interface Draft {
  title: string;
  author: string;
  fandom: string;
  ship: string;
  /** Kept as a string while editing; parsed on save. */
  words: string;
  col: string;
  notes: string;
}
