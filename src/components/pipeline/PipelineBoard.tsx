"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { setDealStage } from "@/app/actions/crud";
import { Mono } from "@/components/ui/Table";
import { PlainError } from "@/components/auth/FormError";
import { cn } from "@/lib/cn";
import { STAGES, type Stage } from "@/lib/stages";

export interface PipelineDeal {
  id: string;
  name: string;
  type: string;
  stage: Stage;
  amount: number | null;
  currency: string;
  amountLabel: string;
  readiness: number;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export function PipelineBoard({
  deals,
  totals,
}: {
  deals: PipelineDeal[];
  totals: Record<string, string>;
}) {
  const t = useTranslations("pipeline");
  const ts = useTranslations("stages");
  const [local, setLocal] = useState(deals);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [, startTransition] = useTransition();

  function move(dealId: string, stage: Stage) {
    const deal = local.find((d) => d.id === dealId);
    if (!deal || deal.stage === stage) return;

    const previous = local;
    setLocal((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage } : d)),
    );
    setError(undefined);

    startTransition(async () => {
      const res = await setDealStage(dealId, stage);
      if (!res.ok) {
        setLocal(previous);
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <PlainError message={error} />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 items-start">
        {STAGES.map((stage) => {
          const column = local.filter((d) => d.stage === stage);
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(stage);
              }}
              onDragLeave={() => setOver((s) => (s === stage ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                if (dragging) move(dragging, stage);
                setDragging(null);
              }}
              className={cn(
                "flex flex-col gap-2 rounded-card border p-2 min-h-[160px] transition-colors",
                over === stage
                  ? "border-accent bg-chip-indigo-bg"
                  : "border-line bg-surface-2",
              )}
            >
              <div className="px-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted">
                    {ts(stage)}
                  </span>
                  <span className="text-[10.5px] text-ink-muted">
                    {column.length}
                  </span>
                </div>
                <Mono className="text-[10.5px] text-ink-secondary">
                  {totals[stage] ?? "—"}
                </Mono>
              </div>

              {column.map((d) => (
                <div
                  key={d.id}
                  draggable
                  onDragStart={() => setDragging(d.id)}
                  onDragEnd={() => setDragging(null)}
                  className={cn(
                    "bg-surface border border-line rounded-[10px] p-2.5 shadow-card cursor-grab active:cursor-grabbing",
                    dragging === d.id && "opacity-50",
                  )}
                >
                  <Link href={`/deal?id=${d.id}`} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="grid place-items-center w-[22px] h-[22px] rounded-[6px] bg-chip-indigo-bg text-chip-indigo-fg text-[9px] font-bold flex-none">
                        {initials(d.name)}
                      </span>
                      <span className="text-[12px] font-semibold truncate text-ink">
                        {d.name}
                      </span>
                    </div>
                    <Mono className="text-[11px] text-ink">
                      {d.amountLabel}
                    </Mono>
                    <div className="flex items-center gap-1.5">
                      <span className="flex-1 h-1 rounded-[2px] bg-separator-soft overflow-hidden">
                        <span
                          className="block h-full bg-accent"
                          style={{ width: `${d.readiness}%` }}
                        />
                      </span>
                      <Mono className="text-[10px] text-ink-muted">
                        {d.readiness}%
                      </Mono>
                    </div>
                  </Link>

                  {/* Le glisser-déposer ne marche pas au doigt : on garde un
                      sélecteur, indispensable sur mobile (public cible). */}
                  <select
                    value={d.stage}
                    onChange={(e) => move(d.id, e.target.value as Stage)}
                    className="mt-2 w-full h-6 text-[10.5px] bg-bg text-ink-secondary rounded-[5px] border border-line cursor-pointer focus:outline-none"
                    aria-label={t("changeStage")}
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {ts(s)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {column.length === 0 && (
                <p className="text-[11px] text-ink-muted text-center py-4">
                  {t("emptyColumn")}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11.5px] text-ink-muted">{t("hint")}</p>
    </div>
  );
}
