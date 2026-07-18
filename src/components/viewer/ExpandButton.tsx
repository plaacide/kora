"use client";

import { useTranslations } from "next-intl";

/**
 * Bouton d'agrandissement, commun à tous les types de documents.
 * Icône seule + libellé accessible : la barre d'outils est déjà chargée.
 */
export function ExpandButton({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("viewer");
  const label = expanded ? t("collapse") : t("expand");

  return (
    <button
      type="button"
      onClick={onToggle}
      title={label}
      aria-label={label}
      aria-pressed={expanded}
      className="grid place-items-center w-7 h-7 rounded-[6px] border border-line text-ink-secondary hover:text-ink hover:border-line-strong transition-colors cursor-pointer shrink-0"
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {expanded ? (
          // Flèches rentrantes.
          <>
            <path d="M10 2v4h4" />
            <path d="M6 14v-4H2" />
            <path d="M14 6l-4 0 0-4" />
            <path d="M2 10l4 0 0 4" />
          </>
        ) : (
          // Flèches sortantes.
          <>
            <path d="M10 1.5h4.5V6" />
            <path d="M6 14.5H1.5V10" />
            <path d="M14.5 1.5L9.5 6.5" />
            <path d="M1.5 14.5L6.5 9.5" />
          </>
        )}
      </svg>
    </button>
  );
}
