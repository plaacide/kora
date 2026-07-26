"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { isSheet, isViewable } from "@/lib/doc-types";
import { Viewer } from "./Viewer";
import { SheetView } from "./SheetView";

/**
 * Ouvre un document EN PLACE, sans quitter le dossier.
 *
 * La visionneuse pleine page reste : elle sert les liens directs, l'impression
 * et le plein écran. Mais consulter trois pièces d'affilée y demandait trois
 * allers-retours, et on perdait à chaque fois le dossier ouvert, le défilement
 * et le contexte. La modale supprime ce va-et-vient.
 *
 * Le contenu n'est MONTÉ qu'à l'ouverture : tant que la modale est fermée,
 * aucune page n'est demandée au serveur — donc aucun rendu, aucun octet, et
 * surtout aucune entrée d'audit.
 *
 * ⚠️ Pas de préchargement au survol, et c'est délibéré. La route qui sert une
 * page JOURNALISE chaque appel (`document.page_viewed`, et
 * `document.thumbnail_viewed` pour les vignettes). Précharger au survol
 * inscrirait donc des consultations qui n'ont pas eu lieu, dans le registre
 * même qui fait la valeur du produit. Une milliseconde gagnée ne vaut pas un
 * journal d'audit qui ment.
 */
export function DocViewerModal({
  versionId,
  name,
  index,
  docId,
  children,
  className,
}: {
  versionId: string | null;
  name: string;
  index: string;
  /** Pour le lien « ouvrir en pleine page ». */
  docId: string;
  /** Le déclencheur — la ligne du document, rendue par l'appelant. */
  children: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations("viewer");
  const [open, setOpen] = useState(false);

  // Le type MIME n'est pas dans la liste : l'extension décide, comme sur la
  // page pleine, qui passe `null` pour la même raison.
  const lisible = isViewable(name, null);
  const tableur = isSheet(name, null);

  // Un document sans version courante, ou d'un type non prévisualisable, ne
  // s'ouvre pas en modale : on laisse l'appelant rendre son lien habituel
  // plutôt que d'ouvrir une fenêtre vide.
  if (!versionId || !lisible) return <>{children}</>;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={name} width={1100}>
        <div className="max-h-[78vh] overflow-y-auto bg-[#FAF8F4]">
          {open &&
            (tableur ? (
              <SheetView versionId={versionId} docName={name} docIndex={index} />
            ) : (
              <Viewer versionId={versionId} docName={name} docIndex={index} />
            ))}
        </div>
        <div className="px-5 py-3 border-t border-[#E8E5DC] flex justify-end">
          <Link
            href={`/visionneuse?doc=${docId}`}
            className="text-[12.5px] font-[600] text-[#C24619] hover:text-[#1A1B1F]"
          >
            {t("openFullPage")}
          </Link>
        </div>
      </Modal>
    </>
  );
}
