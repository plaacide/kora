"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  addV2Version,
  restoreV2Version,
} from "@/app/v2/(workspace)/operations/[operationId]/documents/actions";
import {
  documentEventLabel,
  documentStateLabel,
  folderVisibilityLabel,
} from "@/features/v2/domain/documents";
import type { DocumentDetail } from "@/features/v2/server/documents";
import { cleStockage } from "@/lib/storage-key";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "./Icon";
import { fileSize } from "./Upload";

/**
 * Écran 18 — détail d'une pièce et ses versions.
 * Repris de `sanza_handoff/maquettes/screens/18-detail-piece-versions.html`.
 *
 * Les versions appartiennent à la pièce : restaurer une version antérieure ne
 * supprime pas les suivantes, et déposer un remplacement empile plutôt que
 * d'écraser. Une data room dont on peut réécrire le passé ne prouve rien.
 */

function dateHeure(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DocumentPanel({
  detail,
  operationId,
  organizationId,
  viewerHref,
  closeHref,
}: {
  detail: DocumentDetail;
  operationId: string;
  organizationId: string;
  viewerHref: string;
  closeHref: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const active = detail.versions.find((version) => version.active);
  const statut = documentStateLabel(detail.status);

  async function restaurer(versionId: string, versionNo: number) {
    setErreur(null);
    setBusy(`restore-${versionId}`);

    const res = await restoreV2Version({
      operationId,
      documentId: detail.id,
      versionId,
    });

    setBusy(null);
    if (!res.ok) {
      setErreur(res.error ?? `La version ${versionNo} n’a pas pu être restaurée.`);
      return;
    }
    router.refresh();
  }

  async function remplacer(file: File) {
    setErreur(null);
    setBusy("replace");

    const supabase = createClient();
    const key = `${organizationId}/${operationId}/${crypto.randomUUID()}/${cleStockage(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(key, file, { upsert: false, contentType: file.type });

    if (uploadError) {
      setBusy(null);
      setErreur(uploadError.message);
      return;
    }

    const res = await addV2Version({
      operationId,
      documentId: detail.id,
      storageKey: key,
      size: file.size,
      mime: file.type,
    });

    setBusy(null);
    if (!res.ok) {
      setErreur(res.error ?? "La nouvelle version n’a pas pu être enregistrée.");
      return;
    }
    router.refresh();
  }

  const prochaine = (active?.versionNo ?? detail.versions.length) + 1;

  return (
    <>
      <Link className="v2-scrim" href={closeHref} aria-label="Fermer le panneau" />
      <aside className="v2-sidepanel">
        <header>
          <div>
            <span className="v2-status" data-tone={statut.tone}>
              {statut.label}
            </span>
            {active && (
              <span className="v2-tag">
                {fileKindLabel(active.mimeType)}
                {active.sizeBytes ? ` · ${fileSize(active.sizeBytes)}` : ""}
              </span>
            )}
            <h2>{detail.name}</h2>
          </div>
          <Link href={closeHref} aria-label="Fermer">×</Link>
        </header>

        <div className="v2-sidepanel-body">
          {erreur && (
            <p className="v2-auth-error" role="alert">
              {erreur}
            </p>
          )}

          <div className="v2-detail-grid">
            <div>
              <small>Exigence associée</small>
              <strong>{detail.requirement ?? "Aucune"}</strong>
            </div>
            <div>
              <small>Dossier</small>
              <strong>{detail.folderName ?? "Racine"}</strong>
            </div>
            <div>
              <small>Visibilité</small>
              <strong>{folderVisibilityLabel(detail.guestCount)}</strong>
            </div>
            <div>
              <small>Version active</small>
              <strong>{active ? `v${active.versionNo}` : "—"}</strong>
            </div>
          </div>

          <hr />

          <section>
            <small>Versions</small>
            {detail.versions.map((version) => (
              <div
                className={version.active ? "v2-version is-active" : "v2-version"}
                key={version.id}
              >
                <Icon name="file" />
                <div>
                  <strong>
                    Version {version.versionNo}
                    {version.active && <span>Active</span>}
                  </strong>
                  <small>
                    {version.author ?? "—"} · {dateHeure(version.createdAt)}
                    {version.sizeBytes ? ` · ${fileSize(version.sizeBytes)}` : ""}
                  </small>
                </div>
                {!version.active && (
                  <button
                    disabled={busy !== null}
                    onClick={() => void restaurer(version.id, version.versionNo)}
                    type="button"
                  >
                    {busy === `restore-${version.id}` ? "…" : "Restaurer"}
                  </button>
                )}
              </div>
            ))}
          </section>

          <hr />

          <section>
            <small>Activité sur cette pièce</small>
            {detail.events.length === 0 ? (
              <p className="v2-panel-note">
                Aucune consultation pour l’instant. Chaque ouverture par un
                invité apparaîtra ici.
              </p>
            ) : (
              <ul className="v2-panel-activity">
                {detail.events.map((event, index) => (
                  <li key={`${event.at}-${index}`}>
                    {event.actor} {documentEventLabel(event.action)}
                    {event.page ? ` la page ${event.page}` : ""} — {dateHeure(event.at)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <footer className="v2-sidepanel-footer">
          <Link className="v2-btn" data-variant="secondary" href={viewerHref}>
            Ouvrir la visionneuse
          </Link>
          <label className="v2-btn" data-busy={busy === "replace"}>
            {busy === "replace" ? "Dépôt…" : `Remplacer (v${prochaine})`}
            <input
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void remplacer(file);
              }}
              type="file"
            />
          </label>
        </footer>
      </aside>
    </>
  );
}

/** Local plutôt qu'importé du serveur : ce fichier tourne dans le navigateur. */
function fileKindLabel(mime: string | null): string {
  if (!mime) return "Fichier";
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("spreadsheet") || mime.includes("excel")) return "XLSX";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "PPTX";
  if (mime.includes("word") || mime.includes("document")) return "DOCX";
  if (mime.startsWith("image/")) return "Image";
  return "Fichier";
}
