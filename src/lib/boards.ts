import type { BoardName } from "./types";

export const BOARDS: Record<BoardName, readonly string[]> = {
  Reading: ["Rec'd", "To Read", "Reading", "Finished", "Dropped"],
  Writing: ["Ideas", "Drafting", "Editing", "Posted"],
};

export const BOARD_NAMES = Object.keys(BOARDS) as BoardName[];

export const TAGLINE: Record<BoardName, string> = {
  Reading: "what you're reading",
  Writing: "what you're writing",
};

/** Column header dot colours, by column index. */
export const DOTS = [
  "var(--accent-lavender)",
  "var(--slate-300)",
  "var(--accent-pink)",
  "var(--moss-400)",
  "var(--rust-300)",
];

export const EMPTY_COPY: Record<string, string> = {
  "Rec'd": "Nothing waiting for review.",
  "To Read": "Your queue is clear.",
  Reading: "Not reading anything right now.",
  Finished: "No finished fics yet.",
  Dropped: "Nothing dropped.",
  Ideas: "No ideas parked here.",
  Drafting: "Nothing in progress.",
  Editing: "Nothing to edit.",
  Posted: "Nothing posted yet.",
};

export function isBoardName(v: unknown): v is BoardName {
  return v === "Reading" || v === "Writing";
}
