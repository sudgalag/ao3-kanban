import { useState, type CSSProperties } from "react";

export type ButtonVariant = "primary" | "secondary" | "accent" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: () => void;
}

const SIZES: Record<ButtonSize, CSSProperties> = {
  sm: { padding: "8px 16px", fontSize: "var(--text-xs)" },
  md: { padding: "11px 22px", fontSize: "var(--text-sm)" },
  lg: { padding: "14px 28px", fontSize: "var(--text-md)" },
};

const VARIANTS: Record<ButtonVariant, CSSProperties> = {
  primary: { background: "var(--bg-inverse)", color: "var(--text-inverse)", border: "1px solid var(--bg-inverse)" },
  secondary: { background: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-strong)" },
  accent: {
    background: "var(--accent-primary)",
    color: "var(--text-inverse)",
    border: "1px solid var(--accent-primary)",
  },
  ghost: { background: "transparent", color: "var(--text-secondary)", border: "1px solid transparent" },
};

/** PCDS Button — pill-shaped, uppercase tracked Space Grotesk label. Press scales to 0.97. */
export function Button({ label = "Button", variant = "primary", size = "md", disabled = false, onClick }: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const style: CSSProperties = {
    fontFamily: "var(--font-display)",
    fontWeight: 600,
    letterSpacing: "var(--tracking-wide)",
    textTransform: "uppercase",
    borderRadius: "var(--radius-pill)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
    transform: pressed ? "scale(0.97)" : "scale(1)",
    transition: "transform 140ms cubic-bezier(.22,1,.36,1), opacity 140ms cubic-bezier(.22,1,.36,1)",
    ...SIZES[size],
    ...VARIANTS[variant],
  };
  return (
    <button
      type="button"
      disabled={disabled}
      style={style}
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onClick={() => {
        if (disabled) return;
        onClick?.();
      }}
    >
      {label}
    </button>
  );
}
