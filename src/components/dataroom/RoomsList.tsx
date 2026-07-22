"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShareButton } from "@/components/dataroom/ShareButton";
import { Modal } from "@/components/ui/Modal";
import { setCurrentDeal, createDataRoom } from "@/app/actions/deal-context";
import { updateDeal, deleteDeal, setDealArchived } from "@/app/actions/crud";

/**
 * Liste des data rooms — multi-salles RÉEL. Une salle = un deal. Créer, ouvrir
 * (bascule le deal courant), partager, renommer, supprimer : tout est branché.
 */

export interface Room {
  id: string;
  name: string;
  objectif: string;
  docs: number;
  invites: number;
  archived: boolean;
  /** Reliée à une levée (montant, pipeline, historique) — supprimée en cascade. */
  hasRaise: boolean;
}

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

const OBJ_BADGE: Record<string, { label: string; cls: string }> = {
  levee: { label: "Levée", cls: "text-[#C24619] bg-[#FBEDE6]" },
  diligence: { label: "Diligence", cls: "text-[#185FA5] bg-[#E9F2FB]" },
};

const btnGhost = "rounded-[5px] border border-[#E4E2DC] px-4 py-2 text-[13px] font-[600] text-[#55585F] hover:bg-[#FAFAF8]";
const btnPrimary = "rounded-[5px] bg-[#E85C2B] px-4 py-2 text-[13px] font-[600] text-white hover:bg-[#D24E1F] disabled:opacity-60";
const champ = "h-9 w-full px-2.5 text-[13px] bg-white text-[#1A1B1F] rounded-[5px] border border-[#E4E2DC] focus:border-[#E85C2B] focus:outline-none";

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "levee", label: "Levée" },
  { key: "diligence", label: "Diligence" },
  { key: "archived", label: "Archivées" },
];

