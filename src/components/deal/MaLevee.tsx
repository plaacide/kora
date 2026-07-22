"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShareButton } from "@/components/dataroom/ShareButton";
import { Modal } from "@/components/ui/Modal";
import {
  saveRaise,
  saveRaiseInvestor,
  deleteRaiseInvestor,
  saveRaiseIndicators,
  closeRaise,
  openRaise,
  addPastRaise,
  deleteRaise,
} from "@/app/actions/raises";
import {
  type Raise,
  type RaiseInvestor,
  type Indicateur,
  type Vitrine,
  TYPE_TOUR,
  STADE_RAISE,
  AUDIENCES,
  DEVISES,
  STATUT_PIPELINE,
  VITRINE_TEMPLATES,
  labelOf,
} from "@/lib/raise";

/**
 * « Ma levée » — données RÉELLES (table `raises`), éditables.
 *
 * Trois surfaces éditables : « Modifier la levée » (montant, type, audience…),
 * la vitrine d'indicateurs par audience (ce qu'un investisseur voit avant
 * d'ouvrir les docs, lignes libres), et le pipeline investisseur curé (liste
 * informative : ticket + statut, NON sommée — les soft-commitments restent le
 * champ manuel « montant engagé »).
 *
 * Branche diligence : ni montant ni levée — préparation réelle seule.
 */

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

function formatMoney(amount: number | null | undefined, devise: string): string {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: devise || "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("fr-FR")} ${devise}`;
  }
}

function toneCls(tone: string): string {
  return tone === "amber"
    ? "text-[#B4741B] bg-[#FBF0DC]"
    : tone === "green"
      ? "text-[#147A5C] bg-[#E4F3EC]"
      : "text-[#8B8E96] bg-[#F1F0EB]";
}

function initials(s: string): string {
  return (s.trim().split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("") || s.slice(0, 2)).toUpperCase();
}

function DOC_BADGE(type: string): string {
  return type === "PDF"
    ? "bg-[#FBE6E0] text-[#C0392B]"
    : type === "CSV"
      ? "bg-[#E4F3EC] text-[#147A5C]"
      : type === "DOC"
        ? "bg-[#E9F2FB] text-[#185FA5]"
        : "bg-[#F1F0EB] text-[#6E727A]";
}

const ROLE_TAG: Record<string, { label: string; cls: string }> = {
  owner: { label: "OWNER", cls: "text-[#C24619] bg-[#FBEDE6]" },
  admin: { label: "ÉDITEUR", cls: "text-[#33353B] bg-[#F1F0EB]" },
  member: { label: "MEMBRE", cls: "text-[#8B8E96] bg-[#F1F0EB]" },
};

function moisAnnee(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

/** Pile d'avatars carrés d'investisseurs (3 max + « +N »), style maquette. */
function AvatarStack({ investors }: { investors: RaiseInvestor[] }) {
  if (investors.length === 0) return null;
  const shown = investors.slice(0, 3);
  const reste = investors.length - shown.length;
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex">
        {shown.map((inv, i) => (
          <span
            key={inv.id}
            className="grid place-items-center w-7 h-7 rounded-[6px] bg-[#1A1B1F] text-white text-[9.5px] font-[700] border-2 border-white"
            style={{ marginLeft: i ? -9 : 0 }}
          >
            {initials(inv.nom)}
          </span>
        ))}
        {reste > 0 && (
          <span className="grid place-items-center w-7 h-7 rounded-[6px] border-2 border-dashed border-[#C9C6BD] text-[#A0A3AB] text-[11px] font-[700] bg-white -ml-[9px]">
            +{reste}
          </span>
        )}
      </span>
      <span className="text-[12px] text-[#55585F] leading-[1.4] truncate">
        {shown.map((i) => i.nom).join(" · ")}
      </span>
    </div>
  );
}

const champ =
  "h-9 w-full px-2.5 text-[13px] bg-white text-[#1A1B1F] rounded-[5px] border border-[#E4E2DC] focus:border-[#E85C2B] focus:outline-none";
const lab = "text-[11.5px] font-[600] text-[#6E727A] mb-1 block";
const btnPrimary =
  "rounded-[5px] bg-[#E85C2B] px-4 py-2 text-[13px] font-[600] text-white hover:bg-[#D24E1F] disabled:opacity-60";
const btnGhost =
  "rounded-[5px] border border-[#E4E2DC] px-4 py-2 text-[13px] font-[600] text-[#55585F] hover:bg-[#FAFAF8]";

