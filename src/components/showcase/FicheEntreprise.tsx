"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { lignesRemplies, type Lecture, type IndicateurSaisi } from "@/lib/vitrine-indicateurs";
import { demanderAcces } from "@/app/actions/vitrine";

/**
 * La fiche entreprise (§4). Le seul écran où un investisseur lit des chiffres,
 * et le seul endroit où l'on peut lui refuser quelque chose sans le dire.
 *
 * D'où deux affirmations écrites noir sur blanc en pied :
 *  - les chiffres viennent de l'ENTREPRISE, avec leur date ;
 *  - AUCUN document n'est consultable ici.
 *
 * La seconde n'est pas une précaution juridique, c'est l'argument produit :
 * un fondateur accepte d'être listé parce qu'il sait que sa fiche ne fuit pas
 * ses pièces. Le dire à l'investisseur lui explique aussi pourquoi il doit
 * demander l'accès plutôt que chercher un bouton de téléchargement.
 */

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

export function FicheEntreprise({
  orgId,
  nom,
  secteur,
  pays,
  stade,
  recherche,
  preparation,
  indicateurs,
  majDate,
  lectureInitiale,
}: {
  orgId: string;
  nom: string;
  secteur: string | null;
  pays: string | null;
  stade: string | null;
  recherche: string | null;
  preparation: number | null;
  indicateurs: IndicateurSaisi[];
  majDate: string | null;
  lectureInitiale: Lecture;
}) {
  const t = useTranslations("showcase");
  const [lecture, setLecture] = useState<Lecture>(lectureInitiale);
  const [envoye, setEnvoye] = useState(false);
  const [encours, demarrer] = useTransition();

  // Les huit lignes de la lecture courante, remplies depuis ce que
  // l'entreprise a saisi. La grille ne MÉLANGE jamais les deux lectures :
  // c'est `LIGNES[lecture]` qui commande, pas ce qui se trouve dans les
  // indicateurs.
  const lignes = lignesRemplies(lecture, indicateurs);
  const sigle =
    nom.trim().split(/\s+/).slice(0, 2).map((m) => m[0] ?? "").join("").toUpperCase() || "?";

  function demander() {
    demarrer(async () => {
      const res = await demanderAcces({
        startupOrgId: orgId,
        // L'instrument SUIT la lecture affichée — c'est le contrôle §6 de la
        // spec : demander depuis une fiche lue en dette porte instrument=dette.
        instrument: lecture === "dette" ? "dette" : "equity",
      });
      if (res.ok) setEnvoye(true);
    });
  }

  return (
    <div className="max-w-[760px]">
      <div className="bg-white border border-[#E2DED4] rounded-[10px] px-7 py-6">
        <div className="flex items-start gap-4">
          <span className="grid place-items-center w-[46px] h-[46px] rounded-[10px] bg-[#F1F0EB] text-[14px] font-[700] text-[#4A4E63] shrink-0">
            {sigle}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[22px] font-[700] tracking-[-0.02em] truncate">{nom}</h1>
            <p className="text-[12.5px] text-[#8B8FA3] mt-0.5">
              {[secteur, pays, stade, recherche].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
          {preparation != null && (
            <span style={mono} className="shrink-0 text-[9px] font-[700] tracking-[0.06em] text-[#4A4E63] bg-[#F1F0EB] rounded-[4px] px-2.5 py-[5px]">
              {t("ready", { n: preparation }).toUpperCase()}
            </span>
          )}
        </div>

        {/* Bascule de lecture. Elle ne réordonne pas la même grille : elle en
            change les huit lignes. */}
        <div className="flex items-center gap-2 mt-5">
          {(["equity", "dette"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLecture(l)}
              aria-pressed={lecture === l}
              className={
                "rounded-full border px-3.5 min-h-[30px] text-[12.5px] font-medium " +
                (lecture === l
                  ? "border-[#E85C2B] bg-[#FDF1EA] text-[#C24619]"
                  : "border-[#E4E2DC] bg-white text-[#33353B] hover:border-[#C9C6BD]")
              }
            >
              {l === "equity" ? t("readEquity") : t("readDette")}
            </button>
          ))}
        </div>

        <dl className="mt-5 divide-y divide-[#F0EDE4]">
          {lignes.map((ligne) => (
            <div key={ligne.cle} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-[12.5px] text-[#6E727A]">{t(`rows.${ligne.cle}`)}</dt>
              <dd>
                {ligne.valeur ? (
                  <span style={mono} className="text-[13.5px] font-[600]">{ligne.valeur}</span>
                ) : (
                  <span className="text-[12.5px] italic text-[#A9ACBB]">{t("notCommunicated")}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-4 text-[12px] text-[#8B8FA3] leading-relaxed">
        {majDate && <p>{t("figuresBy", { date: majDate })}</p>}
        <p className="mt-1">{t("noDocs")}</p>
      </div>

      <div className="mt-5">
        {envoye ? (
          <p className="text-[13px] text-[#147A5C] bg-[#E4F3EC] rounded-[6px] px-4 py-3">
            {t("requestSent")}
          </p>
        ) : (
          <button
            onClick={demander}
            disabled={encours}
            className="rounded-[6px] bg-[#E85C2B] px-5 py-3 text-[13.5px] font-[600] text-white hover:bg-[#D24E1F] disabled:opacity-60"
          >
            {t("requestAccess")}
          </button>
        )}
      </div>
    </div>
  );
}
