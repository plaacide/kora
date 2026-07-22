"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Modal réutilisable, style handoff : voile sombre, carte blanche rayon 8,
 * ombre douce. Ferme au clic sur le voile et à Échap.
 *
 * Rendu via un PORTAIL sur `document.body` : sinon le voile `fixed inset-0`
 * serait borné par un ancêtre qui établit un bloc conteneur (l'animation
 * `animate-in` de PageTransition) et n'apparaîtrait que dans la zone de
 * contenu — un « carré » au lieu de couvrir tout l'écran.
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 bg-[rgba(23,24,28,0.5)]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        // Ombre CONTENUE (spread négatif), noire neutre : séparation nette de la
        // carte sur le voile sombre, sans halo ni flou d'arrière-plan.
        style={{ width, maxWidth: "100%", boxShadow: "0 18px 48px -16px rgba(0,0,0,0.5)" }}
        className={"bg-white rounded-[10px] overflow-hidden max-h-[85vh] overflow-y-auto " + className}
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F1F0EC]">
            <div className="text-[16px] font-[700] text-[#1A1B1F]">{title}</div>
            <button onClick={onClose} aria-label="Fermer" className="text-[#9DA0A8] hover:text-[#1A1B1F] text-[18px] leading-none">×</button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
