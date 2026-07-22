"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { setDealNda } from "@/app/actions/nda";

/**
 * Réglages NDA de la data room, en tête de l'écran « Signatures » :
 *  - interrupteur « NDA exigé » (réel, persiste `deals.nda_required`) ;
 *  - « Modifier le modèle » → éditeur du texte de l'accord (`deals.nda_template`).
 */
export function NdaSettings({
  dealId,
  required,
  template,
  label,
  editLabel,
}: {
  dealId: string;
  required: boolean;
  template: string;
  label: string;
  editLabel: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [on, setOn] = useState(required);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(template);
  const [error, setError] = useState<string | undefined>();

  function toggle() {
    const next = !on;
    setOn(next);
    start(async () => {
      const res = await setDealNda({ dealId, required: next });
      if (!res.ok) {
        setOn(!next);
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function saveTemplate() {
    start(async () => {
      const res = await setDealNda({ dealId, template: text });
      if (!res.ok) return setError(res.error);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <button onClick={toggle} disabled={pending} className="flex items-center gap-2.5 text-left disabled:opacity-60">
        <span className="text-[13px] font-[600]">{label}</span>
        <span className={"inline-flex w-[34px] h-[19px] rounded-full relative transition-colors " + (on ? "bg-[#1D9E75]" : "bg-[#DAD8D0]")}>
          <span className={"absolute top-0.5 w-[15px] h-[15px] rounded-full bg-white transition-all " + (on ? "right-0.5" : "left-0.5")} />
        </span>
      </button>

      <button
        onClick={() => { setError(undefined); setText(template); setOpen(true); }}
        className="border border-[#E4E2DC] rounded-[5px] px-3.5 py-2 text-[12.5px] font-[600] text-[#33353B] hover:border-[#C9C6BD] hover:bg-[#FAFAF8] whitespace-nowrap"
      >
        {editLabel}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Modèle de NDA" width={620}>
        <div className="px-6 py-5 flex flex-col gap-3">
          <p className="text-[12px] text-[#6E727A] -mt-1">
            Le texte de l&apos;accord que le signataire lit avant d&apos;accéder à la data room. Laissez vide pour utiliser le texte générique.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            placeholder="En signant, le destinataire s'engage à garder confidentielles les informations de cette data room…"
            className="w-full px-3 py-2.5 text-[13px] leading-relaxed bg-white text-[#1A1B1F] rounded-[5px] border border-[#E4E2DC] focus:border-[#E85C2B] focus:outline-none resize-y"
          />
          {error && <p className="text-[12px] text-[#C0392B]">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setOpen(false)} className="rounded-[5px] border border-[#E4E2DC] px-4 py-2 text-[13px] font-[600] text-[#55585F] hover:bg-[#FAFAF8]">Annuler</button>
            <button onClick={saveTemplate} disabled={pending} className="rounded-[5px] bg-[#E85C2B] px-4 py-2 text-[13px] font-[600] text-white hover:bg-[#D24E1F] disabled:opacity-60">
              {pending ? "Enregistrement…" : "Enregistrer le modèle"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
