import {
  activeOperationCount,
  dailyViews,
  recentReadings,
} from "@/features/v2/server/activity";
import { requireV2Workspace } from "@/features/v2/server/session";
import { HomeScreen } from "@/features/v2/ui/Home";
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

export default async function AccueilPage() {
  const { user, organization } = await requireV2Workspace();

  const [firstName, operationCount, views, readings] = await Promise.all([
    firstNameOf(user.id, user.email),
    activeOperationCount(organization.id),
    dailyViews(organization.id),
    recentReadings(organization.id),
  ]);

  return (
    <HomeScreen
      firstName={firstName}
      operationCount={operationCount}
      readings={readings}
      views={views}
    />
  );
}
