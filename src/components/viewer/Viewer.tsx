"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Chip } from "@/components/ui/Chip";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/cn";
import { useExpanded, expandedShellClass } from "./useExpanded";
import { ExpandButton } from "./ExpandButton";

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
  const tt = useTranslations("tips");
  const { expanded, toggle } = useExpanded();
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Familles d'états « pas d'image mais ce n'est pas une panne » : le fichier
  // existe, il n'est simplement pas (encore) prévisualisable.
  const notice =
    error === "office_not_ready"
      ? { title: t("officeNotReady"), hint: t("officeNotReadyHint") }
      : error === "office_conversion_failed"
        ? { title: t("officeFailed"), hint: t("officeFailedHint") }
        : error === "unsupported_format"
          ? { title: t("unsupported"), hint: t("unsupportedHint") }
          : null;

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

  const panel = (
    <div
      className={cn(
        "grid grid-cols-[92px_1fr] gap-4 items-start",
        expanded && "fixed inset-0 z-50 bg-bg p-4 overflow-hidden",
      )}
    >
      {/* Vignettes */}
      <aside
        className={cn(
          "flex flex-col gap-2",
          expanded && "overflow-y-auto max-h-full",
        )}
      >
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

      <section
        className={cn(
          "bg-surface border border-line rounded-card shadow-card overflow-hidden",
          expanded && "flex flex-col max-h-full",
        )}
      >
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-separator-soft">
          <div className="min-w-0">
            <div className="text-[13px] font-[650] truncate">{docName}</div>
            <div className="font-mono text-[10.5px] text-ink-muted">
              {docIndex} · {t("pageOf", { page, total: pageCount })}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <Chip tone="amber">{t("watermarked")}</Chip>
              <InfoTooltip text={tt("watermark")} />
            </span>
            <span className="inline-flex items-center gap-1">
              <Chip tone="success">{t("downloadBlocked")}</Chip>
              <InfoTooltip text={tt("downloadBlocked")} />
            </span>
            <ExpandButton expanded={expanded} onToggle={toggle} />
          </div>
        </div>

        <div
          className={cn(
            "grid place-items-center p-5 bg-bg select-none",
            expanded ? "flex-1 min-h-0 overflow-auto" : "min-h-[420px]",
          )}
          onContextMenu={(e) => e.preventDefault()}
        >
          {notice ? (
            <div className="flex flex-col items-center gap-2 text-center max-w-sm py-8">
              <span
                className="grid place-items-center w-10 h-10 rounded-full bg-chip-indigo-bg text-chip-indigo-fg text-[18px]"
                aria-hidden
              >
                ⧗
              </span>
              <p className="text-[13px] font-[650] text-ink">{notice.title}</p>
              <p className="text-[11.5px] text-ink-secondary leading-relaxed">
                {notice.hint}
              </p>
            </div>
          ) : error ? (
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
              className={cn(
                "shadow-card rounded-[4px]",
                // En plein écran, la page occupe la hauteur disponible ; sinon
                // elle s'ajuste à la largeur de la carte.
                expanded ? "max-h-full w-auto max-w-full" : "max-w-full",
              )}
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

  // Agrandi : monté sur <body>, hors de tout ancêtre transformé (cf.
  // useExpanded). Sinon `inset-0` se résout contre le wrapper d'animation.
  return expanded && typeof document !== "undefined"
    ? createPortal(panel, document.body)
    : panel;
}