export function RoomsList({ rooms, currentId }: { rooms: Room[]; currentId: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [filter, setFilter] = useState("all");

  // « Archivées » = les salles rangées ; les autres onglets ne montrent que les
  // salles ACTIVES (archivées exclues), filtrées par objectif.
  const filtered =
    filter === "archived"
      ? rooms.filter((r) => r.archived)
      : rooms.filter((r) => !r.archived && (filter === "all" || r.objectif === filter));
  const count = (k: string) =>
    k === "archived"
      ? rooms.filter((r) => r.archived).length
      : rooms.filter((r) => !r.archived && (k === "all" || r.objectif === k)).length;

  function open(id: string) {
    start(async () => {
      await setCurrentDeal(id);
      router.push("/data-room");
    });
  }

  return (
    <div className="flex flex-col text-[#1A1B1F]">
      <div className="flex items-start justify-between gap-5 mb-1.5">
        <div>
          <h1 className="font-display text-[27px] font-[700] tracking-[-0.025em]">Data room</h1>
          <p className="text-[13.5px] text-[#6E727A] mt-1">
            Vos data rooms — une par audience ou par étape. Chacune a ses accès, ses pièces et ses signatures.
          </p>
        </div>
        <NewDataRoomButton className="rounded-[5px] bg-[#E85C2B] px-3.5 py-2.5 text-[13px] font-[600] text-white hover:bg-[#D24E1F] whitespace-nowrap mt-1" />
      </div>

      {/* Filtre par objectif */}
      <div className="flex gap-2 mt-4 mb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={
              "flex items-center gap-1.5 rounded-[5px] px-3 py-[7px] text-[12.5px] font-[600] transition-colors " +
              (filter === f.key ? "bg-[#F1F0EB] text-[#1A1B1F]" : "text-[#6E727A] hover:text-[#1A1B1F]")
            }
          >
            {f.label}
            <span style={mono} className="text-[#9DA0A8]">{count(f.key)}</span>
          </button>
        ))}
      </div>

      <div style={mono} className="grid grid-cols-[2.4fr_0.9fr_1fr_150px] gap-3.5 px-2 pb-2 border-b border-[#ECEBE6] text-[9px] tracking-[0.08em] text-[#A0A3AB] items-center">
        <span>NOM</span><span>OBJECTIF</span><span>PROPRIÉTAIRE</span><span></span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[12.5px] text-[#9DA0A8] py-10 text-center">Aucune data room pour ce filtre.</p>
      ) : (
        filtered.map((r) => {
          const badge = OBJ_BADGE[r.objectif] ?? OBJ_BADGE.levee;
          return (
            <div key={r.id} className="grid grid-cols-[2.4fr_0.9fr_1fr_150px] gap-3.5 items-center px-2 py-[15px] border-b border-[#F1F0EC] hover:bg-[#FAFAF8]">
              <button onClick={() => open(r.id)} disabled={pending} className="flex items-center gap-3 min-w-0 text-left">
                <span className="grid place-items-center w-9 h-9 rounded-[6px] bg-[#FBEDE6] text-[#C24619] shrink-0">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className={"text-[13.5px] font-[650] truncate " + (r.archived ? "text-[#8B8E96]" : "")}>{r.name}</span>
                    {r.archived && <span style={mono} className="text-[9px] font-[600] text-[#8B8E96] bg-[#F1F0EB] rounded-[4px] px-[6px] py-0.5 shrink-0">ARCHIVÉE</span>}
                    {!r.archived && r.id === currentId && <span style={mono} className="text-[9px] font-[600] text-[#147A5C] bg-[#E4F3EC] rounded-[4px] px-[6px] py-0.5 shrink-0">OUVERTE</span>}
                  </span>
                  <span className="block text-[11.5px] text-[#9DA0A8]">
                    {r.docs} document{r.docs > 1 ? "s" : ""} · {r.invites} invité{r.invites > 1 ? "s" : ""}
                  </span>
                </span>
              </button>
              <span>
                <span style={mono} className={"text-[9px] font-[600] rounded-[4px] px-2 py-[3px] uppercase " + badge.cls}>{badge.label}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="grid place-items-center w-6 h-6 rounded-[5px] bg-[#1A1B1F] text-white text-[9px] font-[700]">{r.name.slice(0, 1).toUpperCase()}</span>
                <span className="text-[12.5px] text-[#33353B]">Vous</span>
              </span>
              <span className="flex items-center gap-3 justify-end">
                <ShareButton dealId={r.id} className="text-[12.5px] font-[600] text-[#C24619] hover:text-[#1A1B1F]" />
                <RoomActions room={r} />
              </span>
            </div>
          );
        })
      )}

    </div>
  );
}

/**
 * Bouton de création réutilisable (gère sa propre popup).
 * `fixedObjectif` fige l'objectif et masque son choix — pour l'écran « Ma
 * levée » on crée directement une LEVÉE, sans reparler de data room.
 */
export function NewDataRoomButton({
  label = "Nouvelle data room",
  className,
  fixedObjectif,
}: {
  label?: string;
  className?: string;
  fixedObjectif?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className ?? "rounded-[5px] bg-[#E85C2B] px-4 py-2.5 text-[13px] font-[600] text-white hover:bg-[#D24E1F] whitespace-nowrap"}
      >
        {label}
      </button>
      {open && <NewRoomModal onClose={() => setOpen(false)} fixedObjectif={fixedObjectif} />}
    </>
  );
}

