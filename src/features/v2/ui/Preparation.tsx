"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  confirmV2Associations,
  dismissV2Suggestion,
} from "@/app/v2/(workspace)/operations/[operationId]/documents/actions";
import {
  addRequirementAction,
  applyTemplateAction,
  attachProofAction,
  detachProofAction,
  setRequirementStatusAction,
} from "@/app/v2/(workspace)/operations/[operationId]/preparation/actions";
import {
  DOMAINES,
  actionLabel,
  compter,
  FILTRES,
  correspondAuFiltre,
  correspondAuFinanceur,
  domaineLabel,
  etatAffiche,
  etatPiece,
  grouper,
  niveauLabel,
  requises,
  sourceLabel,
  type ExigenceBrute,
  type FiltreExigences,
  type GroupePieces,
} from "@/features/v2/domain/preparation";
import { dateJournal } from "@/features/v2/domain/journal";
import type { RequirementDetail } from "@/features/v2/server/preparation";
import { EmptyMedallion } from "./EmptyArt";
import { Icon } from "./Icon";

/**
 * Le lien vers un dossier de la data room.
 *
 * La route est un chemin, pas un nom : chaque segment s'encode séparément,
 * sinon le « / » devient « %2F » et le chemin ne se découpe plus. Un lien
 * construit sur le seul nom du dossier rendait 404 dès que ce dossier était
 * un sous-dossier — ce qui est le cas de la plupart.
 */
function lienDossier(operationId: string, chemin: string): string {
  const segments = chemin.split(" / ").map(encodeURIComponent).join("/");
  return `/v2/operations/${operationId}/documents/${segments}`;
}

function shortDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Écran 11 — le plan de préparation, sur les exigences réelles. */
export function PreparationPlan({
  operationId,
  requirements,
  ajout,
}: {
  operationId: string;
  requirements: readonly ExigenceBrute[];
  /** Ouvert par `?new=1` — le bouton de l'en-tête pointe déjà là. */
  ajout: boolean;
}) {
  const router = useRouter();
  const [filtre, setFiltre] = useState<FiltreExigences>("toutes");
  const [financeur, setFinanceur] = useState("");
  const [busy, setBusy] = useState(false);

  // Une seule référence de temps : deux appels à `new Date()` dans la même
  // liste pourraient classer deux exigences différemment.
  const maintenant = new Date();

  // Les trois chiffres portent sur le REQUIS, comme la maquette : leur somme
  // est le nombre d’exigences qui bloquent un closing.
  const comptes = compter(requises(requirements), maintenant);
  const groupes = grouper(
    requirements.filter(
      (item) =>
        correspondAuFiltre(item, filtre, maintenant) &&
        correspondAuFinanceur(item, financeur),
    ),
  );

  async function poserLeReferentiel() {
    setBusy(true);
    const res = await applyTemplateAction(operationId);
    setBusy(false);
    if (res.ok) router.refresh();
  }

  if (requirements.length === 0) {
    return (
      <section className="v2-drop-empty">
        <EmptyMedallion icon="check" />
        <h2>Aucune exigence pour cette opération</h2>
        <p>
          Le référentiel OHADA pose vingt-deux exigences réparties en trois
          domaines, chacune rattachée au dossier où sa pièce se dépose. Vous
          pourrez en ajouter, en retirer, et suivre ce qui manque.
        </p>
        <div>
          <button
            className="v2-btn"
            disabled={busy}
            onClick={poserLeReferentiel}
            type="button"
          >
            {busy ? "Application…" : "Appliquer le référentiel"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Deux lignes : les filtres, puis le compte. Le bouton « Ajouter une
          exigence » n'est plus ici — il faisait doublon avec celui de
          l'en-tête, qui ouvre le même panneau. */}
      <div className="v2-filterbar">
        {FILTRES.map(([valeur, label]) => (
          <button
            data-active={filtre === valeur}
            key={valeur}
            onClick={() => setFiltre(valeur)}
            type="button"
          >
            {label}
          </button>
        ))}
        <i />
        <select
          aria-label="Filtrer par financeur"
          data-active={financeur !== ""}
          onChange={(event) => setFinanceur(event.target.value)}
          value={financeur}
        >
          <option value="">Par financeur</option>
          {["ohada", "bank", "dfi", "capital"].map((source) => (
            <option key={source} value={source}>
              {sourceLabel(source)}
            </option>
          ))}
        </select>
      </div>

      <p className="v2-filter-counts">
        <b>{comptes.pretes}</b> prête{comptes.pretes > 1 ? "s" : ""} ·{" "}
        <b>{comptes.aFournir}</b> à fournir · <b>{comptes.aActualiser}</b> à
        actualiser
      </p>

      <div className="v2-preparation-list">
        {groupes.length === 0 && (
          <p className="v2-panel-note">Aucune exigence dans ce filtre.</p>
        )}

        {groupes.map((groupe) => (
          <section className="v2-requirement-group" key={groupe.domain}>
            <header>
              <strong>{groupe.name}</strong>
              <span>
                {groupe.ready} sur {groupe.due} prête
                {groupe.ready > 1 ? "s" : ""}
              </span>
            </header>
            {groupe.items.map((item) => {
              const statut = etatAffiche(item, maintenant);

              return (
                <article className="v2-requirement-row" key={item.id}>
                  <Icon name="file" />
                  <div className="v2-requirement-copy">
                    <div>
                      <strong>{item.label}</strong>
                      <span
                        className="v2-tag"
                        data-level={item.level === "required" ? "required" : undefined}
                      >
                        {niveauLabel(item.level)}
                      </span>
                      {/* Qui réclame la pièce — plusieurs financeurs possibles,
                          ce que l'ancienne catégorie unique interdisait. */}
                      {item.sources.map((source) => (
                        <span className="v2-tag" key={source}>
                          {sourceLabel(source)}
                        </span>
                      ))}
                    </div>
                    <p>{item.description}</p>
                    {/* Une exigence peut porter une preuve sans être « prête » :
                        le statut suit une intention, la preuve un fait. Le dire
                        évite de lire « À préparer » à côté de « Voir la pièce »
                        comme une incohérence. */}
                    {item.proofs > 0 && (
                      <small>
                        {item.proofs} pièce{item.proofs > 1 ? "s" : ""} rattachée
                        {item.proofs > 1 ? "s" : ""} à cette exigence.
                      </small>
                    )}
                  </div>
                  <span className="v2-status" data-tone={statut.tone}>
                    {statut.label}
                  </span>
                  <Link
                    className="v2-btn"
                    data-variant="secondary"
                    href={`?exigence=${item.id}`}
                  >
                    {actionLabel(item)}
                  </Link>
                </article>
              );
            })}
          </section>
        ))}
      </div>

      {ajout && <AddRequirement operationId={operationId} />}
    </>
  );
}

const NIVEAUX: Array<[string, string]> = [
  ["required", "Requis"],
  ["recommended", "Recommandé"],
  ["optional", "Optionnel"],
];

function AddRequirement({ operationId }: { operationId: string }) {
  const router = useRouter();
  const [domain, setDomain] = useState(DOMAINES[0][0] as string);
  const [level, setLevel] = useState("required");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function enregistrer() {
    setBusy(true);
    setErreur(null);
    const res = await addRequirementAction({
      operationId,
      domain,
      level,
      label,
      description,
    });
    setBusy(false);

    if (!res.ok) {
      setErreur(res.error ?? "L’exigence n’a pas pu être ajoutée.");
      return;
    }

    // On referme en retirant le paramètre, pas en basculant un état local :
    // l'ouverture vient de l'URL, la fermeture doit y retourner.
    router.push(`/v2/operations/${operationId}/preparation`);
    router.refresh();
  }

  return (
    <>
      <Link aria-label="Fermer" className="v2-scrim" href="?" />
      <aside className="v2-sidepanel">
        <header>
          <div>
            <span className="v2-status" data-tone="neutral">Nouvelle exigence</span>
            <h2>Ajouter une exigence</h2>
          </div>
          <Link aria-label="Fermer" href="?">×</Link>
        </header>
        <div className="v2-sidepanel-body">
          {erreur && <p className="v2-auth-error" role="alert">{erreur}</p>}

          <label className="v2-field">
            <span>Domaine</span>
            <span className="v2-control">
              <select
                onChange={(event) => setDomain(event.target.value)}
                value={domain}
              >
                {DOMAINES.map(([valeur, nom]) => (
                  <option key={valeur} value={valeur}>{nom}</option>
                ))}
              </select>
            </span>
          </label>

          <label className="v2-field">
            <span>Niveau</span>
            <span className="v2-control">
              <select
                onChange={(event) => setLevel(event.target.value)}
                value={level}
              >
                {NIVEAUX.map(([valeur, nom]) => (
                  <option key={valeur} value={valeur}>{nom}</option>
                ))}
              </select>
            </span>
          </label>

          <label className="v2-field">
            <span>Intitulé</span>
            <span className="v2-control">
              <input
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Attestation de non-faillite"
                value={label}
              />
            </span>
          </label>

          <label className="v2-field">
            <span>Pourquoi cette pièce est demandée</span>
            <span className="v2-control">
              <textarea
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Ce que le financeur cherche à vérifier."
                rows={3}
                value={description}
              />
            </span>
          </label>

          <p className="v2-panel-note">
            Une exigence ajoutée à la main n’a pas de dossier suggéré : elle
            reste due, sans emplacement imposé.
          </p>
        </div>
        <footer className="v2-sidepanel-footer">
          <Link href="?">Annuler</Link>
          <button
            className="v2-btn"
            disabled={busy || label.trim().length < 2}
            onClick={enregistrer}
            type="button"
          >
            {busy ? "Ajout…" : "Ajouter l’exigence"}
          </button>
        </footer>
      </aside>
    </>
  );
}

/** Écran 12 — le panneau de détail d'une exigence. */
export function RequirementPanel({
  operationId,
  requirement,
  history,
  attachable,
}: {
  operationId: string;
  requirement: RequirementDetail;
  history: ReadonlyArray<{ id: number; texte: string; actor: string; at: string }>;
  /** Pièces rattachables, groupées par dossier comme la data room. */
  attachable: readonly GroupePieces[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [choisie, setChoisie] = useState("");
  // Le panneau montre le même état que la liste : un fondateur qui ouvre une
  // ligne « Pièce à confirmer » ne doit pas y lire « À préparer ».
  const statut = etatAffiche(requirement, new Date());

  async function rattacher(documentId: string) {
    setBusy(documentId);
    await attachProofAction({
      operationId,
      requirementId: requirement.id,
      documentId,
    });
    setBusy(null);
    setChoisie("");
    router.refresh();
  }

  async function changerStatut(status: string) {
    setBusy(status);
    await setRequirementStatusAction({
      operationId,
      requirementId: requirement.id,
      status,
    });
    setBusy(null);
    router.refresh();
  }

  async function confirmer(documentId: string) {
    setBusy(documentId);
    await confirmV2Associations({
      operationId,
      pairs: [{ documentId, requirementId: requirement.id }],
    });
    setBusy(null);
    router.refresh();
  }

  async function ecarter(documentId: string) {
    setBusy(documentId);
    await dismissV2Suggestion({
      operationId,
      requirementId: requirement.id,
      documentId,
    });
    setBusy(null);
    router.refresh();
  }

  async function retirer(documentId: string) {
    setBusy(documentId);
    await detachProofAction({
      operationId,
      requirementId: requirement.id,
      documentId,
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <>
      <Link className="v2-scrim" href="?" aria-label="Fermer le détail" />
      <aside className="v2-sidepanel">
        <header>
          <div>
            {/* La maquette met le niveau et les financeurs en étiquettes
                au-dessus du titre : c'est ce qu'on lit en premier d'une
                exigence, avant même son intitulé. */}
            <div className="v2-panel-tags">
              <span
                className="v2-tag"
                data-level={requirement.level === "required" ? "required" : undefined}
              >
                {niveauLabel(requirement.level)}
              </span>
              {requirement.sources.map((source) => (
                <span className="v2-tag" key={source}>
                  {sourceLabel(source)}
                </span>
              ))}
            </div>
            <h2>{requirement.label}</h2>
          </div>
          <Link href="?" aria-label="Fermer">×</Link>
        </header>

        <div className="v2-sidepanel-body">
          {requirement.description && (
            <section>
              <small>Pourquoi cette pièce est demandée</small>
              <p>{requirement.description}</p>
            </section>
          )}

          <div className="v2-detail-grid">
            {requirement.expectedPeriod && (
              <div>
                <small>Période attendue</small>
                <strong>{requirement.expectedPeriod}</strong>
              </div>
            )}
            {requirement.acceptedFormats && (
              <div>
                <small>Format accepté</small>
                <strong>{requirement.acceptedFormats}</strong>
              </div>
            )}
            <div>
              <small>Statut</small>
              <strong>{statut.label}</strong>
            </div>
            <div>
              <small>Domaine</small>
              <strong>{domaineLabel(requirement.domain)}</strong>
            </div>
            <div>
              <small>Dossier attendu</small>
              <strong>{requirement.folderName ?? "Aucun"}</strong>
            </div>
          </div>

          <hr />

          <section>
            <small>Pièces associées</small>
            {requirement.proofDocuments.length === 0 ? (
              // `v2-upload-zone` — la zone de dépôt du système : cadre
              // pointillé, icône en tête. Une phrase seule se lisait comme un
              // constat ; le cadre en fait une invitation, et il désigne
              // l'endroit où déposer.
              <section className="v2-upload-zone">
                <Icon name="file" />
                <strong>Aucune pièce n’est encore rattachée</strong>
                {requirement.folderId ? (
                  <span>
                    Déposez-la dans {requirement.folderName} : Sanza proposera
                    l’association, vous la confirmerez.
                  </span>
                ) : (
                  <span>
                    Déposez une pièce dans la data room : Sanza proposera
                    l’association, vous la confirmerez.
                  </span>
                )}
                {requirement.folderId && requirement.folderName && (
                  <Link
                    className="v2-btn"
                    data-variant="secondary"
                    href={`${lienDossier(operationId, requirement.folderName)}?upload=1`}
                  >
                    {/* Le dernier segment suffit au bouton : le chemin entier
                        est déjà écrit deux lignes plus haut. */}
                    Déposer dans {requirement.folderName.split(" / ").at(-1)}
                  </Link>
                )}
              </section>
            ) : (
              <ul className="v2-proof-list">
                {requirement.proofDocuments.map((proof) => (
                  <li data-pending={!proof.confirmed} key={proof.id}>
                    <Icon name="file" />
                    <div>
                      <strong>{proof.name}</strong>
                      <small>
                        {proof.versionNo ? `v${proof.versionNo} · ` : ""}
                        {proof.confirmed
                          ? `rattachée le ${shortDate(proof.linkedAt)}`
                          : `proposée par Sanza le ${shortDate(proof.linkedAt)}`}
                      </small>
                    </div>
                    {/* Un état PAR PIÈCE : dans un lot de trois exercices,
                        c'est souvent une seule qui a vieilli. */}
                    <span
                      className="v2-status"
                      data-tone={etatPiece(requirement, proof).tone}
                    >
                      {etatPiece(requirement, proof).label}
                    </span>
                    <Link href={`/v2/documents/${proof.id}`}>Ouvrir</Link>
                    {/* Une suggestion se confirme ou s'écarte ; une preuve
                        validée se retire. Le même bouton pour les deux
                        effacerait la différence entre « la machine propose »
                        et « quelqu'un a validé ». */}
                    {proof.confirmed ? (
                      <button
                        disabled={busy === proof.id}
                        onClick={() => retirer(proof.id)}
                        type="button"
                      >
                        Retirer
                      </button>
                    ) : (
                      <>
                        <button
                          disabled={busy === proof.id}
                          onClick={() => confirmer(proof.id)}
                          type="button"
                        >
                          Confirmer
                        </button>
                        <button
                          disabled={busy === proof.id}
                          onClick={() => ecarter(proof.id)}
                          type="button"
                        >
                          Écarter
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="v2-attach-proof">
            <small>Rattacher une pièce déjà déposée</small>
            {attachable.length === 0 ? (
              <p className="v2-panel-note">
                Toutes les pièces de la data room sont déjà rattachées à cette
                exigence. Déposez-en une nouvelle depuis la data room.
              </p>
            ) : (
              <div>
                <span className="v2-control">
                  {/* `optgroup` plutôt qu'un suffixe « — Financier » sur
                      chaque ligne : le dossier est écrit UNE fois, et la liste
                      se parcourt comme la data room. */}
                  <select
                    onChange={(event) => setChoisie(event.target.value)}
                    value={choisie}
                  >
                    <option value="">Choisir une pièce…</option>
                    {attachable.map((groupe) => (
                      <optgroup key={groupe.chemin} label={groupe.chemin}>
                        {groupe.pieces.map((piece) => (
                          <option key={piece.id} value={piece.id}>
                            {piece.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </span>
                <button
                  className="v2-btn"
                  data-variant="secondary"
                  disabled={!choisie || busy !== null}
                  onClick={() => rattacher(choisie)}
                  type="button"
                >
                  Rattacher
                </button>
              </div>
            )}
          </section>

          <hr />

          <section>
            <small>Historique</small>
            {history.length === 0 ? (
              <p className="v2-panel-note">
                Rien n’a encore été fait sur cette exigence.
              </p>
            ) : (
              <ul className="v2-history-list">
                {history.map((entree) => (
                  <li key={entree.id}>
                    <time>{dateJournal(entree.at)}</time>
                    <span>·</span>
                    <p>
                      <b>{entree.actor}</b> {entree.texte}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <footer className="v2-sidepanel-footer">
          {/* « Non applicable » est le seul des six états de la maquette qui
              soit une DÉCISION : il lui faut donc son geste. */}
          <button
            disabled={busy !== null}
            onClick={() =>
              changerStatut(
                requirement.status === "not_applicable" ? "todo" : "not_applicable",
              )
            }
            type="button"
          >
            {requirement.status === "not_applicable"
              ? "Rendre applicable"
              : "Marquer non applicable"}
          </button>
          {requirement.status !== "in_progress" &&
            requirement.status !== "not_applicable" && (
            <button
              disabled={busy !== null}
              onClick={() => changerStatut("in_progress")}
              type="button"
            >
              Marquer en cours
            </button>
          )}
          {requirement.status === "done" ? (
            <button
              className="v2-btn"
              data-variant="secondary"
              disabled={busy !== null}
              onClick={() => changerStatut("todo")}
              type="button"
            >
              Rouvrir l’exigence
            </button>
          ) : (
            <button
              className="v2-btn"
              disabled={busy !== null}
              onClick={() => changerStatut("done")}
              type="button"
            >
              Marquer prête
            </button>
          )}
        </footer>
      </aside>
    </>
  );
}
