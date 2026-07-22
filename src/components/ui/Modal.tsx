"use client";

import { useEffect } from "react";

/**
 * Modal réutilisable, style handoff : voile sombre, carte blanche rayon 8,
 * ombre douce. Ferme au clic sur le voile et à Échap.
 */
export function Modal({
  open,
  onClose,
  children,
  title,
  width = 490,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** En-tête optionnel : si fourni, un bandeau titre + croix est rendu. */
  title?: string;
  width?: number;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 bg-[rgba(26,27,31,0.35)]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width, maxWidth: "100%", boxShadow: "0 24px 70px rgba(26,27,31,0.28)" }}
        className={"bg-white rounded-[8px] overflow-hidden max-h-[85vh] overflow-y-auto " + className}
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F1F0EC]">
            <div className="text-[16px] font-[700] text-[#1A1B1F]">{title}</div>
            <button onClick={onClose} aria-label="Fermer" className="text-[#9DA0A8] hover:text-[#1A1B1F] text-[18px] leading-none">×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
