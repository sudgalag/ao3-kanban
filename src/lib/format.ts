import type { BadgeTone } from "../pcds";

/** "48k words", "6.8k words", "820 words"; 0 → "not started". */
export function fmtWords(n: number): string {
  if (!n) return "not started";
  const label = n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : String(n);
  return label + " words";
}

const TONES: BadgeTone[] = ["pink", "lavender", "moss", "neutral"];

/** Badge tone derived from the ship string: sum of char codes mod 4. */
export function shipTone(ship: string): BadgeTone {
  let sum = 0;
  for (const ch of ship) sum += ch.charCodeAt(0);
  return TONES[sum % TONES.length];
}

export function byline(author: string): string {
  return "by " + author;
}
