"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";

export function Viewer({
  versionId,
  docName,
  docIndex,
}: {
  versionId: string;
  docName: string;
  docIndex: string;
}) {
  const t = useTranslations("viewer");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (n: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/viewer/${versionId}/${n}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? `HTTP ${res.status}`);
          setLoading(false);
          return;
        }
        const count = Number(res.headers.get("X-Page-Count") ?? "1");
        setPageCount(count || 1);
        const blob = await res.blob();
        setSrc((old) => {
          if (old) URL.revokeObjectURL(old);
          return URL.createObjectURL(blob);
        });
      } catch {
        setError("network");
      }
      setLoading(false);
    },
    [versionId],
  );

  useEffect(() => {
    load(page);
  }, [page, load]);

  return (
    <div className="grid grid-cols-[92px_1fr] gap-4 items-start">
      {/* Vignettes */}
      <aside className="flex flex-col gap-2">
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setPage(n)}
            className={cn(
              "aspect-[3/4] rounded-[8px] border text-[11px] font-mono grid place-items-center transition-colors",
              n === page
                ? "border-accent border-2 text-chip-indigo-fg bg-chip-indigo-bg"
                : "border-line bg-surface text-ink-muted hover:border-line-strong",
            )}
          >
            {n}
          </button>
        ))}
      </aside>

      <section className="bg-surface border border-line rounded-card shadow-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-separator-soft">
          <div className="min-w-0">
            <div className="text-[13px] font-[650] truncate">{docName}</div>
            <div className="font-mono text-[10.5px] text-ink-muted">
              {docIndex} · {t("pageOf", { page, total: pageCount })}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Chip tone="amber">{t("watermarked")}</Chip>
            <Chip tone="success">{t("downloadBlocked")}</Chip>
          </div>
        </div>

        <div
          className="grid place-items-center p-5 bg-bg min-h-[420px] select-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          {error ? (
            <p className="text-[12.5px] text-[oklch(0.48_0.16_25)]">
              {t("renderError")} — {error}
            </p>
          ) : loading ? (
            <p className="text-[12px] text-ink-muted">{t("loading")}</p>
          ) : src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={`${docName} — page ${page}`}
              draggable={false}
              className="max-w-full shadow-card rounded-[4px]"
            />
          ) : null}
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 border-t border-separator-soft">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-[12px] font-medium text-ink-secondary disabled:opacity-40 hover:text-ink cursor-pointer disabled:cursor-default"
          >
            ← {t("prev")}
          </button>
          <span className="font-mono text-[11px] text-ink-muted">
            {page} / {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page >= pageCount}
            className="text-[12px] font-medium text-ink-secondary disabled:opacity-40 hover:text-ink cursor-pointer disabled:cursor-default"
          >
            {t("next")} →
          </button>
        </div>
      </section>
    </div>
  );
}
