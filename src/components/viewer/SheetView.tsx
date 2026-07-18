"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Chip } from "@/components/ui/Chip";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/cn";

interface SheetData {
  name: string;
  rows: string[][];
  truncated: boolean;
  totalRows: number;
  totalCols: number;
}

interface WorkbookData {
  sheets: SheetData[];
  truncated: boolean;
  level: string;
}

/** A, B, … Z, AA, AB … — comme dans un tableur. */
function columnLabel(i: number): string {
  let n = i + 1;
  let out = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    out = String.fromCharCode(65 + r) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

// Alignement à droite des valeurs numériques, comme le ferait Excel. Heuristique
// assumée : on ne reçoit que du texte déjà formaté, pas les types d'origine.
const NUMERIC = /^[-+(]?[\d\s ]*[\d][\d\s .,]*\)?\s*[%€$]?$/;

function isNumeric(v: string): boolean {
  return v !== "" && NUMERIC.test(v.trim());
}

export function SheetView({
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
  const [data, setData] = useState<WorkbookData | null>(null);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`/api/sheet/${versionId}`);
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) setError(body.error ?? `HTTP ${res.status}`);
        else {
          setData(body as WorkbookData);
          setActive(0);
        }
      } catch {
        if (!cancelled) setError("network");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [versionId]);

  const sheet = data?.sheets[active];

  const colCount = useMemo(
    () => (sheet ? sheet.rows.reduce((m, r) => Math.max(m, r.length), 0) : 0),
    [sheet],
  );

  const notice =
    error === "office_not_ready"
      ? { title: t("officeNotReady"), hint: t("officeNotReadyHint") }
      : error === "sheet_read_failed"
        ? { title: t("sheetFailed"), hint: t("sheetFailedHint") }
        : null;

  return (
    <section className="bg-surface border border-line rounded-card shadow-card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-separator-soft">
        <div className="min-w-0">
          <div className="text-[13px] font-[650] truncate">{docName}</div>
          <div className="font-mono text-[10.5px] text-ink-muted">
            {docIndex}
            {sheet ? ` · ${t("cellCount", {
              rows: sheet.totalRows,
              cols: sheet.totalCols,
            })}` : ""}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Pas de chip « Filigrané » ici : une grille de texte n'est pas
              filigranée, l'afficher serait mentir au lecteur. */}
          <span className="inline-flex items-center gap-1">
            <Chip tone="indigo">{t("sheetMode")}</Chip>
            <InfoTooltip text={tt("sheetMode")} />
          </span>
          <span className="inline-flex items-center gap-1">
            <Chip tone="success">{t("downloadBlocked")}</Chip>
            <InfoTooltip text={tt("downloadBlocked")} />
          </span>
        </div>
      </div>

      {/* Onglets de feuilles */}
      {data && data.sheets.length > 1 && (
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-separator-soft overflow-x-auto">
          {data.sheets.map((s, i) => (
            <button
              key={`${s.name}-${i}`}
              onClick={() => setActive(i)}
              className={cn(
                "shrink-0 px-2.5 py-1 rounded-[6px] text-[11.5px] font-medium transition-colors cursor-pointer",
                i === active
                  ? "bg-chip-indigo-bg text-chip-indigo-fg"
                  : "text-ink-secondary hover:bg-bg",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <div className="bg-bg min-h-[420px]" onContextMenu={(e) => e.preventDefault()}>
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
        ) : loading ? (
          <p className="text-[12px] text-ink-muted p-6">{t("loadingSheet")}</p>
        ) : sheet && sheet.rows.length > 0 ? (
          <div className="overflow-auto max-h-[70vh]">
            <table className="border-collapse text-[11.5px] font-mono select-text">
              <thead>
                <tr>
                  <th
                    className="sticky top-0 left-0 z-20 bg-surface border-b border-r border-line w-12 min-w-12"
                    aria-label=""
                  />
                  {Array.from({ length: colCount }, (_, c) => (
                    <th
                      key={c}
                      scope="col"
                      className="sticky top-0 z-10 bg-surface border-b border-r border-line px-2 py-1 text-[10px] font-[550] text-ink-muted text-center min-w-[90px]"
                    >
                      {columnLabel(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheet.rows.map((row, r) => (
                  <tr key={r} className="even:bg-surface">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-surface border-b border-r border-line px-2 py-1 text-[10px] font-[550] text-ink-muted text-right"
                    >
                      {r + 1}
                    </th>
                    {Array.from({ length: colCount }, (_, c) => {
                      const v = row[c] ?? "";
                      return (
                        <td
                          key={c}
                          className={cn(
                            "border-b border-r border-line px-2 py-1 whitespace-nowrap max-w-[320px] overflow-hidden text-ellipsis",
                            isNumeric(v)
                              ? "text-right tabular-nums"
                              : "text-left",
                          )}
                          title={v.length > 40 ? v : undefined}
                        >
                          {v}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[12px] text-ink-muted p-6">{t("sheetEmpty")}</p>
        )}
      </div>

      {/* Troncature : la dire, jamais la masquer — un tableau coupé en silence
          se lit comme un tableau complet. */}
      {sheet?.truncated && (
        <div className="px-4 py-2 border-t border-separator-soft bg-chip-amber-bg">
          <p className="text-[11px] text-ink-secondary">
            {t("sheetTruncated", {
              rows: sheet.rows.length,
              total: sheet.totalRows,
            })}
          </p>
        </div>
      )}
    </section>
  );
}
