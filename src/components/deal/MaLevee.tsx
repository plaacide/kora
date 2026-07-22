"use client";

import { useState } from "react";
import Link from "next/link";
import { ShareButton } from "@/components/dataroom/ShareButton";

/**
 * « Ma levée » — reconstruction fidèle du handoff app v5 (§4).
 *
 * Le point clé demandé par le client : le sélecteur d'audience (VC / DFI /
 * Banque) qui change le jeu d'indicateurs de la bande « En bref ».
 *
 * DONNÉES : le nom de la levée et la préparation sont réels (props). Tout le
 * reste — montant, indicateurs, historique de financement, investisseurs,
 * équipe — est de la donnée d'ATTENTE (dummy), autorisée par le fondateur le
 * temps d'implémenter le modèle multi-levées. Chaque bloc est prêt à être
 * branché sur les vraies tables.
 */

type Audience = "vc" | "dfi" | "banque";

interface Indic {
  label: string;
  valeur: string;
  sub: string;
  vert?: boolean;
}

const INDICATEURS: Record<Audience, Indic[]> = {
  vc: [
    { label: "Revenu annualisé", valeur: "480 K$", sub: "+140 % /an", vert: true },
    { label: "Marge brute", valeur: "38 %", sub: "+6 pts vs. N-1" },
    { label: "Traction métier", valeur: "1 200 t", sub: "/an · 14 clients B2B" },
    { label: "Runway", valeur: "11 mois", sub: "trésorerie 640 K$" },
    { label: "Engagé sur le tour", valeur: "3,2 M$", sub: "/10 M$ · lead Sequoia", vert: true },
  ],
  dfi: [
    { label: "Revenu annualisé", valeur: "480 K$", sub: "+140 % /an", vert: true },
    { label: "Emplois créés", valeur: "320", sub: "+90 sur 12 mois", vert: true },
    { label: "Part femmes", valeur: "61 %", sub: "emplois & producteurs" },
    { label: "Producteurs sourcés", valeur: "2 400", sub: "14 coopératives" },
    { label: "Gouvernance & E&S", valeur: "Conseil 5", sub: "2 indép. · politique E&S" },
  ],
  banque: [
    { label: "EBITDA", valeur: "210 K$", sub: "marge 18 %" },
    { label: "DSCR", valeur: "1,4×", sub: "seuil ≥ 1,25×", vert: true },
    { label: "Ancienneté du CA", valeur: "3 ans", sub: "CA régulier" },
    { label: "Gearing (dette/FP)", valeur: "0,6×", sub: "endettement maîtrisé" },
    { label: "Garanties", valeur: "Équipement", sub: "+ créances · caution" },
  ],
};

const AUD_LABEL: Record<Audience, string> = {
  vc: "VC · Equity",
  dfi: "DFI · Impact",
  banque: "Banque · Dette",
};

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

