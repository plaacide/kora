"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { DEAL_COOKIE } from "@/lib/current-deal";

/**
 * Change le deal courant.
 *
 * Aucun contrôle d'accès ici, et c'est volontaire : le cookie n'est qu'une
 * préférence d'affichage. La validation se fait à la lecture
 * (getCurrentDeal), contre la liste des deals visibles sous RLS.
 */
export async function setCurrentDeal(dealId: string): Promise<void> {
  const store = await cookies();
  store.set(DEAL_COOKIE, dealId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  for (const path of [
    "/dashboard",
    "/deal",
    "/data-room",
    "/visionneuse",
    "/permissions",
    "/invitations",
    "/versions",
    "/qa",
    "/checklist",
    "/readiness",
  ]) {
    revalidatePath(path);
  }
}
