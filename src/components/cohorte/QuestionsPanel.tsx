"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ecrireAEntreprise } from "@/app/actions/dealroom";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Panneau « Questions & suggestions » (§2 de la spec).
 *
 * DEUX OBJETS, jamais un chat — les règles §9 refusent le fil libre. La
 * bascule du composeur n'est donc pas un réglage cosmétique : elle choisit
 * entre quelque chose qui attend une réponse et quelque chose qui n'en attend
 * pas. La phrase sous les boutons le dit, parce que rien dans la forme d'un
 * champ de texte ne le laisserait deviner.
 */

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

export interface Echange {
  id: string;
  type: "question" | "suggestion";
  status: "open" | "answered" | "read";
  body: string;
  entreprise: string;
  date: string;
}

export function QuestionsPanel({
  cohorteId,
  echanges,
  entreprises,
}: {
  cohorteId: string;
  echanges: Echange[];
  entreprises: { orgId: string; nom: string }[];
}) {
  const t = useTranslations("cohorts");
  const router = useRouter();
  const [type, setType] = useState<"question" | "suggestion">("question");
  const [cible, setCible] = useState("");
  const [texte, setTexte] = useState("");
  const [encours, demarrer] = useTransition();

  const badge = {
    question: { libelle: t("threadQuestion"), cls: "text-[#185FA5] bg-[#E9F2FB]" },
    suggestion: { libelle: t("threadSuggestion"), cls: "text-[#B4741B] bg-[#FBF1DF]" },
  } as const;
  const statut = {
    open: t("threadOpen"),
    answered: t("threadAnswered"),
    read: t("threadRead"),
  } as const;

  function envoyer() {
    if (!cible || texte.trim().length < 3) return;
    demarrer(async () => {
      await ecrireAEntreprise({
        cohorteId,
        startupOrgId: cible,
        type,
        body: texte,
      });
      setTexte("");
      router.refresh();
    });
  }

  return (
    <aside className="w-full lg:w-[380px] shrink-0 flex flex-col">
      <h2 className="text-[14px] font-[700] mb-3">{t("threadsTitle")}</h2>

      <div className="flex-1 flex flex-col gap-2 min-h-0">
        {echanges.length === 0 ? (
          <EmptyState
            inset
            title={t("threadsEmptyTitle")}
            description={t("threadsEmptyBody")}
            foot={t("threadsEmptyFoot")}
          />
        ) : (
          echanges.map((e) => (
            <div key={e.id} className="bg-white border border-[#E2DED4] rounded-[6px] px-3.5 py-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  style={mono}
                  className={"text-[8.5px] font-[700] tracking-[0.06em] rounded-[4px] px-2 py-[3px] " + badge[e.type].cls}
                >
                  {badge[e.type].libelle}
                </span>
                <span className="text-[12px] font-[600] text-[#33353B] truncate">{e.entreprise}</span>
                <span style={mono} className="ml-auto text-[9px] text-[#A0A3AB] tracking-[0.06em]">
                  {statut[e.status]}
                </span>
              </div>
              <p className="text-[12.5px] text-[#55585F] mt-1.5 leading-relaxed">{e.body}</p>
              <span style={mono} className="block text-[10px] text-[#A0A3AB] mt-1.5">{e.date}</span>
            </div>
          ))
        )}
      </div>

      {/* Composeur */}
      <div className="border-t border-[#E2DED4] pt-3 mt-3">
        <div className="flex items-center gap-1.5">
          {(["question", "suggestion"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setType(k)}
              aria-pressed={type === k}
              className={
                "rounded-full border px-3 min-h-[28px] text-[11.5px] font-medium " +
                (type === k
                  ? "border-[#FF5A1F] bg-[#FDF1EA] text-[#C44518]"
                  : "border-[#E4E2DC] bg-white text-[#33353B]")
              }
            >
              {badge[k].libelle}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-[#8B8FA3] mt-2 leading-snug">{t("composerHint")}</p>

        <select
          value={cible}
          onChange={(e) => setCible(e.target.value)}
          className="bg-white w-full h-9 px-2.5 mt-2 text-[12.5px] border border-[#E4E2DC] rounded-[5px] focus:outline-none focus:border-[#C9C6BD]"
        >
          <option value="">{t("composerPick")}</option>
          {entreprises.map((e) => (
            <option key={e.orgId} value={e.orgId}>{e.nom}</option>
          ))}
        </select>

        <textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          rows={3}
          placeholder={t("composerPlaceholder")}
          className="bg-white w-full mt-2 px-3 py-2 text-[12.5px] border border-[#E4E2DC] rounded-[5px] resize-none focus:outline-none focus:border-[#C9C6BD]"
        />

        <button
          onClick={envoyer}
          disabled={encours || !cible || texte.trim().length < 3}
          className="w-full mt-2 rounded-[5px] bg-[#FF5A1F] py-2 text-[12.5px] font-[600] text-white hover:bg-[#E74C16] disabled:bg-[#F1F0EB] disabled:text-[#A9ACBB]"
        >
          {t("composerSend")}
        </button>
      </div>
    </aside>
  );
}
