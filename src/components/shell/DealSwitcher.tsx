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
      <div className="px-2.5 pb-1.5 pt-1 font-mono text-[9.5px] font-[600] uppercase tracking-[0.1em] text-[#B0B2B9]">
        {groupe("dealEmpty")}
      </div>
    );
  }

  return (
    <div className="px-1.5 pb-1.5">
      <label
        htmlFor="deal-switcher"
        className="block px-1 pb-1 font-mono text-[9.5px] font-[600] uppercase tracking-[0.1em] text-[#B0B2B9]"
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
        className="w-full h-8 pl-2 pr-5 text-[12.5px] font-[600] text-[#1A1B1F] bg-white border border-[#E4E2DC] rounded-[5px] cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
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
