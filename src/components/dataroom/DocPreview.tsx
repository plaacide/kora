"use client";

import { useEffect, useState } from "react";
import { docKind } from "@/lib/doc-types";
import { PageImage } from "@/components/viewer/PageImage";
import { cn } from "@/lib/cn";

interface MiniCell {
  v: string;
  b?: true;
  fg?: string;
  bg?: string;
  n?: true;
}

/**
 * Aperçu d'un document dans le panneau latéral de la data room.
 *
 * Un carré gris portant « XLSX » n'apprend rien : le lecteur sait déjà ce
 * qu'il a cliqué. On montre donc le document lui-même — première page rendue
 * pour un PDF ou une présentation, premières lignes pour un tableur.
 *
 * Les deux passent par les routes normales, donc par le même contrôle d'accès
 * et le même filigrane : un aperçu reste du contenu servi.
 */
export function DocPreview({
  versionId,
  name,
  className,
}: {
  versionId: string | null;
  name: string;
  className?: string;
}) {
  const kind = docKind(name, null);

  if (!versionId || kind === "other") {
    return <FallbackBadge name={name} className={className} />;
  }

  if (kind === "sheet") {
    return <SheetPreview versionId={versionId} className={className} />;
  }

  return (
    <div
      className={cn(
        "rounded-[8px] overflow-hidden border border-separator-soft bg-[oklch(0.965_0.003_260)]",
        className,
      )}
    >
      <PageImage
        versionId={versionId}
        page={1}
        thumb
        eager
        alt={name}
        className="w-full aspect-[16/10]"
      />
    </div>
  );
}

/** Premières lignes du classeur, mise en forme comprise. */
function SheetPreview({
  versionId,
  className,
}: {
  versionId: string;
  className?: string;
}) {
  const [rows, setRows] = useState<MiniCell[][] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/sheet/${versionId}`);
        if (!res.ok) throw new Error("ko");
        const body = await res.json();
        if (cancelled) return;
        const first = body.sheets?.[0]?.rows ?? [];
        // On coupe court : c'est une vignette, pas la visionneuse. Les lignes
        // entièrement vides du haut n'apprendraient rien.
        const utiles = first
          .filter((r: MiniCell[]) => r.some((c) => c.v !== "" || c.bg))
          .slice(0, 8)
          .map((r: MiniCell[]) => r.slice(0, 5));
        setRows(utiles);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [versionId]);

  if (failed) return <FallbackBadge name="XLSX" className={className} />;

  return (
    <div
      className={cn(
        "rounded-[8px] overflow-hidden border border-separator-soft bg-white aspect-[16/10]",
        className,
      )}
    >
      {rows ? (
        <table className="w-full border-collapse text-[8.5px] leading-tight">
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((c, i) => (
                  <td
                    key={i}
                    className="border-b border-r border-[#e4e4e4] px-1 py-[2px] max-w-0 truncate"
                    style={{
                      color: c.fg,
                      backgroundColor: c.bg,
                      fontWeight: c.b ? 700 : undefined,
                      textAlign: c.n ? "right" : "left",
                    }}
                  >
                    {c.v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="w-full h-full skeleton" aria-hidden />
      )}
    </div>
  );
}

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  return i < 0 ? "?" : name.slice(i + 1).toUpperCase();
}

/** Formats sans aperçu possible (archive, vidéo…) : on reste honnête. */
function FallbackBadge({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid place-items-center aspect-[16/10] rounded-[8px] bg-[oklch(0.965_0.003_260)] border border-separator-soft",
        className,
      )}
    >
      <span className="grid place-items-center w-[52px] h-[52px] rounded-[10px] font-mono text-[13px] font-semibold bg-chip-neutral-bg text-ink-secondary">
        {ext(name)}
      </span>
    </div>
  );
}
