import {
  accessOverview,
  activeOperationCount,
  dailyViews,
  documentActivity,
  guestActivity,
  recentReadings,
} from "@/features/v2/server/activity";
import { requireV2Workspace } from "@/features/v2/server/session";
import { estUneFenetre, HomeScreen, isActivityTab } from "@/features/v2/ui/Home";
import { createClient } from "@/lib/supabase/server";

/**
 * Le prénom déclaré à l'inscription, sinon la partie gauche de l'e-mail.
 *
 * La maquette salue « Bienvenue Amara » : une adresse complète à cet endroit
 * sonnerait comme un accusé de réception, pas comme un accueil.
 */
async function firstNameOf(userId: string, email: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  const declared = (data as { full_name: string | null } | null)?.full_name?.trim();
  const source = declared || email.split("@")[0] || "";
  const first = source.split(/[\s._-]+/).filter(Boolean)[0];

  if (!first) return "à vous";
  return first[0].toUpperCase() + first.slice(1);
}

export default async function AccueilPage({
  searchParams,
}: {
  searchParams: Promise<{ onglet?: string; jours?: string }>;
}) {
  const [{ user, organization }, { onglet, jours }] = await Promise.all([
    requireV2Workspace(),
    searchParams,
  ]);

  const tab = isActivityTab(onglet) ? onglet : "consultations";
  // Une liste fermée, et non un nombre libre : `?jours=100000` ferait lire
  // trois cents ans de journal pour dessiner une courbe illisible.
  const fenetre = estUneFenetre(jours) ? Number(jours) : 30;

  // Les quatre onglets se lisent d'un coup : ils dérivent tous des mêmes
  // tranches de lecture, et l'onglet n'est qu'un changement de regroupement.
  // Recharger la page à chaque clic pour une seule liste serait plus lent que
  // de tout tenir prêt.
  const [firstName, operationCount, views, readings, accesses, documents, guests] =
    await Promise.all([
      firstNameOf(user.id, user.email),
      activeOperationCount(organization.id),
      dailyViews(organization.id, fenetre),
      recentReadings(organization.id),
      accessOverview(organization.id),
      documentActivity(organization.id),
      guestActivity(organization.id),
    ]);

  return (
    <HomeScreen
      accesses={accesses}
      documents={documents}
      fenetre={fenetre}
      firstName={firstName}
      guests={guests}
      operationCount={operationCount}
      readings={readings}
      tab={tab}
      views={views}
    />
  );
}
