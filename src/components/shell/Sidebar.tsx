"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { navFor } from "./nav";
import type { Persona } from "@/lib/persona";
import { usePersonaLabel } from "./persona-label";
import { NavIcon } from "./NavIcon";
import { DealSwitcher } from "./DealSwitcher";
import type { DealRef } from "@/lib/current-deal";
import { cn } from "@/lib/cn";

export function Sidebar({
  deals,
  currentDealId,
  role,
  persona = "fund",
}: {
  deals: DealRef[];
  currentDealId: string | null;
  role: string | null;
  persona?: Persona;
}) {
  const pathname = usePathname();
  const t = useTranslations("shell");
  // Vocabulaire du métier : un fondateur lève, il ne « source » pas.
  const mot = usePersonaLabel("shell", persona);
  const label = (cle: string, chemin: "nav" | "groups") =>
    mot(`${chemin}.${cle}`);

  return (
    <nav
      aria-label={t("mainNav")}
      className="w-[226px] shrink-0 h-[calc(100vh-56px)] sticky top-[56px] overflow-y-auto border-r border-[#ECEBE6] bg-[#FAFAF8] px-3 pt-4 pb-5"
    >
      {navFor(role, persona).map((group) => (
        <div key={group.key} className="mb-3.5">
          {/* Le groupe « Deal » porte le sélecteur : c'est lui qui décide quel
              deal tous les écrans en dessous affichent. */}
          {group.key === "deal" ? (
            <DealSwitcher
              deals={deals}
              currentId={currentDealId}
              persona={persona}
            />
          ) : (
            <div className="px-2.5 pb-1.5 pt-1 font-mono text-[9.5px] font-[600] uppercase tracking-[0.1em] text-[#B0B2B9]">
              {label(group.key, "groups")}
            </div>
          )}

          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-[11px] rounded-[5px] px-2.5 py-2 text-[13.5px] transition-colors",
                      active
                        ? "bg-[#FBEDE6] text-[#C24619] font-[600]"
                        : "text-[#55585F] font-medium hover:bg-[#F1F0EB] hover:text-[#1A1B1F]",
                    )}
                  >
                    <NavIcon name={item.key} />
                    <span className="truncate">{label(item.key, "nav")}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
