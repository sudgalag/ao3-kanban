import type { CSSProperties } from "react";

export type BadgeTone = "neutral" | "pink" | "lavender" | "moss";

export interface BadgeProps {
  label?: string;
  tone?: BadgeTone;
}

const TONES: Record<BadgeTone, CSSProperties> = {
  neutral: { background: "var(--bg-inverse)", color: "var(--text-inverse)" },
  pink: { background: "var(--accent-pink)", color: "var(--text-inverse)" },
  lavender: { background: "var(--accent-lavender)", color: "var(--text-inverse)" },
  moss: { background: "var(--moss-600)", color: "var(--text-inverse)" },
};

/** PCDS Badge — small pill label in uppercase 11px Space Grotesk, widest tracking. */
export function Badge({ label = "NEW", tone = "neutral" }: BadgeProps) {
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    fontFamily: "var(--font-display)",
    fontSize: "var(--text-2xs)",
    fontWeight: 600,
    letterSpacing: "var(--tracking-widest)",
    textTransform: "uppercase",
    padding: "4px 10px",
    borderRadius: "var(--radius-pill)",
    ...TONES[tone],
  };
  return <span style={style}>{label}</span>;
}
