"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { folderIndex } from "@/lib/folder-index";
import { createFolder } from "@/app/actions/deals";
import { setDocumentKey } from "@/app/actions/crud";
import { Uploader } from "./Uploader";
import type { FolderRow, DocRow } from "./DataRoom";

/**
 * Contenu de la data room — nouvelle présentation, handoff app v5 §3b (onglet
 * Contenu).
 *
 * Table pleine largeur sans carte : Index · Nom · Type · Dernière MàJ. On
 * navigue dans l'arborescence en cliquant un dossier ; un fil d'Ariane ramène
 * en arrière. L'upload et la création de dossier réutilisent les mécanismes
 * existants (Uploader, createFolder).
 */

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

function badge(name: string): { t: string; cls: string } {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { t: "PDF", cls: "bg-[#FBE6E0] text-[#C0392B]" };
  if (["xlsx", "xls", "csv"].includes(ext)) return { t: ext === "csv" ? "CSV" : "XLSX", cls: "bg-[#E4F3EC] text-[#147A5C]" };
  if (["doc", "docx"].includes(ext)) return { t: "DOCX", cls: "bg-[#EEF4FB] text-[#2C5F8A]" };
  return { t: (ext || "DOC").toUpperCase().slice(0, 4), cls: "bg-[#F1F0EB] text-[#6E727A]" };
}

