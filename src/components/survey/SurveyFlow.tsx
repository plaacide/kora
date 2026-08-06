"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  SurveyCard,
  SurveyProgress,
  SurveyChip,
  SurveyPrimary,
  SurveyExit,
} from "./SurveyCard";
import {
  demarrerEnquete,
  refuserEnquete,
  repondreEnquete,
  reporterEnquete,
  terminerEnquete,
} from "@/app/actions/survey";
import { baremePour, libellePalier, valeurPalier } from "@/lib/survey-pricing";

/**
 * Les cinq écrans de l'enquête (§4). Le carton et ses pièces viennent de
 * `SurveyCard` ; ici, uniquement l'enchaînement et les réponses.
 *
 * Une écriture PAR ÉCRAN VALIDÉ (§5), jamais une seule à la fin : un abandon
 * en cours de route doit laisser en base ce qui a déjà été dit. C'est aussi
 * pour cela que l'écran 0 est le seul à créer la ligne — afficher le carton
 * n'est pas un consentement (§0.6).
 */

const FRICTIONS = [
  { cle: "document", label: "frictionDoc" },
  { cle: "readiness", label: "frictionReadiness" },
  { cle: "invitation", label: "frictionInvite" },
  { cle: "vocabulaire", label: "frictionWording" },
  { cle: "lenteur", label: "frictionSlow" },
  { cle: "aucune", label: "frictionNone" },
] as const;

/** « Rien de particulier » : exclusif des autres, dans les deux sens. */
const AUCUNE = "aucune";

const HUMEURS = [
  { cle: "fluide", t: "moodFluide", s: "moodFluideSub" },
  { cle: "correct", t: "moodCorrect", s: "moodCorrectSub" },
  { cle: "bloque", t: "moodBloque", s: "moodBloqueSub" },
] as const;

const TITRE_ID = "sz-enquete-titre";

