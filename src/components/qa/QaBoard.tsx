"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { askQuestion, saveAnswer, setAnswerStatus } from "@/app/actions/qa";
import { Button } from "@/components/ui/Button";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Mono } from "@/components/ui/Table";
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

const TONE: Record<AnswerStatus, ChipTone> = {
  draft: "outline",
  internal_review: "amber",
  published: "success",
};

const FILTERS: Array<AnswerStatus | "all"> = [
  "all",
  "draft",
  "internal_review",
  "published",
];

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
    // BOM : sans lui, Excel casse les accents.
    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QA-${dealName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <PlainError message={error} />

      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex items-center gap-1.5 text-[11.5px] font-semibold rounded-[6px] px-2.5 py-1.5 cursor-pointer transition-colors",
              filter === f
                ? "bg-chip-neutral-bg text-ink"
                : "text-ink-secondary hover:text-ink",
            )}
          >
            {f === "all" ? t("filterAll") : t(`status.${f}`)}
            <span className="text-ink-muted">{count(f)}</span>
          </button>
        ))}

        <div className="ml-auto flex gap-2">
          {items.length > 0 && (
            <Button variant="secondary" size="sm" onClick={exportCsv}>
              {t("export")}
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={() => setAskOpen(true)}>
            {t("ask")}
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface border border-line rounded-card shadow-card px-5 py-8 text-center">
          <p className="text-[12.5px] text-ink-secondary">{t("empty")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((q) => (
            <div
              key={q.id}
              className="bg-surface border border-line rounded-card shadow-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink leading-relaxed">
                    {q.body}
                  </p>
                  <Mono className="text-[10.5px] text-ink-muted mt-1">
                    {q.asker} · {q.created_at}
                  </Mono>
                </div>
                <div className="flex items-center gap-2 flex-none">
                  {q.is_mine && <Chip tone="indigo">{t("mine")}</Chip>}
                  <Chip tone={TONE[q.answer_status]}>
                    {t(`status.${q.answer_status}`)}
                  </Chip>
                </div>
              </div>

              {/* L'invité ne voit une réponse que publiée — la base masque le
                  brouillon, on ne compte pas sur l'affichage pour ça. */}
              {isInternal ? (
                <div className="mt-3 flex flex-col gap-2">
                  <textarea
                    value={drafts[q.id] ?? q.answer_body ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [q.id]: e.target.value }))
                    }
                    onBlur={() => persistAnswer(q.id)}
                    rows={3}
                    placeholder={t("answerPlaceholder")}
                    className="px-2.5 py-2 text-[12.5px] bg-bg text-ink rounded-field border border-line focus:border-accent focus:outline-none resize-none"
                  />
                  <div className="flex items-center gap-2">
                    {q.answer_status !== "internal_review" && (
                      <button
                        onClick={() => advance(q.id, "internal_review")}
                        className="text-[11.5px] font-medium text-[oklch(0.48_0.09_80)] cursor-pointer"
                      >
                        {t("toReview")}
                      </button>
                    )}
                    {q.answer_status !== "published" && (
                      <button
                        onClick={() => advance(q.id, "published")}
                        className="text-[11.5px] font-medium text-[oklch(0.42_0.10_155)] cursor-pointer"
                      >
                        {t("publish")}
                      </button>
                    )}
                    {q.answer_status === "published" && (
                      <button
                        onClick={() => advance(q.id, "draft")}
                        className="text-[11.5px] font-medium text-ink-secondary cursor-pointer"
                      >
                        {t("unpublish")}
                      </button>
                    )}
                    {q.answerer && (
                      <Mono className="ml-auto text-[10.5px] text-ink-muted">
                        {t("answeredBy", { name: q.answerer })}
                      </Mono>
                    )}
                  </div>
                </div>
              ) : q.answer_body ? (
                <div className="mt-3 bg-bg border border-separator-soft rounded-card p-3">
                  <p className="text-[12.5px] text-ink leading-relaxed">
                    {q.answer_body}
                  </p>
                  {q.answerer && (
                    <Mono className="text-[10.5px] text-ink-muted mt-1.5 block">
                      {t("answeredBy", { name: q.answerer })}
                    </Mono>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-[11.5px] text-ink-muted">
                  {t("pendingAnswer")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={askOpen} onClose={() => setAskOpen(false)} title={t("ask")}>
        <div className="flex flex-col gap-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            autoFocus
            placeholder={t("questionPlaceholder")}
            className="px-2.5 py-2 text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none resize-none"
          />
          <p className="text-[11px] text-ink-muted leading-relaxed">
            {t("askNote")}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAskOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={submitQuestion}
              loading={busy}
              disabled={busy || question.trim().length < 5}
            >
              {busy ? t("sending") : t("send")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
