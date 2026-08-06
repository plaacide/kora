"use client";

import { useEffect, useRef } from "react";

/**
 * Le carton de l'enquête produit — §3 du handoff.
 *
 * CE N'EST PAS UN MODAL, et c'est la règle §0.1 : ni voile, ni blocage, ni
 * piège au clavier. Un `aside` posé en bas à droite, qui laisse l'application
 * entièrement utilisable derrière. Réutiliser `Modal` aurait été plus rapide
 * et aurait donné exactement le contraire : une enquête qui prend l'écran en
 * otage pour demander si tout va bien.
 *
 * D'où `role="dialog"` avec `aria-modal="false"` (§6) : c'est bien un dialogue
 * nommé, mais il n'enferme personne.
 */

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

export function SurveyCard({
  large,
  titreId,
  onPlusTard,
  children,
}: {
  /** 372 px pour les écrans de questions, 300 px pour l'invitation et le merci. */
  large: boolean;
  titreId: string;
  onPlusTard: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  // Échap vaut « Plus tard » (§6) — pas un abandon définitif. L'écouteur est
  // sur le document parce que le carton ne capture pas le focus : on doit
  // pouvoir le renvoyer sans avoir cliqué dedans.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onPlusTard();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onPlusTard]);

  return (
    <aside
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titreId}
      className="sz-enquete fixed right-6 bottom-6 z-[80] rounded-[12px] border border-[#E2DED4] bg-white p-[18px]"
      style={{
        width: large ? 372 : 300,
        boxShadow: "0 18px 44px rgba(26,27,31,0.20)",
      }}
    >
      {/* Le changement d'écran est annoncé sans voler la parole (§6). */}
      <div aria-live="polite">{children}</div>
    </aside>
  );
}

/**
 * Bandeau des écrans 1 à 4 : la progression, puis la croix.
 *
 * La croix vaut « Plus tard », pas un refus — d'où son `aria-label` explicite.
 * Un « × » nu laisserait croire à un abandon définitif, ce qu'il n'est pas :
 * on repose la question dans sept jours.
 */
export function SurveyProgress({
  etape,
  total,
  labelPlusTard,
  onPlusTard,
}: {
  etape: number;
  total: number;
  labelPlusTard: string;
  onPlusTard: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="flex items-center gap-1" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className="block h-[5px] rounded-full transition-none"
            style={{
              width: i + 1 === etape ? 16 : 5,
              background: i + 1 === etape ? "#FF5A1F" : "#E2DED4",
            }}
          />
        ))}
      </span>
      <span style={mono} className="text-[10px] text-[#9DA0A8]">
        {etape} / {total}
      </span>
      <button
        onClick={onPlusTard}
        aria-label={labelPlusTard}
        title={labelPlusTard}
        className="ml-auto grid place-items-center w-8 h-8 -mr-1.5 rounded-[5px] text-[#9DA0A8] hover:text-[#1A1B1F] hover:bg-[#F1F0EB]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/** Chip de sélection. Cible de 32 px de haut minimum (§6). */
export function SurveyChip({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={
        "rounded-full border px-3.5 min-h-[32px] text-[12.5px] font-medium " +
        (actif
          ? "border-[#FF5A1F] bg-[#FDF1EA] text-[#C44518]"
          : "border-[#E4E2DC] bg-white text-[#33353B] hover:border-[#C9C6BD]")
      }
    >
      {children}
    </button>
  );
}

/** Bouton primaire. Désactivé = gris franc, jamais un orange pâli. */
export function SurveyPrimary({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "rounded-[6px] px-4 min-h-[34px] text-[13px] font-[600] " +
        (disabled
          ? "bg-[#F1F0EB] text-[#A9ACBB] cursor-not-allowed"
          : "bg-[#FF5A1F] text-white hover:bg-[#E74C16]")
      }
    >
      {children}
    </button>
  );
}

/** Lien de sortie : discret, mais toujours présent — aucune question n'est obligatoire. */
export function SurveyExit({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[12px] text-[#9DA0A8] underline underline-offset-2 hover:text-[#4A4E63] min-h-[32px]"
    >
      {children}
    </button>
  );
}
