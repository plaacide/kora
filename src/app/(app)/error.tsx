"use client";

import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Erreur de rendu d'un écran de l'application (handoff §3).
 *
 * Le message dit d'abord ce qui N'A PAS eu lieu : les données sont intactes,
 * c'est l'affichage qui a échoué. Un fondateur qui voit une page cassée pense
 * d'abord qu'il a perdu son dossier — c'est cette peur qu'on lève, avant de
 * proposer l'action.
 *
 * `reset` est fourni par Next : il rejoue le rendu sans recharger la page.
 */
export default function ErreurEcran({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("common");

  return (
    <div className="max-w-2xl">
      <EmptyState
        arcs
        title={t("loadErrorTitle")}
        description={t("loadErrorBody")}
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        }
        action={
          <button
            onClick={reset}
            className="rounded-[5px] bg-[#FF5A1F] px-4 py-2.5 text-[13px] font-[600] text-white hover:bg-[#E74C16]"
          >
            {t("retry")}
          </button>
        }
      />
    </div>
  );
}
