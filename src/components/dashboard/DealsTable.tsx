"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Mono } from "@/components/ui/Table";
import { cn } from "@/lib/cn";

export interface DealRow {
  id: string;
  name: string;
  type: string;
  stage: string;
  amountLabel: string;
  readiness: number;
  docCount: number;
}

const STAGE_TONE: Record<string, ChipTone> = {
  sourcing: "neutral",
  screening: "neutral",
  due_diligence: "indigo",
  ic: "amber",
  signed: "success",
  passed: "outline",
};

/** Couleur de la barre : rouge < 50 %, ambre < 75 %, vert au-delà (cf. proto). */
function readinessColor(score: number): string {
  if (score < 50) return "bg-[oklch(0.60_0.17_40)]";
  if (score < 75) return "bg-[oklch(0.65_0.14_85)]";
  return "bg-[oklch(0.60_0.13_155)]";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export function DealsTable({ deals }: { deals: DealRow[] }) {
  const t = useTranslations("dashboard");
  const ts = useTranslations("stages");
  const [filter, setFilter] = useState<"all" | "dd" | "ic">("all");

  const filtered = deals.filter((d) =>
    filter === "all"
      ? true
      : filter === "dd"
        ? d.stage === "due_diligence"
        : d.stage === "ic",
  );

  const filters: Array<{ key: "all" | "dd" | "ic"; label: string }> = [
    { key: "all", label: t("filterAll") },
    { key: "dd", label: t("filterDd") },
    { key: "ic", label: t("filterIc") },
  ];

  return (
    <div className="bg-surface border border-line rounded-card shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-separator-soft">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-[650]">{t("activeDeals")}</span>
          <span className="text-[11px] font-semibold text-ink-secondary bg-chip-neutral-bg rounded-[10px] px-2 py-0.5">
            {deals.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "text-[11.5px] font-semibold rounded-[6px] px-2.5 py-1.5 cursor-pointer transition-colors",
                filter === f.key
                  ? "bg-chip-neutral-bg text-ink"
                  : "text-ink-secondary hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(180px,1.5fr)_110px_100px_110px_90px] gap-2.5 px-4 py-2 text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted bg-bg border-b border-separator-soft">
        <span>{t("colDeal")}</span>
        <span>{t("colStage")}</span>
        <span className="text-right">{t("colAmount")}</span>
        <span>{t("colReadiness")}</span>
        <span className="text-right">{t("colDocs")}</span>
      </div>

      {filtered.map((d) => (
        <Link
          key={d.id}
          href={`/data-room?deal=${d.id}`}
          className="grid grid-cols-[minmax(180px,1.5fr)_110px_100px_110px_90px] gap-2.5 items-center px-4 py-2.5 border-b border-separator last:border-0 hover:bg-[oklch(0.985_0.002_260)]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid place-items-center w-[26px] h-[26px] rounded-[7px] bg-chip-indigo-bg text-chip-indigo-fg text-[10.5px] font-bold flex-none">
              {initials(d.name)}
            </span>
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold truncate">
                {d.name}
              </div>
              <div className="text-[11px] text-ink-muted">{d.type}</div>
            </div>
          </div>

          <span>
            <Chip tone={STAGE_TONE[d.stage] ?? "neutral"}>
              {ts.has(d.stage) ? ts(d.stage) : d.stage}
            </Chip>
          </span>

          <Mono className="text-[12.5px] text-right text-ink">
            {d.amountLabel}
          </Mono>

          <div className="flex items-center gap-2">
            <span className="w-9 h-1 rounded-[2px] bg-separator-soft overflow-hidden">
              <span
                className={cn("block h-full", readinessColor(d.readiness))}
                style={{ width: `${d.readiness}%` }}
              />
            </span>
            <Mono className="text-[11px] w-7 text-right">{d.readiness}%</Mono>
          </div>

          <Mono className="text-[11.5px] text-right">{d.docCount}</Mono>
        </Link>
      ))}

      {filtered.length === 0 && (
        <p className="text-[12px] text-ink-muted text-center py-6">
          {t("noDeals")}
        </p>
      )}
    </div>
  );
}
