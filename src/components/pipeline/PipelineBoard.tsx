"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { setDealStage } from "@/app/actions/crud";
import { setCurrentDeal } from "@/app/actions/deal-context";
import { Mono } from "@/components/ui/Table";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { NewDealButton } from "@/components/dataroom/NewDealButton";
import { PlainError } from "@/components/auth/FormError";
import { cn } from "@/lib/cn";
import { STAGES, type Stage } from "@/lib/stages";

const STAGE_TONE: Record<string, ChipTone> = {
  sourcing: "neutral",
  screening: "neutral",
  due_diligence: "indigo",
  ic: "amber",
  signed: "success",
  passed: "outline",
};

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
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function open(dealId: string) {
    await setCurrentDeal(dealId);
    router.push("/deal");
  }

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
      {/* Bascule de vue + création — regroupées à droite comme dans le proto. */}
      <div className="flex items-center justify-end gap-2">
        <div className="flex bg-surface-2 rounded-[8px] p-0.5">
          {(["kanban", "table"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "text-[11.5px] font-semibold rounded-[6px] px-2.5 py-1.5 cursor-pointer transition-colors",
                view === v
                  ? "bg-surface text-ink shadow-card"
                  : "text-ink-secondary hover:text-ink",
              )}
            >
              {v === "kanban" ? t("viewKanban") : t("viewTable")}
            </button>
          ))}
        </div>
        <NewDealButton />
      </div>

      <PlainError message={error} />

      {view === "table" ? (
        <div className="bg-surface border border-line rounded-card shadow-card overflow-hidden">
          <div className="grid grid-cols-[minmax(180px,1.5fr)_150px_120px_120px] gap-2.5 px-4 py-2 text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted bg-bg border-b border-separator-soft">
            <span>{t("colDeal")}</span>
            <span>{t("colStage")}</span>
            <span className="text-right">{t("colAmount")}</span>
            <span>{t("colReadiness")}</span>
          </div>
          {local.map((d) => (
            <div
              key={d.id}
              className="grid grid-cols-[minmax(180px,1.5fr)_150px_120px_120px] gap-2.5 items-center px-4 py-2.5 border-b border-separator last:border-0 hover:bg-[oklch(0.985_0.002_260)]"
            >
              <button
                type="button"
                onClick={() => open(d.id)}
                className="flex items-center gap-2.5 min-w-0 text-left"
              >
                <span className="grid place-items-center w-[26px] h-[26px] rounded-[7px] bg-chip-indigo-bg text-chip-indigo-fg text-[10.5px] font-bold flex-none">
                  {initials(d.name)}
                </span>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold truncate">
                    {d.name}
                  </div>
                  <div className="text-[11px] text-ink-muted">{d.type}</div>
                </div>
              </button>
              <select
                value={d.stage}
                onChange={(e) => move(d.id, e.target.value as Stage)}
                className="h-7 text-[11px] bg-bg text-ink-secondary rounded-[6px] border border-line cursor-pointer focus:outline-none px-1.5"
                aria-label={t("changeStage")}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {ts(s)}
                  </option>
                ))}
              </select>
              <Mono className="text-[12px] text-right text-ink">
                {d.amountLabel}
              </Mono>
              <div className="flex items-center gap-2">
                <span className="flex-1 h-1 rounded-[2px] bg-separator-soft overflow-hidden">
                  <span
                    className="block h-full bg-accent"
                    style={{ width: `${d.readiness}%` }}
                  />
                </span>
                <Mono className="text-[10.5px] w-7 text-right">
                  {d.readiness}%
                </Mono>
              </div>
            </div>
          ))}
        </div>
      ) : (
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
                  <button
                    type="button"
                    onClick={() => open(d.id)}
                    className="flex flex-col gap-1.5 text-left w-full"
                  >
                    <div className="flex items-center gap-2">
                      <span className="grid place-items-center w-[22px] h-[22px] rounded-[6px] bg-chip-indigo-bg text-chip-indigo-fg text-[9px] font-bold flex-none">
                        {initials(d.name)}
                      </span>
                      <span className="text-[12px] font-semibold truncate text-ink">
                        {d.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Mono className="text-[11px] text-ink">
                        {d.amountLabel}
                      </Mono>
                      <Chip tone={STAGE_TONE[d.stage] ?? "neutral"}>
                        {d.type}
                      </Chip>
                    </div>
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
                  </button>

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

              {/* Comme dans le proto : « + Ajouter » ouvre la modale Nouveau deal. */}
              <NewDealButton trigger="dashed" triggerLabel={t("addToColumn")} />
            </div>
          );
        })}
      </div>
      )}

      {view === "kanban" && (
        <p className="text-[11.5px] text-ink-muted">{t("hint")}</p>
      )}
    </div>
  );
}
