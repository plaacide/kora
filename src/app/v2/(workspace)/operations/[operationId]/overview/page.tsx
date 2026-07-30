import { OverviewPreparation, OverviewShared } from "@/features/v2/ui/OverviewStates";
import { EmptyArt } from "@/features/v2/ui/EmptyArt";
import Link from "next/link";

import { Icon } from "@/features/v2/ui/Icon";
import { SampleRowMenu } from "@/features/v2/ui/RowMenu";
import { v2Routes } from "@/features/v2/navigation/routes";

export default async function OperationOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ operationId: string }>;
  searchParams: Promise<{ etat?: string }>;
}) {
  const { operationId } = await params;
  const { etat } = await searchParams;

  // Les trois états de la vue d'ensemble : arrivée (08), préparation (09) et
  // dossier partagé (10).
  if (etat === "preparation") return <OverviewPreparation />;
  if (etat === "partagee") return <OverviewShared />;

  return (
    <div className="v2-operation-page">
      <div className="v2-operation-heading">
        <div>
          <h1>Série A 2026</h1>
          <p>
            <span>Levée en capital</span><b>·</b>
            <span>500 000 000 XOF</span><b>·</b>
            <span>Échéance 30 novembre 2026</span>
          </p>
        </div>
        <SampleRowMenu label="Série A 2026" />
      </div>

      <section className="v2-next-action">
        <div>
          <span className="v2-section-label">Prochaine action</span>
          <h2>Déposer les statuts à jour</h2>
          <p>
            C’est la première pièce requise du domaine Société et immatriculation —
            elle conditionne la vérification des autres documents juridiques.
          </p>
          <div>
            <Link
              className="v2-btn"
              href={v2Routes.operations.documents(operationId, ["Société et immatriculation"])}
            >
              Déposer la pièce
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
          <h3>0 sur 24 exigences requises sont prêtes</h3>
          <div className="v2-progress"><span style={{ width: "0%" }} /></div>
          <p>
            24 à fournir · 13 recommandées vous attendent. Commencez par les pièces
            prioritaires — votre plan est déjà organisé par domaine.
          </p>
        </section>
        <section className="v2-content-card">
          <span className="v2-section-label">Votre espace</span>
          <ul className="v2-fact-list">
            <li><Icon name="shield" />Privé — aucun accès accordé</li>
            <li><Icon name="folder" />8 dossiers préparés, 0 pièce déposée</li>
            <li><Icon name="file" />Modèle OHADA — Sénégal appliqué</li>
          </ul>
        </section>
      </div>

      <section className="v2-empty-inline">
        <EmptyArt name="documents" />
        <div>
          <strong>Encore rien à suivre — c’est normal.</strong>
          <p>
            L’activité récente et le suivi investisseurs apparaîtront ici dès qu’il
            y aura quelque chose à montrer — pas d’indicateurs à zéro.
          </p>
        </div>
      </section>
    </div>
  );
}
