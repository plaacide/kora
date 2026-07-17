"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { DealEditor, type DealForm } from "@/components/deal/DealEditor";

/**
 * Édition en action SECONDAIRE : la fiche est en lecture, un bouton
 * « Modifier » ouvre le formulaire dans une modale — au lieu d'un formulaire
 * ouvert en permanence qui écrasait la fiche.
 */
export function EditDealButton({
  deal,
  canDelete,
}: {
  deal: DealForm;
  canDelete: boolean;
}) {
  const t = useTranslations("deal");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[12.5px] font-semibold border border-line bg-surface rounded-[8px] px-3 py-2 cursor-pointer text-ink-secondary hover:text-ink transition-colors"
      >
        {t("edit")}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("editCard")}>
        <DealEditor deal={deal} canDelete={canDelete} />
      </Modal>
    </>
  );
}
