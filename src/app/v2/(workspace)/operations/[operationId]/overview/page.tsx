import Link from "next/link";

import {
  domaineLabel,
  etatAffiche,
  niveauLabel,
  sourceLabel,
  texteProchaineAction,
} from "@/features/v2/domain/preparation";
import { dateJournal, nomCourt } from "@/features/v2/domain/journal";
import { v2Routes } from "@/features/v2/navigation/routes";
import { operationOverview } from "@/features/v2/server/overview";
import { EmptyArt } from "@/features/v2/ui/EmptyArt";
import { Icon } from "@/features/v2/ui/Icon";
import { RowMenu } from "@/features/v2/ui/RowMenu";

/**
 * Écrans 08, 09 et 10 — la vue d'ensemble d'une opération.
 *
 * Un seul écran à trois moments : rien n'est fait, la préparation avance, la
 * data room est partagée. Les blocs apparaissent quand ils ont quelque chose à
 * dire — c'est le principe du handoff, « pas d'indicateurs à zéro ».
 *
 * Le pipeline investisseurs de la maquette 10 n'y est pas : `raise_investors`
 * est vide et l'écran Investisseurs n'existe pas encore. Un bloc de relation
 * sans relation ne dirait rien.
 */

function montant(valeur: number | null, devise: string | null): string | null {
  if (valeur === null) return null;
  return `${valeur.toLocaleString("fr-FR")} ${devise ?? ""}`.trim();
}

const OBJECTIFS: Record<string, string> = {
  levee: "Levée en capital",
  dette: "Dette bancaire",
  dfi: "Financement DFI",
  diligence: "Diligence",
};

