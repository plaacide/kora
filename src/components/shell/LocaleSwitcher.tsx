"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setLocale } from "@/app/actions/auth";
import { locales } from "@/i18n/locales";

export function LocaleSwitcher() {
  const current = useLocale();
  const router = useRouter();
  const t = useTranslations("common");
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label={t("language")}
      value={current}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          await setLocale(next);
          router.refresh();
        });
      }}
      className="h-7 pl-1.5 pr-5 text-[11.5px] font-medium text-ink-secondary bg-transparent border border-line rounded-chip cursor-pointer hover:text-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {l.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
