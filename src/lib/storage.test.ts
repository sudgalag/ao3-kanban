import { describe, expect, it } from "vitest";
import { parseImport, serializeExport } from "./storage";
import { SEED } from "./seed";

describe("export / import", () => {
  it("round-trips the board", () => {
    const text = serializeExport(SEED, new Date("2026-09-24T00:00:00Z"));
    const parsed = JSON.parse(text);
    expect(parsed.version).toBe(1);
    expect(parsed.exportedAt).toBe("2026-09-24T00:00:00.000Z");
    expect(parseImport(text)).toEqual(SEED);
  });
  it("accepts a bare array and drops malformed entries", () => {
    const cards = parseImport(JSON.stringify([SEED[0], { nope: 1 }]));
    expect(cards).toHaveLength(1);
  });
  it("rejects files without cards", () => {
    expect(parseImport("{}")).toBeNull();
    expect(parseImport("[]")).toBeNull();
    expect(parseImport("not json")).toBeNull();
  });
});