export default async function OperationOverviewPage({
  params,
}: {
  params: Promise<{ operationId: string }>;
}) {
  const { operationId } = await params;
  const vue = await operationOverview(operationId);

  const { titre, explication } = texteProchaineAction(vue.action);
  const maintenant = new Date();

  // L'écran 08 : rien de déposé, personne d'invité. On ne montre alors NI
  // listes NI journal — annoncer « encore rien à suivre » et afficher trois
  // lignes d'activité juste en dessous se contredit dans la même page.
  const premierJour = vue.documentCount === 0 && vue.activeAccesses === 0;

  const dues = vue.compte.pretes + vue.compte.aFournir + vue.compte.aActualiser;
  const pourcentage = dues === 0 ? 0 : Math.round((vue.compte.pretes / dues) * 100);

  // Où mène le bouton principal, selon ce qu'il y a à faire.
  const lienAction =
    vue.action.type === "partager"
      ? `${v2Routes.operations.access(operationId)}?share=recipient`
      : vue.action.type === "referentiel" || vue.action.type === "rien"
        ? v2Routes.operations.preparation(operationId)
        : `${v2Routes.operations.preparation(operationId)}?exigence=${vue.action.exigence.id}`;

  const libelleAction =
    vue.action.type === "partager"
      ? "Créer un accès"
      : vue.action.type === "referentiel"
        ? "Poser le référentiel"
        : vue.action.type === "confirmer"
          ? "Confirmer l’association"
          : vue.action.type === "rien"
            ? "Voir le plan"
            : "Ouvrir l’exigence";

  return (
    <div className="v2-operation-page">
      <div className="v2-operation-heading">
        <div>
          <h1>{vue.operation.name}</h1>
          <p>
            <span>
              {OBJECTIFS[vue.operation.objectif ?? ""] ?? "Opération"}
            </span>
            {montant(vue.operation.amount, vue.operation.currency) && (
              <>
                <b>·</b>
                <span>{montant(vue.operation.amount, vue.operation.currency)}</span>
              </>
            )}
            {vue.operation.deadline && (
              <>
                <b>·</b>
                <span>
                  Échéance{" "}
                  {new Date(vue.operation.deadline).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </>
            )}
          </p>
        </div>
        <RowMenu
          href={v2Routes.operations.documents(operationId)}
          label={vue.operation.name}
        />
      </div>

      <section className="v2-next-action">
        <div>
          <span className="v2-section-label">Prochaine action</span>
          <h2>{titre}</h2>
          <p>{explication}</p>
          <div>
            <Link className="v2-btn" href={lienAction}>
              {libelleAction}
            </Link>
            <Link
              className="v2-btn"
              data-variant="secondary"
              href={v2Routes.operations.preparation(operationId)}
            >
              Voir le plan complet
            </Link>
          </div>
        </div>
      </section>

      <div className="v2-overview-grid">
        <section className="v2-content-card">
          <span className="v2-section-label">Progression</span>
          <h3>
            {vue.compte.pretes} sur {dues} exigence{dues > 1 ? "s" : ""} requise
            {dues > 1 ? "s" : ""} {dues > 1 ? "sont prêtes" : "est prête"}
          </h3>
          <div className="v2-progress">
            <span style={{ width: `${pourcentage}%` }} />
          </div>
          <div className="v2-overview-stats">
            <div>
              <b>{vue.compte.aFournir}</b>
              <span>à fournir</span>
            </div>
            <div>
              <b>{vue.compte.aActualiser}</b>
              <span>à actualiser</span>
            </div>
            <div>
              <b>
                {vue.recommandees.ready}/{vue.recommandees.due}
              </b>
              <span>recommandées prêtes</span>
            </div>
          </div>
        </section>

        <section className="v2-content-card">
          <span className="v2-section-label">Votre espace</span>
          <ul className="v2-fact-list">
            <li>
              <Icon name="shield" />
              {vue.activeAccesses === 0
                ? "Privé — aucun accès accordé"
                : `Partagé — ${vue.activeAccesses} accès actif${vue.activeAccesses > 1 ? "s" : ""}`}
            </li>
            <li>
              <Icon name="folder" />
              {vue.folderCount} dossier{vue.folderCount > 1 ? "s" : ""} préparé
              {vue.folderCount > 1 ? "s" : ""}, {vue.documentCount} pièce
              {vue.documentCount > 1 ? "s" : ""} déposée
              {vue.documentCount > 1 ? "s" : ""}
            </li>
            <li>
              <Icon name="file" />
              {vue.requirements.length === 0
                ? "Aucun référentiel appliqué"
                : `${vue.requirements.length} exigences au plan`}
            </li>
          </ul>
        </section>
      </div>

      {premierJour ? (
        <section className="v2-empty-inline">
          <EmptyArt name="documents" />
          <div>
            <strong>Encore rien à suivre — c’est normal.</strong>
            <p>
              L’activité récente et le suivi investisseurs apparaîtront ici dès
              qu’il y aura quelque chose à montrer — pas d’indicateurs à zéro.
            </p>
          </div>
        </section>
      ) : (
        <div className="v2-overview-grid">
          {vue.aTraiter.length > 0 && (
            <section className="v2-content-card">
              <header className="v2-card-header">
                <span className="v2-section-label">À traiter en priorité</span>
                <Link href={v2Routes.operations.preparation(operationId)}>
                  Plan complet →
                </Link>
              </header>
              <ul className="v2-overview-list">
                {vue.aTraiter.map((item) => {
                  const etat = etatAffiche(item, maintenant);
                  return (
                    <li key={item.id}>
                      <Link
                        href={`${v2Routes.operations.preparation(operationId)}?exigence=${item.id}`}
                      >
                        <strong>{item.label}</strong>
                        <small>
                          {niveauLabel(item.level)} ·{" "}
                          {item.sources.length
                            ? item.sources.map(sourceLabel).join(", ")
                            : domaineLabel(item.domain)}
                        </small>
                      </Link>
                      <span className="v2-status" data-tone={etat.tone}>
                        {etat.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {vue.recentDocuments.length > 0 && (
            <section className="v2-content-card">
              <header className="v2-card-header">
                <span className="v2-section-label">Dernières pièces déposées</span>
                <Link href={v2Routes.operations.documents(operationId)}>
                  Data room →
                </Link>
              </header>
              <ul className="v2-overview-list">
                {vue.recentDocuments.map((piece) => (
                  <li key={piece.id}>
                    <Link href={`/v2/documents/${piece.id}`}>
                      <strong>{nomCourt(piece.name, 34)}</strong>
                      <small>
                        {piece.folderName ?? "Racine"} · {dateJournal(piece.at)}
                      </small>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {!premierJour && vue.recentActivity.length > 0 && (
        <section className="v2-content-card">
          <header className="v2-card-header">
            <span className="v2-section-label">Activité récente</span>
            <Link href={v2Routes.operations.activity(operationId)}>
              Journal complet →
            </Link>
          </header>
          <ul className="v2-history-list">
            {vue.recentActivity.map((trace) => (
              <li key={trace.id}>
                <time>{dateJournal(trace.at)}</time>
                <span>·</span>
                <p>
                  <b>{trace.actor}</b> {trace.texte}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
