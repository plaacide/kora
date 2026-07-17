"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Mono } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Uploader } from "./Uploader";
import { createFolder } from "@/app/actions/deals";
import { renameFolder, deleteFolder, deleteDocument, renameDocument } from "@/app/actions/crud";
import { PlainError } from "@/components/auth/FormError";
import type { Level } from "@/lib/permissions";
import { cn } from "@/lib/cn";

export interface FolderRow {
  id: string;
  parent_id: string | null;
  name: string;
  index_path: string;
  /** Consigne du template : ce qu'on attend dans ce dossier. */
  description: string;
}

export interface DocRow {
  id: string;
  folder_id: string;
  name: string;
  index_path: string;
  status: string;
  size_bytes: number | null;
  version_no: number | null;
  version_id: string | null;
  modified: string | null;
  views: number;
  permission: Level;
}

export interface AccessRow {
  name: string;
  role: string;
  level: Level;
  expires: string | null;
}

export interface ViewRow {
  who: string;
  when: string;
}

const PERM_TONE: Record<Level, ChipTone> = {
  none: "outline",
  watermark: "amber",
  view: "indigo",
  download: "success",
  edit: "neutral",
};

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ext(name: string): string {
  const e = name.split(".").pop()?.toUpperCase() ?? "";
  return e.length <= 4 ? e : "DOC";
}

/** Teinte d'icône par type — reprend la logique du prototype. */
function extTone(e: string): string {
  if (["XLS", "XLSX", "CSV"].includes(e))
    return "bg-chip-success-bg text-chip-success-fg";
  if (["PDF"].includes(e)) return "bg-chip-error-bg text-chip-error-fg";
  if (["DOC", "DOCX"].includes(e)) return "bg-chip-indigo-bg text-chip-indigo-fg";
  return "bg-chip-neutral-bg text-chip-neutral-fg";
}

