"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { publierVitrine } from "@/app/actions/dealroom";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Table des entreprises d'une cohorte + barre de sélection (§2 de la spec).
 *
 * TRIÉE PAR RISQUE, pas par nom : ce qu'un programme vient chercher ici, c'est
 * qui décroche. L'ordre alphabétique enterrerait le cas urgent en milieu de
 * liste.
 *
 * La case de listage est INERTE sans consentement de l'entreprise. Ce n'est
 * pas qu'une politesse d'interface : la base refuse aussi de publier sans
 * consentement vivant ET dossier entamé. La case grise dit simplement pourquoi,
 * au lieu de laisser cliquer puis échouer.
 */

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

/** Seuils de la spec, nommés plutôt qu'écrits en dur dans le style. */
const PREPARATION_ROUGE = 45;
const PREPARATION_VERTE = 75;

export interface LigneEntreprise {
  orgId: string;
  nom: string;
  /** « Construction · Abidjan » sous le nom, comme la maquette. */
  secteur: string | null;
  pays: string | null;
  salles: number;
  recherche: number;
  preparation: number | null;
  /** Consentement vivant ET salle désignée : sans quoi rien n'est publiable. */
  consent: boolean;
  /** Consentement donné mais sans salle désignée — accord en attente. */
  consentPartiel: boolean;
  listee: boolean;
  /** Au moins une pièce déposée : seconde condition de publication. */
  dossierEntame: boolean;
}

type Filtre = "toutes" | "decrochent" | "listees";

