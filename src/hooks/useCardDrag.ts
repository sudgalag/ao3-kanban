import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Card } from "../lib/types";
import { byline } from "../lib/format";

export interface Ghost {
  x: number;
  y: number;
  w: number;
  title: string;
  fandom: string;
  byline: string;
}

type Mode = null | "drag" | "panx" | "pany";

interface Pending {
  id: number;
  card: Card;
  /** Pointer position at pointerdown. */
  sx: number;
  sy: number;
  /** Last seen pointer position. */
  lx: number;
  ly: number;
  /** Grab offset inside the card, so the ghost keeps the pointer where it landed. */
  ox: number;
  oy: number;
  w: number;
  main: HTMLElement | null;
  mode: Mode;
  touch: boolean;
  over: string | null;
  timer?: ReturnType<typeof setTimeout>;
}

const DRAG_THRESHOLD = 6;
const HOLD_MS = 260;
const EDGE_PX = 40;
const EDGE_STEP = 12;
/** Horizontal board padding (--space-5); used to snap back after a manual pan. */
const BOARD_PAD = 24;

/**
 * Pointer-event drag-and-drop for cards (no HTML5 DnD).
 * Mouse: drag after 6px. Touch: press-and-hold 260ms activates a drag;
 * moving first turns the gesture into a horizontal board pan or vertical page scroll.
 */
export function useCardDrag(onDrop: (id: number, col: string) => void) {
  const [dragId, setDragId] = useState<number | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const pd = useRef<Pending | null>(null);
  const suppress = useRef(false);
  const onDropRef = useRef(onDrop);
  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);
  const handlers = useRef<{ move: (e: PointerEvent) => void; up: (e: PointerEvent) => void } | null>(null);

  const detach = useCallback(() => {
    const h = handlers.current;
    if (!h) return;
    window.removeEventListener("pointermove", h.move);
    window.removeEventListener("pointerup", h.up);
    window.removeEventListener("pointercancel", h.up);
    handlers.current = null;
  }, []);

  const startDrag = useCallback((x: number, y: number) => {
    const p = pd.current;
    if (!p || p.mode) return;
    clearTimeout(p.timer);
    p.mode = "drag";
    suppress.current = true;
    document.body.style.userSelect = "none";
    if (navigator.vibrate) navigator.vibrate(10);
    setDragId(p.id);
    setGhost({
      x: x - p.ox,
      y: y - p.oy,
      w: p.w,
      title: p.card.title,
      fandom: p.card.fandom,
      byline: byline(p.card.author),
    });
  }, []);

  const pointerMove = useCallback(
    (e: PointerEvent) => {
      const p = pd.current;
      if (!p) return;
      const dx = e.clientX - p.sx;
      const dy = e.clientY - p.sy;
      if (!p.mode) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        suppress.current = true;
        if (!p.touch) {
          startDrag(e.clientX, e.clientY);
        } else {
          clearTimeout(p.timer);
          p.mode = Math.abs(dx) > Math.abs(dy) ? "panx" : "pany";
          if (p.mode === "panx" && p.main) p.main.style.scrollSnapType = "none";
        }
      }
      if (p.mode === "panx") {
        if (p.main) p.main.scrollLeft -= e.clientX - p.lx;
      } else if (p.mode === "pany") {
        window.scrollBy(0, -(e.clientY - p.ly));
      } else if (p.mode === "drag") {
        const hit = document.elementFromPoint(e.clientX, e.clientY);
        const col = hit?.closest<HTMLElement>("[data-col]");
        p.over = col ? (col.dataset.col ?? null) : null;
        if (p.main) {
          const r = p.main.getBoundingClientRect();
          if (e.clientX > r.right - EDGE_PX) p.main.scrollLeft += EDGE_STEP;
          else if (e.clientX < r.left + EDGE_PX) p.main.scrollLeft -= EDGE_STEP;
        }
        setOver(p.over);
        setGhost((g) => (g ? { ...g, x: e.clientX - p.ox, y: e.clientY - p.oy } : g));
      }
      p.lx = e.clientX;
      p.ly = e.clientY;
    },
    [startDrag],
  );

  const pointerUp = useCallback(
    (e: PointerEvent) => {
      const p = pd.current;
      if (!p) return;
      clearTimeout(p.timer);
      detach();
      document.body.style.userSelect = "";
      if (p.mode === "drag" && p.over && e.type !== "pointercancel") onDropRef.current(p.id, p.over);
      if (p.mode === "panx" && p.main) {
        const m = p.main;
        const kids = Array.from(m.children) as HTMLElement[];
        const target = m.scrollLeft + BOARD_PAD;
        const nearest = kids.reduce<HTMLElement | undefined>(
          (best, k) => (!best || Math.abs(k.offsetLeft - target) < Math.abs(best.offsetLeft - target) ? k : best),
          undefined,
        );
        m.scrollTo({ left: nearest ? nearest.offsetLeft - BOARD_PAD : 0, behavior: "smooth" });
        setTimeout(() => {
          m.style.scrollSnapType = "";
        }, 400);
      }
      pd.current = null;
      setDragId(null);
      setOver(null);
      setGhost(null);
      setTimeout(() => {
        suppress.current = false;
      }, 0);
    },
    [detach],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>, card: Card) => {
      if (e.button !== 0 || pd.current) return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const touch = e.pointerType !== "mouse";
      const p: Pending = {
        id: card.id,
        card,
        sx: e.clientX,
        sy: e.clientY,
        lx: e.clientX,
        ly: e.clientY,
        ox: e.clientX - rect.left,
        oy: e.clientY - rect.top,
        w: rect.width,
        main: el.closest("main"),
        mode: null,
        touch,
        over: null,
      };
      pd.current = p;
      if (touch) {
        const { clientX, clientY } = e;
        p.timer = setTimeout(() => startDrag(clientX, clientY), HOLD_MS);
      }
      handlers.current = { move: pointerMove, up: pointerUp };
      window.addEventListener("pointermove", pointerMove);
      window.addEventListener("pointerup", pointerUp);
      window.addEventListener("pointercancel", pointerUp);
    },
    [pointerMove, pointerUp, startDrag],
  );

  /** True right after a drag or pan, so the trailing click must not open the card. */
  const clickSuppressed = useCallback(() => suppress.current, []);

  useEffect(
    () => () => {
      clearTimeout(pd.current?.timer);
      detach();
      document.body.style.userSelect = "";
    },
    [detach],
  );

  return { dragId, over, ghost, onPointerDown, clickSuppressed };
}
