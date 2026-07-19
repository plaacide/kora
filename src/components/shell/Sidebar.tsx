"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { navFor } from "./nav";
import type { Persona } from "@/lib/persona";
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
  // Vocabulaire du métier : un fondateur lève, il ne « source » pas. Les
  // libellés spécifiques surchargent les libellés génériques ; ceux qui n'ont
  // pas d'équivalent retombent dessus, ce qui évite d'entretenir trois listes
  // complètes en parallèle.
  const tp = useTranslations(`shell.${persona === "fund" ? "nav" : persona}`);
  const label = (cle: string, chemin: "nav" | "groups") => {
    const specifique = persona === "fund" ? null : `${chemin}.${cle}`;
    if (specifique && tp.has(specifique)) return tp(specifique);
    return t(`${chemin}.${cle}`);
  };

  return (
    <nav
      aria-label={t("mainNav")}
      className="w-[204px] shrink-0 h-[calc(100vh-52px)] sticky top-[52px] overflow-y-auto border-r border-[#22263c] bg-encre px-2.5 pt-3.5 pb-8"
    >
      {navFor(role, persona).map((group) => (
        <div key={group.key} className="mb-4">
          {/* Le groupe « Deal » porte le sélecteur : c'est lui qui décide quel
              deal tous les écrans en dessous affichent. */}
          {group.key === "deal" ? (
            <DealSwitcher
              deals={deals}
              currentId={currentDealId}
              persona={persona}
            />
          ) : (
            <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.07em] text-[#6f7488]">
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
                      "flex items-center gap-2.5 rounded-btn px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                      active
                        ? "bg-[rgba(232,92,43,0.14)] text-vibration-soft"
                        : "text-[#b8bcca] hover:bg-encre-2 hover:text-white",
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
