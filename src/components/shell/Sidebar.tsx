"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { navGroups } from "./nav";
import { cn } from "@/lib/cn";

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("shell");

  return (
    <nav
      aria-label={t("mainNav")}
      className="w-[204px] shrink-0 h-[calc(100vh-52px)] sticky top-[52px] overflow-y-auto border-r border-line bg-surface-2 px-2.5 pt-3.5 pb-8"
    >
      {navGroups.map((group) => (
        <div key={group.key} className="mb-4">
          <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.07em] text-ink-muted">
            {t(`groups.${group.key}`)}
          </div>
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
                        ? "bg-chip-indigo-bg text-chip-indigo-fg"
                        : "text-ink-secondary hover:bg-[oklch(0.955_0.004_260)] hover:text-ink",
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