export function RoomContenu({
  orgId,
  dealId,
  folders,
  documents,
  canEdit,
  initialFolderId = null,
}: {
  orgId: string;
  dealId: string;
  folders: FolderRow[];
  documents: DocRow[];
  canEdit: boolean;
  initialFolderId?: string | null;
}) {
  const router = useRouter();
  const [courant, setCourant] = useState<string | null>(initialFolderId);
  const [nouvDossier, setNouvDossier] = useState(false);
  const [nom, setNom] = useState("");
  const [busy, setBusy] = useState(false);
  const uploadRef = useRef<HTMLButtonElement>(null);

  const byId = useMemo(() => new Map(folders.map((f) => [f.id, f])), [folders]);

  // Fil d'Ariane : la chaîne de dossiers parents jusqu'à la racine.
  const chemin: FolderRow[] = [];
  let c = courant ? byId.get(courant) : undefined;
  while (c) {
    chemin.unshift(c);
    c = c.parent_id ? byId.get(c.parent_id) : undefined;
  }

  const sousDossiers = folders
    .filter((f) => f.parent_id === courant)
    .sort((a, b) => a.index_path.localeCompare(b.index_path));
  const fichiers = documents
    .filter((d) => d.folder_id === courant)
    .sort((a, b) => a.index_path.localeCompare(b.index_path));

  const compte = (fid: string) =>
    folders.filter((f) => f.parent_id === fid).length +
    documents.filter((d) => d.folder_id === fid).length;

  const dossierCourant = courant ? byId.get(courant) ?? null : null;

  async function basculerCle(docId: string, actuel: boolean) {
    const res = await setDocumentKey(docId, !actuel);
    if (res.ok) router.refresh();
  }

  async function ajouterDossier() {
    if (nom.trim().length < 2) return;
    setBusy(true);
    const fd = new FormData();
    fd.set("deal_id", dealId);
    if (courant) fd.set("parent_id", courant);
    fd.set("name", nom.trim());
    const res = await createFolder(undefined, fd);
    setBusy(false);
    if (!res?.errorRaw && !res?.errorKey) {
      setNouvDossier(false);
      setNom("");
      router.refresh();
    }
  }

  return (
    <div>
      {/* Barre d'outils */}
      <div className="flex justify-end gap-2.5 mb-3.5">
        {canEdit && (
          <button onClick={() => setNouvDossier((v) => !v)} className="border border-[#E4E2DC] rounded-[5px] px-3 py-[7px] text-[12.5px] font-[600] text-[#33353B] hover:border-[#C9C6BD] hover:bg-[#FAFAF8]">
            Créer un dossier
          </button>
        )}
        {canEdit && (
          <button
            onClick={() => (courant ? uploadRef.current?.click() : setNouvDossier(true))}
            className="rounded-[5px] bg-[#E85C2B] px-3 py-[7px] text-[12.5px] font-[600] text-white hover:bg-[#D24E1F]"
          >
            Ajouter des contenus
          </button>
        )}
      </div>

      {/* Fil d'Ariane de l'arborescence */}
      <div className="flex items-center gap-1.5 text-[12.5px] mb-3">
        <button onClick={() => setCourant(null)} className={courant ? "text-[#9DA0A8] hover:text-[#1A1B1F]" : "font-[600] text-[#1A1B1F]"}>
          Accueil
        </button>
        {chemin.map((f) => (
          <span key={f.id} className="flex items-center gap-1.5">
            <span className="text-[#D5D2CA]">/</span>
            <button onClick={() => setCourant(f.id)} className={f.id === courant ? "font-[600] text-[#1A1B1F]" : "text-[#9DA0A8] hover:text-[#1A1B1F]"}>
              {f.name}
            </button>
          </span>
        ))}
      </div>

      {nouvDossier && canEdit && (
        <div className="flex gap-2 mb-3">
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ajouterDossier()}
            placeholder="Nom du dossier"
            autoFocus
            className="flex-1 max-w-[280px] h-8 px-2.5 text-[12.5px] border border-[#E4E2DC] rounded-[5px] focus:outline-none focus:border-[#C9C6BD]"
          />
          <button onClick={ajouterDossier} disabled={busy || nom.trim().length < 2} className="rounded-[5px] bg-[#E85C2B] px-3 text-[12.5px] font-[600] text-white disabled:opacity-50">
            Créer
          </button>
        </div>
      )}

      {/* En-tête de table */}
      <div style={mono} className="grid grid-cols-[44px_1fr_90px_120px_40px] gap-3 px-2 pb-2 border-b border-[#ECEBE6] text-[9px] tracking-[0.08em] text-[#A0A3AB] items-center">
        <span>INDEX</span><span>NOM</span><span>TYPE</span><span>DERNIÈRE MÀJ</span><span className="text-center">CLÉ</span>
      </div>

      {sousDossiers.length === 0 && fichiers.length === 0 && (
        <p className="text-[12.5px] text-[#9DA0A8] py-6 text-center">
          {courant
            ? "Ce dossier est vide — déposez vos fichiers ci-dessous."
            : "Créez un dossier, puis déposez-y vos documents."}
        </p>
      )}

      {/* Dossiers */}
      {sousDossiers.map((f) => (
        <button
          key={f.id}
          onClick={() => setCourant(f.id)}
          className="w-full grid grid-cols-[44px_1fr_90px_120px_40px] gap-3 items-center px-2 py-[13px] border-b border-[#F1F0EC] hover:bg-[#FAFAF8] text-left"
        >
          <span style={mono} className="text-[11px] text-[#9DA0A8]">{folderIndex(f.index_path)}</span>
          <span className="flex items-center gap-[11px] min-w-0">
            <span className="grid place-items-center w-[26px] h-5 rounded-[4px] bg-[#EEF4FB] shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#7DA9D6"><path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8z" /></svg>
            </span>
            <span className="text-[13.5px] font-[600] truncate">{f.name}</span>
            <span className="text-[11.5px] text-[#9DA0A8] shrink-0">{compte(f.id)} élément{compte(f.id) > 1 ? "s" : ""}</span>
          </span>
          <span className="text-[12px] text-[#6E727A]">Dossier</span>
          <span className="text-[12px] text-[#9DA0A8]">—</span>
          <span />
        </button>
      ))}

      {/* Fichiers */}
      {fichiers.map((d) => {
        const b = badge(d.name);
        return (
          <div key={d.id} className="grid grid-cols-[44px_1fr_90px_120px_40px] gap-3 items-center px-2 py-[13px] border-b border-[#F1F0EC] hover:bg-[#FAFAF8]">
            <span style={mono} className="text-[11px] text-[#9DA0A8]">{folderIndex(d.index_path)}</span>
            <Link href={`/visionneuse?doc=${d.id}`} className="flex items-center gap-[11px] min-w-0">
              <span style={mono} className={"rounded-[4px] px-[5px] py-0.5 text-[8.5px] font-[600] shrink-0 " + b.cls}>{b.t}</span>
              <span className="text-[13.5px] font-[600] truncate">{d.name}</span>
              {d.views > 0 && <span style={mono} className="text-[11px] text-[#9DA0A8] shrink-0">{d.views} vues</span>}
            </Link>
            <span className="text-[12px] text-[#6E727A]">{b.t}</span>
            <span className="text-[12px] text-[#9DA0A8]">{d.modified ?? "—"}</span>
            {canEdit ? (
              <button
                onClick={() => basculerCle(d.id, !!d.is_key)}
                title={d.is_key ? "Retirer des documents clés" : "Marquer comme document clé"}
                aria-label="Document clé"
                className="justify-self-center"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={d.is_key ? "#E8A33D" : "none"} stroke={d.is_key ? "#E8A33D" : "#C7C9CF"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" />
                </svg>
              </button>
            ) : (
              d.is_key ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#E8A33D" stroke="#E8A33D" strokeWidth="1.7" className="justify-self-center"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" /></svg>
              ) : <span />
            )}
          </div>
        );
      })}

      {/* Zone de dépôt VISIBLE dans un dossier (glisser-déposer + clic). À la
          racine on ne peut pas déposer : « Ajouter des contenus » y crée un
          dossier. Le bouton du haut déclenche aussi ce même sélecteur. */}
      {canEdit && courant && (
        <div className="mt-3 rounded-[6px] border border-dashed border-[#D5D2CA] hover:border-[#C24619] transition-colors overflow-hidden">
          <Uploader
            ref={uploadRef}
            orgId={orgId}
            dealId={dealId}
            folderId={courant}
            folderIndex={dossierCourant ? folderIndex(dossierCourant.index_path) : ""}
          />
        </div>
      )}
    </div>
  );
}
