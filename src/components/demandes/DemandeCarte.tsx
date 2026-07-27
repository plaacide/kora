"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { deciderDemande } from "@/app/actions/demandes";
import {
  JOURS_AVANT_EXPIRATION,
  type EtatDemande,
} from "@/lib/demandes-echeance";

/**
 * Une demande d'accès, et les décisions qu'elle appelle (§5).
 *
 * LE BADGE EST LA PIÈCE MAÎTRESSE, pas une décoration. « MANDAT ACCORDÉ » et
 * « DÉCISION STARTUP » ne disent pas la même chose du même bouton orange :
 * dans un cas il ouvre la porte, dans l'autre il transmet une recommandation.
 * Un programme qui les confondrait croirait accorder alors qu'il propose — ou
 * l'inverse, ce qui serait pire.
 *
 * D'où deux jeux d'actions distincts, jamais le même libellé pour deux gestes
 * différents.
 *
 * UNE DEMANDE PÉRIMÉE NE SE DÉCIDE PLUS. L'état est calculé (§5 : 30 jours),
 * pas stocké — en base elle reste `pending`. Les boutons disparaissent alors
 * au lieu d'être grisés : un bouton grisé invite à chercher comment
 * l'activer, alors qu'ici il n'y a rien à faire de ce côté-ci. C'est
 * l'investisseur qui relance.
 */

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

export interface Demande {
  id: string;
  investisseur: string;
  organisation: string | null;
  entreprise: string;
  salle: string;
  instrument: "equity" | "dette" | "mezzanine" | null;
  jours: number;
  statut: string;
  sousMandat: boolean;
  /** Calculé par `etatDemande` côté serveur — jamais déduit du seul statut. */
  etat: EtatDemande;
  /** Jours avant péremption ; négatif une fois passée. */
  joursRestants: number;
}

export function DemandeCarte({ d }: { d: Demande }) {
  const t = useTranslations("requests");
  const router = useRouter();
  const [encours, demarrer] = useTransition();

  const decider = (decision: string) =>
    demarrer(async () => {
      await deciderDemande(d.id, decision);
      router.refresh();
    });

  const sigle =
    d.investisseur.trim().split(/\s+/).slice(0, 2).map((m) => m[0] ?? "").join("").toUpperCase() || "?";

  const instrument = d.instrument
    ? t(
        d.instrument === "dette"
          ? "instrDette"
          : d.instrument === "mezzanine"
            ? "instrMezzanine"
            : "instrEquity",
      )
    : null;

  const traitee = d.etat === "tranchee";
  const expiree = d.etat === "expiree";
  const libelleStatut: Record<string, string> = {
    recommended: t("statusRecommended"),
    forwarded: t("statusForwarded"),
    dismissed: t("statusDismissed"),
    granted: t("statusGranted"),
    refused: t("statusRefused"),
  };

  return (
    <div className="bg-white border border-[#E2DED4] rounded-[8px] px-5 py-4">
      <div className="flex items-start gap-3.5">
        <span className="grid place-items-center w-9 h-9 rounded-[8px] bg-[#F1F0EB] text-[11px] font-[700] text-[#4A4E63] shrink-0">
          {sigle}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[13.5px] font-[700]">{d.investisseur}</span>
            {d.organisation && (
              <span className="text-[12px] text-[#8B8FA3]">{d.organisation}</span>
            )}
            <span
              style={mono}
              className={
                "text-[8.5px] font-[700] tracking-[0.06em] rounded-[4px] px-2 py-[3px] " +
                (d.sousMandat
                  ? "text-[#147A5C] bg-[#E4F3EC]"
                  : "text-[#B4741B] bg-[#FBF1DF]")
              }
            >
              {d.sousMandat ? t("badgeMandate") : t("badgeStartup")}
            </span>
          </div>
          <p className="text-[12.5px] text-[#55585F] mt-1">
            {d.entreprise} · {t("room")} <span className="text-[#8B8FA3]">{d.salle}</span>
            {instrument && (
              <>
                {" · "}
                {t("wants")} <span className="font-[600]">{instrument}</span>
              </>
            )}
          </p>
          <span style={mono} className="block text-[10.5px] text-[#A0A3AB] mt-1">
            {t("age", { n: d.jours })}
          </span>
        </div>

        {traitee ? (
          <span style={mono} className="shrink-0 text-[8.5px] font-[700] tracking-[0.06em] text-[#6E727A] bg-[#F1F0EB] rounded-[4px] px-2 py-[3px]">
            {libelleStatut[d.statut] ?? d.statut}
          </span>
        ) : expiree ? (
          <span style={mono} className="shrink-0 text-[8.5px] font-[700] tracking-[0.06em] text-[#C0392B] bg-[#FBE6E0] rounded-[4px] px-2 py-[3px]">
            {t("statusExpired")}
          </span>
        ) : d.etat === "bientot" ? (
          // On prévient AVANT, pas au moment où il est trop tard : une file
          // qu'on découvre périmée est une file perdue.
          <span style={mono} className="shrink-0 text-[8.5px] font-[700] tracking-[0.06em] text-[#B4741B] bg-[#FBF1DF] rounded-[4px] px-2 py-[3px]">
            {t("expiresIn", { n: d.joursRestants })}
          </span>
        ) : null}
      </div>

      {expiree && (
        <p className="text-[12px] text-[#8A4B2C] bg-[#FEFAF7] border border-[#F0C4AE] rounded-[6px] px-3.5 py-2.5 mt-3.5 leading-relaxed">
          {t("expiredBody", { jours: JOURS_AVANT_EXPIRATION })}
        </p>
      )}

      {!traitee && !expiree && (
        <div className="mt-4 pt-3.5 border-t border-[#F0EDE4]">
          <div className="flex items-center gap-2.5 flex-wrap">
            {d.sousMandat ? (
              // Sous mandat, le bouton orange OUVRE. Il ne peut pas porter le
              // même libellé que celui qui transmet.
              <button
                onClick={() => decider("granted")}
                disabled={encours}
                className="rounded-[5px] bg-[#E85C2B] px-4 py-2 text-[12.5px] font-[600] text-white hover:bg-[#D24E1F] disabled:opacity-60"
              >
                {t("grant")}
              </button>
            ) : (
              <button
                onClick={() => decider("recommended")}
                disabled={encours}
                className="rounded-[5px] bg-[#E85C2B] px-4 py-2 text-[12.5px] font-[600] text-white hover:bg-[#D24E1F] disabled:opacity-60"
              >
                {t("recommend")}
              </button>
            )}
            <button
              onClick={() => decider("forwarded")}
              disabled={encours}
              className="border border-[#E4E2DC] rounded-[5px] px-4 py-2 text-[12.5px] font-[600] text-[#33353B] hover:border-[#C9C6BD] hover:bg-[#FAF8F4] disabled:opacity-60"
            >
              {t("forward")}
            </button>
            <button
              onClick={() => decider("dismissed")}
              disabled={encours}
              className="ml-auto text-[12.5px] font-[600] text-[#C0392B] hover:underline underline-offset-2 disabled:opacity-60"
            >
              {t("dismiss")}
            </button>
          </div>
          {!d.sousMandat && (
            <p className="text-[11.5px] text-[#8B8FA3] mt-2.5">{t("legend")}</p>
          )}
        </div>
      )}
    </div>
  );
}
