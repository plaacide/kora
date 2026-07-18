import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveVersionAccess } from "@/lib/viewer/access";
import { readWorkbook } from "@/lib/viewer/sheet";
import { docKind } from "@/lib/doc-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sert le CONTENU d'un tableur (valeurs seules) à un utilisateur autorisé.
 *
 * Route distincte de `/api/viewer/[versionId]/[page]` : un tableur ne se lit
 * pas en pages rendues. Le classeur lui-même n'est jamais transmis — seules
 * les valeurs affichables le sont, et jamais les formules.
 *
 * Placée sous /api/sheet plutôt que sous /api/viewer/... pour ne pas dépendre
 * de la priorité entre segment statique et segment dynamique `[page]`.
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ versionId: string }> },
) {
  const { versionId } = await ctx.params;

  const result = await resolveVersionAccess(versionId);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }
  const { doc, storageKey, mimeType, level, userId } = result.access;

  if (docKind(doc.name, mimeType) !== "sheet") {
    return NextResponse.json(
      { error: "not_a_sheet", kind: docKind(doc.name, mimeType) },
      { status: 415 },
    );
  }

  const admin = createAdminClient();
  const { data: file, error: dlError } = await admin.storage
    .from("documents")
    .download(storageKey);

  if (dlError || !file) {
    return NextResponse.json({ error: "lecture impossible" }, { status: 500 });
  }

  let workbook;
  try {
    workbook = await readWorkbook(
      new Uint8Array(await file.arrayBuffer()),
      doc.name,
    );
  } catch (err) {
    // Journaliser : un catch muet ici, et le prochain diagnostic se fera
    // encore à la main dans le conteneur (cf. AGENTS.md).
    console.error("[sheet] lecture échouée", doc.name, err);
    const reason = err instanceof Error ? err.message : "";
    return NextResponse.json(
      { error: reason === "office_not_ready" ? "office_not_ready" : "sheet_read_failed" },
      { status: reason === "office_not_ready" ? 415 : 502 },
    );
  }

  // Consultation journalisée, comme pour une page rendue : l'audit ne doit pas
  // avoir de trou selon le format du fichier.
  await admin.rpc("write_audit_as", {
    p_actor: userId,
    p_org: doc.deals.org_id,
    p_action: "document.sheet_viewed",
    p_target_type: "document",
    p_target_id: doc.id,
    p_metadata: {
      name: doc.name,
      level,
      sheets: workbook.sheets.length,
      truncated: workbook.truncated,
    },
    p_deal: doc.deal_id,
  });

  return NextResponse.json(
    { ...workbook, level },
    {
      // Jamais mis en cache : le contenu est propre à ce lecteur et à ses
      // droits, qui peuvent expirer.
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    },
  );
}
