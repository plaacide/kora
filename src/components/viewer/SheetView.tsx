"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Chip } from "@/components/ui/Chip";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/cn";
import { useExpanded, expandedShellClass } from "./useExpanded";
import { ExpandButton } from "./ExpandButton";

interface Cell {
  v: string;
  b?: true;
  i?: true;
  u?: true;
  fg?: string;
  bg?: string;
  a?: "left" | "center" | "right";
  va?: "top" | "middle" | "bottom";
  wr?: true;
  ind?: number;
  fs?: number;
  bt?: string;
  br?: string;
  bb?: string;
  bl?: string;
  n?: true;
  cs?: number;
  rs?: number;
  h?: true;
}

interface SheetData {
  name: string;
  rows: Cell[][];
  widths: number[];
  heights: number[];
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
  const { expanded, toggle } = useExpanded();
  const [data, setData] = useState<WorkbookData | null>(null);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Pas de remise à zéro de l'état ici : le composant est monté avec une `key`
  // liée à la version (cf. visionneuse/page.tsx), donc changer de document le
  // remonte avec un état neuf. Remettre à zéro dans le corps de l'effet
  // déclencherait des rendus en cascade.
  useEffect(() => {
    let cancelled = false;
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

  // Largeur de la gouttière des numéros de ligne.
  const GUTTER = 44;

  // En `table-layout: fixed`, un tableau de largeur `auto` s'étire jusqu'à son
  // conteneur et redistribue l'espace entre les colonnes : les largeurs du
  // classeur seraient ignorées. On impose donc la somme exacte.
  const tableWidth = useMemo(() => {
    if (!sheet) return undefined;
    let w = GUTTER;
    for (let c = 0; c < colCount; c++) w += sheet.widths[c] ?? 100;
    return w;
  }, [sheet, colCount]);

  const notice =
    error === "office_not_ready"
      ? { title: t("officeNotReady"), hint: t("officeNotReadyHint") }
      : error === "sheet_read_failed"
        ? { title: t("sheetFailed"), hint: t("sheetFailedHint") }
        : null;

  const panel = (
    <section
      className={cn(
        "bg-surface border border-line rounded-card shadow-card overflow-hidden",
        expandedShellClass(expanded),
      )}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-separator-soft">
        <div className="min-w-0">
          <div className="text-[13px] font-[650] truncate">{docName}</div>
          <div className="font-mono text-[10.5px] text-ink-muted">
            {docIndex}
            {/* On décrit ce qui est AFFICHÉ, pas l'étendue déclarée par le
                classeur : annoncer 97 lignes au-dessus d'une grille qui en
                montre 103 n'a aucun sens pour le lecteur. */}
            {sheet
              ? ` · ${t("cellCount", { rows: sheet.rows.length, cols: colCount })}`
              : ""}
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
          <ExpandButton expanded={expanded} onToggle={toggle} />
        </div>
      </div>

      {/* Onglets de feuilles, en bas comme dans Excel serait plus fidèle, mais
          en haut ils restent visibles sans faire défiler toute la grille. */}
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

      <div
        className={cn(
          "bg-bg",
          expanded ? "flex-1 min-h-0 overflow-hidden" : "min-h-[420px]",
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
        ) : loading ? (
          <p className="text-[12px] text-ink-muted p-6">{t("loadingSheet")}</p>
        ) : sheet && sheet.rows.length > 0 ? (
          <div
            className={cn(
              "overflow-auto sz-sheet",
              expanded ? "h-full" : "max-h-[70vh]",
            )}
          >
            <table
              className="border-collapse text-[11.5px] select-text table-fixed"
              style={{ width: tableWidth }}
            >
              <colgroup>
                <col style={{ width: GUTTER }} />
                {Array.from({ length: colCount }, (_, c) => (
                  <col key={c} style={{ width: sheet.widths[c] ?? 100 }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th className="sz-corner" aria-label="" />
                  {Array.from({ length: colCount }, (_, c) => (
                    <th key={c} scope="col" className="sz-colhead">
                      {columnLabel(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheet.rows.map((row, r) => {
                  const h = sheet.heights[r];
                  return (
                    <tr key={r} style={h ? { height: h } : undefined}>
                      <th scope="row" className="sz-rowhead">
                        {r + 1}
                      </th>
                      {row.map((cell, c) => {
                        // Cellule recouverte par une fusion : le <td> maître
                        // porte déjà le contenu, on n'en émet pas de second.
                        if (cell.h) return null;
                        const style: CSSProperties = {};
                        if (cell.fg) style.color = cell.fg;
                        if (cell.bg) style.backgroundColor = cell.bg;
                        if (cell.b) style.fontWeight = 700;
                        if (cell.i) style.fontStyle = "italic";
                        if (cell.u) style.textDecoration = "underline";
                        if (cell.fs) style.fontSize = `${cell.fs}pt`;
                        if (cell.va) style.verticalAlign = cell.va;
                        if (cell.ind) style.paddingLeft = 6 + cell.ind * 10;
                        // Bordures du classeur : elles remplacent le filet de
                        // grille par défaut, côté par côté.
                        if (cell.bt) style.borderTop = cell.bt;
                        if (cell.br) style.borderRight = cell.br;
                        if (cell.bb) style.borderBottom = cell.bb;
                        if (cell.bl) style.borderLeft = cell.bl;
                        if (cell.wr) {
                          style.whiteSpace = "normal";
                          style.overflow = "visible";
                          style.textOverflow = "clip";
                        }
                        // Alignement explicite du classeur ; à défaut, les
                        // nombres à droite comme le fait Excel.
                        style.textAlign = cell.a ?? (cell.n ? "right" : "left");
                        return (
                          <td
                            key={c}
                            className="sz-cell"
                            style={style}
                            colSpan={cell.cs}
                            rowSpan={cell.rs}
                            title={cell.v.length > 40 ? cell.v : undefined}
                          >
                            {cell.v}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
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

  // Agrandi : monté sur <body>, hors de tout ancêtre transformé (cf.
  // useExpanded). Sinon `inset-0` se résout contre le wrapper d'animation.
  return expanded && typeof document !== "undefined"
    ? createPortal(panel, document.body)
    : panel;
}
