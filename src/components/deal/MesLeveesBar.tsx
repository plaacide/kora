"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCurrentDeal } from "@/app/actions/deal-context";
import { OuvrirLeveeButton } from "@/components/deal/OuvrirLeveeButton";

/**
 * « Mes levées » — la barre en tête de l'écran levée. Une puce par levée ACTIVE
 * (une par data room) ; cliquer bascule sur sa data room. « + Nouvelle levée »
 * s'ouvre sur une data room qui n'en a pas encore.
 */
export interface LeveeChip {
  id: string;
  name: string;
  dealId: string;
  dealName: string;
}

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

export function MesLeveesBar({
  levees,
  currentDealId,
  roomsSansLevee,
}: {
  levees: LeveeChip[];
  currentDealId: string;
  roomsSansLevee: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function basculer(dealId: string) {
    if (dealId === currentDealId) return;
    start(async () => {
      await setCurrentDeal(dealId);
      router.refresh();
    });
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-4 mb-2.5">
        <h2 className="text-[12px] font-[600] uppercase tracking-[0.08em] text-[#9DA0A8]" style={mono}>
          Mes levées
        </h2>
        <OuvrirLeveeButton
          deals={roomsSansLevee}
          label="+ Nouvelle levée"
          className="text-[12.5px] font-[600] text-[#C24619] hover:text-[#1A1B1F] disabled:opacity-50"
        />
      </div>
      {levees.length <= 1 ? null : (
        <div className="flex gap-2 flex-wrap">
          {levees.map((l) => {
            const actif = l.dealId === currentDealId;
            return (
              <button
                key={l.id}
                onClick={() => basculer(l.dealId)}
                disabled={pending}
                className={
                  "flex items-center gap-2.5 rounded-[5px] border px-3.5 py-2 whitespace-nowrap transition-colors disabled:opacity-60 " +
                  (actif ? "border-[#1A1B1F] bg-[#FAFAF8]" : "border-[#E4E2DC] hover:border-[#C9C6BD]")
                }
              >
                <span className={"text-[13px] font-[650] " + (actif ? "text-[#1A1B1F]" : "text-[#55585F]")}>{l.name}</span>
                <span className="text-[11px] text-[#9DA0A8]">· {l.dealName}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