export function DataRoom({
  orgId,
  dealId,
  dealName,
  readiness,
  folders,
  documents,
  accessByFolder,
  viewsByDoc,
  canEdit,
}: {
  orgId: string;
  dealId: string;
  dealName: string;
  readiness: number;
  folders: FolderRow[];
  documents: DocRow[];
  /** Les droits sont posés par dossier : tous ses documents les partagent. */
  accessByFolder: Record<string, AccessRow[]>;
  viewsByDoc: Record<string, ViewRow[]>;
  canEdit: boolean;
}) {
  const t = useTranslations("dataroom");
  const tp = useTranslations("permissions");
  const tc = useTranslations("common");
  const router = useRouter();

  const roots = useMemo(() => folders.filter((f) => !f.parent_id), [folders]);
  const [selected, setSelected] = useState<string | null>(roots[0]?.id ?? null);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(roots.map((f) => [f.id, true])),
  );
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedFolder = folders.find((f) => f.id === selected) ?? null;
  const docs = documents.filter((d) => d.folder_id === selected);
  const doc = documents.find((d) => d.id === selectedDoc) ?? docs[0] ?? null;
  const childrenOf = (id: string | null) =>
    folders.filter((f) => f.parent_id === id);
  const countIn = (id: string) =>
    documents.filter((d) => d.folder_id === id).length;

  async function addFolder() {
    setBusy(true);
    setError(undefined);
    const fd = new FormData();
    fd.set("deal_id", dealId);
    if (selectedFolder?.parent_id === null && selected) fd.set("parent_id", selected);
    fd.set("name", folderName);
    const res = await createFolder(undefined, fd);
    setBusy(false);
    if (res?.errorRaw || res?.errorKey) return setError(res.errorRaw ?? res.errorKey);
    setNewFolderOpen(false);
    setFolderName("");
    router.refresh();
  }

  async function removeFolder(id: string) {
    setError(undefined);
    const res = await deleteFolder(id);
    if (!res.ok) return setError(res.error);
    setSelected(roots[0]?.id ?? null);
    router.refresh();
  }

  async function removeDoc(id: string) {
    setError(undefined);
    const res = await deleteDocument(id);
    if (!res.ok) return setError(res.error);
    setSelectedDoc(null);
    router.refresh();
  }

  async function rename(id: string, current: string, isFolder: boolean) {
    const next = window.prompt(t("renamePrompt"), current);
    if (!next || next.trim() === current) return;
    setError(undefined);
    const res = isFolder
      ? await renameFolder(id, next.trim())
      : await renameDocument(id, next.trim());
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  function renderFolder(f: FolderRow, depth: number) {
    const kids = childrenOf(f.id);
    const active = selected === f.id;
    const open = openMap[f.id] ?? false;

    return (
      <div key={f.id}>
        <div
          className={cn(
            "group flex items-center gap-1.5 pr-1.5 rounded-btn",
            active
              ? "bg-chip-indigo-bg"
              : "hover:bg-[oklch(0.955_0.004_260)]",
          )}
          style={{ paddingLeft: 4 + depth * 12 }}
        >
          {kids.length > 0 ? (
            <button
              onClick={() => setOpenMap((m) => ({ ...m, [f.id]: !open }))}
              className="w-3.5 text-[9px] text-ink-muted cursor-pointer"
              aria-expanded={open}
              aria-label={
                open
                  ? t("collapse", { name: f.name })
                  : t("expand", { name: f.name })
              }
            >
              <span
                className="inline-block transition-transform"
                style={{ transform: open ? "rotate(90deg)" : "none" }}
              >
                ▶
              </span>
            </button>
          ) : (
            <span className="w-3.5" />
          )}

          <button
            onClick={() => {
              setSelected(f.id);
              setSelectedDoc(null);
            }}
            className="flex items-center gap-1.5 flex-1 min-w-0 py-1.5 text-left cursor-pointer"
          >
            <Mono
              className={cn(
                "text-[10.5px] w-6 flex-none",
                active ? "text-chip-indigo-fg" : "text-ink-muted",
              )}
            >
              {f.index_path}
            </Mono>
            <span
              className={cn(
                "text-[12.5px] truncate",
                depth === 0 ? "font-semibold" : "font-medium",
                active ? "text-chip-indigo-fg" : "text-ink",
              )}
            >
              {f.name}
            </span>
          </button>

          <span className="text-[10.5px] text-ink-muted">{countIn(f.id)}</span>

          {canEdit && (
            <button
              onClick={() => removeFolder(f.id)}
              className="opacity-0 group-hover:opacity-100 text-[10px] text-ink-muted hover:text-error cursor-pointer"
              title={t("deleteFolder")}
            >
              ✕
            </button>
          )}
        </div>
        {open && kids.map((k) => renderFolder(k, depth + 1))}
      </div>
    );
  }

  return (
    <>
      <PlainError message={error} />

      <div className="grid grid-cols-1 xl:grid-cols-[248px_1fr_290px] gap-4 items-start">
        {/* 1 — Arborescence indexée */}
        <aside className="bg-surface border border-line rounded-card shadow-card p-2.5">
          <div className="px-2 pt-1 pb-2.5">
            <div className="text-[13px] font-[650]">{dealName}</div>
            <div className="text-[10.5px] text-ink-secondary mt-0.5">
              {t("docCount", { count: documents.length })}
            </div>
          </div>

          {roots.map((f) => renderFolder(f, 0))}

          {canEdit && (
            <button
              onClick={() => setNewFolderOpen(true)}
              className="w-full text-left text-[11.5px] font-medium text-accent px-2 py-2 mt-1 cursor-pointer"
            >
              + {t("newFolder")}
            </button>
          )}

          <div className="mt-3 mx-2 pt-3 border-t border-separator-soft">
            <div className="flex justify-between text-[11px] font-[550] text-ink-secondary mb-1.5">
              <span>{t("readiness")}</span>
              <Mono>{readiness}%</Mono>
            </div>
            <span className="block h-1 rounded-[2px] bg-separator-soft overflow-hidden">
              <span
                className="block h-full bg-accent"
                style={{ width: `${readiness}%` }}
              />
            </span>
          </div>
        </aside>

        {/* 2 — Documents du dossier */}
        <section className="bg-surface border border-line rounded-card shadow-card overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-separator-soft">
            <div className="flex items-center gap-1.5 text-[12px] text-ink-secondary min-w-0">
              <span className="truncate">{dealName}</span>
              <span className="text-[oklch(0.75_0.005_260)]">/</span>
              <span className="text-ink font-semibold truncate">
                {selectedFolder
                  ? `${selectedFolder.index_path} ${selectedFolder.name}`
                  : "—"}
              </span>
            </div>
            {/* La consigne du template : c'est elle qui fait du dossier un guide. */}
            {selectedFolder?.description && (
              <p className="text-[11.5px] text-ink-muted leading-relaxed mt-1">
                {selectedFolder.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-[minmax(160px,1.6fr)_60px_110px_50px_70px] gap-2.5 px-3.5 py-2 text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted bg-bg border-b border-separator-soft">
            <span>{t("colDocument")}</span>
            <span>{t("colVersion")}</span>
            <span>{t("colPermission")}</span>
            <span className="text-right">{t("colViews")}</span>
            <span className="text-right">{t("colModified")}</span>
          </div>

          {docs.map((d) => {
            const e = ext(d.name);
            return (
              <div
                key={d.id}
                onClick={() => setSelectedDoc(d.id)}
                className={cn(
                  "group grid grid-cols-[minmax(160px,1.6fr)_60px_110px_50px_70px] gap-2.5 items-center px-3.5 py-2.5 border-b border-separator cursor-pointer",
                  doc?.id === d.id
                    ? "bg-[oklch(0.965_0.01_270)]"
                    : "hover:bg-[oklch(0.985_0.002_260)]",
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={cn(
                      "grid place-items-center w-[30px] h-[30px] rounded-[7px] font-mono text-[8.5px] font-semibold flex-none",
                      extTone(e),
                    )}
                  >
                    {e}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold truncate">
                      {d.name}
                    </div>
                    <Mono className="text-[10.5px] text-ink-muted">
                      {d.index_path} · {formatSize(d.size_bytes)}
                    </Mono>
                  </div>
                </div>
                <Mono className="text-[11.5px]">v{d.version_no ?? 1}</Mono>
                <span>
                  <Chip tone={PERM_TONE[d.permission]}>
                    {tp(`levels.${d.permission}`)}
                  </Chip>
                </span>
                <span className="text-[11.5px] text-ink-secondary text-right">
                  {d.views}
                </span>
                <Mono className="text-[11px] text-right">
                  {d.modified ?? "—"}
                </Mono>
              </div>
            );
          })}

          {docs.length === 0 && (
            <p className="px-3.5 py-6 text-center text-[12px] text-ink-muted">
              {t("emptyFolder")}
            </p>
          )}

          {canEdit && (
            <Uploader
              orgId={orgId}
              dealId={dealId}
              folderId={selected}
              folderIndex={selectedFolder?.index_path ?? ""}
            />
          )}
        </section>

        {/* 3 — Détail du document */}
        <aside className="bg-surface border border-line rounded-card shadow-card p-4 flex flex-col gap-3.5">
          {doc ? (
            <>
              <div className="grid place-items-center aspect-[16/10] rounded-[8px] bg-[oklch(0.965_0.003_260)] border border-separator-soft">
                <span
                  className={cn(
                    "grid place-items-center w-[52px] h-[52px] rounded-[10px] font-mono text-[13px] font-semibold",
                    extTone(ext(doc.name)),
                  )}
                >
                  {ext(doc.name)}
                </span>
              </div>

              <div>
                <div className="text-[13px] font-[650] break-words">
                  {doc.name}
                </div>
                <Mono className="text-[11px] text-ink-muted">
                  {doc.index_path} · {formatSize(doc.size_bytes)} · v
                  {doc.version_no ?? 1}
                </Mono>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/visionneuse?doc=${doc.id}`}
                  className="flex-1"
                >
                  <Button variant="primary" size="sm" className="w-full">
                    {t("open")}
                  </Button>
                </Link>
                {canEdit && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => rename(doc.id, doc.name, false)}
                    >
                      {t("rename")}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeDoc(doc.id)}
                    >
                      ✕
                    </Button>
                  </>
                )}
              </div>

              {/* Qui a accès — vient des permissions réelles */}
              <div>
                <div className="text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted mb-2">
                  {t("access")}
                </div>
                <div className="flex flex-col gap-2">
                  {(accessByFolder[doc.folder_id] ?? []).map((a) => (
                    <div key={a.name} className="flex items-center gap-2">
                      <span className="grid place-items-center w-[26px] h-[26px] rounded-full bg-chip-neutral-bg text-ink-secondary text-[9.5px] font-bold flex-none">
                        {a.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-semibold truncate">
                          {a.name}
                        </div>
                        <div className="text-[10.5px] text-ink-muted truncate">
                          {a.role}
                          {a.expires ? ` · ${t("expires")} ${a.expires}` : ""}
                        </div>
                      </div>
                      <Chip tone={PERM_TONE[a.level]}>
                        {tp(`levels.${a.level}`)}
                      </Chip>
                    </div>
                  ))}
                  {(accessByFolder[doc.folder_id] ?? []).length === 0 && (
                    <p className="text-[11.5px] text-ink-muted">
                      {t("noAccess")}
                    </p>
                  )}
                </div>
              </div>

              {/* Dernières vues — issues du journal d'audit */}
              <div>
                <div className="text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted mb-2">
                  {t("lastViews")}
                </div>
                <div className="flex flex-col gap-1.5">
                  {(viewsByDoc[doc.id] ?? []).map((v, i) => (
                    <div key={i} className="flex justify-between gap-2">
                      <span className="text-[12px] text-ink truncate">
                        {v.who}
                      </span>
                      <Mono className="text-[11px] text-ink-muted flex-none">
                        {v.when}
                      </Mono>
                    </div>
                  ))}
                  {(viewsByDoc[doc.id] ?? []).length === 0 && (
                    <p className="text-[11.5px] text-ink-muted">
                      {t("noViews")}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-bg border border-separator-soft rounded-[10px] p-3">
                <div className="text-[12px] font-[650]">{t("auditTitle")}</div>
                <p className="text-[11px] text-ink-secondary leading-relaxed my-1">
                  {t("auditBody")}
                </p>
                <Link
                  href="/audit"
                  className="text-[11.5px] font-medium text-accent"
                >
                  {t("auditLink")} →
                </Link>
              </div>
            </>
          ) : (
            <p className="text-[12px] text-ink-muted text-center py-6">
              {t("selectDoc")}
            </p>
          )}
        </aside>
      </div>

      <Modal
        open={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        title={t("newFolder")}
      >
        <div className="flex flex-col gap-4">
          <Input
            label={t("folderName")}
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            autoFocus
          />
          <p className="text-[11.5px] text-ink-muted">
            {selectedFolder?.parent_id === null && selectedFolder
              ? t("folderUnder", { parent: selectedFolder.name })
              : t("folderAtRoot")}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setNewFolderOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={addFolder}
              disabled={busy || folderName.trim().length < 2}
            >
              {tc("save")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
