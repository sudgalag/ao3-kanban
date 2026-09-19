import { useEffect, type ReactNode } from "react";

interface Props {
  onClose: () => void;
  label: string;
  children: ReactNode;
}

/** Bottom sheet over a blurred scrim. Click on the scrim or Escape closes it. */
export function Sheet({ onClose, label, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
