"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { addDocumentVersion, restoreVersion } from "@/app/actions/versions";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Mono } from "@/components/ui/Table";
import { PlainError } from "@/components/auth/FormError";
import { cn } from "@/lib/cn";

export interface VersionRow {
  id: string;
  version_no: number;
  size_bytes: number | null;
  created_at: string;
  uploaded_by: string;
  is_current: boolean;
}

export interface VersionDoc {
  id: string;
  name: string;
  index_path: string;
  folder_name: string;
  versions: VersionRow[];
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VersionList({
  docs,
  orgId,
  dealId,
  canEdit,
}: {
  docs: VersionDoc[];
  orgId: string;
  dealId: string;
  canEdit: boolean;
}) {
  const t = useTranslations("versions");
  const router = useRouter();
  const [selected, setSelected] = useState(docs[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  const doc = docs.find((d) => d.id === selected) ?? docs[0] ?? null;

  async function upload(files: FileList | null) {
    if (!files?.length || !doc) return;
    setBusy(true);
    setError(undefined);

    const file = files[0];
    const supabase = createClient();
    const key = `${orgId}/${dealId}/${crypto.randomUUID()}/${file.name}`;

    const { error: upErr } = await supabase.storage
      .from("documents")
      .upload(key, file, { contentType: file.type });

    if (upErr) {
      setBusy(false);
      return setError(upErr.message);
    }

    const res = await addDocumentVersion({
      docId: doc.id,
      storageKey: key,
      size: file.size,
      mime: file.type,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  async function restore(versionId: string) {
    if (!doc) return;
    setBusy(true);
    setError(undefined);
    const res = await restoreVersion(doc.id, versionId);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <PlainError message={error} />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start">
        {/* Documents */}
        <aside className="bg-surface border border-line rounded-card shadow-card overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-separator-soft text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted">
            {t("documents")}
          </div>
          {docs.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelected(d.id)}
              className={cn(
                "w-full text-left px-3.5 py-2.5 border-b border-separator last:border-0 cursor-pointer",
                doc?.id === d.id
                  ? "bg-chip-indigo-bg"
                  : "hover:bg-[oklch(0.985_0.002_260)]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-semibold truncate">
                  {d.name}
                </span>
                <Chip tone="neutral">
                  {t("versionCount", { n: d.versions.length })}
                </Chip>
              </div>
              <Mono className="text-[10.5px] text-ink-muted">
                {d.index_path} · {d.folder_name}
              </Mono>
            </button>
          ))}
        </aside>

        {/* Historique */}
        <section className="bg-surface border border-line rounded-card shadow-card overflow-hidden">
          {doc ? (
            <>
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-separator-soft">
                <div className="min-w-0">
                  <div className="text-[13px] font-[650] truncate">
                    {doc.name}
                  </div>
                  <Mono className="text-[10.5px] text-ink-muted">
                    {doc.index_path}
                  </Mono>
                </div>
                {canEdit && (
                  <>
                    <input
                      ref={inputRef}
                      type="file"
                      hidden
                      onChange={(e) => upload(e.target.files)}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => inputRef.current?.click()}
                      disabled={busy}
                    >
                      {busy ? t("uploading") : t("newVersion")}
                    </Button>
                  </>
                )}
              </div>

              <div className="grid grid-cols-[70px_1fr_80px_100px] gap-2.5 px-4 py-2 text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted bg-bg border-b border-separator-soft">
                <span>{t("colVersion")}</span>
                <span>{t("colBy")}</span>
                <span className="text-right">{t("colSize")}</span>
                <span className="text-right">{t("colDate")}</span>
              </div>

              {doc.versions.map((v) => (
                <div
                  key={v.id}
                  className="grid grid-cols-[70px_1fr_80px_100px] gap-2.5 items-center px-4 py-2.5 border-b border-separator last:border-0"
                >
                  <div className="flex items-center gap-1.5">
                    <Mono className="text-[12px] text-ink">v{v.version_no}</Mono>
                    {v.is_current && <Chip tone="success">{t("current")}</Chip>}
                  </div>
                  <span className="text-[12px] text-ink-secondary truncate">
                    {v.uploaded_by}
                  </span>
                  <Mono className="text-[11.5px] text-right">
                    {formatSize(v.size_bytes)}
                  </Mono>
                  <div className="flex items-center justify-end gap-2">
                    <Mono className="text-[11px]">{v.created_at}</Mono>
                    {canEdit && !v.is_current && (
                      <button
                        onClick={() => restore(v.id)}
                        disabled={busy}
                        className="text-[11px] font-medium text-accent cursor-pointer"
                      >
                        {t("restore")}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="px-4 py-3 bg-bg border-t border-separator-soft flex items-center justify-between gap-3">
                <p className="text-[11.5px] text-ink-muted leading-relaxed">
                  {t("keepAll")}
                </p>
                <Link
                  href={`/visionneuse?doc=${doc.id}`}
                  className="text-[11.5px] font-medium text-accent flex-none"
                >
                  {t("openCurrent")} →
                </Link>
              </div>
            </>
          ) : (
            <p className="text-[12px] text-ink-muted text-center py-8">
              {t("empty")}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
