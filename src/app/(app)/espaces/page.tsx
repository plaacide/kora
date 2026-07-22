import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/access";
import { getCurrentDeal } from "@/lib/current-deal";

/**
 * Liste des data rooms (handoff §3a). Le titre est « Data room » (choix du
 * fondateur, plutôt qu'« Espaces »).
 *
 * DONNÉES : la première ligne est la VRAIE salle du deal — nom, nombre de
 * documents et d'invités réels. Les deux autres lignes (partage large, round
 * archivé) sont de la donnée d'attente, le modèle multi-rooms n'existant pas
 * encore (phase D). Elles illustrent ce que sera la liste.
 */
const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={"inline-flex w-[30px] h-[17px] rounded-full relative " + (on ? "bg-[#1D9E75]" : "bg-[#DAD8D0]")}>
      <span className={"absolute top-0.5 w-[13px] h-[13px] rounded-full bg-white " + (on ? "right-0.5" : "left-0.5")} />
    </span>
  );
}

export default async function EspacesPage() {
  const supabase = await createClient();
  await requireInternal(supabase);
  const { deal } = await getCurrentDeal(supabase);

  let nbDocs = 0;
  let nbInvites = 0;
  if (deal) {
    const [{ count: dc }, { data: acc }] = await Promise.all([
      supabase.from("documents").select("id", { count: "exact", head: true }).eq("deal_id", deal.id),
      supabase.from("invitations").select("email").eq("deal_id", deal.id),
    ]);
    nbDocs = dc ?? 0;
    nbInvites = (acc ?? []).length;
  }

  const nom = deal?.name ?? "Ma data room";

  return (
    <div className="flex flex-col text-[#1A1B1F]">
      <div className="flex items-start justify-between gap-5 mb-1.5">
        <div>
          <h1 className="font-display text-[27px] font-[700] tracking-[-0.025em]">Data room</h1>
          <p className="text-[13.5px] text-[#6E727A] mt-1">
            Vos data rooms — une par audience ou par étape de la levée. Chacune a ses accès, ses pièces et ses signatures.
          </p>
        </div>
        <span className="rounded-[5px] bg-[#E85C2B] px-3.5 py-2.5 text-[13px] font-[600] text-white hover:bg-[#D24E1F] cursor-pointer whitespace-nowrap mt-1">
          Nouvelle data room
        </span>
      </div>

      <div className="flex gap-2 mt-4 mb-1">
        <span className="flex items-center gap-1.5 bg-[#F5F4F0] rounded-[5px] px-3 py-[7px] text-[12.5px] font-[600] cursor-pointer">
          Mes espaces
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6E727A" strokeWidth="2" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
        </span>
        <span className="flex items-center gap-1.5 bg-[#F5F4F0] rounded-[5px] px-3 py-[7px] text-[12.5px] font-[600] text-[#6E727A] cursor-pointer">
          Tous les statuts
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6E727A" strokeWidth="2" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
        </span>
      </div>

      <div style={mono} className="grid grid-cols-[2.4fr_1fr_1.2fr_90px_150px] gap-3.5 px-2 pb-2 border-b border-[#ECEBE6] text-[9px] tracking-[0.08em] text-[#A0A3AB] items-center">
        <span>NOM</span><span>DERNIÈRE MÀJ</span><span>PROPRIÉTAIRE</span><span>ACTIF</span><span></span>
      </div>

      {/* Ligne RÉELLE : la salle du deal */}
      <Link href="/data-room" className="grid grid-cols-[2.4fr_1fr_1.2fr_90px_150px] gap-3.5 items-center px-2 py-[15px] border-b border-[#F1F0EC] hover:bg-[#FAFAF8]">
        <span className="flex items-center gap-3 min-w-0">
          <span className="grid place-items-center w-9 h-9 rounded-[6px] bg-[#FBEDE6] text-[#C24619] shrink-0">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
          </span>
          <span className="min-w-0">
            <span className="block text-[13.5px] font-[650] truncate">Due diligence — {nom}</span>
            <span className="block text-[11.5px] text-[#9DA0A8]">Seed 2026 · {nbDocs} document{nbDocs > 1 ? "s" : ""} · {nbInvites} invité{nbInvites > 1 ? "s" : ""}</span>
          </span>
        </span>
        <span className="text-[12.5px] text-[#55585F]">à l&apos;instant</span>
        <span className="flex items-center gap-2">
          <span className="grid place-items-center w-6 h-6 rounded-[5px] bg-[#1A1B1F] text-white text-[9px] font-[700]">PB</span>
          <span className="text-[12.5px] text-[#33353B]">Vous</span>
        </span>
        <span><Toggle on /></span>
        <span className="flex items-center gap-3 justify-end">
          <span className="text-[12.5px] font-[600] text-[#C24619]">Partager</span>
          <span className="text-[#A0A3AB] text-[17px] leading-none">⋯</span>
        </span>
      </Link>

      {/* Lignes d'ATTENTE (dummy) — illustrent le multi-rooms à venir */}
      <div className="grid grid-cols-[2.4fr_1fr_1.2fr_90px_150px] gap-3.5 items-center px-2 py-[15px] border-b border-[#F1F0EC]">
        <span className="flex items-center gap-3 min-w-0">
          <span className="grid place-items-center w-9 h-9 rounded-[6px] bg-[#EEF4FB] text-[#2C5F8A] shrink-0">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
          </span>
          <span className="min-w-0">
            <span className="block text-[13.5px] font-[650] truncate">Teaser &amp; deck — partage large</span>
            <span className="block text-[11.5px] text-[#9DA0A8]">Prospection · 2 documents · lien public</span>
          </span>
        </span>
        <span className="text-[12.5px] text-[#55585F]">il y a 3 j</span>
        <span className="flex items-center gap-2">
          <span className="grid place-items-center w-6 h-6 rounded-[5px] bg-[#1A1B1F] text-white text-[9px] font-[700]">PB</span>
          <span className="text-[12.5px] text-[#33353B]">Vous</span>
        </span>
        <span><Toggle on /></span>
        <span className="flex items-center gap-3 justify-end">
          <span className="text-[12.5px] font-[600] text-[#C24619]">Partager</span>
          <span className="text-[#A0A3AB] text-[17px] leading-none">⋯</span>
        </span>
      </div>

      <div className="grid grid-cols-[2.4fr_1fr_1.2fr_90px_150px] gap-3.5 items-center px-2 py-[15px] border-b border-[#F1F0EC]">
        <span className="flex items-center gap-3 min-w-0">
          <span className="grid place-items-center w-9 h-9 rounded-[6px] bg-[#F1F0EB] text-[#9DA0A8] shrink-0">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" /></svg>
          </span>
          <span className="min-w-0">
            <span className="block text-[13.5px] font-[650] text-[#55585F] truncate">Round Pre-Seed 2024</span>
            <span className="block text-[11.5px] text-[#9DA0A8]">Clôturée · archivée · lecture seule</span>
          </span>
        </span>
        <span className="text-[12.5px] text-[#9DA0A8]">12 mars</span>
        <span className="flex items-center gap-2">
          <span className="grid place-items-center w-6 h-6 rounded-[5px] bg-[#7A5CA8] text-white text-[9px] font-[700]">AN</span>
          <span className="text-[12.5px] text-[#33353B]">Awa Ndiaye</span>
        </span>
        <span><Toggle on={false} /></span>
        <span className="flex items-center gap-3 justify-end">
          <span className="text-[12.5px] font-[600] text-[#9DA0A8]">Rouvrir</span>
          <span className="text-[#A0A3AB] text-[17px] leading-none">⋯</span>
        </span>
      </div>
    </div>
  );
}