export function CohorteTable({
  cohorteId,
  lignes,
  devise,
}: {
  cohorteId: string;
  lignes: LigneEntreprise[];
  devise: string;
}) {
  const t = useTranslations("cohorts");
  const router = useRouter();
  const [filtre, setFiltre] = useState<Filtre>("toutes");
  const [choix, setChoix] = useState<string[]>(
    lignes.filter((l) => l.listee).map((l) => l.orgId),
  );
  const [encours, demarrer] = useTransition();

  const argent = useMemo(
    () => new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }),
    [],
  );

  // Le risque, c'est la préparation la plus basse en premier. Une entreprise
  // sans aucun score passe AVANT celles qui en ont un : ne rien avoir commencé
  // est le cas le plus urgent, pas le plus neutre.
  const triees = useMemo(() => {
    const parRisque = [...lignes].sort(
      (a, b) => (a.preparation ?? -1) - (b.preparation ?? -1),
    );
    if (filtre === "decrochent") {
      // Même raison : une entreprise sans dossier ne « décroche » pas, elle
      // n'a pas commencé. La mêler aux vrais décrochages noierait le signal.
      return parRisque.filter(
        (l) => l.preparation !== null && l.preparation < PREPARATION_ROUGE,
      );
    }
    if (filtre === "listees") return parRisque.filter((l) => l.listee);
    return parRisque;
  }, [lignes, filtre]);

  const publiables = lignes.filter((l) => l.consent && l.dossierEntame);
  const enAttente = lignes.filter((l) => !l.consent).length;

  function basculer(orgId: string) {
    setChoix((c) => (c.includes(orgId) ? c.filter((x) => x !== orgId) : [...c, orgId]));
  }

  function mettreAJour() {
    demarrer(async () => {
      await publierVitrine(cohorteId, choix);
      router.refresh();
    });
  }

  const modifie =
    choix.length !== lignes.filter((l) => l.listee).length ||
    choix.some((o) => !lignes.find((l) => l.orgId === o)?.listee);

  return (
    <div>
      {/* Filtres */}
      <div className="flex items-center justify-between gap-3 mb-3.5 flex-wrap">
        <div className="flex items-center gap-2">
          {(
            [
              ["toutes", t("filterAll")],
              ["decrochent", t("filterDropping")],
              ["listees", t("filterListed")],
            ] as const
          ).map(([cle, libelle]) => (
            <button
              key={cle}
              onClick={() => setFiltre(cle)}
              aria-pressed={filtre === cle}
              className={
                "rounded-full border px-3.5 min-h-[30px] text-[12.5px] font-medium " +
                (filtre === cle
                  ? "border-[#E85C2B] bg-[#FDF1EA] text-[#C24619]"
                  : "border-[#E4E2DC] bg-white text-[#33353B] hover:border-[#C9C6BD]")
              }
            >
              {libelle}
            </button>
          ))}
        </div>
        <span style={mono} className="text-[10px] tracking-[0.08em] text-[#A0A3AB] uppercase">
          {t("sortedByRisk")}
        </span>
      </div>

      {/* Rien de listable : on le DIT, au lieu de le cacher dans l'info-bulle
          d'un bouton grisé — invisible au doigt, et muette sur le pourquoi.
          Les deux conditions sont nommées ; c'est ce qui rend l'écran
          actionnable plutôt que bloquant. */}
      {publiables.length === 0 && lignes.length > 0 && (
        <div className="rounded-[6px] border border-[#E2DED4] bg-white mb-3">
          <EmptyState
            inset
            title={t("nothingListableTitle")}
            description={t("nothingListableBody")}
          />
        </div>
      )}

      {/* Barre de sélection — teintée dès qu'une entreprise est cochée. */}
      <div
        className={
          "flex flex-wrap items-center gap-3 rounded-[6px] border px-4 py-3 mb-3 " +
          (choix.length > 0
            ? "bg-[#FEFAF7] border-[#F0C4AE]"
            : "bg-white border-[#E2DED4]")
        }
      >
        <span className="text-[12.5px] text-[#33353B]">
          {t("selection", { n: choix.length, total: lignes.length })}
          {enAttente > 0 && (
            <span className="text-[#B4741B]"> · {t("selectionPending", { n: enAttente })}</span>
          )}
        </span>
        <span className="ml-auto flex items-center gap-2.5">
          {choix.length > 0 && (
            <button
              onClick={() => setChoix([])}
              className="text-[12px] text-[#9DA0A8] underline underline-offset-2 hover:text-[#4A4E63]"
            >
              {t("clearAll")}
            </button>
          )}
          <button
            onClick={mettreAJour}
            disabled={encours || !modifie || publiables.length === 0}
            title={publiables.length === 0 ? t("nothingListable") : undefined}
            className="rounded-[5px] bg-[#E85C2B] px-3.5 py-2 text-[12.5px] font-[600] text-white hover:bg-[#D24E1F] disabled:bg-[#F1F0EB] disabled:text-[#A9ACBB]"
          >
            {t("updateShowcase")}
          </button>
        </span>
      </div>

      {/* En-tête */}
      <div
        style={mono}
        className="grid grid-cols-[30px_1.7fr_150px_120px_170px_150px] gap-3 px-2 pt-3 pb-2 border-b border-[#E2DED4] text-[9px] tracking-[0.08em] text-[#A0A3AB]"
      >
        <span />
        <span>{t("colCompany")}</span>
        <span>{t("colRooms")}</span>
        <span>{t("colSought")}</span>
        <span>{t("colReadiness")}</span>
        <span>{t("colStatus")}</span>
      </div>

      {triees.map((l) => {
        // PRÉPARATION NULLE ≠ PRÉPARATION ZÉRO. Une entreprise qui vient de
        // rejoindre n'a pas encore de salle : `preparation` est `null`. La
        // traiter comme 0 l'affichait « DÉCROCHE » en rouge le jour de son
        // arrivée — un reproche adressé à quelqu'un qui n'a rien eu le temps
        // de faire, et le premier signal que le programme lui envoie.
        const etat =
          l.preparation === null
            ? { libelle: t("stateNew"), cls: "text-[#1B6B8F] bg-[#E3F0F6]" }
            : l.preparation < PREPARATION_ROUGE
              ? { libelle: t("stateDropping"), cls: "text-[#C0392B] bg-[#FBE6E0]" }
              : l.preparation >= PREPARATION_VERTE
                ? { libelle: t("stateReady"), cls: "text-[#147A5C] bg-[#E4F3EC]" }
                : { libelle: t("stateGoing"), cls: "text-[#B4741B] bg-[#FBF1DF]" };

        return (
          <div
            key={l.orgId}
            className="bg-white grid grid-cols-[30px_1.7fr_150px_120px_170px_150px] gap-3 items-center px-2 py-3.5 border-b border-[#E8E5DC]"
          >
            <span className="justify-self-center">
              <input
                type="checkbox"
                checked={choix.includes(l.orgId)}
                onChange={() => basculer(l.orgId)}
                disabled={!l.consent}
                title={!l.consent ? t("consentMissing") : undefined}
                aria-label={l.nom}
                className="w-[17px] h-[17px] accent-[#E85C2B] disabled:cursor-not-allowed"
                style={!l.consent ? { background: "#F4F1EA" } : undefined}
              />
            </span>

            {/* Nom + badge sur la première ligne, secteur · ville en dessous.
                La maquette met « Construction · Abidjan » sous « CoolBricks » :
                c'est ce qui permet de reconnaître une entreprise sans avoir à
                ouvrir sa fiche. */}
            <span className="flex flex-col min-w-0 gap-0.5">
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="text-[13.5px] font-[600] truncate">{l.nom}</span>
                <span
                  style={mono}
                  className={"shrink-0 text-[8.5px] font-[700] tracking-[0.06em] rounded-[4px] px-2 py-[3px] " + etat.cls}
                >
                  {etat.libelle}
                </span>
              </span>
              {(l.secteur || l.pays) && (
                <span className="text-[11px] text-[#9DA0A8] truncate">
                  {[l.secteur, l.pays].filter(Boolean).join(" · ")}
                </span>
              )}
            </span>

            <span style={mono} className="text-[12.5px] text-[#55585F]">{l.salles}</span>
            <span style={mono} className="text-[12.5px] text-[#55585F]">
              {l.recherche > 0 ? (
                `${argent.format(l.recherche)} ${devise}`
              ) : (
                <span className="text-[#A9ACBB]">{t("notProvided")}</span>
              )}
            </span>

            <span>
              {l.preparation == null ? (
                <span className="text-[12.5px] text-[#9DA0A8]">—</span>
              ) : (
                <>
                  <span style={mono} className="text-[12px] text-[#55585F]">{l.preparation} %</span>
                  <span className="block h-1.5 rounded-full bg-[#E8E5DC] overflow-hidden mt-1">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${l.preparation}%`,
                        background:
                          l.preparation < PREPARATION_ROUGE
                            ? "#C0392B"
                            : l.preparation >= PREPARATION_VERTE
                              ? "#1D9E75"
                              : "#E85C2B",
                      }}
                    />
                  </span>
                </>
              )}
            </span>

            <span className="text-[12px]">
              {l.listee ? (
                <span style={mono} className="text-[8.5px] font-[700] tracking-[0.06em] text-[#147A5C] bg-[#E4F3EC] rounded-[4px] px-2 py-[3px]">
                  {t("inShowcase")}
                </span>
              ) : l.consentPartiel || !l.consent ? (
                <span className="text-[#B4741B]">{t("consentPending")}</span>
              ) : (
                <span className="text-[#9DA0A8]">{t("notListed")}</span>
              )}
            </span>
          </div>
        );
      })}

      <p className="text-[11.5px] text-[#8B8FA3] leading-relaxed mt-3">{t("tableNote")}</p>
    </div>
  );
}
