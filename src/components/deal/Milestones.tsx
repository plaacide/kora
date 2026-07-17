"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  addMilestone,
  toggleMilestone,
  deleteMilestone,
} from "@/app/actions/deal-sections";
import { Mono } from "@/components/ui/Table";
import { PlainError } from "@/components/auth/FormError";
import { cn } from "@/lib/cn";

export interface MilestoneItem {
  id: string;
  label: string;
  due: string | null;
  dueLabel: string | null;
  status: "pending" | "done";
  overdue: boolean;
}

export function Milestones({
  dealId,
  items,
  canEdit,
}: {
  dealId: string;
  items: MilestoneItem[];
  canEdit: boolean;
}) {
  const t = useTranslations("deal");
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [due, setDue] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(undefined);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col">
      <PlainError message={error} />

      {items.length === 0 && (
        <p className="text-[12px] text-ink-muted py-1">{t("noMilestones")}</p>
      )}

      {items.map((m) => (
        <div
          key={m.id}
          className="flex items-center gap-2.5 py-1.5 group"
        >
          <button
            type="button"
            disabled={!canEdit || pending}
            onClick={() => run(() => toggleMilestone(m.id))}
            aria-label={t("toggleMilestone")}
            className={cn(
              "w-[15px] h-[15px] rounded-[4px] border-[1.5px] flex-none grid place-items-center transition-colors",
              m.status === "done"
                ? "bg-accent border-accent text-white"
                : "border-[oklch(0.80_0.01_260)]",
              canEdit && "cursor-pointer",
            )}
          >
            {m.status === "done" && (
              <span className="text-[9px] leading-none">✓</span>
            )}
          </button>
          <span
            className={cn(
              "text-[12px] flex-1 min-w-0 truncate",
              m.status === "done"
                ? "text-ink-muted line-through"
                : "text-ink-secondary",
            )}
          >
            {m.label}
          </span>
          <Mono
            className={cn(
              "text-[11px] flex-none",
              m.overdue && m.status !== "done"
                ? "text-[oklch(0.55_0.17_25)]"
                : "text-ink-muted",
            )}
          >
            {m.dueLabel ?? "—"}
          </Mono>
          {canEdit && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => deleteMilestone(m.id))}
              aria-label={t("deleteMilestone")}
              className="text-ink-muted hover:text-[oklch(0.55_0.17_25)] opacity-0 group-hover:opacity-100 transition-opacity text-[13px] leading-none flex-none"
            >
              ×
            </button>
          )}
        </div>
      ))}

      {canEdit && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (label.trim().length < 2) return;
            run(() => addMilestone(dealId, label.trim(), due || null));
            setLabel("");
            setDue("");
          }}
          className="flex items-center gap-1.5 mt-2 pt-2 border-t border-separator-soft"
        >
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("milestonePlaceholder")}
            className="flex-1 min-w-0 h-7 px-2 text-[11.5px] bg-bg text-ink rounded-[6px] border border-line focus:border-accent focus:outline-none"
          />
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="h-7 px-1.5 text-[11px] bg-bg text-ink-secondary rounded-[6px] border border-line focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending || label.trim().length < 2}
            className="h-7 px-2.5 text-[11.5px] font-semibold rounded-[6px] bg-accent text-white disabled:opacity-40 cursor-pointer disabled:cursor-default flex-none"
          >
            +
          </button>
        </form>
      )}
    </div>
  );
}
