"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Persona } from "@/lib/persona";
import { usePersonaLabel } from "./persona-label";
import { setCurrentDeal } from "@/app/actions/deal-context";
import type { DealRef } from "@/lib/current-deal";

/**
 * Sélecteur du deal courant, dans l'en-tête du groupe « Deal ».
 *
 * L'app est organisée par deal : sans ce sélecteur, chaque écran prenait le
 * deal le plus récent en silence et rien ne permettait d'en changer.
 */
export function DealSwitcher({
  deals,
  currentId,
  persona = "fund",
}: {
  deals: DealRef[];
  currentId: string | null;
  persona?: Persona;
}) {
  // « Deal » ne veut rien dire pour qui lève des fonds.
  const mot = usePersonaLabel("shell", persona);
  const groupe = (cle: string) => mot(`groups.${cle}`);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (deals.length === 0) {
    return (
      <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.07em] text-[#6f7488]">
        {groupe("dealEmpty")}
      </div>
    );
  }

  return (
    <div className="px-1.5 pb-1.5">
      <label
        htmlFor="deal-switcher"
        className="block px-1 pb-1 text-[10px] font-bold uppercase tracking-[0.07em] text-[#6f7488]"
      >
        {groupe("deal")}
      </label>
      <select
        id="deal-switcher"
        value={currentId ?? ""}
        disabled={pending}
        onChange={(e) => {
          const id = e.target.value;
          startTransition(async () => {
            await setCurrentDeal(id);
            router.refresh();
          });
        }}
        className="w-full h-7 pl-1.5 pr-5 text-[12px] font-semibold text-white bg-encre-2 border border-[#33374d] rounded-btn cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
      >
        {deals.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
    </div>
  );
}
