"use client";

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
  label = "Ouvrir une levée",
  className,
}: {
  deals: { id: string; name: string }[];
  defaultDealId?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [dealId, setDealId] = useState(defaultDealId ?? deals[0]?.id ?? "");
  const [error, setError] = useState<string | undefined>();

  const champ = "h-9 w-full px-2.5 text-[13px] bg-white text-[#1A1B1F] rounded-[5px] border border-[#E4E2DC] focus:border-[#E85C2B] focus:outline-none";

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
        className={className ?? "rounded-[5px] bg-[#E85C2B] px-4 py-2.5 text-[13px] font-[600] text-white hover:bg-[#D24E1F]"}
      >
        {label}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Ouvrir une levée" width={480}>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="text-[11.5px] font-[600] text-[#6E727A] mb-1 block">Nom de la levée</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Série A 2026" className={champ} />
          </div>
          <div>
            <label className="text-[11.5px] font-[600] text-[#6E727A] mb-1 block">Data room à attacher</label>
            {deals.length === 0 ? (
              <p className="text-[12px] text-[#9DA0A8]">Créez d&apos;abord une data room, puis ouvrez-y une levée.</p>
            ) : (
              <>
                <select value={dealId} onChange={(e) => setDealId(e.target.value)} className={champ}>
                  {deals.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <p className="text-[11px] text-[#9DA0A8] mt-1">La levée montrera les documents de cette data room à vos investisseurs.</p>
              </>
            )}
          </div>
          {error && <p className="text-[12px] text-[#C0392B]">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setOpen(false)} className="rounded-[5px] border border-[#E4E2DC] px-4 py-2 text-[13px] font-[600] text-[#55585F] hover:bg-[#FAFAF8]">Annuler</button>
            <button onClick={submit} disabled={pending || name.trim().length < 2 || !dealId} className="rounded-[5px] bg-[#E85C2B] px-4 py-2 text-[13px] font-[600] text-white hover:bg-[#D24E1F] disabled:opacity-60">
              {pending ? "Ouverture…" : "Ouvrir la levée"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
