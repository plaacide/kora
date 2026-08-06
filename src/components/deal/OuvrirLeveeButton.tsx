"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { createRaise } from "@/app/actions/raises";
import { setCurrentDeal } from "@/app/actions/deal-context";

/**
 * Ouvrir une levée = créer une levée (nom propre) ET l'ATTACHER à une data room
 * choisie. C'est le geste central du modèle découplé : la data room existe
 * seule, la levée s'y rattache.
 */
export function OuvrirLeveeButton({
  deals,
  defaultDealId,
  label,
  className,
}: {
  deals: { id: string; name: string }[];
  defaultDealId?: string;
  label?: string;
  className?: string;
}) {
  const t = useTranslations("deal.raise");
  const libelle = label ?? t("openRaise");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [dealId, setDealId] = useState(defaultDealId ?? deals[0]?.id ?? "");
  const [error, setError] = useState<string | undefined>();

  const champ = "h-9 w-full px-2.5 text-[13px] bg-white text-[#1A1B1F] rounded-[5px] border border-[#E4E2DC] focus:border-[#FF5A1F] focus:outline-none";

  function submit() {
    if (name.trim().length < 2 || !dealId) return;
    start(async () => {
      const res = await createRaise(dealId, name.trim());
      if (!res.ok) return setError(res.error);
      // On bascule sur la data room de la levée pour l'afficher, formulaire ouvert.
      await setCurrentDeal(dealId);
      router.push("/deal?configurer=1");
    });
  }

  return (
    <>
      <button
        onClick={() => { setError(undefined); setName(""); setDealId(defaultDealId ?? deals[0]?.id ?? ""); setOpen(true); }}
        className={className ?? "rounded-[5px] bg-[#FF5A1F] px-4 py-2.5 text-[13px] font-[600] text-white hover:bg-[#E74C16]"}
      >
        {libelle}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("openRaise")} width={480}>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="text-[11.5px] font-[600] text-[#6E727A] mb-1 block">{t("raiseNameLabel")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder={t("phRaiseName")} className={champ} />
          </div>
          <div>
            <label className="text-[11.5px] font-[600] text-[#6E727A] mb-1 block">{t("roomToAttach")}</label>
            {deals.length === 0 ? (
              <p className="text-[12px] text-[#9DA0A8]">{t("createRoomFirst")}</p>
            ) : (
              <>
                <select value={dealId} onChange={(e) => setDealId(e.target.value)} className={champ}>
                  {deals.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <p className="text-[11px] text-[#9DA0A8] mt-1">{t("attachHint")}</p>
              </>
            )}
          </div>
          {error && <p className="text-[12px] text-[#C0392B]">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setOpen(false)} className="rounded-[5px] border border-[#E4E2DC] px-4 py-2 text-[13px] font-[600] text-[#55585F] hover:bg-[#FAF8F4]">{t("cancel")}</button>
            <button onClick={submit} disabled={pending || name.trim().length < 2 || !dealId} className="rounded-[5px] bg-[#FF5A1F] px-4 py-2 text-[13px] font-[600] text-white hover:bg-[#E74C16] disabled:opacity-60">
              {pending ? "Ouverture…" : t("openRaiseCta")}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
