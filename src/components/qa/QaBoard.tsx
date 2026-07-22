"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { askQuestion, saveAnswer, setAnswerStatus } from "@/app/actions/qa";
import { Modal } from "@/components/ui/Modal";
import { PlainError } from "@/components/auth/FormError";
import { cn } from "@/lib/cn";

export type AnswerStatus = "draft" | "internal_review" | "published";

export interface QaItem {
  id: string;
  body: string;
  asker: string;
  answer_body: string | null;
  answer_status: AnswerStatus;
  answerer: string | null;
  created_at: string;
  is_mine: boolean;
}

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

/** Pastilles de statut, style maquette (mono, plates). */
const STATUT_PILL: Record<AnswerStatus, string> = {
  draft: "text-[#8B8E96] bg-[#F1F0EB]",
  internal_review: "text-[#B4741B] bg-[#FBF0DC]",
  published: "text-[#147A5C] bg-[#E4F3EC]",
};

const FILTERS: Array<AnswerStatus | "all"> = [
  "all",
  "draft",
  "internal_review",
  "published",
];

const champ =
  "w-full px-2.5 py-2 text-[12.5px] bg-white text-[#1A1B1F] rounded-[5px] border border-[#E4E2DC] focus:border-[#E85C2B] focus:outline-none resize-none";

