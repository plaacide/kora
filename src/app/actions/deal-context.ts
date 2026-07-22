"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEAL_COOKIE } from "@/lib/current-deal";

/**
 * Change le deal courant.
 *
 * Aucun contrôle d'accès ici, et c'est volontaire : le cookie n'est qu'une
 * préférence d'affichage. La validation se fait à la lecture
 * (getCurrentDeal), contre la liste des deals visibles sous RLS.
 */
const REVALIDATE_PATHS = [
  "/dashboard",
  "/espaces",
  "/deal",
  "/data-room",
  "/visionneuse",
  "/permissions",
  "/invitations",
  "/versions",
  "/qa",
  "/checklist",
  "/readiness",
] as const;

export async function setCurrentDeal(dealId: string): Promise<void> {
  const store = await cookies();
  store.set(DEAL_COOKIE, dealId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

/**
 * Crée une nouvelle data room (= un deal) avec son objectif, puis bascule
 * dessus. Réutilise `create_data_room` (template OHADA + audit + tour de levée
 * vierge si objectif = levée). Renvoie l'identifiant pour que le client ouvre
 * la salle.
 */
export async function createDataRoom(input: {
  name: string;
  objectif: string;
  /** true = arborescence OHADA + checklist ; false = data room vide. */
  template?: boolean;
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_data_room", {
    p_name: input.name,
    p_objectif: input.objectif,
    p_template: input.template ?? true,
  });
  if (error) return { ok: false, error: error.message };

  const id = (data as { id?: string } | null)?.id;
  if (id) {
    const store = await cookies();
    store.set(DEAL_COOKIE, id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
  return { ok: true, id };
}
