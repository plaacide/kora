"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { lignesRemplies, type Lecture, type IndicateurSaisi } from "@/lib/vitrine-indicateurs";
import { demanderAcces, relancerDemande } from "@/app/actions/vitrine";
import {
  JOURS_AVANT_EXPIRATION,
  etatDemande,
  joursAvantPeremption,
  relancable,
} from "@/lib/demandes-echeance";

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
 *
 * LA DEMANDE EXISTANTE VIENT DU SERVEUR, plus d'un état local. Avant, un
 * rechargement remettait le bouton « Demander l'accès » : l'investisseur
 * redemandait, croyant que la première fois n'avait pas marché, et la file du
 * programme se remplissait de doublons.
 *
 * C'est aussi ce qui rend la RELANCE possible (§5) : sans connaître la date de
 * sa demande, on ne peut pas lui dire qu'elle a expiré.
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
  demande,
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
  /** La demande en cours de cet investisseur sur cette entreprise, s'il y en a. */
  demande: { id: string; statut: string; creeLe: string; relanceeLe: string | null } | null;
}) {
  const t = useTranslations("showcase");
  const [lecture, setLecture] = useState<Lecture>(lectureInitiale);
  const [envoye, setEnvoye] = useState(false);
  const [relance, setRelance] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [encours, demarrer] = useTransition();

  const etat = demande
    ? etatDemande(demande.statut, demande.creeLe, demande.relanceeLe)
    : null;
  const jours = demande
    ? joursAvantPeremption(demande.creeLe, demande.relanceeLe)
    : 0;

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
      else setErreur(res.error ?? "—");
    });
  }

  function relancer() {
    setErreur(null);
    demarrer(async () => {
      const res = await relancerDemande(demande!.id);
      if (res.ok) setRelance(true);
      else setErreur(res.error ?? "—");
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
        {erreur && (
          <p className="text-[12.5px] text-[#C0392B] mb-2.5 leading-relaxed">{erreur}</p>
        )}

        {envoye || relance || etat === "enAttente" || etat === "bientot" ? (
          <p className="text-[13px] text-[#147A5C] bg-[#E4F3EC] rounded-[6px] px-4 py-3 leading-relaxed">
            {t("requestSent")}
            {demande && !envoye && (
              <span className="block text-[12px] text-[#3D7A63] mt-1">
                {t("requestPendingSince", { n: Math.max(0, jours) })}
              </span>
            )}
          </p>
        ) : etat === "expiree" ? (
          // Expirée : on le DIT, et on propose la relance dans le même bloc.
          // Laisser le bouton « Demander l'accès » créerait un doublon dont
          // personne ne verrait qu'il continue le premier.
          <div className="rounded-[6px] border border-[#F0C4AE] bg-[#FEFAF7] px-4 py-3">
            <p className="text-[13px] text-[#8A4B2C] leading-relaxed">
              {t("requestExpired", { jours: JOURS_AVANT_EXPIRATION })}
            </p>
            {relancable(demande!.statut, demande!.relanceeLe) ? (
              <button
                onClick={relancer}
                disabled={encours}
                className="mt-2.5 rounded-[6px] bg-[#E85C2B] px-4 py-2.5 text-[13px] font-[600] text-white hover:bg-[#D24E1F] disabled:opacity-60"
              >
                {t("requestRelaunch")}
              </button>
            ) : (
              // La relance est consommée. On ne propose pas d'en déposer une
              // autre : ce serait contourner la limite par la porte d'à côté.
              <p className="text-[12px] text-[#8B8FA3] mt-1.5 leading-relaxed">
                {t("requestRelaunchSpent")}
              </p>
            )}
          </div>
        ) : etat === "tranchee" ? (
          <p className="text-[13px] text-[#6E727A] bg-[#F1F0EB] rounded-[6px] px-4 py-3">
            {t("requestDecided")}
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