function NewRoomModal({ onClose, fixedObjectif }: { onClose: () => void; fixedObjectif?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [objectif, setObjectif] = useState(fixedObjectif ?? "levee");
  const [template, setTemplate] = useState(true);

  const titre =
    fixedObjectif === "levee" ? "Nouvelle levée" : fixedObjectif === "diligence" ? "Nouveau dossier de diligence" : "Nouvelle data room";

  function submit() {
    if (name.trim().length < 2) return;
    start(async () => {
      const res = await createDataRoom({ name: name.trim(), objectif, template });
      if (!res.ok) return setError(res.error);
      // Une levée → on arrive sur « Ma levée » avec le formulaire ouvert à
      // remplir ; une diligence → directement le contenu de la data room.
      router.push(objectif === "levee" ? "/deal?configurer=1" : "/data-room");
    });
  }

  return (
    <Modal open onClose={onClose} title={titre} width={480}>
      <div className="px-6 py-5 flex flex-col gap-4">
        <div>
          <label className="text-[11.5px] font-[600] text-[#6E727A] mb-1 block">{fixedObjectif === "levee" ? "Nom de la levée" : "Nom de la data room"}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder={fixedObjectif === "levee" ? "Levée Seed 2026" : "Levée Seed, Due diligence banque…"} className={champ} />
        </div>
        {!fixedObjectif && (
        <div>
          <label className="text-[11.5px] font-[600] text-[#6E727A] mb-1.5 block">Objectif</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "levee", titre: "Lever des fonds", sous: "Montant, audience, investisseurs." },
              { key: "diligence", titre: "Due diligence", sous: "Partage banque / partenaire, sans levée." },
            ].map((o) => {
              const actif = objectif === o.key;
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setObjectif(o.key)}
                  className={"text-left rounded-[8px] border p-3 transition-colors " + (actif ? "border-[#E85C2B] bg-[#FEF8F4]" : "border-[#E4E2DC] hover:border-[#C9C6BD]")}
                >
                  <div className="text-[13px] font-[650] text-[#1A1B1F]">{o.titre}</div>
                  <p className="text-[11px] text-[#9DA0A8] mt-1 leading-snug">{o.sous}</p>
                </button>
              );
            })}
          </div>
        </div>
        )}
        <div>
          <label className="text-[11.5px] font-[600] text-[#6E727A] mb-1.5 block">Point de départ</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: true, titre: "À partir d'un modèle", sous: "Arborescence OHADA/UEMOA et checklist de diligence pré-remplies." },
              { key: false, titre: "Partir de zéro", sous: "Data room vide, vous montez les dossiers vous-même." },
            ].map((o) => {
              const actif = template === o.key;
              return (
                <button
                  key={String(o.key)}
                  type="button"
                  onClick={() => setTemplate(o.key)}
                  className={"text-left rounded-[8px] border p-3 transition-colors " + (actif ? "border-[#E85C2B] bg-[#FEF8F4]" : "border-[#E4E2DC] hover:border-[#C9C6BD]")}
                >
                  <div className="text-[13px] font-[650] text-[#1A1B1F]">{o.titre}</div>
                  <p className="text-[11px] text-[#9DA0A8] mt-1 leading-snug">{o.sous}</p>
                </button>
              );
            })}
          </div>
        </div>
        {error && <p className="text-[12px] text-[#C0392B]">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className={btnGhost}>Annuler</button>
          <button onClick={submit} disabled={pending || name.trim().length < 2} className={btnPrimary}>
            {pending ? "Création…" : "Créer la data room"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/** Menu ⋯ d'une salle : Renommer / Supprimer (RPC réels, popups in-app). */
function RoomActions({ room }: { room: Room }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [menu, setMenu] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [warnOpen, setWarnOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(room.name);
  const [error, setError] = useState<string | undefined>();

  function renommer() {
    if (name.trim().length < 2) return;
    start(async () => {
      const res = await updateDeal({ dealId: room.id, name: name.trim() });
      if (!res.ok) return setError(res.error);
      setRenameOpen(false);
      router.refresh();
    });
  }

  function supprimer() {
    start(async () => {
      const res = await deleteDeal(room.id);
      if (!res.ok) return setError(res.error);
      setDeleteOpen(false);
      router.refresh();
    });
  }

  function archiver(archived: boolean) {
    setMenu(false);
    start(async () => {
      const res = await setDealArchived(room.id, archived);
      if (res.ok) router.refresh();
    });
  }

  return (
    <span className="relative">
      <button
        onClick={() => { setError(undefined); setMenu((v) => !v); }}
        aria-label="Actions de la data room"
        className="grid place-items-center w-7 h-7 rounded-[5px] text-[#A0A3AB] hover:bg-[#F1F0EB] hover:text-[#1A1B1F] text-[17px] leading-none"
      >
        ⋯
      </button>
      {menu && (
        <>
          <span className="fixed inset-0 z-[90]" onClick={() => setMenu(false)} />
          <span className="absolute right-0 top-8 z-[91] w-44 rounded-[6px] border border-[#ECEBE6] bg-white shadow-[0_10px_30px_rgba(26,27,31,0.14)] py-1 flex flex-col">
            <button onClick={() => { setMenu(false); setName(room.name); setRenameOpen(true); }} className="text-left px-3 py-2 text-[12.5px] text-[#33353B] hover:bg-[#FAFAF8]">Renommer</button>
            {room.archived ? (
              <button onClick={() => archiver(false)} className="text-left px-3 py-2 text-[12.5px] text-[#33353B] hover:bg-[#FAFAF8]">Désarchiver</button>
            ) : (
              <button onClick={() => archiver(true)} className="text-left px-3 py-2 text-[12.5px] text-[#33353B] hover:bg-[#FAFAF8]">Archiver</button>
            )}
            <button onClick={() => { setMenu(false); setError(undefined); room.hasRaise ? setWarnOpen(true) : setDeleteOpen(true); }} className="text-left px-3 py-2 text-[12.5px] text-[#C0392B] hover:bg-[#FBEDE6]">Supprimer</button>
          </span>
        </>
      )}

      <Modal open={renameOpen} onClose={() => setRenameOpen(false)} title="Renommer la data room" width={440}>
        <div className="px-6 py-5 flex flex-col gap-4">
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus className={champ} />
          {error && <p className="text-[12px] text-[#C0392B]">{error}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setRenameOpen(false)} className={btnGhost}>Annuler</button>
            <button onClick={renommer} disabled={pending || name.trim().length < 2} className={btnPrimary}>{pending ? "…" : "Renommer"}</button>
          </div>
        </div>
      </Modal>

      {/* Étape 1 (salles reliées à une levée) : avertir de la connexion. */}
      <Modal open={warnOpen} onClose={() => setWarnOpen(false)} title="Cette data room est reliée à une levée" width={470}>
        <div className="px-6 py-5">
          <div className="flex gap-3">
            <span className="grid place-items-center w-9 h-9 rounded-[6px] bg-[#FBEDE6] text-[#C24619] shrink-0 mt-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
            </span>
            <p className="text-[13px] text-[#33353B] leading-relaxed">
              <span className="font-[700]">{room.name}</span> porte une levée : montant, indicateurs, pipeline d&apos;investisseurs et historique de financement. Supprimer cette data room <span className="font-[700] text-[#C0392B]">supprimera aussi la levée</span> et toutes ses données.
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setWarnOpen(false)} className={btnGhost}>Annuler</button>
            <button onClick={() => { setWarnOpen(false); setDeleteOpen(true); }} className="rounded-[5px] border border-[#E3B4AD] bg-white px-4 py-2 text-[13px] font-[600] text-[#C0392B] hover:bg-[#FBEDE6]">
              Continuer quand même
            </button>
          </div>
        </div>
      </Modal>

      {/* Étape 2 : confirmation finale de suppression. */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Supprimer la data room" width={440}>
        <div className="px-6 py-5">
          <p className="text-[13px] text-[#33353B] leading-relaxed">
            Supprimer <span className="font-[700]">{room.name}</span> et tout son contenu (dossiers, documents, accès{room.hasRaise ? ", levée" : ""})&nbsp;? Cette action est définitive.
          </p>
          {error && <p className="text-[12px] text-[#C0392B] mt-2.5">{error}</p>}
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setDeleteOpen(false)} className={btnGhost}>Annuler</button>
            <button onClick={supprimer} disabled={pending} className="rounded-[5px] bg-[#C0392B] px-4 py-2 text-[13px] font-[600] text-white hover:bg-[#A32D2D] disabled:opacity-60">{pending ? "…" : "Supprimer"}</button>
          </div>
        </div>
      </Modal>
    </span>
  );
}
