"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { navFor } from "./nav";
import { DealSwitcher } from "./DealSwitcher";
import type { DealRef } from "@/lib/current-deal";
import { cn } from "@/lib/cn";

export function Sidebar({
  deals,
  currentDealId,
  role,
}: {
  deals: DealRef[];
  currentDealId: string | null;
  role: string | null;
}) {
  const pathname = usePathname();
  const t = useTranslations("shell");

  return (
    <nav
      aria-label={t("mainNav")}
      className="w-[204px] shrink-0 h-[calc(100vh-52px)] sticky top-[52px] overflow-y-auto border-r border-[#22263c] bg-encre px-2.5 pt-3.5 pb-8"
    >
      {navFor(role).map((group) => (
        <div key={group.key} className="mb-4">
          {/* Le groupe « Deal » porte le sélecteur : c'est lui qui décide quel
              deal tous les écrans en dessous affichent. */}
          {group.key === "deal" ? (
            <DealSwitcher deals={deals} currentId={currentDealId} />
          ) : (
            <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.07em] text-[#6f7488]">
              {t(`groups.${group.key}`)}
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
                      "block rounded-btn px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                      active
                        ? "bg-[rgba(232,92,43,0.14)] text-vibration-soft"
                        : "text-[#b8bcca] hover:bg-encre-2 hover:text-white",
                    )}
                  >
                    {t(`nav.${item.key}`)}
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