export function MaLevee({
  dealName,
  dealId,
  readiness,
  missing,
}: {
  dealName: string;
  dealId: string;
  readiness: number;
  missing: { label: string; folderId: string | null }[];
}) {
  const [audience, setAudience] = useState<Audience>("vc");
  const indic = INDICATEURS[audience];

  return (
    <div className="flex flex-col text-[#1A1B1F]">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-5 mb-4">
        <div>
          <h1 className="font-display text-[27px] font-[700] tracking-[-0.025em]">Ma levée</h1>
          <p className="text-[13.5px] text-[#6E727A] mt-1">
            Le pilotage de votre tour de table : montant, équipe, documents clés et investisseurs.
          </p>
        </div>
        <button className="flex items-center gap-2 border border-[#E4E2DC] rounded-[5px] px-3.5 py-2 text-[13px] font-[600] text-[#33353B] hover:border-[#C9C6BD] hover:bg-[#FAFAF8] whitespace-nowrap mt-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
          Modifier la levée
        </button>
      </div>

      {/* Sélecteur de levées */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <span className="flex items-center gap-2.5 border border-[#1A1B1F] rounded-[5px] px-3.5 py-2.5 whitespace-nowrap">
          <span className="text-[13px] font-[650]">{dealName}</span>
          <span style={mono} className="text-[9px] font-[600] text-[#147A5C] bg-[#E4F3EC] rounded-[4px] px-[7px] py-0.5">EN COURS</span>
          <span style={mono} className="text-[11px] text-[#9DA0A8]">10 M$</span>
        </span>
        <span className="flex items-center gap-2.5 border border-[#E4E2DC] rounded-[5px] px-3.5 py-2.5 whitespace-nowrap">
          <span className="text-[13px] font-[650] text-[#6E727A]">Pre-Seed 2024</span>
          <span style={mono} className="text-[9px] font-[600] text-[#8B8E96] bg-[#F1F0EB] rounded-[4px] px-[7px] py-0.5">CLÔTURÉE</span>
          <span style={mono} className="text-[11px] text-[#9DA0A8]">1,5 M$</span>
        </span>
        <span className="flex items-center border border-dashed border-[#D5D2CA] rounded-[5px] px-3.5 py-2.5 text-[13px] font-[600] text-[#8B8E96] hover:border-[#C24619] hover:text-[#C24619] cursor-pointer whitespace-nowrap">
          + Nouvelle levée
        </span>
      </div>

      {/* Audience */}
      <div className="flex items-center gap-3 mb-3.5 flex-wrap">
        <span className="text-[13px] font-[600] text-[#55585F]">Cette levée s&apos;adresse à</span>
        <div className="flex gap-1.5">
          {(["vc", "dfi", "banque"] as Audience[]).map((a) => (
            <button
              key={a}
              onClick={() => setAudience(a)}
              className={
                "rounded-[5px] px-3 py-[7px] text-[12.5px] font-[600] border transition-colors " +
                (audience === a
                  ? "border-[#E85C2B] bg-[#FEF8F4] text-[#C24619]"
                  : "border-[#E4E2DC] text-[#55585F] hover:border-[#C9C6BD]")
              }
            >
              {AUD_LABEL[a]}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[11.5px] text-[#9DA0A8]">Détermine les indicateurs mis en avant</span>
      </div>

      {/* En bref — indicateurs par audience */}
      <div className="border border-[#ECEBE6] rounded-[6px] mb-7 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#ECEBE6]">
          <span className="flex items-baseline gap-2.5">
            <span className="text-[13.5px] font-[700]">En bref</span>
            <span className="text-[11.5px] text-[#9DA0A8]">ce qu&apos;un investisseur voit avant d&apos;ouvrir vos documents</span>
          </span>
          <span className="flex items-center gap-2 text-[11.5px] font-[600] text-[#6E727A]">
            Visible par les invités
            <span className="inline-flex w-7 h-4 rounded-full bg-[#1D9E75] relative">
              <span className="absolute right-0.5 top-0.5 w-3 h-3 rounded-full bg-white" />
            </span>
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-[#ECEBE6]">
          {indic.map((k) => (
            <div key={k.label} className="px-4 py-[15px]">
              <div className="text-[11px] font-[600] text-[#8B8E96] mb-1.5">{k.label}</div>
              <div style={mono} className="text-[19px] font-[600] tracking-[-0.02em]">{k.valeur}</div>
              <div className={"text-[11px] mt-[3px] " + (k.vert ? "text-[#147A5C] font-[600]" : "text-[#6E727A]")}>{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Résumé de la levée */}
      <div className="border border-[#ECEBE6] rounded-[6px] mb-7">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] divide-y md:divide-y-0 md:divide-x divide-[#ECEBE6]">
          <div className="px-5 py-[18px]">
            <div className="text-[11.5px] font-[600] text-[#8B8E96] mb-[7px]">Montant recherché</div>
            <div style={mono} className="text-[26px] font-[600] tracking-[-0.02em]">10 000 000 <span className="text-[14px] text-[#A0A3AB]">$US</span></div>
            <span className="block h-1.5 rounded-[3px] bg-[#ECEBE6] overflow-hidden mt-[11px]"><span className="block h-full bg-[#E85C2B]" style={{ width: "32%" }} /></span>
            <div className="text-[11.5px] text-[#6E727A] mt-[7px]"><span style={mono} className="text-[#C24619] font-[600]">3,2 M$</span> engagés · <span style={mono}>6,8 M$</span> restants</div>
          </div>
          <div className="px-5 py-[18px]">
            <div className="text-[11.5px] font-[600] text-[#8B8E96] mb-[7px]">Type de financement</div>
            <div className="text-[15px] font-[650]">Equity — Seed</div>
            <div className="text-[12px] text-[#6E727A] mt-1">VC &amp; DFI · valorisation pré-money 28 M$</div>
            <div className="flex gap-1.5 mt-2.5 flex-wrap">
              <span style={mono} className="text-[9.5px] font-[600] text-[#33353B] bg-[#F1F0EB] rounded-[4px] px-2 py-[3px]">SAFE</span>
              <span style={mono} className="text-[9.5px] font-[600] text-[#33353B] bg-[#F1F0EB] rounded-[4px] px-2 py-[3px]">OHADA</span>
            </div>
          </div>
          <div className="px-5 py-[18px]">
            <div className="text-[11.5px] font-[600] text-[#8B8E96] mb-[7px]">Clôture visée</div>
            <div className="text-[15px] font-[650]">30 septembre 2026</div>
            <div className="text-[12px] text-[#6E727A] mt-1">Term sheet Proparco espérée mi-août</div>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-[#ECEBE6] text-[13px] text-[#55585F] leading-[1.6]">
          <span style={mono} className="block text-[9px] font-[600] text-[#8B8E96] tracking-[0.08em] mb-1.5">DESCRIPTION</span>
          {dealName} industrialise la transformation de céréales locales (mil, fonio) en Côte d&apos;Ivoire. La levée finance une seconde ligne de production à Abidjan et l&apos;extension du réseau de collecte auprès de 2 400 producteurs.
        </div>
      </div>

      {/* Historique de financement */}
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-[15px] font-[700] tracking-[-0.01em]">Historique de financement</h2>
        <span className="text-[12.5px] text-[#9DA0A8]">1,5 M$ levés · 1 tour clôturé</span>
      </div>
      <div className="border border-[#ECEBE6] rounded-[6px] flex items-stretch mb-9 flex-col md:flex-row">
        <div className="flex-1 p-[18px]">
          <div className="flex items-center gap-2 mb-2">
            <span style={mono} className="text-[9px] font-[600] text-[#8B8E96] bg-[#F1F0EB] rounded-[4px] px-2 py-[3px]">CLÔTURÉE · MARS 2024</span>
            <span className="text-[13px] font-[650]">Pre-Seed 2024</span>
          </div>
          <div style={mono} className="text-[20px] font-[600] tracking-[-0.02em] mb-3">1,5 M$</div>
          <div className="flex items-center gap-2.5">
            <span className="flex">
              {[["AN", "#7A5CA8"], ["KO", "#2C7A5C"], ["DI", "#B5843A"]].map(([ini, bg], i) => (
                <span key={ini} className="grid place-items-center w-7 h-7 rounded-[6px] text-white text-[9.5px] font-[700] border-2 border-white" style={{ background: bg, marginLeft: i ? -9 : 0 }}>{ini}</span>
              ))}
            </span>
            <span className="text-[12px] text-[#55585F] leading-[1.4]">Awa Ndiaye <span className="text-[#9DA0A8]">(lead)</span> · Kola Ventures · Diallo FO</span>
          </div>
        </div>
        <div className="flex items-center px-1.5 text-[#C7C9CF] text-[18px] justify-center">→</div>
        <div className="flex-1 p-[18px] md:border-l border-[#ECEBE6] bg-[#FEFCFA]">
          <div className="flex items-center gap-2 mb-2">
            <span style={mono} className="text-[9px] font-[600] text-[#147A5C] bg-[#E4F3EC] rounded-[4px] px-2 py-[3px]">EN COURS</span>
            <span className="text-[13px] font-[650]">{dealName}</span>
          </div>
          <div className="flex items-baseline gap-2 mb-3"><span style={mono} className="text-[20px] font-[600] tracking-[-0.02em]">3,2 M$</span><span className="text-[12px] text-[#9DA0A8]">engagés / 10 M$</span></div>
          <div className="flex items-center gap-2.5">
            <span className="flex">
              <span className="grid place-items-center w-7 h-7 rounded-[6px] bg-[#1A1B1F] text-white text-[9.5px] font-[700] border-2 border-white">JD</span>
              <span className="grid place-items-center w-7 h-7 rounded-[6px] bg-[#2C5F8A] text-white text-[9.5px] font-[700] border-2 border-white -ml-[9px]">PR</span>
              <span className="grid place-items-center w-7 h-7 rounded-[6px] border-2 border-dashed border-[#C9C6BD] text-[#A0A3AB] text-[11px] font-[700] bg-white -ml-[9px]">+1</span>
            </span>
            <span className="text-[12px] text-[#55585F] leading-[1.4]">Sequoia <span className="text-[#9DA0A8]">(lead pressenti)</span> · Proparco · Teranga</span>
          </div>
        </div>
      </div>

      {/* Documents clés + Équipe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-9 mb-9">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-[15px] font-[700] tracking-[-0.01em]">Documents clés</h2>
            <Link href="/data-room" className="text-[12.5px] font-[600] text-[#C24619]">Voir la data room →</Link>
          </div>
          <div className="border-t border-[#ECEBE6]">
            {[
              { t: "PDF", n: "Deck_Sulma_Seed.pdf", v: "8 vues", muet: false },
              { t: "CSV", n: "Prévisionnels_3ans.csv", v: "4 vues", muet: false },
              { t: "PDF", n: "Cap_table.pdf", v: "à ajouter", muet: true },
            ].map((d) => (
              <div key={d.n} className="flex items-center gap-2.5 py-3 border-b border-[#F1F0EC] last:border-0">
                <span style={mono} className={"rounded-[3px] px-[5px] py-0.5 text-[8.5px] font-[600] " + (d.t === "PDF" ? "bg-[#FBE6E0] text-[#C0392B]" : "bg-[#E4F3EC] text-[#147A5C]")}>{d.t}</span>
                <span className="flex-1 text-[13px] font-[600]">{d.n}</span>
                <span style={mono} className={"text-[11px] " + (d.muet ? "text-[#9DA0A8]" : "text-[#6E727A]")}>{d.v}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-[15px] font-[700] tracking-[-0.01em]">Équipe sur la levée</h2>
            <span className="text-[12.5px] font-[600] text-[#C24619] cursor-pointer">Gérer →</span>
          </div>
          <div className="border-t border-[#ECEBE6]">
            {[
              { ini: "PB", bg: "#1A1B1F", nom: "Placide Bakala", role: "CEO · pilote la levée", tag: "OWNER", tagCls: "text-[#C24619] bg-[#FBEDE6]" },
              { ini: "AN", bg: "#7A5CA8", nom: "Awa Ndiaye", role: "CFO · prépare le financier", tag: "ÉDITEUR", tagCls: "text-[#33353B] bg-[#F1F0EB]" },
              { ini: "MK", bg: "#2C7A5C", nom: "Me Koffi", role: "Conseil juridique · externe", tag: "LECTEUR", tagCls: "text-[#8B8E96] bg-[#F1F0EB]" },
            ].map((m) => (
              <div key={m.nom} className="flex items-center gap-2.5 py-3 border-b border-[#F1F0EC] last:border-0">
                <span className="grid place-items-center w-[30px] h-[30px] rounded-[6px] text-white text-[10px] font-[700]" style={{ background: m.bg }}>{m.ini}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-[600] truncate">{m.nom}</span>
                  <span className="block text-[11px] text-[#9DA0A8] truncate">{m.role}</span>
                </span>
                <span style={mono} className={"text-[9px] font-[600] rounded-[4px] px-2 py-[3px] " + m.tagCls}>{m.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Investisseurs sur cette levée */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[15px] font-[700] tracking-[-0.01em]">Investisseurs sur cette levée</h2>
        <ShareButton dealId={dealId} label="+ Inviter un investisseur" className="text-[12.5px] font-[600] text-[#C24619]" />
      </div>
      <div className="border-t border-[#ECEBE6] mb-8">
        <div style={mono} className="grid grid-cols-[1.6fr_0.8fr_1fr_0.9fr] gap-3 py-2 text-[9px] text-[#A0A3AB] tracking-[0.05em] border-b border-[#ECEBE6]">
          <span>INVESTISSEUR</span><span>TICKET</span><span>STATUT</span><span className="text-right">DERNIÈRE VISITE</span>
        </div>
        {[
          { ini: "JD", nom: "Jason Doe", org: "Sequoia · lead pressenti", ticket: "2,0 M$", statut: "EN DILIGENCE", tone: "amber", visite: "il y a 45 min" },
          { ini: "PR", nom: "Proparco", org: "DFI · co-investisseur", ticket: "1,2 M$", statut: "SOFT-COMMIT", tone: "green", visite: "il y a 2 h" },
          { ini: "TC", nom: "Teranga Capital", org: "fonds@teranga.sn", ticket: "—", statut: "INVITÉ", tone: "gray", visite: "en attente NDA" },
        ].map((i) => (
          <div key={i.nom} className="grid grid-cols-[1.6fr_0.8fr_1fr_0.9fr] gap-3 items-center py-3 border-b border-[#F1F0EC]">
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="grid place-items-center w-7 h-7 rounded-[6px] bg-[#1A1B1F] text-white text-[10px] font-[700] shrink-0">{i.ini}</span>
              <span className="min-w-0">
                <span className="block text-[13px] font-[600] truncate">{i.nom}</span>
                <span className="block text-[11px] text-[#8B8E96] truncate">{i.org}</span>
              </span>
            </span>
            <span style={mono} className="text-[12.5px] font-[600]">{i.ticket}</span>
            <span><span style={mono} className={
              "text-[9px] font-[600] rounded-[4px] px-2 py-[3px] " +
              (i.tone === "amber" ? "text-[#B4741B] bg-[#FBF0DC]" : i.tone === "green" ? "text-[#147A5C] bg-[#E4F3EC]" : "text-[#8B8E96] bg-[#F1F0EB]")
            }>{i.statut}</span></span>
            <span className="text-right text-[11.5px] text-[#9DA0A8]">{i.visite}</span>
          </div>
        ))}
      </div>

      {/* Data room attachée — données RÉELLES de préparation */}
      <h2 className="text-[15px] font-[700] tracking-[-0.01em] mb-2">Data room attachée</h2>
      <div className="border border-[#ECEBE6] rounded-[6px] p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-10 h-10 rounded-[6px] bg-[#1A1B1F] text-white font-[700]">{dealName.slice(0, 1)}</span>
            <div>
              <div className="text-[14px] font-[650]">Due diligence — {dealName}</div>
              <div className="text-[11.5px] text-[#8B8E96]">rattachée à cette levée</div>
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
            <div style={mono} className="text-[9px] font-[600] text-[#8B8E96] tracking-[0.06em] mb-2.5">
              CE QU&apos;IL RESTE À FAIRE
            </div>
            <div className="flex flex-col gap-1.5">
              {missing.slice(0, 3).map((m, i) => (
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
    </div>
  );
}
