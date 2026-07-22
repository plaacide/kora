"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  setChecklistStatus,
  attachChecklistDocument,
  detachChecklistDocument,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from "@/app/actions/checklist";
import { folderIndex } from "@/lib/folder-index";
import { PlainError } from "@/components/auth/FormError";
import { cn } from "@/lib/cn";

export const STATUSES = ["todo", "in_progress", "done"] as const;
export type Status = (typeof STATUSES)[number];

export interface ChecklistItem {
  id: string;
  category: "ohada" | "financier" | "dfi";
  label: string;
  description: string;
  status: Status;
  /** Les preuves rattachées. Plusieurs : PV sur 3 exercices, CAC général + spécial. */
  documents: string[];
  /** Dossier de la data room où cette pièce se dépose. */
  folder_id: string | null;
}

export interface DocOption {
  id: string;
  name: string;
  index_path: string;
  folder_id?: string | null;
}

export interface FolderOption {
  id: string;
  name: string;
  index_path: string;
}

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

/** Pastille de statut, style maquette (mono, plate). */
const STATUT_PILL: Record<Status, string> = {
  todo: "text-[#8B8E96] bg-[#F1F0EB]",
  in_progress: "text-[#B4741B] bg-[#FBF0DC]",
  done: "text-[#147A5C] bg-[#E4F3EC]",
};

const CATEGORIES: Array<ChecklistItem["category"]> = [
  "ohada",
  "financier",
  "dfi",
];

/** Même formule que recompute_readiness côté base : « en cours » vaut 0,5. */
function computeScore(list: ChecklistItem[]): number {
  if (!list.length) return 0;
  const pts = list.reduce(
    (s, i) => s + (i.status === "done" ? 1 : i.status === "in_progress" ? 0.5 : 0),
    0,
  );
  return Math.round((pts / list.length) * 100);
}

