"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Petit « i » d'aide contextuelle : au survol OU au focus clavier, il affiche
 * une infobulle expliquant une notion (readiness, filigrane, niveaux…).
 *
 * L'infobulle est rendue dans un PORTAIL en position fixe, calculée depuis la
 * position du bouton : elle n'est donc jamais rognée par le `overflow-hidden`
 * d'une carte ni par un parent, contrairement à un positionnement absolu.
 *
 * Accessible : c'est un vrai bouton, l'explication est portée par `aria-label`
 * (lue par un lecteur d'écran même sans survol), ouverture au focus, Échap.
 */
export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLButtonElement>(null);

  function place() {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    // Sous le bouton, centrée, mais bornée pour ne pas sortir de l'écran.
    const half = 130;
    const left = Math.min(
      Math.max(r.left + r.width / 2, half + 8),
      window.innerWidth - half - 8,
    );
    setPos({ top: r.bottom + 6, left });
  }

  function show() {
    place();
    setOpen(true);
  }

  return (
    <span className="relative inline-flex align-middle">
      <button
        ref={ref}
        type="button"
        aria-label={text}
        onMouseEnter={show}
        onMouseLeave={() => setOpen(false)}
        onFocus={show}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          if (open) setOpen(false);
          else show();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className="grid place-items-center w-[15px] h-[15px] rounded-full border border-line text-ink-muted text-[9px] font-bold leading-none cursor-help transition-colors hover:text-ink hover:border-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        i
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            role="tooltip"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              transform: "translateX(-50%)",
            }}
            className="z-[100] w-max max-w-[260px] rounded-[8px] bg-[oklch(0.24_0.015_260)] text-white text-[11px] font-normal leading-snug px-2.5 py-1.5 shadow-lg pointer-events-none normal-case tracking-normal"
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  );
}
