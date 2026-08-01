"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  addV2Version,
  restoreV2Version,
  setV2DocumentHidden,
} from "@/app/v2/(workspace)/operations/[operationId]/documents/actions";
import { dateJournal, nomActeur } from "@/features/v2/domain/journal";
import { messageDErreur } from "@/features/v2/domain/erreurs";
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

  async function restaurer(versionId: string) {
    setErreur(null);
    setBusy(`restore-${versionId}`);

    const res = await restoreV2Version({
      operationId,
      documentId: detail.id,
      versionId,
    });

    setBusy(null);
    if (!res.ok) {
      setErreur(messageDErreur(res.code));
      return;
    }
    router.refresh();
  }

  async function basculerMasquage() {
    setErreur(null);
    setBusy("hidden");

    const res = await setV2DocumentHidden({
      operationId,
      documentId: detail.id,
      hidden: !detail.hidden,
    });

    setBusy(null);
    if (!res.ok) {
      setErreur(messageDErreur(res.code));
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
      // Le message du stockage est technique — « The resource already exists ».
      setErreur(messageDErreur("document.envoi_echoue"));
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
      setErreur(messageDErreur(res.code));
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
              <strong>
                {detail.hidden
                  ? "Masquée aux invités"
                  : folderVisibilityLabel(detail.guestCount)}
              </strong>
            </div>
            <div>
              <small>Version active</small>
              <strong>{active ? `v${active.versionNo}` : "—"}</strong>
            </div>
          </div>

          <hr />

          {/* Le masquage se décide ICI, devant la pièce — pas enfoui dans un
              assistant de partage qu'on ne rouvre jamais. */}
          <section className="v2-hide-toggle">
            <div>
              <strong>Masquer aux invités</strong>
              <small>
                {detail.hidden
                  ? "Cette pièce n’apparaît nulle part pour un invité, pas même son nom, quel que soit le droit posé sur son dossier."
                  : "La pièce suit le droit de son dossier. La masquer la retire de tous les accès, présents et à venir, sans la déplacer."}
              </small>
            </div>
            <button
              aria-pressed={detail.hidden}
              className="v2-switch"
              data-active={detail.hidden}
              disabled={busy !== null}
              onClick={basculerMasquage}
              type="button"
            >
              <span />
            </button>
          </section>

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
                    onClick={() => void restaurer(version.id)}
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
              <ul className="v2-history-list">
                {detail.events.map((event, index) => (
                  <li key={`${event.at}-${index}`}>
                    <time>{dateJournal(event.at)}</time>
                    <span>·</span>
                    <p>
                      <b>{nomActeur(event.actor)}</b>{" "}
                      {documentEventLabel(event.action)}
                      {event.page ? ` la page ${event.page}` : ""}
                    </p>
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
