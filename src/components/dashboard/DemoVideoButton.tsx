"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";

/**
 * « Voir la démo » — la vidéo de présentation, en surcouche.
 *
 * La vidéo est servie depuis NOTRE domaine, pas depuis YouTube ou Vimeo : la
 * politique de sécurité pose `frame-src 'none'`, qui bloque toute iframe. Un
 * `<video>` de même origine passe par `default-src 'self'`, donc sans rien
 * assouplir. Fichier attendu dans `public/`, chemin donné par
 * `NEXT_PUBLIC_DEMO_VIDEO`.
 *
 * Le composant n'est jamais rendu sans source : c'est l'appelant qui décide,
 * pour ne pas afficher un bouton qui n'ouvrirait rien.
 */
export function DemoVideoButton({
  src,
  poster,
  className,
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const t = useTranslations("dashboard");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        <span className="inline-flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.3-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14z" />
          </svg>
          {t("demoCta")}
        </span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("demoModalTitle")} width={880}>
        <div className="bg-black">
          {/* Monté seulement à l'ouverture : rien n'est téléchargé tant que la
              modale est fermée. */}
          {open && (
            <video
              src={src}
              poster={poster}
              controls
              autoPlay
              // `muted` est INDISPENSABLE, pas décoratif : Safari refuse toute
              // lecture automatique sur un média non muet, et le refus est
              // SILENCIEUX — on obtient un rectangle noir avec des contrôles,
              // ce qui se lit comme « la vidéo ne charge pas ». La démo n'a de
              // toute façon aucune piste audio.
              muted
              playsInline
              preload="metadata"
              className="block w-full max-h-[70vh]"
            />
          )}
        </div>
      </Modal>
    </>
  );
}
