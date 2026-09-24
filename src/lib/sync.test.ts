import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRemoteBoard, isNewer, normalizeSyncUrl, pushRemoteBoard, SyncError } from "./sync";

const settings = { url: "https://w.example", token: "t0k" };
const card = {
  id: 1,
  board: "Reading",
  col: "To Read",
  title: "x",
  author: "a",
  fandom: "f",
  ship: "s",
  words: 1,
  notes: "",
  url: "",
};

afterEach(() => vi.unstubAllGlobals());

describe("normalizeSyncUrl", () => {
  it("strips whitespace, trailing slashes and /board", () => {
    expect(normalizeSyncUrl("  https://w.example/ ")).toBe("https://w.example");
    expect(normalizeSyncUrl("https://w.example/board")).toBe("https://w.example");
  });
});

describe("isNewer", () => {
  it("compares ISO timestamps and treats empty as oldest", () => {
    expect(isNewer("2026-09-24T10:00:00.000Z", "2026-09-24T09:59:59.000Z")).toBe(true);
    expect(isNewer("2026-09-24T10:00:00.000Z", "")).toBe(true);
    expect(isNewer("", "2026-09-24T10:00:00.000Z")).toBe(false);
    expect(isNewer("a", "a")).toBe(false);
  });
});

describe("fetchRemoteBoard", () => {
  it("sends the bearer token and parses the board", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ cards: [card, { junk: true }], updatedAt: "2026-09-24T10:00:00.000Z" }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const board = await fetchRemoteBoard(settings);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://w.example/board",
      expect.objectContaining({ headers: { Authorization: "Bearer t0k" } }),
    );
    expect(board?.cards).toHaveLength(1);
    expect(board?.updatedAt).toBe("2026-09-24T10:00:00.000Z");
  });
  it("returns null when nothing is stored yet", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 404 })));
    expect(await fetchRemoteBoard(settings)).toBeNull();
  });
  it("explains a rejected token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
    await expect(fetchRemoteBoard(settings)).rejects.toMatchObject({ name: "SyncError", status: 401 });
  });
});

describe("pushRemoteBoard", () => {
  it("PUTs JSON with the token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await pushRemoteBoard(settings, { cards: [card], updatedAt: "2026-09-24T10:00:00.000Z" });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://w.example/board");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string).cards).toHaveLength(1);
  });
  it("throws a SyncError on failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 503 })));
    await expect(pushRemoteBoard(settings, { cards: [], updatedAt: "x" })).rejects.toBeInstanceOf(SyncError);
  });
});
