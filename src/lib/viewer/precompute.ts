import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { docKind } from "@/lib/doc-types";
import { renderPdfPage } from "./render";
import { officeToPdf, officeConversionAvailable } from "./office";
import {
  readDerived,
  writeDerived,
  writeDerivedJson,
  pdfKey,
  pageKey,
  metaKey,
  SCALE_FULL,
  SCALE_THUMB,
} from "./derived";

/**
 * Préchauffage : rendre les premières pages AU DÉPÔT plutôt qu'à la lecture.
 *
 * POURQUOI ICI ET PAS AU SURVOL. La route qui sert une page journalise chaque
 * appel — c'est la promesse du produit, « qui a lu quoi ». Précharger côté
 * lecteur inscrirait donc des consultations qui n'ont pas eu lieu. Le dépôt,
 * lui, est un geste du FONDATEUR sur SON dossier : rien n'y est à tracer comme
 * une lecture. C'est le seul moment où l'on peut travailler d'avance sans
 * mentir au journal.
 *
 * CE QUE ÇA FAIT GAGNER, ET À QUI. Une page filigranée n'est jamais mise en
 * cache : elle porte l'e-mail du lecteur et la date, la mutualiser reviendrait
 * à servir à quelqu'un le filigrane d'un autre. Le préchauffage ne raccourcit
 * donc pas l'image finale d'un invité au niveau « filigrane ». Il évite en
 * revanche, POUR TOUT LE MONDE :
 *  - la conversion LibreOffice d'un .docx ou .xlsx, de loin l'étape la plus
 *    lente, mutualisée via `pdfKey` quel que soit le niveau d'accès ;
 *  - le téléchargement du fichier source depuis le stockage ;
 *  - la découverte du nombre de pages, qui conditionne l'affichage.
 * Et il sert directement les lecteurs aux niveaux « voir » et
 * « télécharger », dont les pages, elles, sont mises en cache.
 *
 * NE JETTE JAMAIS. Un préchauffage raté ne doit pas faire échouer un dépôt :
 * la lecture retombera simplement sur le rendu à la demande, comme avant.
 */

/** Pages rendues d'avance. Au-delà, le coût dépasse le bénéfice. */
const PAGES_AVANCE = 3;

export async function prechaufferVersion(versionId: string): Promise<void> {
  try {
    const admin = createAdminClient();

    const { data: version } = await admin
      .from("document_versions")
      .select("storage_key, mime_type, documents!inner(name)")
      .eq("id", versionId)
      .maybeSingle();

    if (!version) return;

    // PostgREST renvoie un tableau pour un embed to-one selon la relation.
    const docs = (version as { documents: { name: string } | { name: string }[] }).documents;
    const nom = (Array.isArray(docs) ? docs[0] : docs)?.name ?? "";
    const storageKey = (version as { storage_key: string }).storage_key;
    const mime = (version as { mime_type: string | null }).mime_type;

    const kind = docKind(nom, mime);
    // Tableurs et formats non prévisualisables ont leur propre chemin, ou
    // aucun : rien à préchauffer.
    if (kind !== "pdf" && kind !== "office") return;

    let pdfBytes: Uint8Array<ArrayBufferLike> | null =
      kind === "office" ? await readDerived(admin, pdfKey(versionId)) : null;

    if (!pdfBytes) {
      const { data: file, error } = await admin.storage
        .from("documents")
        .download(storageKey);
      if (error || !file) {
        console.error("[prechauffage] téléchargement impossible", storageKey, error?.message);
        return;
      }
      const raw = new Uint8Array(await file.arrayBuffer());

      if (kind === "office") {
        if (!(await officeConversionAvailable())) return;
        const converti = await officeToPdf(raw, nom);
        if (!converti) return;
        pdfBytes = converti;
        await writeDerived(admin, pdfKey(versionId), converti, "application/pdf");
      } else {
        pdfBytes = raw;
      }
    }

    // Page 1 d'abord : elle donne le nombre de pages, donc combien continuer.
    const premiere = await renderPdfPage(pdfBytes, 1, "", SCALE_FULL);
    const total = premiere.pageCount;

    await Promise.all([
      writeDerived(admin, pageKey(versionId, 1, SCALE_FULL), new Uint8Array(premiere.png), "image/png"),
      writeDerivedJson(admin, metaKey(versionId), { pageCount: total }),
      // Aussi en base : c'est le dénominateur de la couverture de lecture, et
      // l'accueil du fondateur interroge la table, pas le stockage.
      admin
        .from("document_versions")
        .update({ page_count: total })
        .eq("id", versionId)
        .is("page_count", null),
    ]);

    // La vignette de la bande latérale, puis les pages suivantes. En série :
    // un rendu PDF est gourmand, les paralléliser sur un petit serveur ferait
    // concurrence au trafic réel pour un gain qui n'est pas attendu.
    const vignette = await renderPdfPage(pdfBytes, 1, "", SCALE_THUMB);
    await writeDerived(admin, pageKey(versionId, 1, SCALE_THUMB), new Uint8Array(vignette.png), "image/png");

    for (let p = 2; p <= Math.min(PAGES_AVANCE, total); p++) {
      const rendu = await renderPdfPage(pdfBytes, p, "", SCALE_FULL);
      await writeDerived(admin, pageKey(versionId, p, SCALE_FULL), new Uint8Array(rendu.png), "image/png");
    }
  } catch (err) {
    // Volontairement avalé, mais JAMAIS silencieux : sans trace, un échec en
    // production ne se diagnostique qu'en rejouant le rendu à la main.
    console.error("[prechauffage] échec pour la version", versionId, err);
  }
}
