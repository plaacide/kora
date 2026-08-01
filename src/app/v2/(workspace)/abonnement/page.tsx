import {
  planCatalog,
  workspaceConsumption,
  workspaceEntitlements,
  workspacePlan,
  workspaceSubscription,
} from "@/features/v2/billing/entitlements";
import { listOperations } from "@/features/v2/server/operations";
import { verifierPaiementEnAttente } from "@/features/v2/server/paiement";
import { requireV2Workspace } from "@/features/v2/server/session";
import { Standalone } from "@/features/v2/ui/Shell";
import {
  SubscriptionScreen,
  type OperationComptee,
} from "@/features/v2/ui/Subscription";

import { cancelV2Subscription, requestV2Plan } from "./actions";

/**
 * Écran 68 — l'abonnement de l'organisation.
 *
 * L'écran affichait quatre opérations et quatre plans écrits en dur, à une
 * adresse que personne ne pouvait atteindre. Tout ce qu'il montre est
 * désormais lu : le plan, ses droits, l'usage réel.
 */
export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ paiement?: string }>;
}) {
  const { organization } = await requireV2Workspace();
  const { paiement } = await searchParams;

  // AU RETOUR DU PRESTATAIRE, ON VÉRIFIE NOUS-MÊMES.
  //
  // Le 1er août, Genius Pay affichait « webhooks envoyés : 0 » alors qu'une
  // transaction était bien réglée. Attendre une notification qui ne vient pas,
  // c'est laisser quelqu'un qui a payé devant un plan qui n'a pas bougé.
  //
  // La vérification tourne AVANT la lecture du plan, pour que l'écran montre
  // l'état d'après. Elle ne croit rien de l'URL : la référence est relue en
  // base, et c'est le prestataire qui dit si c'est réglé.
  const retourDePaiement =
    paiement === "ok" ? await verifierPaiementEnAttente(organization.id) : null;

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
        retourDePaiement={retourDePaiement?.etat ?? null}
        catalogue={catalogue}
        consommation={consommation}
        droits={droits}
        onPayer={async (choix) => {
          "use server";
          // L'identifiant d'organisation vient du SERVEUR, jamais du navigateur :
          // le passer par le client permettrait de payer pour l'espace d'un autre.
          const { organization: espace } = await requireV2Workspace();
          return requestV2Plan({ organizationId: espace.id, ...choix });
        }}
        onResilier={async (motif) => {
          "use server";
          const { organization: espace } = await requireV2Workspace();
          // Jamais `immediat` : §15, ce qui est payé est servi jusqu'au terme.
          return cancelV2Subscription({ organizationId: espace.id, motif });
        }}
        operations={comptees}
        plan={plan}
      />
    </Standalone>
  );
}