export function Checklist({
  dealId,
  items,
  docs,
  folders,
  readiness,
  canEdit,
}: {
  dealId: string;
  items: ChecklistItem[];
  docs: DocOption[];
  folders: FolderOption[];
  readiness: number;
  canEdit: boolean;
}) {
  const t = useTranslations("checklist");
  const tc = useTranslations("common");
  const router = useRouter();
  const [local, setLocal] = useState(items);
  const [score, setScore] = useState(readiness);
  const [error, setError] = useState<string | undefined>();
  // Identifiants provisoires des exigences ajoutées avant retour du serveur.
  const tempId = useRef(0);
  // Dossier attendu, par identifiant — pour afficher « à déposer dans 1.2 ».
  const folderById = new Map(folders.map((f) => [f.id, f]));
  // Pour nommer les preuves rattachées (l'exigence n'en porte que les ids).
  const docById = new Map(docs.map((d) => [d.id, d]));
  const [, startTransition] = useTransition();

  // Après un router.refresh(), le serveur renvoie la liste et le score à jour :
  // on resynchronise l'état local dessus (source de vérité). Ajusté PENDANT le
  // rendu (motif React documenté), pas dans un effet.
  const [vus, setVus] = useState(items);
  if (items !== vus) {
    setVus(items);
    setLocal(items);
    setScore(readiness);
  }

  // Ajout d'exigence : catégorie dont le formulaire est ouvert + champs.
  const [adding, setAdding] = useState<ChecklistItem["category"] | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newDesc, setNewDesc] = useState("");
  // Édition : id de l'exigence en cours d'édition + champs.
  const [editing, setEditing] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDesc, setEditDesc] = useState("");

  function run(
    optimistic: ChecklistItem[],
    fn: () => Promise<{ ok: boolean; error?: string }>,
  ) {
    const previous = local;
    setLocal(optimistic);
    setScore(computeScore(optimistic));
    setError(undefined);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setLocal(previous);
        setScore(computeScore(previous));
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  /** Cycle du prototype : À faire → En cours → Fait → À faire. */
  function cycle(item: ChecklistItem) {
    if (!canEdit) return;
    const next = STATUSES[(STATUSES.indexOf(item.status) + 1) % STATUSES.length];
    run(
      local.map((i) => (i.id === item.id ? { ...i, status: next } : i)),
      async () => {
        const res = await setChecklistStatus(item.id, next);
        return { ok: res.ok, error: res.error };
      },
    );
  }

  /** Miroir de la règle base (preuves multiples) : le statut suit le nombre de preuves. */
  function statutPour(item: ChecklistItem, preuves: string[]): Status {
    if (preuves.length > 0 && item.status === "todo") return "done";
    if (preuves.length === 0 && item.status === "done") return "todo";
    return item.status;
  }

  function attach(item: ChecklistItem, docId: string) {
    if (!docId || item.documents.includes(docId)) return;
    const preuves = [...item.documents, docId];
    run(
      local.map((i) =>
        i.id === item.id
          ? { ...i, documents: preuves, status: statutPour(item, preuves) }
          : i,
      ),
      () => attachChecklistDocument(item.id, docId),
    );
  }

  function detach(item: ChecklistItem, docId: string) {
    const preuves = item.documents.filter((d) => d !== docId);
    run(
      local.map((i) =>
        i.id === item.id
          ? { ...i, documents: preuves, status: statutPour(item, preuves) }
          : i,
      ),
      () => detachChecklistDocument(item.id, docId),
    );
  }

  function saveNew(cat: ChecklistItem["category"]) {
    const label = newLabel.trim();
    if (label.length < 2) return;
    setAdding(null);
    setNewLabel("");
    setNewDesc("");
    tempId.current += 1;
    const temp: ChecklistItem = {
      id: `temp-${tempId.current}`,
      category: cat,
      label,
      description: newDesc.trim(),
      status: "todo",
      documents: [],
      folder_id: null,
    };
    run([...local, temp], () =>
      addChecklistItem(dealId, cat, label, newDesc.trim()),
    );
  }

  function saveEdit(item: ChecklistItem) {
    const label = editLabel.trim();
    if (label.length < 2) return;
    setEditing(null);
    run(
      local.map((i) =>
        i.id === item.id ? { ...i, label, description: editDesc.trim() } : i,
      ),
      () => updateChecklistItem(item.id, label, editDesc.trim()),
    );
  }

  function remove(item: ChecklistItem) {
    run(
      local.filter((i) => i.id !== item.id),
      () => deleteChecklistItem(item.id),
    );
  }

  const done = local.filter((i) => i.status === "done").length;
  const champ =
    "w-full h-8 px-2.5 text-[12.5px] bg-white text-[#1A1B1F] rounded-[5px] border border-[#E4E2DC] focus:border-[#E85C2B] focus:outline-none";

  return (
    <div className="flex flex-col gap-6 text-[#1A1B1F]">
      <PlainError message={error} />

      {/* Préparation — le score se recalcule à chaque changement. */}
      <div className="border border-[#ECEBE6] rounded-[6px] p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[12.5px] font-[600] text-[#6E727A]">
            {t("readinessTitle")}
          </span>
          <span style={mono} className="text-[19px] tracking-[-0.03em]">{score}%</span>
        </div>
        <span className="block h-1.5 rounded-[3px] bg-[#ECEBE6] overflow-hidden mt-2">
          <span
            className={cn(
              "block h-full transition-all",
              score < 50 ? "bg-[#C0392B]" : score < 75 ? "bg-[#B4741B]" : "bg-[#147A5C]",
            )}
            style={{ width: `${score}%` }}
          />
        </span>
        <p className="text-[11.5px] text-[#9DA0A8] mt-2">
          {t("progress", { done, total: local.length })}
        </p>
      </div>

      {CATEGORIES.map((cat) => {
        const list = local.filter((i) => i.category === cat);
        const catDone = list.filter((i) => i.status === "done").length;

        return (
          <section key={cat} className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[13px] font-[700]">{t(`categories.${cat}`)}</h2>
              {list.length > 0 && (
                <span style={mono} className="text-[11px] text-[#9DA0A8]">
                  {catDone}/{list.length}
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-[#9DA0A8] -mt-1">
              {t(`categoryHints.${cat}`)}
            </p>

            <div className="border border-[#ECEBE6] rounded-[6px] overflow-hidden">
              {list.map((i) => (
                <div
                  key={i.id}
                  className="flex items-start gap-3 px-4 py-3 border-b border-[#F1F0EC] last:border-0 hover:bg-[#FAFAF8] group"
                >
                  <button
                    onClick={() => cycle(i)}
                    disabled={!canEdit || editing === i.id}
                    title={canEdit ? t("clickToCycle") : undefined}
                    className={cn("mt-0.5 flex-none", canEdit ? "cursor-pointer" : "cursor-default")}
                  >
                    <span
                      style={mono}
                      className={"inline-block text-[9px] font-[600] rounded-[4px] px-2 py-[3px] uppercase whitespace-nowrap " + STATUT_PILL[i.status]}
                    >
                      {t(`status.${i.status}`)}
                    </span>
                  </button>

                  <div className="min-w-0 flex-1">
                    {editing === i.id ? (
                      <div className="flex flex-col gap-1.5">
                        <input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          autoFocus
                          className={champ}
                        />
                        <input
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder={t("reqDescPlaceholder")}
                          className={champ + " text-[#6E727A]"}
                        />
                        <div className="flex gap-2 mt-0.5">
                          <button onClick={() => saveEdit(i)} className="text-[11.5px] font-[600] text-[#C24619] cursor-pointer">
                            {tc("save")}
                          </button>
                          <button onClick={() => setEditing(null)} className="text-[11.5px] text-[#9DA0A8] cursor-pointer">
                            {tc("cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={cn("text-[12.5px] font-[600]", i.status === "done" && "text-[#6E727A]")}>
                          {i.label}
                        </div>
                        {i.description && (
                          <p className="text-[11.5px] text-[#9DA0A8] leading-relaxed mt-0.5">
                            {i.description}
                          </p>
                        )}
                        {/* Où déposer la pièce — affiché seulement tant qu'elle manque. */}
                        {i.documents.length === 0 &&
                          (() => {
                            const dossier = i.folder_id ? folderById.get(i.folder_id) : undefined;
                            if (!dossier) return null;
                            return (
                              <Link
                                href={`/data-room?dossier=${dossier.id}`}
                                className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-[#C24619] hover:text-[#1A1B1F]"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                  <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h7A1.5 1.5 0 0 1 19 10v7.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 3 17.5z" />
                                </svg>
                                {t("depositIn", { folder: `${folderIndex(dossier.index_path)} ${dossier.name}` })}
                              </Link>
                            );
                          })()}

                        {/* Preuves rattachées, nommées. */}
                        {i.documents.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {i.documents.map((id) => {
                              const d = docById.get(id);
                              return (
                                <span
                                  key={id}
                                  className="inline-flex items-center gap-1 rounded-[5px] border border-[#ECEBE6] bg-[#FAFAF8] pl-1.5 pr-1 py-0.5 text-[11px] text-[#55585F] max-w-[240px]"
                                >
                                  <span className="truncate">
                                    {d ? `${folderIndex(d.index_path)} ${d.name}` : t("removedDoc")}
                                  </span>
                                  {canEdit && (
                                    <button
                                      onClick={() => detach(i, id)}
                                      aria-label={t("unlinkDoc")}
                                      className="text-[#9DA0A8] hover:text-[#C0392B] leading-none text-[13px]"
                                    >
                                      ×
                                    </button>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {canEdit && editing !== i.id && (
                    <div className="flex items-center gap-2 flex-none">
                      <select
                        value=""
                        onChange={(e) => attach(i, e.target.value)}
                        className="h-7 max-w-[160px] px-1.5 text-[11px] bg-white text-[#55585F] rounded-[5px] border border-[#E4E2DC] cursor-pointer focus:outline-none"
                        aria-label={t("linkDoc")}
                      >
                        <option value="">
                          {i.documents.length ? t("addDoc") : t("noDoc")}
                        </option>
                        {(() => {
                          const libres = docs.filter((d) => !i.documents.includes(d.id));
                          const duDossier = i.folder_id
                            ? libres.filter((d) => d.folder_id === i.folder_id)
                            : [];
                          const autres = libres.filter((d) => !duDossier.includes(d));
                          const ligne = (d: DocOption) => (
                            <option key={d.id} value={d.id}>
                              {folderIndex(d.index_path)} {d.name}
                            </option>
                          );
                          if (duDossier.length === 0) return libres.map(ligne);
                          return (
                            <>
                              <optgroup label={t("expectedFolderGroup")}>
                                {duDossier.map(ligne)}
                              </optgroup>
                              {autres.length > 0 && (
                                <optgroup label={t("otherDocsGroup")}>
                                  {autres.map(ligne)}
                                </optgroup>
                              )}
                            </>
                          );
                        })()}
                      </select>
                      <button
                        onClick={() => {
                          setEditing(i.id);
                          setEditLabel(i.label);
                          setEditDesc(i.description);
                        }}
                        aria-label={t("editReq")}
                        className="text-[#9DA0A8] hover:text-[#1A1B1F] opacity-0 group-hover:opacity-100 transition-opacity text-[12px]"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => remove(i)}
                        aria-label={t("deleteReq")}
                        className="text-[#9DA0A8] hover:text-[#C0392B] opacity-0 group-hover:opacity-100 transition-opacity text-[14px] leading-none"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {list.length === 0 && (
                <p className="text-[11.5px] text-[#9DA0A8] px-4 py-3">{t("noItems")}</p>
              )}

              {/* Ajout d'exigence personnalisée. */}
              {canEdit && (
                <div className="px-4 py-2.5 bg-[#FAFAF8] border-t border-[#ECEBE6]">
                  {adding === cat ? (
                    <div className="flex flex-col gap-1.5">
                      <input
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        autoFocus
                        placeholder={t("reqLabelPlaceholder")}
                        className={champ}
                      />
                      <input
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder={t("reqDescPlaceholder")}
                        className={champ + " text-[#6E727A]"}
                      />
                      <div className="flex gap-2 mt-0.5">
                        <button
                          onClick={() => saveNew(cat)}
                          disabled={newLabel.trim().length < 2}
                          className="text-[11.5px] font-[600] text-[#C24619] disabled:opacity-40 cursor-pointer disabled:cursor-default"
                        >
                          {t("addBtn")}
                        </button>
                        <button
                          onClick={() => {
                            setAdding(null);
                            setNewLabel("");
                            setNewDesc("");
                          }}
                          className="text-[11.5px] text-[#9DA0A8] cursor-pointer"
                        >
                          {tc("cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAdding(cat)}
                      className="text-[11.5px] font-[600] text-[#C24619] cursor-pointer"
                    >
                      {t("addRequirement")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        );
      })}

      <p className="text-[11.5px] text-[#9DA0A8] leading-relaxed max-w-2xl">
        {t("scoreExplainer")}
      </p>
    </div>
  );
}
