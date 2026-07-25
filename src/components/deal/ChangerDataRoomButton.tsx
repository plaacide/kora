"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { setRaiseDeal } from "@/app/actions/raises";
import { setCurrentDeal } from "@/app/actions/deal-context";

/**
 * Rattache une levée à une AUTRE data room. Le picker ne propose que des data
 * rooms SANS levée active (une active par data room). Après le changement, on
 * bascule sur la nouvelle data room.
 */
export function ChangerDataRoomButton({
  raiseId,
  rooms,
}: {
  raiseId: string;
  rooms: { id: string; name: string }[];
}) {
  const t = useTranslations("deal.raise");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [dealId, setDealId] = useState(rooms[0]?.id ?? "");
  const [error, setError] = useState<string | undefined>();

  const champ = "h-9 w-full px-2.5 text-[13px] bg-white text-[#1A1B1F] rounded-[5px] border border-[#E4E2DC] focus:border-[#E85C2B] focus:outline-none";

  function submit() {
    if (!dealId) return;
    start(async () => {
      const res = await setRaiseDeal(raiseId, dealId);
      if (!res.ok) return setError(res.error);
      await setCurrentDeal(dealId);
      setOpen(false);
      router.push("/deal");
    });
  }

  return (
    <>
      <button
        onClick={() => { setError(undefined); setDealId(rooms[0]?.id ?? ""); setOpen(true); }}
        className="text-[12px] font-[600] text-[#C24619] hover:text-[#1A1B1F]"
      >{t("changeRoom")}</button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("changeRoom")} width={460}>
        <div className="px-6 py-5 flex flex-col gap-4">
          <p className="text-[12px] text-[#6E727A] -mt-1">
            Rattacher cette levée à une autre data room : elle montrera les documents de la nouvelle salle. Seules les data rooms sans levée sont proposées.
          </p>
          {rooms.length === 0 ? (
            <p className="text-[12px] text-[#9DA0A8]">{t("noOtherRoom")}</p>
          ) : (
            <div>
              <label className="text-[11.5px] font-[600] text-[#6E727A] mb-1 block">{t("newRoom")}</label>
              <select value={dealId} onChange={(e) => setDealId(e.target.value)} className={champ}>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          )}
          {error && <p className="text-[12px] text-[#C0392B]">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setOpen(false)} className="rounded-[5px] border border-[#E4E2DC] px-4 py-2 text-[13px] font-[600] text-[#55585F] hover:bg-[#FAF8F4]">{t("cancel")}</button>
            <button onClick={submit} disabled={pending || !dealId} className="rounded-[5px] bg-[#E85C2B] px-4 py-2 text-[13px] font-[600] text-white hover:bg-[#D24E1F] disabled:opacity-60">
              {pending ? "…" : "Rattacher"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
