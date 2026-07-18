"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Chip } from "@/components/ui/Chip";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/cn";
import { useExpanded, expandedShellClass } from "./useExpanded";
import { ExpandButton } from "./ExpandButton";
import { PageImage } from "./PageImage";

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
  const [pageCount, setPageCount] = useState(0);
  const [current, setCurrent] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Le nombre de pages n'est connu qu'après un premier rendu : on interroge la
  // page 1 en vignette, la moins chère à produire.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/viewer/${versionId}/1?s=thumb`);
        if (cancelled) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? `HTTP ${res.status}`);
          return;
        }
        setPageCount(Number(res.headers.get("X-Page-Count") ?? "1") || 1);
      } catch {
        if (!cancelled) setError("network");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [versionId]);

  const handleCount = useCallback((n: number) => {
    setPageCount((c) => (c === n ? c : n));
  }, []);

  const handleVisible = useCallback((p: number) => setCurrent(p), []);

  const goTo = (p: number) => {
    const el = pageRefs.current.get(p);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  const panel = (
    <div
      className={cn(
        "grid grid-cols-[92px_1fr] gap-4 items-start",
        expanded && "fixed inset-0 z-50 bg-bg p-4 overflow-hidden",
      )}
    >
      {/* Bande de vignettes : de vraies pages miniatures, pas des carrés
          numérotés — on reconnaît une page à son allure, pas à son numéro. */}
      <aside
        className={cn(
          "flex flex-col gap-2",
          expanded ? "overflow-y-auto max-h-full" : "max-h-[70vh] overflow-y-auto",
        )}
      >
        {pages.map((n) => (
          <button
            key={n}
            onClick={() => goTo(n)}
            aria-label={t("goToPage", { page: n })}
            aria-current={n === current}
            className={cn(
              "relative block w-full rounded-[6px] overflow-hidden border bg-surface transition-colors cursor-pointer",
              n === current
                ? "border-accent border-2"
                : "border-line hover:border-line-strong",
            )}
          >
            <PageImage
              versionId={versionId}
              page={n}
              thumb
              eager={n <= 4}
              alt={t("thumbAlt", { page: n })}
              className="min-h-[64px] aspect-[3/4]"
            />
            <span className="absolute bottom-0 right-0 px-1 font-mono text-[9px] bg-surface/85 text-ink-muted rounded-tl-[4px]">
              {n}
            </span>
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
              {docIndex} ·{" "}
              {t("pageOf", { page: current, total: pageCount || 1 })}
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

        {/* Défilement continu : toutes les pages à la suite, comme dans un
            lecteur PDF. Chacune se charge à l'approche. */}
        <div
          ref={scrollRef}
          className={cn(
            "bg-bg select-none overflow-y-auto",
            expanded ? "flex-1 min-h-0" : "max-h-[70vh] min-h-[420px]",
          )}
          onContextMenu={(e) => e.preventDefault()}
        >
          {notice ? (
            <div className="flex flex-col items-center gap-2 text-center max-w-sm py-16 mx-auto">
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
            <p className="text-[12.5px] text-[oklch(0.48_0.16_25)] p-6">
              {t("renderError")} — {error}
            </p>
          ) : pageCount === 0 ? (
            <p className="text-[12px] text-ink-muted p-6">{t("loading")}</p>
          ) : (
            <div className="flex flex-col items-center gap-4 p-5">
              {pages.map((n) => (
                <div
                  key={n}
                  ref={(el) => {
                    if (el) pageRefs.current.set(n, el);
                    else pageRefs.current.delete(n);
                  }}
                  className="w-full max-w-[900px] shadow-card rounded-[4px] overflow-hidden bg-surface"
                >
                  <PageImage
                    versionId={versionId}
                    page={n}
                    eager={n === 1}
                    alt={`${docName} — page ${n}`}
                    className="min-h-[300px]"
                    onPageCount={handleCount}
                    onVisible={handleVisible}
                  />
                </div>
              ))}
            </div>
          )}
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
