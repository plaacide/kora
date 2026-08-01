"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { confirmV2Associations } from "@/app/v2/(workspace)/operations/[operationId]/documents/actions";
import { messageDErreur } from "@/features/v2/domain/erreurs";
import type { PendingAssociation } from "@/features/v2/server/documents";
import { Icon } from "./Icon";

/**
 * Écran 17 — confirmation des associations suggérées.
 * Repris de `sanza_handoff/maquettes/screens/17-confirmation-associations.html`.
 *
 * « Rien n'est associé sans validation », dit la note de la maquette : les
 * suggestions arrivent cochées, mais rien n'est écrit avant que le fondateur
 * confirme. Décocher suffit à refuser, et fermer le panneau ne laisse rien
 * derrière.
 *
 * Les propositions viennent de `domain/suggestions`, calculées contre les
 * seules exigences de cette opération. Les mots qui les ont produites sont
 * affichés : une suggestion qu'on ne peut pas expliquer ne se valide pas en
 * confiance.
 */

export function AssociationsPanel({
  operationId,
  pending,
  requirements,
  closeHref,
}: {
  operationId: string;
  pending: readonly PendingAssociation[];
  /** Toutes les exigences, pour choisir soi-même quand la suggestion ne va pas. */
  requirements: ReadonlyArray<{ id: string; label: string }>;
  closeHref: string;
}) {
  const router = useRouter();

  // Pré-cochées : la suggestion est un point de départ, pas une décision.
  const [choix, setChoix] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(
      pending.map((entry) => [
        entry.documentId,
        entry.suggestion?.requirementId ?? null,
      ]),
    ),
  );
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const retenues = Object.entries(choix).filter(([, requirementId]) => requirementId);

  async function confirmer() {
    setErreur(null);
    setBusy(true);

    const res = await confirmV2Associations({
      operationId,
      pairs: retenues.map(([documentId, requirementId]) => ({
        documentId,
        requirementId: requirementId as string,
      })),
    });

    setBusy(false);
    if (!res.ok) {
      const cause = messageDErreur(res.code);
      // Le lot s'arrête à la première association refusée, mais celles d'avant
      // sont enregistrées : le dire évite qu'on recommence tout.
      setErreur(
        res.confirmed > 0
          ? `${res.confirmed} association${res.confirmed > 1 ? "s" : ""} enregistrée${res.confirmed > 1 ? "s" : ""}, puis : ${cause}`
          : cause,
      );
      return;
    }

    router.push(closeHref);
    router.refresh();
  }

  return (
    <>
      <Link className="v2-scrim" href={closeHref} aria-label="Fermer le panneau" />
      <aside className="v2-sidepanel">
        <header>
          <div>
            <h2>
              {pending.length} pièce{pending.length > 1 ? "s" : ""} ajoutée
              {pending.length > 1 ? "s" : ""}
            </h2>
            <p>
              Sanza propose des associations d’après vos exigences. Vérifiez
              avant de confirmer.
            </p>
          </div>
          <Link href={closeHref} aria-label="Fermer">×</Link>
        </header>

        <div className="v2-sidepanel-body">
          {erreur && (
            <p className="v2-auth-error" role="alert">
              {erreur}
            </p>
          )}

          {pending.map((entry) => (
            <section className="v2-association-card" key={entry.documentId}>
              <div className="v2-association-file">
                <Icon name="file" />
                <b>{entry.documentName}</b>
              </div>

              {entry.suggestion ? (
                <label
                  className="v2-association-choice"
                  data-selected={
                    choix[entry.documentId] === entry.suggestion.requirementId
                  }
                >
                  <input
                    checked={
                      choix[entry.documentId] === entry.suggestion.requirementId
                    }
                    onChange={(event) =>
                      setChoix((current) => ({
                        ...current,
                        [entry.documentId]: event.target.checked
                          ? (entry.suggestion?.requirementId ?? null)
                          : null,
                      }))
                    }
                    type="checkbox"
                  />
                  <span>
                    <strong>{entry.suggestion.label}</strong>
                    <small>
                      Proposé d’après « {entry.suggestion.matched.join(" », « ")} »
                    </small>
                  </span>
                </label>
              ) : (
                <p className="v2-association-none">
                  Aucune exigence ne correspond au nom de cette pièce.
                </p>
              )}

              {/* Le choix manuel reste ouvert, y compris pour écarter la
                  suggestion au profit d'une autre exigence. */}
              <label className="v2-field v2-association-manuel">
                <span>
                  {entry.suggestion
                    ? "Ou choisir une autre exigence"
                    : "Choisir une exigence"}
                </span>
                <span className="v2-control">
                  <select
                    onChange={(event) =>
                      setChoix((current) => ({
                        ...current,
                        [entry.documentId]: event.target.value || null,
                      }))
                    }
                    value={choix[entry.documentId] ?? ""}
                  >
                    <option value="">Aucune pour l’instant</option>
                    {requirements.map((requirement) => (
                      <option key={requirement.id} value={requirement.id}>
                        {requirement.label}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
            </section>
          ))}

          <p className="v2-panel-note">
            Une pièce peut répondre à plusieurs exigences sans être dupliquée.
            Aucune association n’est définitive sans votre confirmation.
          </p>
        </div>

        <footer className="v2-sidepanel-footer">
          <Link href={closeHref}>Plus tard</Link>
          <button
            className="v2-btn"
            disabled={busy || retenues.length === 0}
            onClick={() => void confirmer()}
            type="button"
          >
            {busy
              ? "Enregistrement…"
              : `Confirmer ${retenues.length} association${retenues.length > 1 ? "s" : ""}`}
          </button>
        </footer>
      </aside>
    </>
  );
}
