"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { messageDErreur, type Resultat } from "@/features/v2/domain/erreurs";

import { demanderRenommage } from "./NomEditable";
import { ActionsMenu } from "./RowMenu";

/**
 * Le menu « ⋯ » d'une pièce — avec de vraies actions.
 *
 * CE QU'IL REMPLACE. `SampleRowMenu` affichait six libellés d'exemple dont
 * aucun n'agissait, « Supprimer » compris : on cliquait, le menu se fermait,
 * rien ne se passait. Une option destructrice qui semble marcher est le pire
 * cas possible — on la croit faite, on ne recommence pas, et le fichier reste.
 *
 * LES GESTES QUI CHANGENT QUELQUE CHOSE PASSENT PAR UN DIALOGUE. Renommer,
 * déplacer et supprimer demandent une décision ; les autres — masquer, marquer
 * comme clé — sont réversibles d'un clic et s'appliquent directement. La règle
 * est simple : on ouvre une fenêtre quand on a besoin d'une saisie ou d'un
 * avertissement, jamais pour faire « êtes-vous sûr ? ».
 */

export interface DossierChoix {
  id: string;
  nom: string;
}

type Dialogue = "deplacer" | "supprimer" | null;

export function DocumentMenu({
  documentId,
  dossierActuel,
  dossiers,
  estCle,
  masquee,
  nom,
  onDeplacer,
  onMarquerCle,
  onMasquer,
  onSupprimer,
  urlVisionneuse,
}: {
  documentId: string;
  dossierActuel: string | null;
  /** Les dossiers de l'opération, pour « Déplacer vers ». */
  dossiers: readonly DossierChoix[];
  estCle: boolean;
  masquee: boolean;
  nom: string;
  onDeplacer: (folderId: string | null) => Promise<Resultat>;
  onMarquerCle: (key: boolean) => Promise<Resultat>;
  onMasquer: (hidden: boolean) => Promise<Resultat>;
  onSupprimer: () => Promise<Resultat>;
  urlVisionneuse: string;
}) {
  const router = useRouter();
  const [dialogue, setDialogue] = useState<Dialogue>(null);
  const [cible, setCible] = useState<string>(dossierActuel ?? "");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function agir(action: () => Promise<Resultat>) {
    setEnvoi(true);
    setErreur(null);
    const resultat = await action();
    setEnvoi(false);
    if (!resultat.ok) {
      setErreur(messageDErreur(resultat.code));
      return;
    }
    setDialogue(null);
    router.refresh();
  }

  return (
    <>
      <ActionsMenu
        items={[
          { label: "Ouvrir", href: urlVisionneuse, icon: "eye" },
          {
            label: "Renommer",
            icon: "pencil",
            // LE MÊME GESTE QUE LE CLIC SUR LE NOM, pas une fenêtre de plus.
            // Deux chemins vers une même action doivent aboutir au même
            // endroit : sinon on apprend deux façons de renommer, dont l'une
            // fait perdre de vue la ligne qu'on modifie.
            onSelect: () => demanderRenommage(documentId),
          },
          {
            label: "Déplacer vers…",
            icon: "move",
            onSelect: () => {
              setCible(dossierActuel ?? "");
              setErreur(null);
              setDialogue("deplacer");
            },
          },
          {
            label: estCle ? "Retirer des pièces clés" : "Marquer comme pièce clé",
            icon: "star",
            onSelect: () => void agir(() => onMarquerCle(!estCle)),
          },
          {
            label: masquee ? "Rendre visible aux invités" : "Masquer aux invités",
            icon: masquee ? "eye" : "eye-off",
            onSelect: () => void agir(() => onMasquer(!masquee)),
          },
          {
            label: "Supprimer",
            icon: "trash",
            destructive: true,
            separateur: true,
            onSelect: () => {
              setErreur(null);
              setDialogue("supprimer");
            },
          },
        ]}
        label={nom}
      />

      {dialogue && (
        <>
          <button
            aria-label="Fermer"
            className="v2-scrim"
            onClick={() => setDialogue(null)}
            type="button"
          />
          <div aria-modal="true" className="v2-dialog" role="dialog">
            {dialogue === "deplacer" && (
              <>
                <h2>Déplacer « {nom} »</h2>
                {/* LA CONSÉQUENCE QUI COMPTE, dite avant le geste : les
                    partages portent sur les DOSSIERS. Déplacer une pièce
                    change donc qui la voit — c'est rarement ce qu'on a en
                    tête en la rangeant. */}
                <p>
                  Les accès se donnent par dossier : déplacer cette pièce change
                  qui peut la consulter.
                </p>
                <label className="v2-field" data-wide="true">
                  <span>Dossier de destination</span>
                  <span className="v2-control">
                    <select
                      onChange={(event) => setCible(event.target.value)}
                      value={cible}
                    >
                      <option value="">Hors dossier — visible de l’équipe seule</option>
                      {dossiers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nom}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
              </>
            )}

            {dialogue === "supprimer" && (
              <>
                <h2>Supprimer « {nom} » ?</h2>
                <p>
                  La pièce et son historique de versions disparaissent de cette
                  opération. Si elle répondait à une exigence de votre plan,
                  celle-ci redeviendra à fournir.
                </p>
                {/* On ne promet PAS un effacement qui n'a pas lieu. Aucune
                    cascade en base ne touche le fichier stocké — le dire vaut
                    mieux que de laisser croire à une destruction complète. */}
                <p className="v2-dialog-note">
                  Le fichier d’origine reste conservé sur nos serveurs. Pour un
                  effacement définitif, écrivez-nous.
                </p>
              </>
            )}

            {erreur && (
              <p className="v2-auth-error" role="alert">
                {erreur}
              </p>
            )}

            <footer>
              {dialogue === "supprimer" ? (
                <button
                  className="v2-btn v2-btn-danger"
                  disabled={envoi}
                  onClick={() => void agir(onSupprimer)}
                  type="button"
                >
                  {envoi ? "Suppression…" : "Supprimer"}
                </button>
              ) : (
                <button
                  className="v2-btn"
                  disabled={envoi}
                  onClick={() => void agir(() => onDeplacer(cible || null))}
                  type="button"
                >
                  {envoi ? "…" : "Déplacer"}
                </button>
              )}
              <button
                className="v2-btn v2-btn-grey"
                disabled={envoi}
                onClick={() => setDialogue(null)}
                type="button"
              >
                Annuler
              </button>
            </footer>
          </div>
        </>
      )}
    </>
  );
}

