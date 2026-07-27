"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { donnerMandat, retirerMandat } from "@/app/actions/mandat";

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

export interface ProgrammeMandat {
  orgId: string;
  nom: string;
  /** Cohortes vivantes par lesquelles ce programme accompagne l'entreprise. */
  cohortes: string[];
  mandate: boolean;
}

/**
 * Déléguer à un programme le droit d'ouvrir cette salle.
 *
 * UNE CONFIRMATION, ET UNE SEULE FOIS. Donner mandat est irréversible dans ses
 * effets — les accès accordés pendant le mandat survivent à sa révocation. Un
 * interrupteur nu se bascule par accident ; on demande donc confirmation, en
 * disant ce qui change et ce qui ne changera plus. Retirer, en revanche, ne
 * demande rien : refermer une porte n'a jamais besoin d'être protégé.
 *
 * CE PANNEAU NE S'AFFICHE PAS SANS PROGRAMME. Une entreprise qui n'est dans
 * aucune cohorte n'a personne à mandater : lui montrer une section vide lui
 * apprendrait une notion dont elle n'a pas l'usage, au milieu de l'écran où
 * elle gère ses invités.
 */
export function MandatPanneau({
  dealId,
  programmes,
}: {
  dealId: string;
  programmes: ProgrammeMandat[];
}) {
  const t = useTranslations("permissions");
  const router = useRouter();
  const [confirme, setConfirme] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [encours, demarrer] = useTransition();

  function agir(programmeId: string, donner: boolean) {
    setErreur(null);
    demarrer(async () => {
      const r = donner
        ? await donnerMandat(dealId, programmeId)
        : await retirerMandat(dealId, programmeId);
      if (!r.ok) setErreur(r.error ?? "—");
      setConfirme(null);
      router.refresh();
    });
  }

  return (
    <section className="mt-8">
      <div
        style={mono}
        className="text-[9px] tracking-[0.08em] text-[#A0A3AB] uppercase"
      >
        {t("mandateTitle")}
      </div>
      <p className="text-[12px] text-[#6E727A] mt-1.5 max-w-xl leading-relaxed">
        {t("mandateIntro")}
      </p>

      {erreur && (
        <p className="text-[12px] text-[#C0392B] mt-2 leading-relaxed">{erreur}</p>
      )}

      <div className="mt-3 bg-white border border-[#E2DED4] rounded-[8px]">
        {programmes.map((p, i) => (
          <div
            key={p.orgId}
            className={
              "px-4 py-3.5 " + (i > 0 ? "border-t border-[#F0EDE4]" : "")
            }
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="min-w-0">
                <span className="block text-[13px] font-[600] truncate">
                  {p.nom}
                </span>
                <span className="block text-[11px] text-[#9DA0A8] truncate">
                  {p.cohortes.join(" · ")}
                </span>
              </span>

              {p.mandate && (
                <span
                  style={mono}
                  className="shrink-0 text-[8.5px] font-[700] tracking-[0.06em] rounded-[4px] px-2 py-[3px] text-[#C24619] bg-[#FBEDE6]"
                >
                  {t("mandateBadge")}
                </span>
              )}

              <span className="ml-auto shrink-0">
                {p.mandate ? (
                  <button
                    onClick={() => agir(p.orgId, false)}
                    disabled={encours}
                    className="text-[11.5px] text-[#9DA0A8] underline underline-offset-2 hover:text-[#C0392B] disabled:no-underline"
                  >
                    {t("mandateRevoke")}
                  </button>
                ) : confirme === p.orgId ? (
                  <span className="flex items-center gap-2.5">
                    <button
                      onClick={() => setConfirme(null)}
                      disabled={encours}
                      className="text-[11.5px] text-[#9DA0A8] underline underline-offset-2"
                    >
                      {t("mandateCancel")}
                    </button>
                    <button
                      onClick={() => agir(p.orgId, true)}
                      disabled={encours}
                      className="rounded-[5px] bg-[#E85C2B] px-3 py-1.5 text-[12px] font-[600] text-white hover:bg-[#D24E1F] disabled:bg-[#F1F0EB] disabled:text-[#A9ACBB]"
                    >
                      {t("mandateConfirm")}
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirme(p.orgId)}
                    className="rounded-[5px] border border-[#E2DED4] px-3 py-1.5 text-[12px] font-[550] text-[#33353B] hover:border-[#C9C6BD]"
                  >
                    {t("mandateGrant")}
                  </button>
                )}
              </span>
            </div>

            {/* Ce qu'on engage, écrit AVANT de confirmer — pas dans une modale
                qu'on ferme sans lire. */}
            {confirme === p.orgId && (
              <p className="text-[12px] text-[#8A4B2C] bg-[#FEFAF7] border border-[#F0C4AE] rounded-[6px] px-3.5 py-2.5 mt-2.5 leading-relaxed">
                {t("mandateWarning", { name: p.nom })}
              </p>
            )}
          </div>
        ))}
      </div>

      <p className="text-[11.5px] text-[#8B8FA3] mt-2.5 max-w-xl leading-relaxed">
        {t("mandateRevokeHint")}
      </p>
    </section>
  );
}
