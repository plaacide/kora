import {
  planCatalog,
  workspaceConsumption,
  workspaceEntitlements,
  workspacePlan,
  workspaceSubscription,
} from "@/features/v2/billing/entitlements";
import { listOperations } from "@/features/v2/server/operations";
import { requireV2Workspace } from "@/features/v2/server/session";
import { Standalone } from "@/features/v2/ui/Shell";
import {
  SubscriptionScreen,
  type OperationComptee,
} from "@/features/v2/ui/Subscription";

/**
 * Écran 68 — l'abonnement de l'organisation.
 *
 * L'écran affichait quatre opérations et quatre plans écrits en dur, à une
 * adresse que personne ne pouvait atteindre. Tout ce qu'il montre est
 * désormais lu : le plan, ses droits, l'usage réel.
 */
export default async function AbonnementPage() {
  const { organization } = await requireV2Workspace();

  const [plan, abonnement, consommation, droits, catalogue, operations] =
    await Promise.all([
      workspacePlan(organization.id),
      workspaceSubscription(organization.id),
      workspaceConsumption(organization.id),
      workspaceEntitlements(organization.id),
      planCatalog(),
      listOperations(organization.id),
    ]);

  // Une archive ne compte pas dans la limite, et c'est ce qui la rend tenable :
  // le fondateur n'a pas à choisir entre garder une trace et ouvrir un tour.
  const comptees: OperationComptee[] = operations.map((o) => ({
    id: o.id,
    nom: o.name,
    detail:
      o.lifecycle === "archived"
        ? "Archivée · lecture seule"
        : `${o.preparation} % prête`,
    comptee: o.lifecycle !== "archived",
  }));

  return (
    <Standalone search={false} title="Abonnement">
      <SubscriptionScreen
        abonnement={abonnement}
        catalogue={catalogue}
        consommation={consommation}
        droits={droits}
        operations={comptees}
        plan={plan}
      />
    </Standalone>
  );
}
