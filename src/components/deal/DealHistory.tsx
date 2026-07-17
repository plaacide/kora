"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mono } from "@/components/ui/Table";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

export interface HistoryItem {
  label: string;
  actor: string;
  detail: string | null;
  when: string;
}

const PAGE = 5;

export function DealHistory({
  items,
  tip,
}: {
  items: HistoryItem[];
  tip: string;
}) {
  const t = useTranslations("deal");
  const [page, setPage] = useState(0);

  const pages = Math.max(1, Math.ceil(items.length / PAGE));
  const start = page * PAGE;
  const slice = items.slice(start, start + PAGE);

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-separator-soft text-[13px] font-[650] flex items-center gap-1.5">
        {t("dealHistory")}
        <InfoTooltip text={tip} />
      </div>

      {slice.map((a, i) => (
        <div
          key={start + i}
          className="flex gap-3 px-4 py-2.5 border-b border-separator last:border-0"
        >
          <div className="flex flex-col items-center flex-none pt-1">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="w-px flex-1 bg-separator mt-1" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-[550] text-ink">{a.label}</div>
            <div className="text-[11px] text-ink-muted mt-0.5">
              {a.actor}
              {a.detail ? ` · ${a.detail}` : ""}
            </div>
          </div>
          <Mono className="text-[10.5px] text-ink-muted flex-none">
            {a.when}
          </Mono>
        </div>
      ))}

      {items.length === 0 && (
        <p className="text-[12px] text-ink-muted text-center py-4">
          {t("noActivity")}
        </p>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-bg border-t border-separator-soft">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-[11.5px] font-medium text-ink-secondary disabled:opacity-40 hover:text-ink cursor-pointer disabled:cursor-default"
          >
            ← {t("prev")}
          </button>
          <Mono className="text-[10.5px] text-ink-muted">
            {page + 1} / {pages}
          </Mono>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            disabled={page >= pages - 1}
            className="text-[11.5px] font-medium text-ink-secondary disabled:opacity-40 hover:text-ink cursor-pointer disabled:cursor-default"
          >
            {t("next")} →
          </button>
        </div>
      )}
    </div>
  );
}
