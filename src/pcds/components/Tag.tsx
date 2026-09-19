import type { CSSProperties } from "react";

export interface TagProps {
  label?: string;
  selected?: boolean;
  onClick?: () => void;
}

/** PCDS Tag — filter chip with a leading dot indicator, in mono type. */
export function Tag({ label = "Fandom Tag", selected = false, onClick }: TagProps) {
  const tagStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-2xs)",
    letterSpacing: "var(--tracking-wide)",
    padding: "6px 12px",
    borderRadius: "var(--radius-sm)",
    border: selected ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
    background: selected ? "var(--accent-primary-soft)" : "var(--bg-surface)",
    color: "var(--text-primary)",
    cursor: "pointer",
  };
  const dotStyle: CSSProperties = {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: selected ? "var(--accent-primary)" : "var(--text-muted)",
  };
  return (
    <span
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      style={tagStyle}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <span style={dotStyle} />
      {label}
    </span>
  );
}
