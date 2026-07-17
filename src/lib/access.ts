import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentDeal, getDealRole, getAnyRole } from "@/lib/current-deal";
import { isInternalRole } from "@/components/shell/nav";

/**
 * Interdit l'écran au côté investisseur.
 *
 * Filtrer le menu ne protège rien : l'URL reste tapable. La RLS vide déjà les
 * données, mais un écran vide n'est pas une réponse — la fiche de deal, elle,
 * afficherait carrément son formulaire d'édition. On renvoie donc l'invité
 * vers le seul endroit qui le concerne : la data room.
 *
 * Ceci reste une garde d'affichage. L'autorité, ce sont la RLS et les RPC.
 */
export async function requireInternal(
  supabase: SupabaseClient,
): Promise<string> {
  const { deal } = await getCurrentDeal(supabase);
  const role = deal
    ? await getDealRole(supabase, deal.org_id)
    : await getAnyRole(supabase);

  if (!isInternalRole(role)) redirect("/data-room");
  return role as string;
}