/**
 * Le menu « ⋯ » d'un dossier.
 *
 * La suppression ne cascade JAMAIS depuis ce menu : `delete_folder` refuse un
 * dossier non vide, et c'est le comportement qu'on veut. Emporter des pièces
 * par surprise en supprimant un rangement serait la pire façon de perdre un
 * document.
 */
export function FolderMenu({
  contient,
  folderId,
  nom,
  onCreerSous,
  onSupprimer,
  urlOuvrir,
}: {
  /** Nombre de pièces dans le dossier — décide si la suppression est possible. */
  contient: number;
  /** L'identifiant, pour viser le bon nom lors du renommage sur place. */
  folderId: string;
  nom: string;
  onCreerSous: (nom: string) => Promise<Resultat>;
  onSupprimer: () => Promise<Resultat>;
  urlOuvrir: string;
}) {
  const router = useRouter();
  // Plus de « renommer » : le nom du dossier s'édite sur place, comme celui
  // d'une pièce. Ne restent que les deux gestes qui demandent une saisie
  // nouvelle ou un avertissement.
  const [dialogue, setDialogue] = useState<"sous" | "supprimer" | null>(null);
  const [saisie, setSaisie] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function agir(action: () => Promise<Resultat>) {
    setEnvoi(true);
    setErreur(null);
    const resultat = await action();
    setEnvoi(false);
    if (!resultat.ok) {
      setErreur(messageDErreur(resultat.code));
      return;
    }
    setDialogue(null);
    router.refresh();
  }

  return (
    <>
      <ActionsMenu
        items={[
          { label: "Ouvrir", href: urlOuvrir, icon: "folder" },
          {
            label: "Renommer",
            icon: "pencil",
            onSelect: () => demanderRenommage(folderId),
          },
          {
            label: "Nouveau sous-dossier",
            icon: "folder-plus",
            onSelect: () => {
              setSaisie("");
              setErreur(null);
              setDialogue("sous");
            },
          },
          {
            label: "Supprimer",
            icon: "trash",
            destructive: true,
            separateur: true,
            onSelect: () => {
              setErreur(null);
              setDialogue("supprimer");
            },
          },
        ]}
        label={nom}
      />

      {dialogue && (
        <>
          <button
            aria-label="Fermer"
            className="v2-scrim"
            onClick={() => setDialogue(null)}
            type="button"
          />
          <div aria-modal="true" className="v2-dialog" role="dialog">
            {dialogue !== "supprimer" ? (
              <>
                <h2>Nouveau dossier dans « {nom} »</h2>
                <label className="v2-field" data-wide="true">
                  <span>Nom</span>
                  <span className="v2-control">
                    <input
                      autoFocus
                      onChange={(event) => setSaisie(event.target.value)}
                      placeholder="Juridique, Finances…"
                      value={saisie}
                    />
                  </span>
                </label>
              </>
            ) : contient > 0 ? (
              <>
                <h2>Ce dossier n’est pas vide</h2>
                <p>
                  Il contient {contient} pièce{contient > 1 ? "s" : ""}. Déplacez-les
                  ailleurs avant de le supprimer — un rangement ne doit jamais
                  emporter ce qu’il range.
                </p>
              </>
            ) : (
              <>
                <h2>Supprimer « {nom} » ?</h2>
                <p>
                  Le dossier est vide. Les accès qui le désignaient deviendront
                  sans objet.
                </p>
              </>
            )}

            {erreur && (
              <p className="v2-auth-error" role="alert">
                {erreur}
              </p>
            )}

            <footer>
              {dialogue === "supprimer" ? (
                contient === 0 && (
                  <button
                    className="v2-btn v2-btn-danger"
                    disabled={envoi}
                    onClick={() => void agir(onSupprimer)}
                    type="button"
                  >
                    {envoi ? "Suppression…" : "Supprimer"}
                  </button>
                )
              ) : (
                <button
                  className="v2-btn"
                  disabled={envoi}
                  onClick={() => void agir(() => onCreerSous(saisie))}
                  type="button"
                >
                  {envoi ? "…" : "Créer"}
                </button>
              )}
              <button
                className="v2-btn v2-btn-grey"
                disabled={envoi}
                onClick={() => setDialogue(null)}
                type="button"
              >
                {dialogue === "supprimer" && contient > 0 ? "Fermer" : "Annuler"}
              </button>
            </footer>
          </div>
        </>
      )}
    </>
  );
}
