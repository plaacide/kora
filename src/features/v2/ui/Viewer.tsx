"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { PageImage } from "@/components/viewer/PageImage";
import { SheetView } from "@/components/viewer/SheetView";
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
  enSurcouche,
  retour,
}: {
  document: ViewerDocument;
  /**
   * Posé PAR-DESSUS l'écran d'où l'on vient, plutôt qu'à sa place.
   *
   * Les côtés deviennent alors translucides : on continue de voir la liste
   * derrière, et cliquer à côté de la page referme — comme on repose un
   * dossier sur la table. Consulter une pièce n'est pas quitter la data room.
   */
  enSurcouche?: boolean;
  retour?: string;
}) {
  const router = useRouter();
  const [pageCount, setPageCount] = useState(0);
  const [current, setCurrent] = useState(1);

  // Le zoom agit sur la LARGEUR de la page, pas sur l'échelle de rendu : les
  // images arrivent déjà rendues côté serveur, et redemander chaque page à
  // chaque cran de zoom relancerait autant de conversions. Agrandir l'affiché
  // est instantané et suffit à lire une petite écriture.
  const [zoom, setZoom] = useState(1);
  const [pleinEcran, setPleinEcran] = useState(false);
  const [barreVisible, setBarreVisible] = useState(true);
  const cadre = useRef<HTMLDivElement>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * La barre s'efface pendant la lecture, et revient au moindre mouvement.
   *
   * Une barre permanente mange soixante pixels en haut et quarante-quatre en
   * bas — sur un portable, c'est un cinquième de la page. Elle ne disparaît
   * qu'après une vraie pause : la faire fuir dès le premier défilement
   * obligerait à la rappeler sans cesse.
   */
  const reveiller = useCallback(() => {
    setBarreVisible(true);
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(() => setBarreVisible(false), 2600);
  }, []);

  useEffect(() => {
    reveiller();
    return () => {
      if (minuterie.current) clearTimeout(minuterie.current);
    };
  }, [reveiller]);

  /**
   * En surcouche, la page dessous ne doit PAS défiler.
   *
   * `overscroll-behavior` empêche le défilement de se propager quand on atteint
   * le bord du lecteur, mais il ne fait rien si le pointeur est sur les côtés
   * translucides — là, la molette s'applique directement à la page derrière.
   * On la fige donc le temps de la lecture, et on la rend telle qu'on l'a
   * trouvée : écraser `overflow` sans le restaurer laisserait un écran bloqué
   * après la fermeture.
   */
  useEffect(() => {
    if (!enSurcouche) return;
    const corps = window.document.body;
    const avant = corps.style.overflow;
    corps.style.overflow = "hidden";
    return () => {
      corps.style.overflow = avant;
    };
  }, [enSurcouche]);

  // Le navigateur peut sortir du plein écran sans nous prévenir — touche Échap,
  // geste système. Sans cette écoute, le bouton resterait à « quitter » alors
  // qu'on en est déjà sorti.
  useEffect(() => {
    const suivre = () => setPleinEcran(Boolean(window.document.fullscreenElement));
    window.document.addEventListener("fullscreenchange", suivre);
    return () => window.document.removeEventListener("fullscreenchange", suivre);
  }, []);

  async function basculerPleinEcran() {
    try {
      if (window.document.fullscreenElement) {
        await window.document.exitFullscreen();
      } else {
        await cadre.current?.requestFullscreen();
      }
    } catch {
      // Refusé par le navigateur ou la politique de la page : on n'insiste
      // pas, la lecture continue dans la fenêtre.
    }
  }

  const onPageCount = useCallback((n: number) => setPageCount(n), []);
  const onVisible = useCallback((page: number) => setCurrent(page), []);

  const canDownload = document.level === "download" || document.level === "edit";
  const pages = pageCount > 0 ? pageCount : 1;

  return (
    <div
      className="v2-viewer"
      data-barre={barreVisible}
      data-surcouche={enSurcouche}
      onMouseMove={reveiller}
      ref={cadre}
    >
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
            {/* Le nombre de pages se lit AVEC le nom, pas seulement en pied :
                c'est ce qu'on cherche avant de commencer — « est-ce que j'ai
                dix minutes ou une heure ». Il n'apparaît qu'une fois connu :
                l'annoncer à zéro pendant le chargement serait faux. */}
            {document.kind !== "sheet" &&
              pageCount > 0 &&
              ` · ${pageCount} page${pageCount > 1 ? "s" : ""}`}
            {document.folderName ? ` · ${document.folderName}` : " · Racine"} ·{" "}
            {document.operationName}
          </div>
        </div>
        <button
          aria-label="Réduire"
          className="v2-viewer-icon"
          disabled={zoom <= 0.6}
          onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.2) * 10) / 10))}
          type="button"
        >
          −
        </button>
        {/* Le pourcentage se clique pour revenir à cent : c'est le geste qu'on
            cherche après avoir trop zoomé, et il évite un bouton de plus. */}
        <button
          aria-label="Revenir à la taille normale"
          className="v2-viewer-zoom"
          onClick={() => setZoom(1)}
          type="button"
        >
          {Math.round(zoom * 100)} %
        </button>
        <button
          aria-label="Agrandir"
          className="v2-viewer-icon"
          disabled={zoom >= 2.4}
          onClick={() => setZoom((z) => Math.min(2.4, Math.round((z + 0.2) * 10) / 10))}
          type="button"
        >
          +
        </button>
        <button
          aria-label={pleinEcran ? "Quitter le plein écran" : "Plein écran"}
          className="v2-viewer-icon"
          onClick={basculerPleinEcran}
          type="button"
        >
          <Icon name={pleinEcran ? "minimize" : "maximize"} />
        </button>

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

      {/* CLIQUER À CÔTÉ DE LA PAGE REFERME — mais seulement à côté. Le test
          `target === currentTarget` distingue le vide du contenu : un clic sur
          le document, sur une image ou sur un bouton ne referme jamais.
          Une couche de fond en `position:absolute` aurait été plus simple à
          écrire, mais elle aurait avalé la molette : on ne pourrait plus
          faire défiler les pages. */}
      <div
        className="v2-viewer-stage"
        style={{ "--zoom": zoom } as CSSProperties}
        onClick={
          enSurcouche
            ? (event) => {
                if (event.target !== event.currentTarget) return;
                router.push(
                  retour || `/v2/operations/${document.operationId}/documents`,
                );
              }
            : undefined
        }
      >
        {/* UN TABLEUR SE LIT EN GRILLE, PAS EN IMAGE — et c'est une décision
            de fond, pas un raccourci. Un modèle financier rendu en PNG perd
            ses colonnes au-delà de la largeur de page, ses formules, et tout
            défilement horizontal : on voit un tableau sans pouvoir le lire.
            `SheetView` existait déjà, écrit pour la V1 ; il n'était pas
            branché ici, et le lecteur affichait donc une erreur là où il
            suffisait de changer de vue. */}
        {document.kind === "sheet" ? (
          <div className="v2-viewer-sheet">
          <SheetView
            docIndex=""
            docName={document.documentName}
            key={document.versionId}
            versionId={document.versionId}
          />
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      <footer className="v2-viewer-foot">
        <span>
          {document.kind === "sheet"
            ? "Tableur — lecture en grille"
            : pageCount > 0
              ? `Page ${current} sur ${pageCount}`
              : "Chargement…"}
        </span>
        <span>·</span>
        <span>Chaque consultation est journalisée</span>
      </footer>
    </div>
  );
}
