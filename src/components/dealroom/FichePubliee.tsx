"use client";

import { useTransition } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { useRouter } from "next/navigation";
import { depublier } from "@/app/actions/dealroom";

/**
 * Une fiche de la vitrine, avec son bouton de dépublication.
 *
 * DÉPUBLIER N'EST PAS RÉVOQUER (règle §4). Retirer une fiche la fait
 * disparaître de la vitrine ; les accès aux data rooms que des entreprises ont
 * déjà accordés restent ouverts. La phrase est sous la liste, pas dans une
 * confirmation modale : c'est une information à connaître AVANT de cliquer,
 * pas un obstacle à franchir après.
 */
export function FichePubliee({
  cohorteId,
  orgId,
  nom,
  publieeLe,
}: {
  cohorteId: string;
  orgId: string;
  nom: string;
  publieeLe: string;
}) {
  const t = useTranslations("dealroom");
  const f = useFormatter();
  const router = useRouter();
  const [encours, demarrer] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 border-t border-[#F0EDE4]">
      <span className="text-[12.5px] font-[550] text-[#1A1B1F] min-w-0 truncate">
        {nom}
      </span>
      <span className="text-[11.5px] text-[#A0A3AB]">
        {t("publishedSince", {
          date: f.dateTime(new Date(publieeLe), {
            day: "numeric",
            month: "short",
          }),
        })}
      </span>
      <button
        onClick={() =>
          demarrer(async () => {
            await depublier(cohorteId, orgId);
            router.refresh();
          })
        }
        disabled={encours}
        className="ml-auto shrink-0 text-[11.5px] text-[#9DA0A8] underline underline-offset-2 hover:text-[#C0392B] disabled:no-underline"
      >
        {t("unpublish")}
      </button>
    </div>
  );
}