export function MaLevee({
  dealName,
  dealId,
  readiness,
  missing,
  objectif = "levee",
  raise = null,
  closedRaises = [],
  investors = [],
  team = [],
  keyDocs = [],
  ndaDefault = true,
}: {
  dealName: string;
  dealId: string;
  readiness: number;
  missing: { label: string; folderId: string | null }[];
  objectif?: string;
  raise?: Raise | null;
  closedRaises?: Raise[];
  investors?: RaiseInvestor[];
  team?: { name: string; role: string }[];
  keyDocs?: { id: string; name: string; type: string; vues: number }[];
  /** Réglage NDA de la data room — défaut du bouton Partager. */
  ndaDefault?: boolean;
}) {
  // ----- Diligence : pilotage sans levée -----
  if (objectif === "diligence") {
    return (
      <div className="flex flex-col text-[#1A1B1F]">
        <div className="flex items-start justify-between gap-5 mb-6">
          <div>
            <h1 className="font-display text-[27px] font-[700] tracking-[-0.025em]">Ma data room</h1>
            <p className="text-[13.5px] text-[#6E727A] mt-1">
              Le pilotage de votre dossier de diligence : préparation, documents et qui a regardé quoi.
            </p>
          </div>
          <ShareButton dealId={dealId} defaultNda={ndaDefault} label="+ Inviter à consulter" className="shrink-0 whitespace-nowrap rounded-[5px] bg-[#E85C2B] px-4 py-2.5 text-[13px] font-[600] text-white hover:bg-[#D24E1F] mt-1" />
        </div>
        <PreparationCard dealName={dealName} readiness={readiness} missing={missing} legende="dossier de diligence" />
      </div>
    );
  }

  // ----- Levée : données réelles -----
  const cible = raise?.montant_cible ?? null;
  const engage = raise?.montant_engage ?? 0;
  const devise = raise?.devise ?? "USD";
  const pct = cible && cible > 0 ? Math.min(100, Math.round((engage / cible) * 100)) : 0;
  const restant = cible != null ? cible - engage : null;
  const audience = raise?.audience ?? [];

  return (
    <div className="flex flex-col text-[#1A1B1F]">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-5 mb-4">
        <div>
          <h1 className="font-display text-[27px] font-[700] tracking-[-0.025em]">Ma levée</h1>
          <p className="text-[13.5px] text-[#6E727A] mt-1">
            Le pilotage de votre tour de table : montant, échéance, audience et data room.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <ShareButton dealId={dealId} defaultNda={ndaDefault} label="Partager" className="rounded-[5px] bg-[#E85C2B] px-3.5 py-2 text-[13px] font-[600] text-white hover:bg-[#D24E1F] whitespace-nowrap mt-1" />
          {raise && <ModifierLevee dealId={dealId} raise={raise} />}
        </div>
      </div>

      {/* Levées : courante (+ Clôturer), clôturées, et « Nouvelle levée ». */}
      <RaiseChips dealName={dealName} dealId={dealId} raise={raise} closedRaises={closedRaises} />

      {!raise ? (
        /* Aucune levée en cours (le fondateur a clôturé sans rouvrir). */
        <div className="border border-dashed border-[#D5D2CA] rounded-[6px] px-5 py-8 mb-7 text-center">
          <p className="text-[13px] font-[600] text-[#1A1B1F]">Aucune levée en cours</p>
          <p className="text-[12px] text-[#9DA0A8] mt-1 mb-4">Ouvrez un nouveau tour pour renseigner montant, audience et indicateurs.</p>
          <OpenRaiseButton dealId={dealId} hasCurrent={false} label="Ouvrir une nouvelle levée" className="rounded-[5px] bg-[#E85C2B] px-4 py-2.5 text-[13px] font-[600] text-white hover:bg-[#D24E1F]" />
        </div>
      ) : (
      <>
      {/* Vitrine — indicateurs par audience (éditable) */}
      <VitrineBand dealId={dealId} audience={audience} indicateurs={raise.indicateurs ?? {}} />

      {/* Résumé de la levée — RÉEL */}
      <div className="border border-[#ECEBE6] rounded-[6px] mb-7">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] divide-y md:divide-y-0 md:divide-x divide-[#ECEBE6]">
          <div className="px-5 py-[18px]">
            <div className="text-[11.5px] font-[600] text-[#8B8E96] mb-[7px]">Montant recherché</div>
            <div style={mono} className="text-[26px] font-[600] tracking-[-0.02em]">
              {cible != null ? formatMoney(cible, devise) : <span className="text-[#C7C9CF]">à renseigner</span>}
            </div>
            {cible != null && cible > 0 && (
              <>
                <span className="block h-1.5 rounded-[3px] bg-[#ECEBE6] overflow-hidden mt-[11px]"><span className="block h-full bg-[#E85C2B]" style={{ width: `${pct}%` }} /></span>
                <div className="text-[11.5px] text-[#6E727A] mt-[7px]">
                  <span style={mono} className="text-[#C24619] font-[600]">{formatMoney(engage, devise)}</span> engagés
                  {restant != null && restant > 0 && <> · <span style={mono}>{formatMoney(restant, devise)}</span> restants</>}
                  {" "}· {pct} %
                </div>
              </>
            )}
          </div>
          <div className="px-5 py-[18px]">
            <div className="text-[11.5px] font-[600] text-[#8B8E96] mb-[7px]">Type de financement</div>
            <div className="text-[15px] font-[650]">
              {[labelOf(TYPE_TOUR, raise?.type_tour ?? null), labelOf(STADE_RAISE, raise?.stade ?? null)].filter(Boolean).join(" — ") || <span className="text-[#C7C9CF] font-[400]">à renseigner</span>}
            </div>
            {raise?.valorisation_pre != null && (
              <div className="text-[12px] text-[#6E727A] mt-1">valorisation pré-money {formatMoney(raise.valorisation_pre, devise)}</div>
            )}
            {audience.length > 0 && (
              <div className="flex gap-1.5 mt-2.5 flex-wrap">
                {audience.map((a) => (
                  <span key={a} style={mono} className="text-[9.5px] font-[600] text-[#33353B] bg-[#F1F0EB] rounded-[4px] px-2 py-[3px]">{labelOf(AUDIENCES, a) || a}</span>
                ))}
              </div>
            )}
          </div>
          <div className="px-5 py-[18px]">
            <div className="text-[11.5px] font-[600] text-[#8B8E96] mb-[7px]">Clôture visée</div>
            <div className="text-[15px] font-[650]">
              {raise?.date_cloture
                ? new Date(raise.date_cloture).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                : <span className="text-[#C7C9CF] font-[400]">à renseigner</span>}
            </div>
          </div>
        </div>
        {raise?.description && (
          <div className="px-5 py-4 border-t border-[#ECEBE6] text-[13px] text-[#55585F] leading-[1.6]">
            <span style={mono} className="block text-[9px] font-[600] text-[#8B8E96] tracking-[0.08em] mb-1.5">DESCRIPTION</span>
            {raise.description}
          </div>
        )}
      </div>
      </>
      )}

      {/* Historique de financement — rail de tours (clôturés → en cours),
          fidèle à la maquette. N'apparaît que si au moins un tour est clôturé. */}
      {closedRaises.length > 0 && (() => {
        // Tours du plus ancien au plus récent, puis le tour en cours (si actif).
        const anciens = [...closedRaises].reverse();
        const devisesCloturees = new Set(anciens.map((r) => r.devise));
        const totalCloture = anciens.reduce((s, r) => s + (r.montant_cible ?? 0), 0);
        const totalLabel =
          devisesCloturees.size === 1 ? `${formatMoney(totalCloture, [...devisesCloturees][0])} levés · ` : "";
        const rounds = [
          ...anciens.map((r) => ({ kind: "closed" as const, r })),
          ...(raise ? [{ kind: "current" as const, r: raise }] : []),
        ];
        return (
          <>
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-[15px] font-[700] tracking-[-0.01em]">Historique de financement</h2>
              <span className="text-[12.5px] text-[#9DA0A8]">{totalLabel}{closedRaises.length} tour(s) clôturé(s)</span>
            </div>
            <div className="border border-[#ECEBE6] rounded-[6px] flex items-stretch mb-9 flex-col md:flex-row overflow-x-auto">
              {rounds.map((rd, i) => (
                <Fragment key={rd.r.id}>
                  {i > 0 && (
                    <div className="hidden md:flex items-center px-1.5 text-[#C7C9CF] text-[18px] justify-center">→</div>
                  )}
                  <div className={"relative flex-1 min-w-[220px] p-[18px] group " + (i > 0 ? "border-t md:border-t-0 md:border-l border-[#ECEBE6] " : "") + (rd.kind === "current" ? "bg-[#FEFCFA]" : "")}>
                    {rd.kind === "closed" && <DeleteRoundButton id={rd.r.id} />}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {rd.kind === "closed" ? (
                        <span style={mono} className="text-[9px] font-[600] text-[#8B8E96] bg-[#F1F0EB] rounded-[4px] px-2 py-[3px] uppercase">
                          Clôturée{moisAnnee(rd.r.date_cloture) ? ` · ${moisAnnee(rd.r.date_cloture)}` : ""}
                        </span>
                      ) : (
                        <span style={mono} className="text-[9px] font-[600] text-[#147A5C] bg-[#E4F3EC] rounded-[4px] px-2 py-[3px] uppercase">En cours</span>
                      )}
                      <span className="text-[13px] font-[650]">
                        {labelOf(STADE_RAISE, rd.r.stade) || (rd.kind === "current" ? dealName : "Tour précédent")}
                      </span>
                    </div>
                    {rd.kind === "closed" ? (
                      <div style={mono} className="text-[20px] font-[600] tracking-[-0.02em] mb-3">{formatMoney(rd.r.montant_cible, rd.r.devise)}</div>
                    ) : (
                      <div className="flex items-baseline gap-2 mb-3">
                        <span style={mono} className="text-[20px] font-[600] tracking-[-0.02em]">{formatMoney(engage, devise)}</span>
                        {cible != null && <span className="text-[12px] text-[#9DA0A8]">engagés / {formatMoney(cible, devise)}</span>}
                      </div>
                    )}
                    {rd.kind === "current" && <AvatarStack investors={investors} />}
                  </div>
                </Fragment>
              ))}
            </div>
          </>
        );
      })()}

      {/* Documents clés + Équipe sur la levée — données réelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-9 mb-9">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-[15px] font-[700] tracking-[-0.01em]">Documents clés</h2>
            <Link href="/data-room" className="text-[12.5px] font-[600] text-[#C24619] hover:text-[#1A1B1F]">Voir la data room →</Link>
          </div>
          <div className="border-t border-[#ECEBE6]">
            {keyDocs.length === 0 ? (
              <p className="text-[12px] text-[#9DA0A8] py-4">Aucun document déposé. <Link href="/data-room" className="font-[600] text-[#C24619]">Déposer →</Link></p>
            ) : (
              keyDocs.map((d) => (
                <Link key={d.id} href={`/visionneuse?doc=${d.id}`} className="flex items-center gap-2.5 py-3 border-b border-[#F1F0EC] last:border-0 hover:bg-[#FAFAF8]">
                  <span style={mono} className={"rounded-[3px] px-[5px] py-0.5 text-[8.5px] font-[600] " + DOC_BADGE(d.type)}>{d.type}</span>
                  <span className="flex-1 min-w-0 text-[13px] font-[600] truncate">{d.name}</span>
                  <span style={mono} className="text-[11px] text-[#9DA0A8] shrink-0">{d.vues > 0 ? `${d.vues} vue${d.vues > 1 ? "s" : ""}` : "0 vue"}</span>
                </Link>
              ))
            )}
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-[15px] font-[700] tracking-[-0.01em]">Équipe sur la levée</h2>
          </div>
          <div className="border-t border-[#ECEBE6]">
            {team.length === 0 ? (
              <p className="text-[12px] text-[#9DA0A8] py-4">Vous êtes seul sur cette levée pour l&apos;instant.</p>
            ) : (
              team.map((m, i) => {
                const tag = ROLE_TAG[m.role] ?? { label: m.role.toUpperCase(), cls: "text-[#8B8E96] bg-[#F1F0EB]" };
                return (
                  <div key={i} className="flex items-center gap-2.5 py-3 border-b border-[#F1F0EC] last:border-0">
                    <span className="grid place-items-center w-[30px] h-[30px] rounded-[6px] bg-[#1A1B1F] text-white text-[10px] font-[700] shrink-0">{initials(m.name)}</span>
                    <span className="flex-1 min-w-0 text-[13px] font-[600] truncate">{m.name}</span>
                    <span style={mono} className={"text-[9px] font-[600] rounded-[4px] px-2 py-[3px] " + tag.cls}>{tag.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Pipeline investisseur curé (éditable) */}
      <PipelineInvestisseurs dealId={dealId} devise={devise} investors={investors} />

      {/* Data room attachée — RÉELLE */}
      <h2 className="text-[15px] font-[700] tracking-[-0.01em] mb-2">Data room attachée</h2>
      <PreparationCard dealName={dealName} readiness={readiness} missing={missing} legende="rattachée à cette levée" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Vitrine d'indicateurs par audience                                  */
/* ------------------------------------------------------------------ */

function VitrineBand({
  dealId,
  audience,
  indicateurs,
}: {
  dealId: string;
  audience: string[];
  indicateurs: Vitrine;
}) {
  const allAud = AUDIENCES.map((a) => a.key);
  const targeted = audience ?? [];
  const withIndics = allAud.filter((a) => (indicateurs[a]?.length ?? 0) > 0);
  // Bloc : on montre les audiences ciblées si définies, sinon celles qui ont
  // déjà des indicateurs. L'ÉDITEUR, lui, propose toujours de quoi saisir
  // (audiences ciblées, ou les trois par défaut) — d'où « Éditer » qui marche
  // même sans audience choisie.
  const shownKeys = targeted.length ? targeted : withIndics;
  const editKeys = targeted.length ? targeted : allAud;
  const [sel, setSel] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const activeSel = shownKeys.includes(sel) ? sel : shownKeys[0] ?? "";
  const rows = (activeSel && indicateurs[activeSel]) || [];

  return (
    <div className="mb-7">
      {/* Ligne d'audience (façon maquette) : sélectionner change les indicateurs vus. */}
      {shownKeys.length > 0 && (
        <div className="flex items-center gap-3 mb-3.5 flex-wrap">
          <span className="text-[13px] font-[600] text-[#55585F]">Cette levée s&apos;adresse à</span>
          <div className="flex gap-1.5">
            {shownKeys.map((a) => (
              <button
                key={a}
                onClick={() => setSel(a)}
                className={"rounded-[5px] px-3 py-[7px] text-[12.5px] font-[600] border transition-colors " + (activeSel === a ? "border-[#E85C2B] bg-[#FEF8F4] text-[#C24619]" : "border-[#E4E2DC] text-[#55585F] hover:border-[#C9C6BD]")}
              >
                {labelOf(AUDIENCES, a) || a}
              </button>
            ))}
          </div>
          <span className="ml-auto text-[11.5px] text-[#9DA0A8]">Détermine les indicateurs mis en avant</span>
        </div>
      )}

      {/* En bref */}
      <div className="border border-[#ECEBE6] rounded-[6px] overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#ECEBE6] flex-wrap">
          <span className="flex items-baseline gap-2.5">
            <span className="text-[13.5px] font-[700]">En bref</span>
            <span className="text-[11.5px] text-[#9DA0A8]">ce qu&apos;un investisseur voit avant d&apos;ouvrir vos documents</span>
          </span>
          <button onClick={() => setEditOpen(true)} className="flex items-center gap-1.5 border border-[#E4E2DC] rounded-[5px] px-3 py-1.5 text-[12px] font-[600] text-[#33353B] hover:border-[#C9C6BD] hover:bg-[#FAFAF8] whitespace-nowrap">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
            Éditer les indicateurs
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="text-[12.5px] text-[#9DA0A8] px-4 py-6 text-center">
            Aucun indicateur pour l&apos;instant. Cliquez sur « Éditer les indicateurs » pour ajouter ce qu&apos;un investisseur voit avant d&apos;ouvrir vos documents.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-[#ECEBE6]">
            {rows.map((k, i) => (
              <div key={i} className="px-4 py-[15px]">
                <div className="text-[11px] font-[600] text-[#8B8E96] mb-1.5">{k.l}</div>
                <div style={mono} className="text-[19px] font-[600] tracking-[-0.02em]">{k.v}</div>
                {k.s && <div className={"text-[11px] mt-[3px] " + (k.g ? "text-[#147A5C] font-[600]" : "text-[#6E727A]")}>{k.s}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {editOpen && (
        <VitrineEditor
          dealId={dealId}
          audKeys={editKeys}
          initial={indicateurs}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}

function VitrineEditor({
  dealId,
  audKeys,
  initial,
  onClose,
}: {
  dealId: string;
  audKeys: string[];
  initial: Vitrine;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [data, setData] = useState<Vitrine>(() => {
    const d: Vitrine = {};
    for (const a of audKeys) d[a] = (initial[a] ?? []).map((x) => ({ ...x }));
    return d;
  });

  function set(aud: string, rows: Indicateur[]) {
    setData((d) => ({ ...d, [aud]: rows }));
  }
  function addRow(aud: string) {
    set(aud, [...(data[aud] ?? []), { l: "", v: "", s: "", g: false }]);
  }
  function loadTemplate(aud: string) {
    set(aud, (VITRINE_TEMPLATES[aud] ?? []).map((x) => ({ ...x, g: false })));
  }
  function edit(aud: string, i: number, patch: Partial<Indicateur>) {
    set(aud, (data[aud] ?? []).map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }
  function remove(aud: string, i: number) {
    set(aud, (data[aud] ?? []).filter((_, j) => j !== i));
  }

  function submit() {
    start(async () => {
      // On repart de l'existant pour NE PAS écraser les indicateurs d'audiences
      // non éditées, puis on nettoie (lignes avec au moins un libellé/valeur).
      const clean: Vitrine = { ...initial };
      for (const a of audKeys) {
        clean[a] = (data[a] ?? [])
          .filter((r) => r.l.trim() || r.v.trim())
          .map((r) => ({ l: r.l.trim(), v: r.v.trim(), s: (r.s ?? "").trim() || undefined, g: !!r.g }));
      }
      const res = await saveRaiseIndicators(dealId, clean);
      if (!res.ok) return setError(res.error);
      onClose();
      router.refresh();
    });
  }

  return (
    <Modal open onClose={onClose} title="Vitrine — indicateurs" width={620}>
      <div className="px-6 py-5 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
        <p className="text-[12px] text-[#6E727A] -mt-1">
          Ce que vos investisseurs voient avant d&apos;ouvrir les documents. Une ligne = un indicateur (libellé, valeur, précision).
        </p>
        {audKeys.map((aud) => (
          <div key={aud}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12.5px] font-[700] text-[#1A1B1F]">{labelOf(AUDIENCES, aud) || aud}</div>
              {VITRINE_TEMPLATES[aud] && (
                <button
                  type="button"
                  onClick={() => loadTemplate(aud)}
                  className="text-[11.5px] font-[600] text-[#C24619] hover:text-[#1A1B1F]"
                >
                  {(data[aud] ?? []).length === 0 ? "Partir du modèle" : "Réinitialiser au modèle"}
                </button>
              )}
            </div>
            {(data[aud] ?? []).length === 0 && (
              <p className="text-[11.5px] text-[#9DA0A8] mb-2">
                Modèle {(labelOf(AUDIENCES, aud) || aud).toLowerCase()} : {(VITRINE_TEMPLATES[aud] ?? []).map((x) => x.l).join(" · ")}
              </p>
            )}
            <div className="flex flex-col gap-2">
              {(data[aud] ?? []).map((r, i) => (
                <div key={i} className="grid grid-cols-[1.1fr_0.9fr_1.1fr_auto_auto] gap-2 items-center">
                  <input value={r.l} onChange={(e) => edit(aud, i, { l: e.target.value })} placeholder="Libellé" className={champ} />
                  <input value={r.v} onChange={(e) => edit(aud, i, { v: e.target.value })} placeholder="Valeur" style={mono} className={champ} />
                  <input value={r.s ?? ""} onChange={(e) => edit(aud, i, { s: e.target.value })} placeholder="Précision" className={champ} />
                  <button
                    type="button"
                    onClick={() => edit(aud, i, { g: !r.g })}
                    title="Mettre en avant (vert)"
                    className={"w-9 h-9 rounded-[5px] border text-[11px] font-[700] " + (r.g ? "border-[#147A5C] bg-[#E4F3EC] text-[#147A5C]" : "border-[#E4E2DC] text-[#9DA0A8]")}
                  >
                    ✓
                  </button>
                  <button type="button" onClick={() => remove(aud, i)} title="Retirer" className="w-9 h-9 rounded-[5px] border border-[#E4E2DC] text-[#9DA0A8] hover:text-[#C0392B] hover:border-[#E3B4AD]">×</button>
                </div>
              ))}
              <button type="button" onClick={() => addRow(aud)} className="self-start text-[12px] font-[600] text-[#C24619] mt-0.5">+ Ajouter un indicateur</button>
            </div>
          </div>
        ))}

        {error && <p className="text-[12px] text-[#C0392B]">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className={btnGhost}>Annuler</button>
          <button onClick={submit} disabled={pending} className={btnPrimary}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Pipeline investisseur curé                                          */
/* ------------------------------------------------------------------ */

function PipelineInvestisseurs({
  dealId,
  devise,
  investors,
}: {
  dealId: string;
  devise: string;
  investors: RaiseInvestor[];
}) {
  // `null` = fermé, "new" = création, sinon l'investisseur en édition.
  const [editing, setEditing] = useState<RaiseInvestor | "new" | null>(null);

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[15px] font-[700] tracking-[-0.01em]">Investisseurs sur cette levée</h2>
        <button onClick={() => setEditing("new")} className="text-[12.5px] font-[600] text-[#C24619] hover:text-[#1A1B1F]">
          + Ajouter un investisseur
        </button>
      </div>
      <div className="border-t border-[#ECEBE6] mb-8">
        {investors.length === 0 ? (
          <p className="text-[12.5px] text-[#9DA0A8] py-6 text-center">
            Aucun investisseur suivi. Ajoutez ceux que vous approchez, avec leur ticket et leur statut.
          </p>
        ) : (
          <>
            <div style={mono} className="grid grid-cols-[1.7fr_0.8fr_1fr_auto] gap-3 py-2 text-[9px] text-[#A0A3AB] tracking-[0.05em] border-b border-[#ECEBE6]">
              <span>INVESTISSEUR</span><span>TICKET</span><span>STATUT</span><span></span>
            </div>
            {investors.map((inv) => {
              const st = STATUT_PIPELINE.find((s) => s.key === inv.statut);
              return (
                <div key={inv.id} className="grid grid-cols-[1.7fr_0.8fr_1fr_auto] gap-3 items-center py-3 border-b border-[#F1F0EC]">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="grid place-items-center w-7 h-7 rounded-[6px] bg-[#1A1B1F] text-white text-[10px] font-[700] shrink-0">{initials(inv.nom)}</span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-[600] truncate">{inv.nom}</span>
                      {(inv.organisation || inv.email) && <span className="block text-[11px] text-[#8B8E96] truncate">{inv.organisation || inv.email}</span>}
                    </span>
                  </span>
                  <span style={mono} className="text-[12.5px] font-[600]">{inv.ticket != null ? formatMoney(inv.ticket, devise) : "—"}</span>
                  <span>
                    <span style={mono} className={"text-[9px] font-[600] rounded-[4px] px-2 py-[3px] " + toneCls(st?.tone ?? "gray")}>{(st?.label ?? inv.statut).toUpperCase()}</span>
                  </span>
                  <button onClick={() => setEditing(inv)} className="text-[11.5px] font-[600] text-[#C24619] hover:text-[#1A1B1F] justify-self-end">Modifier</button>
                </div>
              );
            })}
          </>
        )}
      </div>

      {editing && (
        <InvestorEditor
          dealId={dealId}
          investor={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function InvestorEditor({
  dealId,
  investor,
  onClose,
}: {
  dealId: string;
  investor: RaiseInvestor | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [nom, setNom] = useState(investor?.nom ?? "");
  const [org, setOrg] = useState(investor?.organisation ?? "");
  const [email, setEmail] = useState(investor?.email ?? "");
  const [ticket, setTicket] = useState(investor?.ticket?.toString() ?? "");
  const [statut, setStatut] = useState(investor?.statut ?? "invite");

  function submit() {
    start(async () => {
      const res = await saveRaiseInvestor({
        dealId,
        id: investor?.id ?? null,
        nom: nom.trim() || "Investisseur",
        organisation: org.trim() || undefined,
        email: email.trim() || undefined,
        ticket: ticket ? Math.round(Number(ticket)) : null,
        statut,
      });
      if (!res.ok) return setError(res.error);
      onClose();
      router.refresh();
    });
  }

  function remove() {
    if (!investor) return;
    start(async () => {
      const res = await deleteRaiseInvestor(investor.id);
      if (!res.ok) return setError(res.error);
      onClose();
      router.refresh();
    });
  }

  return (
    <Modal open onClose={onClose} title={investor ? "Modifier l'investisseur" : "Ajouter un investisseur"} width={520}>
      <div className="px-6 py-5 flex flex-col gap-4">
        <div>
          <label className={lab}>Nom</label>
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Awa Ndiaye" className={champ} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lab}>Organisation</label>
            <input value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Kola Ventures" className={champ} />
          </div>
          <div>
            <label className={lab}>E-mail (optionnel)</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="awa@kola.vc" className={champ} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lab}>Ticket envisagé</label>
            <input type="number" min="0" value={ticket} onChange={(e) => setTicket(e.target.value)} placeholder="optionnel" style={mono} className={champ} />
          </div>
          <div>
            <label className={lab}>Statut</label>
            <select value={statut} onChange={(e) => setStatut(e.target.value)} className={champ}>
              {STATUT_PIPELINE.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-[12px] text-[#C0392B]">{error}</p>}

        <div className="flex items-center justify-between pt-1">
          {investor ? (
            <button onClick={remove} disabled={pending} className="text-[12.5px] font-[600] text-[#C0392B] hover:underline disabled:opacity-60">Retirer</button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className={btnGhost}>Annuler</button>
            <button onClick={submit} disabled={pending} className={btnPrimary}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Cycle de vie des levées                                             */
/* ------------------------------------------------------------------ */

/** Barre des levées : courante (+ Clôturer), clôturées, + Nouvelle levée. */
function RaiseChips({
  dealName,
  dealId,
  raise,
  closedRaises,
}: {
  dealName: string;
  dealId: string;
  raise: Raise | null;
  closedRaises: Raise[];
}) {
  return (
    <div className="flex gap-2 mb-6 flex-wrap items-center">
      {raise && (
        <>
          <span className="flex items-center gap-2.5 border border-[#1A1B1F] rounded-[5px] px-3.5 py-2.5 whitespace-nowrap">
            <span className="text-[13px] font-[650]">{dealName}</span>
            <span style={mono} className="text-[9px] font-[600] text-[#147A5C] bg-[#E4F3EC] rounded-[4px] px-[7px] py-0.5">EN COURS</span>
            <span style={mono} className="text-[11px] text-[#9DA0A8]">{formatMoney(raise.montant_cible, raise.devise)}</span>
          </span>
          <CloseRaiseButton dealId={dealId} />
        </>
      )}
      {closedRaises.map((r) => (
        <span key={r.id} className="flex items-center gap-2.5 border border-[#E4E2DC] rounded-[5px] px-3.5 py-2.5 whitespace-nowrap">
          <span className="text-[13px] font-[650] text-[#6E727A]">{labelOf(STADE_RAISE, r.stade) || "Tour précédent"}</span>
          <span style={mono} className="text-[9px] font-[600] text-[#8B8E96] bg-[#F1F0EB] rounded-[4px] px-[7px] py-0.5">CLÔTURÉE</span>
          <span style={mono} className="text-[11px] text-[#9DA0A8]">{formatMoney(r.montant_cible, r.devise)}</span>
        </span>
      ))}
      <OpenRaiseButton
        dealId={dealId}
        hasCurrent={!!raise}
        label="+ Nouvelle levée"
        className="flex items-center border border-dashed border-[#D5D2CA] rounded-[5px] px-3.5 py-2.5 text-[13px] font-[600] text-[#8B8E96] hover:border-[#C24619] hover:text-[#C24619] whitespace-nowrap"
      />
      <AddPastRaiseButton dealId={dealId} />
    </div>
  );
}

/** Documenter une levée faite AVANT la plateforme (tour déjà clôturé). */
function AddPastRaiseButton({ dealId }: { dealId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [montant, setMontant] = useState("");
  const [devise, setDevise] = useState("USD");
  const [stade, setStade] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  const champ = "h-9 w-full px-2.5 text-[13px] bg-white text-[#1A1B1F] rounded-[5px] border border-[#E4E2DC] focus:border-[#E85C2B] focus:outline-none";
  const lab = "text-[11.5px] font-[600] text-[#6E727A] mb-1 block";

  function submit() {
    start(async () => {
      const res = await addPastRaise({
        dealId,
        montant: montant ? Math.round(Number(montant)) : null,
        devise,
        stade: stade || undefined,
        date: date || null,
        description: description.trim() || undefined,
      });
      if (!res.ok) return setError(res.error);
      setOpen(false);
      setMontant(""); setStade(""); setDate(""); setDescription("");
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => { setError(undefined); setOpen(true); }}
        className="flex items-center border border-dashed border-[#D5D2CA] rounded-[5px] px-3.5 py-2.5 text-[13px] font-[600] text-[#8B8E96] hover:border-[#C24619] hover:text-[#C24619] whitespace-nowrap"
      >
        + Tour passé
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter un tour passé" width={520}>
        <div className="px-6 py-5 flex flex-col gap-4">
          <p className="text-[12px] text-[#6E727A] -mt-1">
            Une levée bouclée avant Sanza (Pre-Seed, Seed…). Elle rejoint votre historique de financement.
          </p>
          <div className="grid grid-cols-[1.4fr_0.8fr] gap-3">
            <div>
              <label className={lab}>Montant levé</label>
              <input type="number" min="0" value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="1500000" style={mono} className={champ} />
            </div>
            <div>
              <label className={lab}>Devise</label>
              <select value={devise} onChange={(e) => setDevise(e.target.value)} className={champ}>
                {DEVISES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lab}>Stade</label>
              <select value={stade} onChange={(e) => setStade(e.target.value)} className={champ}>
                <option value="">—</option>
                {STADE_RAISE.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lab}>Date de clôture</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={champ} />
            </div>
          </div>
          <div>
            <label className={lab}>Note (optionnelle)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Investisseurs, contexte…" className="w-full px-2.5 py-2 text-[13px] bg-white text-[#1A1B1F] rounded-[5px] border border-[#E4E2DC] focus:border-[#E85C2B] focus:outline-none resize-none" />
          </div>
          {error && <p className="text-[12px] text-[#C0392B]">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setOpen(false)} className={btnGhost}>Annuler</button>
            <button onClick={submit} disabled={pending} className={btnPrimary}>{pending ? "Ajout…" : "Ajouter le tour"}</button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/** Supprime un tour de l'historique (correction) — ✕ discret + popup. */
function DeleteRoundButton({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function confirmer() {
    start(async () => {
      const res = await deleteRaise(id);
      if (!res.ok) return setError(res.error);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => { setError(undefined); setOpen(true); }}
        aria-label="Supprimer ce tour"
        className="absolute top-2.5 right-2.5 text-[#C7C9CF] hover:text-[#C0392B] opacity-0 group-hover:opacity-100 transition-opacity text-[15px] leading-none"
      >
        ×
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Supprimer ce tour" width={420}>
        <div className="px-6 py-5">
          <p className="text-[13px] text-[#33353B] leading-relaxed">
            Retirer ce tour de l&apos;historique de financement&nbsp;? Cette action est définitive.
          </p>
          {error && <p className="text-[12px] text-[#C0392B] mt-2.5">{error}</p>}
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setOpen(false)} className={btnGhost}>Annuler</button>
            <button onClick={confirmer} disabled={pending} className="rounded-[5px] bg-[#C0392B] px-4 py-2 text-[13px] font-[600] text-white hover:bg-[#A32D2D] disabled:opacity-60">
              {pending ? "…" : "Supprimer"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/**
 * Ouvre un nouveau tour. S'il y a déjà une levée en cours, une POPUP demande
 * d'abord si on la clôture (elle rejoint l'historique) avant d'ouvrir. Sinon,
 * ouverture directe. La base refuse d'ouvrir tant qu'un tour est ouvert : on
 * clôture donc explicitement dans la popup, puis on ouvre.
 */
function OpenRaiseButton({
  dealId,
  hasCurrent,
  label,
  className,
}: {
  dealId: string;
  hasCurrent: boolean;
  label: string;
  className: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  function onClick() {
    setError(undefined);
    // Une levée est ouverte → on demande via la popup. Sinon, ouverture directe.
    if (hasCurrent) {
      setConfirmOpen(true);
      return;
    }
    start(async () => {
      const res = await openRaise(dealId);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  function cloturerEtOuvrir() {
    start(async () => {
      const c = await closeRaise(dealId);
      if (!c.ok) return setError(c.error);
      const o = await openRaise(dealId);
      if (!o.ok) return setError(o.error);
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button onClick={onClick} disabled={pending} className={className + " disabled:opacity-50"}>
        {pending ? "…" : label}
      </button>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Ouvrir une nouvelle levée" width={460}>
        <div className="px-6 py-5">
          <p className="text-[13px] text-[#33353B] leading-relaxed">
            Une levée est déjà en cours. Voulez-vous la <span className="font-[700]">clôturer</span> — elle rejoindra l&apos;historique de financement — et ouvrir un nouveau tour&nbsp;?
          </p>
          {error && <p className="text-[12px] text-[#C0392B] mt-2.5">{error}</p>}
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setConfirmOpen(false)} className={btnGhost}>Annuler</button>
            <button onClick={cloturerEtOuvrir} disabled={pending} className={btnPrimary}>
              {pending ? "…" : "Clôturer et ouvrir"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/** Clôturer la levée en cours — bouton visible + popup in-app (pas de window.confirm). */
function CloseRaiseButton({ dealId }: { dealId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  function confirmer() {
    start(async () => {
      const res = await closeRaise(dealId);
      if (!res.ok) return setError(res.error);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => { setError(undefined); setOpen(true); }}
        className="flex items-center gap-1.5 border border-[#E4E2DC] rounded-[5px] px-3.5 py-2.5 text-[12.5px] font-[600] text-[#33353B] hover:border-[#C24619] hover:text-[#C24619] whitespace-nowrap"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        Clôturer la levée
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Clôturer la levée" width={460}>
        <div className="px-6 py-5">
          <p className="text-[13px] text-[#33353B] leading-relaxed">
            Clôturer la levée en cours&nbsp;? Elle rejoindra l&apos;<span className="font-[700]">historique de financement</span> et ne sera plus modifiable. Vous pourrez ensuite ouvrir un nouveau tour.
          </p>
          {error && <p className="text-[12px] text-[#C0392B] mt-2.5">{error}</p>}
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setOpen(false)} className={btnGhost}>Annuler</button>
            <button onClick={confirmer} disabled={pending} className={btnPrimary}>
              {pending ? "…" : "Clôturer la levée"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Sous-composants partagés                                            */
/* ------------------------------------------------------------------ */

/** Carte de préparation réutilisée par la levée et la diligence (données réelles). */
function PreparationCard({
  dealName,
  readiness,
  missing,
  legende,
}: {
  dealName: string;
  readiness: number;
  missing: { label: string; folderId: string | null }[];
  legende: string;
}) {
  return (
    <div className="border border-[#ECEBE6] rounded-[6px] p-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-[6px] bg-[#1A1B1F] text-white font-[700]">{dealName.slice(0, 1)}</span>
          <div>
            <div className="text-[14px] font-[650]">{dealName}</div>
            <div className="text-[11.5px] text-[#8B8E96]">{legende}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[11px] font-[600] text-[#8B8E96]">Dossier prêt</div>
            <div style={mono} className="text-[18px] font-[600]">{readiness}%</div>
          </div>
          <Link href="/data-room" className="rounded-[5px] bg-[#E85C2B] px-4 py-2.5 text-[13px] font-[600] text-white hover:bg-[#D24E1F]">Ouvrir →</Link>
        </div>
      </div>
      {missing.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#F1F0EC]">
          <div style={mono} className="text-[9px] font-[600] text-[#8B8E96] tracking-[0.06em] mb-2.5">CE QU&apos;IL RESTE À FAIRE</div>
          <div className="flex flex-col gap-1.5">
            {missing.slice(0, 5).map((m, i) => (
              <div key={m.label} className="flex items-center gap-3 text-[12.5px]">
                <span style={mono} className="text-[9px] font-[600] text-[#8B8E96] bg-[#F1F0EB] rounded-[4px] px-2 py-0.5 w-[52px] text-center">À FAIRE</span>
                <span className="flex-1 text-[#33353B]">{m.label}</span>
                {i === 0 && <span style={mono} className="text-[9px] font-[600] text-[#C24619] bg-[#FBEDE6] rounded-[4px] px-2 py-0.5">PROCHAINE</span>}
                <Link href={m.folderId ? `/data-room?dossier=${m.folderId}` : "/checklist"} className="text-[12px] font-[600] text-[#C24619]">Déposer</Link>
              </div>
            ))}
          </div>
          <Link href="/checklist" className="inline-block mt-3 text-[12.5px] font-[600] text-[#C24619]">Ouvrir le suivi de la diligence →</Link>
        </div>
      )}
    </div>
  );
}

/** Bouton + modal d'édition de la levée. Écrit via `saveRaise` (RPC audité). */
function ModifierLevee({ dealId, raise }: { dealId: string; raise: Raise | null }) {
  const router = useRouter();
  const sp = useSearchParams();
  // Ouverture automatique après « Créer ma levée » (?configurer=1) : le
  // fondateur atterrit sur Ma levée avec le formulaire déjà ouvert à remplir.
  const [open, setOpen] = useState(sp.get("configurer") === "1");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const [cible, setCible] = useState(raise?.montant_cible?.toString() ?? "");
  const [engage, setEngage] = useState(raise?.montant_engage?.toString() ?? "");
  const [devise, setDevise] = useState(raise?.devise ?? "USD");
  const [typeTour, setTypeTour] = useState(raise?.type_tour ?? "");
  const [stade, setStade] = useState(raise?.stade ?? "");
  const [valo, setValo] = useState(raise?.valorisation_pre?.toString() ?? "");
  const [cloture, setCloture] = useState(raise?.date_cloture ?? "");
  const [audience, setAudience] = useState<string[]>(raise?.audience ?? []);
  const [description, setDescription] = useState(raise?.description ?? "");
  const [confDel, setConfDel] = useState(false);

  function supprimerLevee() {
    if (!raise?.id) return;
    start(async () => {
      const res = await deleteRaise(raise.id);
      if (!res.ok) return setError(res.error);
      setOpen(false);
      router.refresh();
    });
  }

  function toggleAud(key: string) {
    setAudience((a) => (a.includes(key) ? a.filter((x) => x !== key) : [...a, key]));
  }

  function submit() {
    start(async () => {
      const res = await saveRaise({
        dealId,
        montantCible: cible ? Math.round(Number(cible)) : null,
        montantEngage: engage ? Math.round(Number(engage)) : 0,
        devise,
        typeTour: typeTour || undefined,
        stade: stade || undefined,
        valorisationPre: valo ? Math.round(Number(valo)) : null,
        dateCloture: cloture || null,
        audience,
        description: description.trim() || undefined,
      });
      if (!res.ok) return setError(res.error);
      setError(undefined);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-[#E4E2DC] rounded-[5px] px-3.5 py-2 text-[13px] font-[600] text-[#33353B] hover:border-[#C9C6BD] hover:bg-[#FAFAF8] whitespace-nowrap mt-1"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
        Modifier la levée
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Modifier la levée" width={560}>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-[1.4fr_0.8fr] gap-3">
            <div>
              <label className={lab}>Montant recherché</label>
              <input type="number" min="0" value={cible} onChange={(e) => setCible(e.target.value)} placeholder="5000000" style={mono} className={champ} />
            </div>
            <div>
              <label className={lab}>Devise</label>
              <select value={devise} onChange={(e) => setDevise(e.target.value)} className={champ}>
                {DEVISES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={lab}>Montant déjà engagé (soft-commitments)</label>
            <input type="number" min="0" value={engage} onChange={(e) => setEngage(e.target.value)} placeholder="0" style={mono} className={champ} />
            <p className="text-[11px] text-[#9DA0A8] mt-1">Sert à la jauge « engagés / recherchés » de l&apos;accueil.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lab}>Type de tour</label>
              <select value={typeTour} onChange={(e) => setTypeTour(e.target.value)} className={champ}>
                <option value="">—</option>
                {TYPE_TOUR.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lab}>Stade</label>
              <select value={stade} onChange={(e) => setStade(e.target.value)} className={champ}>
                <option value="">—</option>
                {STADE_RAISE.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lab}>Valorisation pré-money</label>
              <input type="number" min="0" value={valo} onChange={(e) => setValo(e.target.value)} placeholder="optionnel" style={mono} className={champ} />
            </div>
            <div>
              <label className={lab}>Clôture visée</label>
              <input type="date" value={cloture} onChange={(e) => setCloture(e.target.value)} className={champ} />
            </div>
          </div>

          <div>
            <label className={lab}>Cette levée s&apos;adresse à</label>
            <div className="flex gap-1.5 flex-wrap">
              {AUDIENCES.map((a) => {
                const on = audience.includes(a.key);
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => toggleAud(a.key)}
                    className={"rounded-[5px] px-3 py-[7px] text-[12.5px] font-[600] border transition-colors " + (on ? "border-[#E85C2B] bg-[#FEF8F4] text-[#C24619]" : "border-[#E4E2DC] text-[#55585F] hover:border-[#C9C6BD]")}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={lab}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Ce que finance cette levée, en quelques lignes." className="w-full px-2.5 py-2 text-[13px] bg-white text-[#1A1B1F] rounded-[5px] border border-[#E4E2DC] focus:border-[#E85C2B] focus:outline-none resize-none" />
          </div>

          {error && <p className="text-[12px] text-[#C0392B]">{error}</p>}

          {confDel && (
            <div className="rounded-[6px] border border-[#E3B4AD] bg-[#FBEDE6] px-3 py-2.5 text-[12px] text-[#8A2A1E] leading-relaxed">
              Supprimer cette levée et toutes ses données (montant, indicateurs, pipeline d&apos;investisseurs, historique)&nbsp;? La data room, elle, est conservée. Cette action est définitive.
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            {raise?.id && !confDel ? (
              <button onClick={() => setConfDel(true)} className="text-[12.5px] font-[600] text-[#C0392B] hover:underline">Supprimer la levée</button>
            ) : <span />}
            <div className="flex gap-2">
              {confDel ? (
                <>
                  <button onClick={() => setConfDel(false)} className={btnGhost}>Annuler</button>
                  <button onClick={supprimerLevee} disabled={pending} className="rounded-[5px] bg-[#C0392B] px-4 py-2 text-[13px] font-[600] text-white hover:bg-[#A32D2D] disabled:opacity-60">
                    {pending ? "…" : "Supprimer la levée"}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setOpen(false)} className={btnGhost}>Annuler</button>
                  <button onClick={submit} disabled={pending} className={btnPrimary}>
                    {pending ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
