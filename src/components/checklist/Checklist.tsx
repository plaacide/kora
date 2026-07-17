"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  setChecklistStatus,
  linkChecklistDocument,
} from "@/app/actions/checklist";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Mono } from "@/components/ui/Table";
import { PlainError } from "@/components/auth/FormError";
import { cn } from "@/lib/cn";

export const STATUSES = ["todo", "in_progress", "done"] as const;
export type Status = (typeof STATUSES)[number];

export interface ChecklistItem {
  id: string;
  category: "ohada" | "financier" | "dfi";
  label: string;
  description: string;
  status: Status;
  document_id: string | null;
}

export interface DocOption {
  id: string;
  name: string;
  index_path: string;
}

const TONE: Record<Status, ChipTone> = {
  todo: "outline",
  in_progress: "amber",
  done: "success",
};

const CATEGORIES: Array<ChecklistItem["category"]> = [
  "ohada",
  "financier",
  "dfi",
];

export function Checklist({
  items,
  docs,
  readiness,
  canEdit,
}: {
  items: ChecklistItem[];
  docs: DocOption[];
  readiness: number;
  canEdit: boolean;
}) {
  const t = useTranslations("checklist");
  const router = useRouter();
  const [local, setLocal] = useState(items);
  const [score, setScore] = useState(readiness);
  const [error, setError] = useState<string | undefined>();
  const [, startTransition] = useTransition();

  /** Cycle du prototype : À faire → En cours → Fait → À faire. */
  function cycle(item: ChecklistItem) {
    if (!canEdit) return;
    const next = STATUSES[(STATUSES.indexOf(item.status) + 1) % STATUSES.length];
    const previous = local;

    setLocal((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: next } : i)),
    );
    setError(undefined);

    startTransition(async () => {
      const res = await setChecklistStatus(item.id, next);
      if (!res.ok) {
        setLocal(previous);
        setError(res.error);
        return;
      }
      // Le score renvoyé par la base fait foi, pas un calcul côté client.
      if (typeof res.readiness === "number") setScore(res.readiness);
      router.refresh();
    });
  }

  function link(item: ChecklistItem, docId: string) {
    const value = docId || null;
    setLocal((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, document_id: value } : i)),
    );
    startTransition(async () => {
      const res = await linkChecklistDocument(item.id, value);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  const done = local.filter((i) => i.status === "done").length;

  return (
    <div className="flex flex-col gap-5">
      <PlainError message={error} />

      {/* Le score se recalcule à chaque clic : il mesure, il ne décore pas. */}
      <div className="bg-surface border border-line rounded-card shadow-card p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[12.5px] font-[550] text-ink-secondary">
            {t("readinessTitle")}
          </span>
          <Mono className="text-[19px] text-ink tracking-[-0.03em]">
            {score}%
          </Mono>
        </div>
        <span className="block h-1.5 rounded-[3px] bg-separator-soft overflow-hidden mt-2">
          <span
            className={cn(
              "block h-full transition-all",
              score < 50
                ? "bg-[oklch(0.60_0.17_40)]"
                : score < 75
                  ? "bg-[oklch(0.65_0.14_85)]"
                  : "bg-[oklch(0.60_0.13_155)]",
            )}
            style={{ width: `${score}%` }}
          />
        </span>
        <p className="text-[11.5px] text-ink-muted mt-2">
          {t("progress", { done, total: local.length })}
        </p>
      </div>

      {CATEGORIES.map((cat) => {
        const list = local.filter((i) => i.category === cat);
        if (!list.length) return null;
        const catDone = list.filter((i) => i.status === "done").length;

        return (
          <section key={cat} className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[13px] font-[650]">{t(`categories.${cat}`)}</h2>
              <Mono className="text-[11px] text-ink-muted">
                {catDone}/{list.length}
              </Mono>
            </div>
            <p className="text-[11.5px] text-ink-muted -mt-1">
              {t(`categoryHints.${cat}`)}
            </p>

            <div className="bg-surface border border-line rounded-card shadow-card overflow-hidden">
              {list.map((i) => (
                <div
                  key={i.id}
                  className="flex items-start gap-3 px-4 py-3 border-b border-separator last:border-0"
                >
                  <button
                    onClick={() => cycle(i)}
                    disabled={!canEdit}
                    title={canEdit ? t("clickToCycle") : undefined}
                    className={cn(
                      "mt-0.5 flex-none",
                      canEdit ? "cursor-pointer" : "cursor-default",
                    )}
                  >
                    <Chip tone={TONE[i.status]}>{t(`status.${i.status}`)}</Chip>
                  </button>

                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "text-[12.5px] font-semibold",
                        i.status === "done" && "text-ink-secondary",
                      )}
                    >
                      {i.label}
                    </div>
                    <p className="text-[11.5px] text-ink-muted leading-relaxed mt-0.5">
                      {i.description}
                    </p>
                  </div>

                  {/* La preuve : quel document satisfait l'exigence. */}
                  {canEdit && (
                    <select
                      value={i.document_id ?? ""}
                      onChange={(e) => link(i, e.target.value)}
                      className="h-7 max-w-[180px] px-1.5 text-[11px] bg-surface text-ink-secondary rounded-[6px] border border-line cursor-pointer focus:outline-none flex-none"
                      aria-label={t("linkDoc")}
                    >
                      <option value="">{t("noDoc")}</option>
                      {docs.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.index_path} {d.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <p className="text-[11.5px] text-ink-muted leading-relaxed max-w-2xl">
        {t("scoreExplainer")}
      </p>
    </div>
  );
}
