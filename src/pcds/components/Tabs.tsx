import { useState, type CSSProperties } from "react";

export interface TabsProps {
  tabs?: string[];
  active?: string;
  onChange?: (tab: string) => void;
}

/** PCDS Tabs — segmented control; the active tab gets a solid charcoal pill. */
export function Tabs({ tabs = [], active, onChange }: TabsProps) {
  const [internal, setInternal] = useState<string | null>(null);
  const current = active ?? internal ?? tabs[0];
  const rowStyle: CSSProperties = {
    display: "flex",
    gap: "4px",
    padding: "4px",
    background: "var(--bg-surface-2)",
    borderRadius: "var(--radius-pill)",
    width: "fit-content",
    fontFamily: "var(--font-display)",
  };
  const baseStyle: CSSProperties = {
    border: "none",
    cursor: "pointer",
    padding: "8px 18px",
    borderRadius: "var(--radius-pill)",
    fontSize: "var(--text-xs)",
    fontWeight: 600,
    letterSpacing: "var(--tracking-wide)",
    textTransform: "uppercase",
    transition: "all 160ms var(--ease-soft)",
  };
  const select = (label: string) => {
    if (active === undefined) setInternal(label);
    onChange?.(label);
  };
  return (
    <div role="tablist" style={rowStyle}>
      {tabs.map((label) => (
        <button
          key={label}
          type="button"
          role="tab"
          aria-selected={label === current}
          onClick={() => select(label)}
          style={{
            ...baseStyle,
            background: label === current ? "var(--bg-inverse)" : "transparent",
            color: label === current ? "var(--text-inverse)" : "var(--text-secondary)",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
