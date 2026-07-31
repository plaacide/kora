"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  addRequirementAction,
  applyTemplateAction,
  detachProofAction,
  setRequirementStatusAction,
} from "@/app/v2/(workspace)/operations/[operationId]/preparation/actions";
import {
  actionLabel,
  compter,
  correspondAuFiltre,
  domaineLabel,
  grouper,
  sourceLabel,
  statutLabel,
  type ExigenceBrute,
  type FiltreExigences,
} from "@/features/v2/domain/preparation";
import type { RequirementDetail } from "@/features/v2/server/preparation";
import { EmptyArt } from "./EmptyArt";
import { Icon } from "./Icon";

function shortDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const FILTRES: Array<[FiltreExigences, string]> = [
  ["toutes", "Toutes"],
  ["a-traiter", "À traiter"],
  ["en-cours", "En cours"],
  ["pretes", "Prêtes"],
];

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
  const [busy, setBusy] = useState(false);

  const comptes = compter(requirements);
  const groupes = grouper(
    requirements.filter((item) => correspondAuFiltre(item.status, filtre)),
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
        <EmptyArt name="files" />
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
        <Link href="?new=1">Ajouter une exigence</Link>
        <span>
          <b>{comptes.pretes}</b> prête{comptes.pretes > 1 ? "s" : ""} ·{" "}
          <b>{comptes.aFournir}</b> à fournir · <b>{comptes.enCours}</b> en cours
        </span>
      </div>

      <div className="v2-preparation-list">
        {groupes.length === 0 && (
          <p className="v2-panel-note">Aucune exigence dans ce filtre.</p>
        )}

        {groupes.map((groupe) => (
          <section className="v2-requirement-group" key={groupe.category}>
            <header>
              <strong>{groupe.name}</strong>
              <span>
                {groupe.ready} sur {groupe.items.length} prête
                {groupe.ready > 1 ? "s" : ""}
              </span>
            </header>
            {groupe.items.map((item) => {
              const statut = statutLabel(item.status);

              return (
                <article className="v2-requirement-row" key={item.id}>
                  <Icon name="file" />
                  <div className="v2-requirement-copy">
                    <div>
                      <strong>{item.label}</strong>
                      <span className="v2-tag">{sourceLabel(item.category)}</span>
                      {item.folderName && (
                        <span className="v2-tag">{item.folderName}</span>
                      )}
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

const CATEGORIES: Array<[string, string]> = [
  ["ohada", domaineLabel("ohada")],
  ["financier", domaineLabel("financier")],
  ["dfi", domaineLabel("dfi")],
];

function AddRequirement({ operationId }: { operationId: string }) {
  const router = useRouter();
  const [category, setCategory] = useState("ohada");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function enregistrer() {
    setBusy(true);
    setErreur(null);
    const res = await addRequirementAction({
      operationId,
      category,
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
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              >
                {CATEGORIES.map(([valeur, nom]) => (
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
}: {
  operationId: string;
  requirement: RequirementDetail;
  history: ReadonlyArray<{ id: number; texte: string; actor: string; at: string }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const statut = statutLabel(requirement.status);

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
            <span className="v2-status" data-tone={statut.tone}>{statut.label}</span>
            <h2>{requirement.label}</h2>
          </div>
          <Link href="?" aria-label="Fermer">×</Link>
        </header>

        <div className="v2-sidepanel-body">
          <div className="v2-detail-grid">
            <div>
              <small>Domaine</small>
              <strong>{domaineLabel(requirement.category)}</strong>
            </div>
            <div>
              <small>Dossier attendu</small>
              <strong>{requirement.folderName ?? "Aucun"}</strong>
            </div>
          </div>

          {requirement.description && (
            <section>
              <small>Pourquoi cette pièce est demandée</small>
              <p>{requirement.description}</p>
            </section>
          )}

          <hr />

          <section>
            <small>Pièces associées</small>
            {requirement.proofDocuments.length === 0 ? (
              <p className="v2-panel-note">
                Aucune pièce n’est encore rattachée.{" "}
                {requirement.folderId ? (
                  <>
                    Déposez-la dans{" "}
                    <Link
                      href={`/v2/operations/${operationId}/documents/${encodeURIComponent(
                        requirement.folderName ?? "",
                      )}`}
                    >
                      {requirement.folderName}
                    </Link>{" "}
                    : Sanza proposera l’association, vous la confirmerez.
                  </>
                ) : (
                  <>
                    Déposez une pièce dans la data room : Sanza proposera
                    l’association, vous la confirmerez.
                  </>
                )}
              </p>
            ) : (
              <ul className="v2-proof-list">
                {requirement.proofDocuments.map((proof) => (
                  <li key={proof.id}>
                    <Icon name="file" />
                    <div>
                      <strong>{proof.name}</strong>
                      <small>
                        {proof.versionNo ? `v${proof.versionNo} · ` : ""}
                        rattachée le {shortDate(proof.linkedAt)}
                      </small>
                    </div>
                    <Link href={`/v2/documents/${proof.id}`}>Ouvrir</Link>
                    <button
                      disabled={busy === proof.id}
                      onClick={() => retirer(proof.id)}
                      type="button"
                    >
                      Retirer
                    </button>
                  </li>
                ))}
              </ul>
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
                    <span>{shortDate(entree.at)}</span>
                    {entree.actor} {entree.texte}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <footer className="v2-sidepanel-footer">
          {requirement.status !== "in_progress" && (
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
