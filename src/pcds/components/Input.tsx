import { useState, type CSSProperties } from "react";

export interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  type?: string;
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

/** PCDS Input — labeled text field. Uppercase tracked caption; border turns accent on focus. */
export function Input({
  label = "Display name",
  placeholder = "",
  value,
  defaultValue,
  type = "text",
  onChange,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [internal, setInternal] = useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const inputStyle: CSSProperties = {
    font: "inherit",
    fontSize: "var(--text-sm)",
    color: "var(--text-primary)",
    background: "var(--bg-surface)",
    padding: "11px 14px",
    borderRadius: "var(--radius-md)",
    border: focused ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
    outline: "none",
    transition: "border-color 140ms ease",
    minWidth: 0,
  };
  return (
    <label style={wrapStyle}>
      <span style={labelStyle}>{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={current}
        onChange={(e) => {
          if (!isControlled) setInternal(e.target.value);
          onChange?.(e.target.value);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={inputStyle}
      />
    </label>
  );
}
