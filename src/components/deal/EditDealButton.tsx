"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DealEditor, type DealForm } from "@/components/deal/DealEditor";
import type { Persona } from "@/lib/persona";

/**
 * Édition en action SECONDAIRE : la fiche est en lecture, un bouton
 * « Modifier » ouvre le formulaire dans une modale — au lieu d'un formulaire
 * ouvert en permanence qui écrasait la fiche.
 */
export function EditDealButton({
  deal,
  canDelete,
  persona = "fund",
}: {
  deal: DealForm;
  canDelete: boolean;
  persona?: Persona;
}) {
  const t = useTranslations("deal");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {t("edit")}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("editCard")}>
        <DealEditor deal={deal} canDelete={canDelete} persona={persona} />
      </Modal>
    </>
  );
}
