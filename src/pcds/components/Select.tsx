import { useState, type CSSProperties } from "react";

export interface SelectProps {
  label?: string;
  options?: string[];
  value?: string;
  onChange?: (value: string) => void;
}

const wrapStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontFamily: "var(--font-display)",
};
const labelStyle: CSSProperties = {
  fontSize: "var(--text-2xs)",
  letterSpacing: "var(--tracking-widest)",
  textTransform: "uppercase",
  color: "var(--text-secondary)",
  fontWeight: 600,
};
const selectStyle: CSSProperties = {
  font: "inherit",
  fontSize: "var(--text-sm)",
  color: "var(--text-primary)",
  background: "var(--bg-surface)",
  padding: "11px 14px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border-subtle)",
  outline: "none",
  minWidth: 0,
};

/** PCDS Select — labeled native dropdown sharing the Input chrome. */
export function Select({ label = "Slot type", options = [], value, onChange }: SelectProps) {
  const [internal, setInternal] = useState(options[0] ?? "");
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  return (
    <label style={wrapStyle}>
      <span style={labelStyle}>{label}</span>
      <select
        value={current}
        onChange={(e) => {
          if (!isControlled) setInternal(e.target.value);
          onChange?.(e.target.value);
        }}
        style={selectStyle}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
