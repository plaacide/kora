"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { folderIndex } from "@/lib/folder-index";
import { useTranslations } from "next-intl";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Mono } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Uploader } from "./Uploader";
import {
  FolderTemplates,
  type FolderTemplate,
} from "./FolderTemplates";
import { createFolder } from "@/app/actions/deals";
import {
  renameFolder,
  deleteFolder,
  deleteDocument,
  renameDocument,
} from "@/app/actions/crud";
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

function extTone(e: string): string {
  if (["XLS", "XLSX", "CSV"].includes(e))
    return "bg-chip-success-bg text-chip-success-fg";
  if (e === "PDF") return "bg-chip-error-bg text-chip-error-fg";
  if (["DOC", "DOCX"].includes(e)) return "bg-chip-indigo-bg text-chip-indigo-fg";
  return "bg-chip-neutral-bg text-chip-neutral-fg";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export function DataRoom({
  orgId,
  dealId,
  dealName,
  dealType,
  readiness,
  folders,
  documents,
  accessByFolder,
  viewsByDoc,
  templatesByFolder,
  canEdit,
}: {
  orgId: string;
  dealId: string;
  dealName: string;
  dealType: string;
  readiness: number;
  folders: FolderRow[];
  documents: DocRow[];
  accessByFolder: Record<string, AccessRow[]>;
  viewsByDoc: Record<string, ViewRow[]>;
  /** Modèles du dossier, rattachés par NOM de dossier. */
  templatesByFolder: Record<string, FolderTemplate[]>;
  canEdit: boolean;
}) {
  const t = useTranslations("dataroom");
  const tp = useTranslations("permissions");
  const tc = useTranslations("common");
  const router = useRouter();

  const roots = useMemo(() => folders.filter((f) => !f.parent_id), [folders]);
  const [selected, setSelected] = useState<string | null>(roots[0]?.id ?? null);
  // Seul le premier dossier racine est déroulé : avec 6+ catégories (chacune
  // avec ses sous-dossiers), tout ouvrir rendait l'arbre trop long.
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(roots.map((f, i) => [f.id, i === 0])),
  );
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | undefined>();
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [renaming, setRenaming] = useState<{
    id: string;
    isFolder: boolean;
    value: string;
  } | null>(null);
  const uploadRef = useRef<HTMLButtonElement>(null);

  const selectedFolder = folders.find((f) => f.id === selected) ?? null;
  const parentFolder = selectedFolder?.parent_id
    ? (folders.find((f) => f.id === selectedFolder.parent_id) ?? null)
    : null;
  const docs = documents.filter((d) => d.folder_id === selected);
  const doc = documents.find((d) => d.id === selectedDoc) ?? docs[0] ?? null;
  const childrenOf = (id: string | null) =>
    folders.filter((f) => f.parent_id === id);

  /**
   * Compte RÉCURSIF : « Corporate » doit afficher tout ce qu'il contient,
   * sous-dossiers compris. Un dossier parent qui affiche 0 alors que ses
   * enfants sont pleins ne veut rien dire.
   */
  const countIn = (id: string): number => {
    const own = documents.filter((d) => d.folder_id === id).length;
    return childrenOf(id).reduce((sum, c) => sum + countIn(c.id), own);
  };

  async function addFolder() {
    setBusy(true);
    setError(undefined);
    const fd = new FormData();
    fd.set("deal_id", dealId);
    if (selectedFolder && !selectedFolder.parent_id) fd.set("parent_id", selectedFolder.id);
    fd.set("name", folderName);
    const res = await createFolder(undefined, fd);
    setBusy(false);
    if (res?.errorRaw || res?.errorKey)
      return setError(res.errorRaw ?? res.errorKey);
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

  /** Renommage via modale : window.prompt est bloqué dans certains contextes. */
  function askRename(id: string, current: string, isFolder: boolean) {
    setRenaming({ id, isFolder, value: current });
  }

  async function confirmRename() {
    if (!renaming) return;
    const value = renaming.value.trim();
    if (value.length < 2) return;
    setBusy(true);
    setError(undefined);
    const res = renaming.isFolder
      ? await renameFolder(renaming.id, value)
      : await renameDocument(renaming.id, value);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setRenaming(null);
    router.refresh();
  }

  /** Partager = copier le lien de la visionneuse. Le fichier ne circule pas. */
  function share() {
    if (!doc) return;
    navigator.clipboard.writeText(
      `${window.location.origin}/visionneuse?doc=${doc.id}`,
    );
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** Suppression groupée : séquentielle, pour que chaque ligne soit auditée. */
  async function removeChecked() {
    setBusy(true);
    setError(undefined);
    for (const id of checked) {
      const res = await deleteDocument(id);
      if (!res.ok) {
        setError(res.error);
        break;
      }
    }
    setBusy(false);
    setChecked(new Set());
    setBulkOpen(false);
    setSelectedDoc(null);
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
            active ? "bg-chip-indigo-bg" : "hover:bg-[oklch(0.955_0.004_260)]",
          )}
          style={{ paddingLeft: 4 + depth * 14 }}
        >
          {kids.length > 0 ? (
            <button
              onClick={() => setOpenMap((m) => ({ ...m, [f.id]: !open }))}
              className="w-3 text-[9px] text-ink-muted cursor-pointer"
              aria-expanded={open}
              aria-label={
                open ? t("collapse", { name: f.name }) : t("expand", { name: f.name })
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
            <span className="w-3" />
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
                "text-[10.5px] flex-none",
                depth === 0 ? "w-3.5" : "w-6",
                active ? "text-chip-indigo-fg" : "text-ink-muted",
              )}
            >
              {folderIndex(f.index_path)}
            </Mono>
            <span
              className={cn(
                "truncate",
                depth === 0 ? "text-[12.5px] font-semibold" : "text-[12px] font-medium",
                active ? "text-chip-indigo-fg" : depth === 0 ? "text-ink" : "text-ink-secondary",
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

      <div className="grid grid-cols-1 xl:grid-cols-[236px_1fr_286px] gap-4 items-start">
        {/* 1 — Arborescence */}
        <aside className="bg-surface border border-line rounded-card shadow-card p-2.5">
          <div className="flex items-center gap-2 px-1.5 pt-1 pb-3">
            <span className="grid place-items-center w-[26px] h-[26px] rounded-[7px] bg-chip-amber-bg text-chip-amber-fg text-[10.5px] font-bold flex-none">
              {initials(dealName)}
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-[650] truncate">{dealName}</div>
              <div className="text-[10.5px] text-ink-secondary">
                {dealType} · {t("docCount", { count: documents.length })}
              </div>
            </div>
          </div>

          {roots.map((f) => renderFolder(f, 0))}

          <div className="mt-3 mx-1.5 pt-3 border-t border-separator-soft">
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

        {/* 2 — Documents */}
        <section className="bg-surface border border-line rounded-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 border-b border-separator-soft">
            {/* Fil d'Ariane complet : le parent situe le dossier dans l'arbo. */}
            <div className="flex items-center gap-1.5 text-[12px] text-ink-secondary min-w-0">
              <span className="truncate">{dealName}</span>
              {parentFolder && (
                <>
                  <span className="text-[oklch(0.75_0.005_260)]">/</span>
                  <span className="truncate">
                    {folderIndex(parentFolder.index_path)} {parentFolder.name}
                  </span>
                </>
              )}
              <span className="text-[oklch(0.75_0.005_260)]">/</span>
              <span className="text-ink font-semibold truncate">
                {selectedFolder
                  ? `${folderIndex(selectedFolder.index_path)} ${selectedFolder.name}`
                  : "—"}
              </span>
            </div>

            {canEdit && (
              <div className="flex gap-2 flex-none">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setNewFolderOpen(true)}
                >
                  {t("newFolder")}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => uploadRef.current?.click()}
                >
                  {t("dropFiles")}
                </Button>
              </div>
            )}
          </div>

          {/* N'apparaît que s'il y a une sélection : une case à cocher sans
              action derrière est pire qu'une absence de case. */}
          {checked.size > 0 && canEdit && (
            <div className="flex items-center gap-3 px-3.5 py-2 bg-chip-indigo-bg border-b border-separator-soft">
              <span className="text-[11.5px] font-[650] text-chip-indigo-fg">
                {t("selected", { n: checked.size })}
              </span>
              <button
                onClick={() => setBulkOpen(true)}
                disabled={busy}
                className="text-[11.5px] font-medium text-[oklch(0.48_0.16_25)] cursor-pointer"
              >
                {t("deleteSelected")}
              </button>
              <button
                onClick={() => setChecked(new Set())}
                className="ml-auto text-[11.5px] font-medium text-ink-secondary cursor-pointer"
              >
                {tc("cancel")}
              </button>
            </div>
          )}

          <div className="grid grid-cols-[22px_minmax(150px,1.6fr)_56px_104px_44px_66px] gap-2.5 px-3.5 py-2 text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted bg-bg border-b border-separator-soft">
            <span />
            <span>{t("colDocument")}</span>
            <span>{t("colVersion")}</span>
            <span>{t("colPermission")}</span>
            <span className="text-right">{t("colViews")}</span>
            <span className="text-right">{t("colModified")}</span>
          </div>

          {/* Sous-dossiers d'abord : sélectionner « Corporate » doit montrer
              ce qu'il contient, dossiers compris. Une table vide alors que le
              dossier a 4 enfants n'a aucun sens. */}
          {childrenOf(selected).map((f) => (
            <div
              key={f.id}
              onClick={() => {
                setSelected(f.id);
                setSelectedDoc(null);
              }}
              className="group grid grid-cols-[22px_minmax(150px,1.6fr)_56px_104px_44px_66px] gap-2.5 items-center px-3.5 py-2.5 border-b border-separator cursor-pointer hover:bg-[oklch(0.985_0.002_260)]"
            >
              <span />
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid place-items-center w-[30px] h-[30px] rounded-[7px] bg-chip-amber-bg text-chip-amber-fg text-[13px] flex-none">
                  ▸
                </span>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold truncate">
                    {f.name}
                  </div>
                  <Mono className="text-[10.5px] text-ink-muted">
                    {folderIndex(f.index_path)}
                  </Mono>
                </div>
              </div>
              <span className="text-[11px] text-ink-muted">{t("folder")}</span>
              <span />
              {/* Le nombre d'éléments occupe la colonne « vues » : compact,
                  et aligné avec les lignes de documents. */}
              <span className="text-[11.5px] text-ink-secondary text-right">
                {countIn(f.id)}
              </span>
              {canEdit && (
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      askRename(f.id, f.name, true);
                    }}
                    className="text-[10.5px] font-medium text-ink-secondary hover:text-ink cursor-pointer"
                  >
                    {t("rename")}
                  </button>
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      removeFolder(f.id);
                    }}
                    className="text-[10.5px] text-ink-muted hover:text-error cursor-pointer"
                    title={t("deleteFolder")}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}

          {docs.map((d) => {
            const e = ext(d.name);
            return (
              <div
                key={d.id}
                onClick={() => setSelectedDoc(d.id)}
                className={cn(
                  "group grid grid-cols-[22px_minmax(150px,1.6fr)_56px_104px_44px_66px] gap-2.5 items-center px-3.5 py-2.5 border-b border-separator cursor-pointer",
                  doc?.id === d.id
                    ? "bg-[oklch(0.965_0.01_270)]"
                    : "hover:bg-[oklch(0.985_0.002_260)]",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked.has(d.id)}
                  onChange={() => toggleCheck(d.id)}
                  onClick={(ev) => ev.stopPropagation()}
                  aria-label={d.name}
                  className="w-3.5 h-3.5 cursor-pointer"
                />
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
                {/* La date cède la place aux actions au survol : renommer et
                    supprimer doivent être atteignables depuis la liste. */}
                <div className="text-right">
                  <Mono
                    className={cn(
                      "text-[11px]",
                      canEdit && "group-hover:hidden",
                    )}
                  >
                    {d.modified ?? "—"}
                  </Mono>
                  {canEdit && (
                    <div className="hidden group-hover:flex items-center justify-end gap-2">
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          askRename(d.id, d.name, false);
                        }}
                        className="text-[10.5px] font-medium text-ink-secondary hover:text-ink cursor-pointer"
                      >
                        {t("rename")}
                      </button>
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          removeDoc(d.id);
                        }}
                        className="text-[10.5px] text-ink-muted hover:text-error cursor-pointer"
                        title={t("deleteDoc")}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Vraiment vide = ni sous-dossier ni fichier. C'est le moment exact
              où la consigne du template est utile. */}
          {docs.length === 0 && childrenOf(selected).length === 0 && (
            <div className="px-5 py-7 text-center">
              <p className="text-[12.5px] font-semibold text-ink">
                {t("emptyFolder")}
              </p>
              {selectedFolder?.description && (
                <p className="text-[12px] text-ink-secondary leading-relaxed max-w-md mx-auto mt-1.5">
                  <span className="font-[650] text-ink">
                    {t("whatToPut")}
                  </span>{" "}
                  {selectedFolder.description}
                </p>
              )}
            </div>
          )}

          <FolderTemplates
            templates={
              (selectedFolder && templatesByFolder[selectedFolder.name]) || []
            }
          />

          {canEdit && (
            <Uploader
              ref={uploadRef}
              orgId={orgId}
              dealId={dealId}
              folderId={selected}
              folderIndex={selectedFolder?.index_path ?? ""}
            />
          )}
        </section>

        {/* 3 — Détail */}
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
                <Link href={`/visionneuse?doc=${doc.id}`} className="flex-1">
                  <Button variant="primary" size="sm" className="w-full">
                    {t("open")}
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={share}
                  className="flex-1"
                >
                  {shared ? t("copied") : t("share")}
                </Button>
              </div>

              {canEdit && (
                <div className="flex gap-2 -mt-1.5">
                  <button
                    onClick={() => askRename(doc.id, doc.name, false)}
                    className="text-[11px] font-medium text-ink-secondary hover:text-ink cursor-pointer"
                  >
                    {t("rename")}
                  </button>
                  <button
                    onClick={() => removeDoc(doc.id)}
                    className="text-[11px] font-medium text-ink-muted hover:text-error cursor-pointer ml-auto"
                  >
                    {t("deleteDoc")}
                  </button>
                </div>
              )}

              <div>
                <div className="text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted mb-2">
                  {t("access")}
                </div>
                <div className="flex flex-col gap-2">
                  {(accessByFolder[doc.folder_id] ?? []).map((a) => (
                    <div key={a.name} className="flex items-center gap-2">
                      <span className="grid place-items-center w-[26px] h-[26px] rounded-full bg-chip-neutral-bg text-ink-secondary text-[9.5px] font-bold flex-none">
                        {initials(a.name)}
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
        open={Boolean(renaming)}
        onClose={() => setRenaming(null)}
        title={renaming?.isFolder ? t("renameFolder") : t("renameDoc")}
      >
        <div className="flex flex-col gap-4">
          <Input
            label={renaming?.isFolder ? t("folderName") : t("docName")}
            value={renaming?.value ?? ""}
            onChange={(e) =>
              setRenaming((r) => (r ? { ...r, value: e.target.value } : r))
            }
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              {tc("cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={confirmRename}
              disabled={busy || (renaming?.value.trim().length ?? 0) < 2}
            >
              {tc("save")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title={t("deleteSelected")}
      >
        <div className="flex flex-col gap-4">
          <p className="text-[12.5px] text-ink-secondary leading-relaxed">
            {t("bulkDeleteBody", { n: checked.size })}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setBulkOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button variant="danger" onClick={removeChecked} disabled={busy}>
              {busy ? t("deleting") : t("confirmDelete")}
            </Button>
          </div>
        </div>
      </Modal>

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
            {selectedFolder && !selectedFolder.parent_id
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
