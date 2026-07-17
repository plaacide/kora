"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

export function EncryptionBadge({ className }: { className?: string }) {
  const t = useTranslations("common");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11.5px] font-[550] text-success",
        className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden />
      {t("encrypted")}
    </span>
  );
}
