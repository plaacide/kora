import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reçoit une tranche de temps de lecture depuis la visionneuse.
 *
 * Sous la session du LECTEUR (pas la clé admin) : l'écriture passe par la RPC
 * `record_page_dwell`, `security definer`, qui vérifie qu'il a le droit de voir
 * le deal. Le client ne peut donc pas fabriquer du temps de lecture sur un
 * dossier qu'il ne peut pas ouvrir.
 *
 * Accepte le JSON d'un `fetch` classique ET le corps d'un `navigator.sendBeacon`
 * (au départ de la page) : les deux arrivent en `text`, on parse à la main.
 */
export async function POST(request: NextRequest) {
  let body: { versionId?: string; page?: number; ms?: number };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "corps_invalide" }, { status: 400 });
  }

  const { versionId, page, ms } = body;
  if (!versionId || typeof page !== "number" || typeof ms !== "number") {
    return NextResponse.json({ error: "champs_manquants" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_page_dwell", {
    p_version: versionId,
    p_page: page,
    p_ms: Math.round(ms),
  });

  // Un échec de mesure ne doit jamais gêner la lecture : on répond toujours
  // 200, l'erreur éventuelle est journalisée côté serveur.
  if (error) console.error("[dwell] enregistrement échoué :", error.message);
  return NextResponse.json({ ok: true });
}
