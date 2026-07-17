"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Chip } from "@/components/ui/Chip";
import { Mono } from "@/components/ui/Table";
import { Uploader } from "./Uploader";
import { cn } from "@/lib/cn";

export interface FolderRow {
  id: string;
  parent_id: string | null;
  name: string;
  index_path: string;
}

export interface DocRow {
  id: string;
  folder_id: string;
  name: string;
  index_path: string;
  status: string;
  size_bytes: number | null;
  version_no: number | null;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DataRoom({
  orgId,
  dealId,
  dealName,
  folders,
  documents,
}: {
  orgId: string;
  dealId: string;
  dealName: string;
  folders: FolderRow[];
  documents: DocRow[];
}) {
  const t = useTranslations("dataroom");
  const roots = useMemo(
    () => folders.filter((f) => !f.parent_id),
    [folders],
  );
  const [selected, setSelected] = useState<string | null>(
    roots[0]?.id ?? null,
  );

  const selectedFolder = folders.find((f) => f.id === selected) ?? null;
  const docs = documents.filter((d) => d.folder_id === selected);
  const childrenOf = (id: string | null) =>
    folders.filter((f) => f.parent_id === id);

  function renderFolder(f: FolderRow, depth: number) {
    const kids = childrenOf(f.id);
    const count = documents.filter((d) => d.folder_id === f.id).length;
    const active = selected === f.id;

    return (
      <div key={f.id}>
        <button
          onClick={() => setSelected(f.id)}
          style={{ paddingLeft: 8 + depth * 14 }}
          className={cn(
            "w-full flex items-center gap-2 pr-2 py-1.5 rounded-btn text-left transition-colors",
            active
              ? "bg-chip-indigo-bg text-chip-indigo-fg"
              : "hover:bg-[oklch(0.955_0.004_260)]",
          )}
        >
          <span className="font-mono text-[10.5px] font-medium text-ink-muted w-6 flex-none">
            {f.index_path}
          </span>
          <span className="text-[12.5px] font-semibold truncate">{f.name}</span>
          {count > 0 && (
            <span className="ml-auto text-[10.5px] text-ink-muted">{count}</span>
          )}
        </button>
        {kids.map((k) => renderFolder(k, depth + 1))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[240px_1fr] gap-5 items-start">
      {/* Arborescence indexée */}
      <aside className="bg-surface border border-line rounded-card shadow-card p-2.5">
        <div className="px-2 pt-1 pb-2.5">
          <div className="text-[13px] font-[650]">{dealName}</div>
          <div className="text-[10.5px] text-ink-secondary mt-0.5">
            {t("docCount", { count: documents.length })}
          </div>
        </div>
        {roots.map((f) => renderFolder(f, 0))}
      </aside>

      {/* Documents du dossier sélectionné */}
      <section className="bg-surface border border-line rounded-card shadow-card overflow-hidden">
        <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-separator-soft text-[12px] text-ink-secondary">
          <span>{dealName}</span>
          <span className="text-[oklch(0.75_0.005_260)]">/</span>
          <span className="text-ink font-semibold">
            {selectedFolder
              ? `${selectedFolder.index_path} ${selectedFolder.name}`
              : "—"}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_80px_90px] gap-2.5 px-3.5 py-2 text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted bg-bg border-b border-separator-soft">
          <span>{t("colDocument")}</span>
          <span>{t("colVersion")}</span>
          <span className="text-right">{t("colSize")}</span>
        </div>

        {docs.map((d) => (
          <div
            key={d.id}
            className="grid grid-cols-[1fr_80px_90px] gap-2.5 items-center px-3.5 py-2.5 border-b border-separator hover:bg-[oklch(0.985_0.002_260)]"
          >
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold truncate">
                {d.name}
              </div>
              <Mono className="text-[10.5px] text-ink-muted">
                {d.index_path}
              </Mono>
            </div>
            <Mono>v{d.version_no ?? 1}</Mono>
            <Mono className="text-right">{formatSize(d.size_bytes)}</Mono>
          </div>
        ))}

        {docs.length === 0 && (
          <div className="px-3.5 py-6 text-center text-[12px] text-ink-muted">
            {t("emptyFolder")}
          </div>
        )}

        <Uploader
          orgId={orgId}
          dealId={dealId}
          folderId={selected}
          folderIndex={selectedFolder?.index_path ?? ""}
        />
      </section>
    </div>
  );
}