export function SurveyFlow({
  minutes,
  pays,
  onFermer,
}: {
  minutes: number;
  pays: string | null;
  onFermer: () => void;
}) {
  const t = useTranslations("survey");
  const locale = useLocale();
  const [ecran, setEcran] = useState(0);
  const [id, setId] = useState<number | null>(null);
  const [humeur, setHumeur] = useState<string | null>(null);
  const [frictions, setFrictions] = useState<string[]>([]);
  const [juste, setJuste] = useState<string | null>(null);
  const [tropCher, setTropCher] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const titreRef = useRef<HTMLHeadingElement>(null);

  const bareme = baremePour(pays);

  // Le focus se pose sur le titre de l'écran courant (§6) — jamais volé
  // pendant que l'utilisateur tape ailleurs : `preventScroll` évite en plus de
  // faire sauter la page vers le carton.
  useEffect(() => {
    const actif = document.activeElement;
    const saisieEnCours =
      actif instanceof HTMLInputElement ||
      actif instanceof HTMLTextAreaElement ||
      (actif instanceof HTMLElement && actif.isContentEditable);
    if (!saisieEnCours) titreRef.current?.focus({ preventScroll: true });
  }, [ecran]);

  async function plusTard() {
    await reporterEnquete();
    onFermer();
  }

  async function neJamaisDemander() {
    await refuserEnquete();
    onFermer();
  }

  async function accepter() {
    const nouveau = await demarrerEnquete(minutes);
    setId(nouveau);
    setEcran(1);
  }

  function choisirHumeur(cle: string) {
    setHumeur(cle);
    if (id) void repondreEnquete({ id, mood: cle });
    // Avance seule : la sélection EST la réponse, un bouton « Continuer »
    // demanderait de confirmer un choix déjà fait.
    setTimeout(() => setEcran(2), 220);
  }

  function basculerFriction(cle: string) {
    setFrictions((cur) => {
      if (cle === AUCUNE) return cur.includes(AUCUNE) ? [] : [AUCUNE];
      const sans = cur.filter((c) => c !== AUCUNE);
      return sans.includes(cle) ? sans.filter((c) => c !== cle) : [...sans, cle];
    });
  }

  function validerFrictions(valeurs: string[]) {
    if (id) void repondreEnquete({ id, frictions: valeurs });
    // On ne demande pas un prix à quelqu'un en difficulté : sa réponse ne
    // dirait rien du prix, seulement de sa frustration. On saute l'écran 3.
    const enDifficulte = humeur === "bloque" && valeurs.filter((v) => v !== AUCUNE).length >= 2;
    setEcran(enDifficulte ? 4 : 3);
  }

  function validerPrix() {
    if (id && juste && tropCher) {
      void repondreEnquete({ id, priceFair: juste, priceTooHigh: tropCher });
    }
    setEcran(4);
  }

  async function envoyer(avecCommentaire: boolean) {
    if (id) {
      if (avecCommentaire && commentaire.trim()) {
        await repondreEnquete({ id, comment: commentaire.trim() });
      }
      await terminerEnquete(id);
    }
    setEcran(5);
  }

  const grand = ecran >= 1 && ecran <= 4;
  const titre = "text-[15px] font-[700] text-[#1A1B1F] outline-none";

  return (
    <SurveyCard large={grand} titreId={TITRE_ID} onPlusTard={plusTard}>
      {grand && (
        <SurveyProgress
          etape={ecran}
          total={4}
          labelPlusTard={t("later")}
          onPlusTard={plusTard}
        />
      )}

      {/* 0 — invitation. Rien n'est écrit en base tant qu'elle n'est pas acceptée. */}
      {ecran === 0 && (
        <>
          <span className="grid place-items-center w-9 h-9 rounded-[8px] bg-[#FDF1EA] text-[#C44518] mb-3" aria-hidden>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 21l1.9-5A8.4 8.4 0 0 1 4 11.5a8.4 8.4 0 0 1 8.5-8.4h.5a8.4 8.4 0 0 1 8 8.4z" />
            </svg>
          </span>
          <h2 id={TITRE_ID} ref={titreRef} tabIndex={-1} className={titre}>{t("inviteTitle")}</h2>
          <p className="text-[12.5px] text-[#6E727A] mt-1.5 leading-relaxed">{t("inviteBody")}</p>
          <div className="flex items-center justify-between mt-4">
            <SurveyExit onClick={plusTard}>{t("later")}</SurveyExit>
            <SurveyPrimary onClick={accepter}>{t("agree")}</SurveyPrimary>
          </div>
        </>
      )}

      {/* 1 — humeur. Trois cartes cliquables en entier, pas trois radios. */}
      {ecran === 1 && (
        <>
          <h2 id={TITRE_ID} ref={titreRef} tabIndex={-1} className={titre}>{t("moodTitle")}</h2>
          <div className="flex flex-col gap-2 mt-3.5">
            {HUMEURS.map((h) => (
              <button
                key={h.cle}
                type="button"
                onClick={() => choisirHumeur(h.cle)}
                aria-pressed={humeur === h.cle}
                className={
                  "text-left rounded-[8px] border px-3.5 py-2.5 " +
                  (humeur === h.cle
                    ? "border-[#FF5A1F] bg-[#FDF1EA]"
                    : "border-[#E4E2DC] bg-white hover:border-[#C9C6BD]")
                }
              >
                <span className="block text-[13px] font-[650] text-[#1A1B1F]">{t(h.t)}</span>
                <span className="block text-[11.5px] text-[#9DA0A8] mt-0.5">{t(h.s)}</span>
              </button>
            ))}
          </div>
          <div className="mt-4">
            <SurveyExit onClick={neJamaisDemander}>{t("neverAsk")}</SurveyExit>
          </div>
        </>
      )}

      {/* 2 — frictions. */}
      {ecran === 2 && (
        <>
          <h2 id={TITRE_ID} ref={titreRef} tabIndex={-1} className={titre}>{t("frictionTitle")}</h2>
          <p className="text-[12px] text-[#9DA0A8] mt-1">{t("frictionHint")}</p>
          <div className="flex flex-wrap gap-2 mt-3.5">
            {FRICTIONS.map((f) => (
              <SurveyChip key={f.cle} actif={frictions.includes(f.cle)} onClick={() => basculerFriction(f.cle)}>
                {t(f.label)}
              </SurveyChip>
            ))}
          </div>
          <div className="flex items-center justify-between mt-5">
            <SurveyExit onClick={() => validerFrictions([])}>{t("skip")}</SurveyExit>
            <SurveyPrimary onClick={() => validerFrictions(frictions)} disabled={frictions.length === 0}>
              {t("continue")}
            </SurveyPrimary>
          </div>
        </>
      )}

      {/* 3 — prix. Barème selon le pays de la startup, jamais figé en FCFA. */}
      {ecran === 3 && (
        <>
          <h2 id={TITRE_ID} ref={titreRef} tabIndex={-1} className={titre}>{t("priceTitle")}</h2>
          <p className="text-[12px] text-[#6E727A] mt-1.5 leading-relaxed">{t("priceIntro")}</p>

          {[
            { titre: t("priceFair"), aide: t("priceFairHint"), val: juste, set: setJuste },
            { titre: t("priceHigh"), aide: t("priceHighHint"), val: tropCher, set: setTropCher },
          ].map((q) => (
            <div key={q.titre} className="mt-4">
              <div className="text-[12.5px] font-[600] text-[#33353B]">{q.titre}</div>
              <div className="text-[11.5px] text-[#9DA0A8] mt-0.5 leading-snug">{q.aide}</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {bareme.paliers.map((p) => {
                  const v = valeurPalier(p, bareme.devise);
                  return (
                    <SurveyChip key={v} actif={q.val === v} onClick={() => q.set(v)}>
                      {libellePalier(p, bareme.devise, locale)}
                    </SurveyChip>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between mt-5">
            <SurveyExit onClick={() => setEcran(4)}>{t("priceDecline")}</SurveyExit>
            <SurveyPrimary onClick={validerPrix} disabled={!juste || !tropCher}>
              {t("continue")}
            </SurveyPrimary>
          </div>
        </>
      )}

      {/* 4 — champ libre. */}
      {ecran === 4 && (
        <>
          <h2 id={TITRE_ID} ref={titreRef} tabIndex={-1} className={titre}>{t("commentTitle")}</h2>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={3}
            placeholder={t("commentPlaceholder")}
            className="w-full mt-3 px-3 py-2 text-[12.5px] bg-white border border-[#E4E2DC] rounded-[6px] resize-none focus:outline-none focus:border-[#C9C6BD]"
          />
          <div className="flex items-center justify-between mt-4">
            <SurveyExit onClick={() => envoyer(false)}>{t("sendWithout")}</SurveyExit>
            <SurveyPrimary onClick={() => envoyer(true)}>{t("send")}</SurveyPrimary>
          </div>
        </>
      )}

      {/* 5 — remerciement. */}
      {ecran === 5 && (
        <>
          <span className="grid place-items-center w-9 h-9 rounded-full bg-[#FF5A1F] text-white mb-3" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <h2 id={TITRE_ID} ref={titreRef} tabIndex={-1} className={titre}>{t("thanksTitle")}</h2>
          <p className="text-[12.5px] text-[#6E727A] mt-1.5 leading-relaxed">{t("thanksBody")}</p>
          <div className="flex justify-end mt-4">
            <SurveyPrimary onClick={onFermer}>{t("close")}</SurveyPrimary>
          </div>
        </>
      )}
    </SurveyCard>
  );
}
