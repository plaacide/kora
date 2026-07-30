"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { PageImage } from "@/components/viewer/PageImage";
import type { ViewerDocument } from "@/features/v2/server/viewer";
import { Icon } from "./Icon";

/**
 * Écran 19 — Visionneuse sécurisée.
 * Repris de `sanza_handoff/maquettes/screens/19-visionneuse.html`.
 *
 * Le fichier source ne quitte jamais le serveur. Chaque page arrive en image
 * DÉJÀ rendue par `/api/viewer/[versionId]/[page]`, et le filigrane y est
 * incrusté dans les pixels — pas posé en surimpression CSS, qui se retire en
 * trois clics dans l'inspecteur.
 *
 * Le rendu des pages réutilise `PageImage` de la V1 : chargement à l'approche
 * de l'écran, libération mémoire au défilement, filet de secours quand
 * l'observateur d'intersection ne se déclenche pas. Le réécrire pour la V2
 * aurait dupliqué un mécanisme éprouvé — et ses correctifs.
 */

/** Ce que chaque niveau autorise, dit au lecteur. */
const LEVEL_NOTE: Record<string, string> = {
  watermark: "Lecture filigranée active",
  view: "Lecture seule",
  download: "Lecture et téléchargement",
  edit: "Accès complet",
};

export function SecureViewer({
  document,
  retour,
}: {
  document: ViewerDocument;
  retour?: string;
}) {
  const [pageCount, setPageCount] = useState(0);
  const [current, setCurrent] = useState(1);

  const onPageCount = useCallback((n: number) => setPageCount(n), []);
  const onVisible = useCallback((page: number) => setCurrent(page), []);

  const canDownload = document.level === "download" || document.level === "edit";
  const pages = pageCount > 0 ? pageCount : 1;

  return (
    <div className="v2-viewer">
      <header className="v2-viewer-bar">
        <Link
          aria-label="Fermer la visionneuse"
          className="v2-viewer-close"
          href={retour || `/v2/operations/${document.operationId}/documents`}
        >
          ×
        </Link>
        <div className="v2-viewer-title">
          <div>{document.documentName}</div>
          <div>
            Version active v{document.versionNo}
            {document.folderName ? ` · ${document.folderName}` : " · Racine"} ·{" "}
            {document.operationName}
          </div>
        </div>
        <span className="v2-viewer-flag">
          <Icon name="eye" />
          {LEVEL_NOTE[document.level] ?? "Lecture"}
        </span>

        {canDownload ? (
          <a
            className="v2-viewer-download"
            data-active="true"
            href={`/api/document/${document.versionId}/download`}
          >
            Télécharger
          </a>
        ) : (
          <span
            className="v2-viewer-download"
            title="Téléchargement désactivé pour votre accès"
          >
            Télécharger
          </span>
        )}
      </header>

      <div className="v2-viewer-stage">
        {/* `PageImage` porte son propre état d'échec : un format non rendable
            (tableur, archive) affiche sa propre explication à la place de
            l'image, sans faire tomber la visionneuse entière. */}
        {Array.from({ length: pages }, (_, index) => (
          <PageImage
            alt={`${document.documentName} — page ${index + 1}`}
            className="v2-page"
            eager={index < 2}
            key={index}
            onPageCount={onPageCount}
            onVisible={onVisible}
            page={index + 1}
            versionId={document.versionId}
          />
        ))}
      </div>

      <footer className="v2-viewer-foot">
        <span>
          {pageCount > 0 ? `Page ${current} sur ${pageCount}` : "Chargement…"}
        </span>
        <span>·</span>
        <span>Chaque consultation est journalisée</span>
      </footer>
    </div>
  );
}
