"use client";

import { useState } from "react";

/**
 * Petit « i » d'aide contextuelle : au survol OU au focus clavier, il affiche
 * une infobulle expliquant une notion (readiness, filigrane, niveaux…).
 *
 * Accessible : c'est un vrai bouton, l'explication est portée par `aria-label`
 * (donc lue par un lecteur d'écran même sans survol), et l'infobulle s'ouvre
 * aussi au focus et se ferme à Échap.
 */
export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={text}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className="grid place-items-center w-[15px] h-[15px] rounded-full border border-line text-ink-muted text-[9px] font-bold leading-none cursor-help transition-colors hover:text-ink hover:border-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-[60] w-max max-w-[250px] rounded-[8px] bg-[oklch(0.24_0.015_260)] text-white text-[11px] font-normal leading-snug px-2.5 py-1.5 shadow-card pointer-events-none normal-case tracking-normal"
        >
          {text}
        </span>
      )}
    </span>
  );
}