export function QaBoard({
  dealId,
  dealName,
  items,
  isInternal,
}: {
  dealId: string;
  dealName: string;
  items: QaItem[];
  isInternal: boolean;
}) {
  const t = useTranslations("qa");
  const router = useRouter();
  const [filter, setFilter] = useState<AnswerStatus | "all">("all");
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const filtered =
    filter === "all" ? items : items.filter((i) => i.answer_status === filter);

  const count = (f: AnswerStatus | "all") =>
    f === "all" ? items.length : items.filter((i) => i.answer_status === f).length;

  async function submitQuestion() {
    setBusy(true);
    setError(undefined);
    const res = await askQuestion({ dealId, body: question });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setAskOpen(false);
    setQuestion("");
    router.refresh();
  }

  async function persistAnswer(id: string) {
    const body = drafts[id];
    if (body === undefined) return;
    setError(undefined);
    startTransition(async () => {
      const res = await saveAnswer(id, body);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  async function advance(id: string, status: AnswerStatus) {
    setError(undefined);
    startTransition(async () => {
      const res = await setAnswerStatus(id, status);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  /** Export : les fonds travaillent leurs Q&A dans Excel, pas dans un SaaS. */
  function exportCsv() {
    const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Question", "Posée par", "Date", "Réponse", "Statut", "Répondu par"],
      ...items.map((i) => [
        esc(i.body),
        esc(i.asker),
        esc(i.created_at),
        esc(i.answer_body ?? ""),
        esc(t(`status.${i.answer_status}`)),
        esc(i.answerer ?? ""),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QA-${dealName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4 text-[#1A1B1F]">
      <PlainError message={error} />

      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex items-center gap-1.5 text-[11.5px] font-[600] rounded-[5px] px-2.5 py-1.5 cursor-pointer transition-colors",
              filter === f ? "bg-[#F1F0EB] text-[#1A1B1F]" : "text-[#6E727A] hover:text-[#1A1B1F]",
            )}
          >
            {f === "all" ? t("filterAll") : t(`status.${f}`)}
            <span style={mono} className="text-[#9DA0A8]">{count(f)}</span>
          </button>
        ))}

        <div className="ml-auto flex gap-2">
          {items.length > 0 && (
            <button onClick={exportCsv} className="border border-[#E4E2DC] rounded-[5px] px-3.5 py-2 text-[12.5px] font-[600] text-[#33353B] hover:border-[#C9C6BD] hover:bg-[#FAFAF8]">
              {t("export")}
            </button>
          )}
          <button onClick={() => setAskOpen(true)} className="rounded-[5px] bg-[#E85C2B] px-3.5 py-2 text-[12.5px] font-[600] text-white hover:bg-[#D24E1F]">
            {t("ask")}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-[#ECEBE6] rounded-[6px] px-5 py-8 text-center">
          <p className="text-[12.5px] text-[#6E727A]">{t("empty")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((q) => (
            <div key={q.id} className="border border-[#ECEBE6] rounded-[6px] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-[600] leading-relaxed">{q.body}</p>
                  <span style={mono} className="block text-[10.5px] text-[#9DA0A8] mt-1">
                    {q.asker} · {q.created_at}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-none">
                  {q.is_mine && (
                    <span style={mono} className="text-[9px] font-[600] rounded-[4px] px-2 py-[3px] uppercase text-[#185FA5] bg-[#E9F2FB]">{t("mine")}</span>
                  )}
                  <span style={mono} className={"text-[9px] font-[600] rounded-[4px] px-2 py-[3px] uppercase whitespace-nowrap " + STATUT_PILL[q.answer_status]}>
                    {t(`status.${q.answer_status}`)}
                  </span>
                </div>
              </div>

              {/* L'invité ne voit une réponse que publiée — la base masque le
                  brouillon, on ne compte pas sur l'affichage pour ça. */}
              {isInternal ? (
                <div className="mt-3 flex flex-col gap-2">
                  <textarea
                    value={drafts[q.id] ?? q.answer_body ?? ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                    onBlur={() => persistAnswer(q.id)}
                    rows={3}
                    placeholder={t("answerPlaceholder")}
                    className={champ}
                  />
                  <div className="flex items-center gap-3">
                    {q.answer_status !== "internal_review" && (
                      <button onClick={() => advance(q.id, "internal_review")} className="text-[11.5px] font-[600] text-[#B4741B] cursor-pointer">
                        {t("toReview")}
                      </button>
                    )}
                    {q.answer_status !== "published" && (
                      <button onClick={() => advance(q.id, "published")} className="text-[11.5px] font-[600] text-[#147A5C] cursor-pointer">
                        {t("publish")}
                      </button>
                    )}
                    {q.answer_status === "published" && (
                      <button onClick={() => advance(q.id, "draft")} className="text-[11.5px] font-[600] text-[#6E727A] cursor-pointer">
                        {t("unpublish")}
                      </button>
                    )}
                    {q.answerer && (
                      <span style={mono} className="ml-auto text-[10.5px] text-[#9DA0A8]">
                        {t("answeredBy", { name: q.answerer })}
                      </span>
                    )}
                  </div>
                </div>
              ) : q.answer_body ? (
                <div className="mt-3 bg-[#FAFAF8] border border-[#ECEBE6] rounded-[5px] p-3">
                  <p className="text-[12.5px] leading-relaxed">{q.answer_body}</p>
                  {q.answerer && (
                    <span style={mono} className="text-[10.5px] text-[#9DA0A8] mt-1.5 block">
                      {t("answeredBy", { name: q.answerer })}
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-[11.5px] text-[#9DA0A8]">{t("pendingAnswer")}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={askOpen} onClose={() => setAskOpen(false)} title={t("ask")}>
        <div className="px-6 py-5 flex flex-col gap-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            autoFocus
            placeholder={t("questionPlaceholder")}
            className={champ}
          />
          <p className="text-[11px] text-[#9DA0A8] leading-relaxed">{t("askNote")}</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAskOpen(false)} className="rounded-[5px] border border-[#E4E2DC] px-4 py-2 text-[13px] font-[600] text-[#55585F] hover:bg-[#FAFAF8]">
              {t("cancel")}
            </button>
            <button
              onClick={submitQuestion}
              disabled={busy || question.trim().length < 5}
              className="rounded-[5px] bg-[#E85C2B] px-4 py-2 text-[13px] font-[600] text-white hover:bg-[#D24E1F] disabled:opacity-60"
            >
              {busy ? t("sending") : t("send")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
