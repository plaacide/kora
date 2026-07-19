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
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Mono } from "@/components/ui/Table";
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

const TONE: Record<Status, ChipTone> = {
  todo: "outline",
  in_progress: "amber",
  done: "success",
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
  // on resynchronise l'état local dessus (source de vérité).
  //
  // Ajusté PENDANT le rendu et non dans un effet : c'est le motif documenté
  // par React pour dériver un état d'une prop. Dans un effet, la resynchro
  // provoquait un second rendu en cascade — l'utilisateur voyait brièvement
  // l'ancienne liste après chaque enregistrement.
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

  /**
   * Miroir de la règle appliquée en base (cf. migration « preuves
   * multiples ») : le statut suit le NOMBRE de preuves. La première valide une
   * pièce à faire, la dernière retirée la ramène à l'état initial. Une pièce
   * « en cours » n'est pas promue — le fondateur a exprimé une intention, on
   * ne la contredit pas. Sans ce miroir, la jauge ne bougerait qu'au
   * rechargement.
   */
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
    // Optimiste avec un id temporaire ; le refresh apporte le vrai.
    // Compteur plutôt que Math.random : un identifiant tiré au hasard change
    // à chaque rendu et déstabilise la réconciliation de React.
    tempId.current += 1;
    const temp: ChecklistItem = {
      id: `temp-${tempId.current}`,
      category: cat,
      label,
      description: newDesc.trim(),
      status: "todo",
      documents: [],
      // Une exigence ajoutée à la main n'a pas de dossier de référence.
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

  return (
    <div className="flex flex-col gap-5">
      <PlainError message={error} />

      {/* Le score se recalcule à chaque changement : il mesure, il ne décore pas. */}
      <div className="bg-surface border border-line rounded-card shadow-card p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[12.5px] font-[550] text-ink-secondary">
            {t("readinessTitle")}
          </span>
          <Mono className="text-[19px] text-ink tracking-[-0.03em]">
            {score}%
          </Mono>
        </div>
        <span className="block h-1.5 rounded-[3px] bg-separator-soft overflow-hidden mt-2">
          <span
            className={cn(
              "block h-full transition-all",
              score < 50
                ? "bg-[oklch(0.60_0.17_40)]"
                : score < 75
                  ? "bg-[oklch(0.65_0.14_85)]"
                  : "bg-[oklch(0.60_0.13_155)]",
            )}
            style={{ width: `${score}%` }}
          />
        </span>
        <p className="text-[11.5px] text-ink-muted mt-2">
          {t("progress", { done, total: local.length })}
        </p>
      </div>

      {CATEGORIES.map((cat) => {
        const list = local.filter((i) => i.category === cat);
        const catDone = list.filter((i) => i.status === "done").length;

        return (
          <section key={cat} className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[13px] font-[650]">{t(`categories.${cat}`)}</h2>
              {list.length > 0 && (
                <Mono className="text-[11px] text-ink-muted">
                  {catDone}/{list.length}
                </Mono>
              )}
            </div>
            <p className="text-[11.5px] text-ink-muted -mt-1">
              {t(`categoryHints.${cat}`)}
            </p>

            <div className="bg-surface border border-line rounded-card shadow-card overflow-hidden">
              {list.map((i) => (
                <div
                  key={i.id}
                  className="flex items-start gap-3 px-4 py-3 border-b border-separator last:border-0 group"
                >
                  <button
                    onClick={() => cycle(i)}
                    disabled={!canEdit || editing === i.id}
                    title={canEdit ? t("clickToCycle") : undefined}
                    className={cn(
                      "mt-0.5 flex-none",
                      canEdit ? "cursor-pointer" : "cursor-default",
                    )}
                  >
                    <Chip tone={TONE[i.status]}>{t(`status.${i.status}`)}</Chip>
                  </button>

                  <div className="min-w-0 flex-1">
                    {editing === i.id ? (
                      <div className="flex flex-col gap-1.5">
                        <input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          autoFocus
                          className="w-full h-7 px-2 text-[12.5px] bg-bg text-ink rounded-[6px] border border-line focus:border-accent focus:outline-none"
                        />
                        <input
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder={t("reqDescPlaceholder")}
                          className="w-full h-7 px-2 text-[11.5px] bg-bg text-ink-secondary rounded-[6px] border border-line focus:border-accent focus:outline-none"
                        />
                        <div className="flex gap-2 mt-0.5">
                          <button
                            onClick={() => saveEdit(i)}
                            className="text-[11px] font-semibold text-accent cursor-pointer"
                          >
                            {tc("save")}
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="text-[11px] text-ink-muted cursor-pointer"
                          >
                            {tc("cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className={cn(
                            "text-[12.5px] font-semibold",
                            i.status === "done" && "text-ink-secondary",
                          )}
                        >
                          {i.label}
                        </div>
                        {i.description && (
                          <p className="text-[11.5px] text-ink-muted leading-relaxed mt-0.5">
                            {i.description}
                          </p>
                        )}
                        {/* Où déposer la pièce. C'est ce qui distingue un
                            guide d'une liste : sans cette ligne, le fondateur
                            doit deviner lequel des 30 dossiers accueille son
                            RCCM. Affiché seulement quand la pièce manque —
                            une fois la preuve rattachée, l'indication n'a
                            plus d'utilité et alourdirait la lecture. */}
                        {i.documents.length === 0 &&
                          (() => {
                            const dossier = i.folder_id
                              ? folderById.get(i.folder_id)
                              : undefined;
                            if (!dossier) return null;
                            return (
                              <Link
                                href={`/data-room?dossier=${dossier.id}`}
                                className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-link hover:text-link-hover"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                  <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h7A1.5 1.5 0 0 1 19 10v7.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 3 17.5z" />
                                </svg>
                                {t("depositIn", {
                                  folder: `${folderIndex(dossier.index_path)} ${dossier.name}`,
                                })}
                              </Link>
                            );
                          })()}

                        {/* Les preuves rattachées, nommées. Un compteur
                            (« 3 documents ») obligerait à ouvrir pour savoir
                            s'il manque l'exercice 2023 — c'est précisément la
                            question que le fondateur se pose. */}
                        {i.documents.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {i.documents.map((id) => {
                              const d = docById.get(id);
                              return (
                                <span
                                  key={id}
                                  className="inline-flex items-center gap-1 rounded-[6px] border border-line bg-surface-2 pl-1.5 pr-1 py-0.5 text-[11px] text-ink-secondary max-w-[240px]"
                                >
                                  <span className="truncate">
                                    {d
                                      ? `${folderIndex(d.index_path)} ${d.name}`
                                      : t("removedDoc")}
                                  </span>
                                  {canEdit && (
                                    <button
                                      onClick={() => detach(i, id)}
                                      aria-label={t("unlinkDoc")}
                                      className="text-ink-muted hover:text-[oklch(0.55_0.17_25)] leading-none text-[13px]"
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
                      {/* Ajout d'une preuve. Le champ revient toujours à vide :
                          c'est une action (« ajouter »), pas la valeur d'un
                          état — les preuves déjà rattachées se lisent à gauche.
                          Un select qui afficherait la dernière choisie ferait
                          croire qu'elle remplace les autres. */}
                      <select
                        value=""
                        onChange={(e) => attach(i, e.target.value)}
                        className="h-7 max-w-[160px] px-1.5 text-[11px] bg-surface text-ink-secondary rounded-[6px] border border-line cursor-pointer focus:outline-none"
                        aria-label={t("linkDoc")}
                      >
                        <option value="">
                          {i.documents.length ? t("addDoc") : t("noDoc")}
                        </option>
                        {/* Les documents du dossier attendu d'abord : sur une
                            data room fournie, la bonne preuve serait autrement
                            noyée au milieu de dizaines de fichiers. Les autres
                            restent proposés — la suggestion oriente, elle
                            n'impose pas. */}
                        {(() => {
                          // Une preuve déjà rattachée n'est plus proposée :
                          // la resélectionner ne ferait rien (la clé primaire
                          // rend l'insertion idempotente), mais le fondateur
                          // n'a aucun moyen de le savoir en lisant la liste.
                          const libres = docs.filter(
                            (d) => !i.documents.includes(d.id),
                          );
                          const duDossier = i.folder_id
                            ? libres.filter((d) => d.folder_id === i.folder_id)
                            : [];
                          const autres = libres.filter(
                            (d) => !duDossier.includes(d),
                          );
                          const ligne = (d: DocOption) => (
                            <option key={d.id} value={d.id}>
                              {folderIndex(d.index_path)} {d.name}
                            </option>
                          );
                          if (duDossier.length === 0)
                            return libres.map(ligne);
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
                        className="text-ink-muted hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity text-[12px]"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => remove(i)}
                        aria-label={t("deleteReq")}
                        className="text-ink-muted hover:text-[oklch(0.55_0.17_25)] opacity-0 group-hover:opacity-100 transition-opacity text-[14px] leading-none"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {list.length === 0 && (
                <p className="text-[11.5px] text-ink-muted px-4 py-3">
                  {t("noItems")}
                </p>
              )}

              {/* Ajout d'exigence personnalisée. */}
              {canEdit && (
                <div className="px-4 py-2.5 bg-bg border-t border-separator-soft">
                  {adding === cat ? (
                    <div className="flex flex-col gap-1.5">
                      <input
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        autoFocus
                        placeholder={t("reqLabelPlaceholder")}
                        className="w-full h-7 px-2 text-[12.5px] bg-surface text-ink rounded-[6px] border border-line focus:border-accent focus:outline-none"
                      />
                      <input
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder={t("reqDescPlaceholder")}
                        className="w-full h-7 px-2 text-[11.5px] bg-surface text-ink-secondary rounded-[6px] border border-line focus:border-accent focus:outline-none"
                      />
                      <div className="flex gap-2 mt-0.5">
                        <button
                          onClick={() => saveNew(cat)}
                          disabled={newLabel.trim().length < 2}
                          className="text-[11.5px] font-semibold text-accent disabled:opacity-40 cursor-pointer disabled:cursor-default"
                        >
                          {t("addBtn")}
                        </button>
                        <button
                          onClick={() => {
                            setAdding(null);
                            setNewLabel("");
                            setNewDesc("");
                          }}
                          className="text-[11.5px] text-ink-muted cursor-pointer"
                        >
                          {tc("cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAdding(cat)}
                      className="text-[11.5px] font-medium text-accent cursor-pointer"
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

      <p className="text-[11.5px] text-ink-muted leading-relaxed max-w-2xl">
        {t("scoreExplainer")}
      </p>
    </div>
  );
}
