import { describe, expect, it } from "vitest";
import { fmtWords, shipTone } from "./format";

describe("fmtWords", () => {
  it("formats counts like the design", () => {
    expect(fmtWords(48200)).toBe("48k words");
    expect(fmtWords(6800)).toBe("6.8k words");
    expect(fmtWords(820)).toBe("820 words");
    expect(fmtWords(0)).toBe("not started");
  });
});

describe("shipTone", () => {
  it("is deterministic and stays inside the four tones", () => {
    const tones = new Set(["pink", "lavender", "moss", "neutral"]);
    for (const s of ["Haewon/Lily", "Ryujin/Yeji", "Chaewon/Sakura", "Gen", ""]) {
      expect(tones.has(shipTone(s))).toBe(true);
      expect(shipTone(s)).toBe(shipTone(s));
    }
  });
});
