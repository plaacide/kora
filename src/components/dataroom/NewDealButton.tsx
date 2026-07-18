"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createDeal } from "@/app/actions/deals";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { FormError } from "@/components/auth/FormError";

const types = ["VC", "PE", "M&A", "Dette DFI"];
const currencies = ["XOF", "XAF", "NGN", "KES", "GHS", "USD", "EUR"];

export function NewDealButton({
  trigger = "primary",
  triggerLabel,
}: {
  /** "dashed" : bouton pleine largeur en pointillés (« + Ajouter » par colonne). */
  trigger?: "primary" | "dashed";
  triggerLabel?: string;
} = {}) {
  const t = useTranslations("dataroom");

  // Une « session » par ouverture : le numéro sert de `key` au formulaire, donc
  // rouvrir le modal le remonte avec un état d'action neuf. `null` = fermé.
  const [session, setSession] = useState<number | null>(null);
  const openModal = () => setSession((s) => (s ?? 0) + 1);

  return (
    <>
      {trigger === "dashed" ? (
        <button
          type="button"
          onClick={openModal}
          className="w-full border-[1.5px] border-dashed border-line rounded-[9px] bg-transparent text-ink-muted text-[11.5px] font-[550] py-2 cursor-pointer hover:border-accent hover:text-accent transition-colors"
        >
          {triggerLabel ?? t("newDeal")}
        </button>
      ) : (
        <Button variant="primary" onClick={openModal}>
          {t("newDeal")}
        </Button>
      )}

      <NewDealModal
        key={session}
        open={session !== null}
        onClose={() => setSession(null)}
      />
    </>
  );
}

function NewDealModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("dataroom");
  const tc = useTranslations("common");
  const router = useRouter();
  const [state, action, pending] = useActionState(createDeal, undefined);

  // L'action renvoie {} en cas de succès. La fermeture est DÉRIVÉE du rendu
  // plutôt que posée par un setState dans un effet (rendus en cascade) : le
  // composant est monté avec une `key` par ouverture, donc rouvrir repart d'un
  // état vierge. Cf. viewer/SheetView.tsx.
  const created =
    !!state && !state.errorRaw && !state.errorKey && !state.fieldErrors;

  // `router.refresh()` n'est pas un setState local : sa place est bien ici.
  useEffect(() => {
    if (created) router.refresh();
  }, [created, router]);

  return (
    <Modal open={open && !created} onClose={onClose} title={t("newDeal")}>
      <form action={action} className="flex flex-col gap-4">
        <FormError errorKey={state?.errorKey} errorRaw={state?.errorRaw} />

        <Input
          label={t("dealName")}
          name="name"
          placeholder="Kalyx Foods"
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="type"
              className="text-[11.5px] font-medium text-ink-secondary"
            >
              {t("dealType")}
            </label>
            <select
              id="type"
              name="type"
              defaultValue="VC"
              className="h-8 px-2.5 text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none"
            >
              {types.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="currency"
              className="text-[11.5px] font-medium text-ink-secondary"
            >
              {t("dealCurrency")}
            </label>
            <select
              id="currency"
              name="currency"
              defaultValue="XOF"
              className="h-8 px-2.5 text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none"
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input label={t("dealAmount")} name="amount" type="number" min="0" />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={pending}
            disabled={pending}
          >
            {pending ? t("creating") : t("createDeal")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
