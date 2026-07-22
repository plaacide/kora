"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * En-tête de data room + barre des 6 onglets (handoff app v5 §3b).
 *
 * Contenu · Autorisations · Suivi de la diligence · Q&A · Signatures · Journal
 * d'audit — les écrans qui étaient éparpillés en menu deviennent les onglets
 * d'UNE salle, comme DocSend. Chaque onglet est une route existante ; l'onglet
 * actif est déduit du chemin.
 *
 * Ne s'affiche que pour l'équipe interne (le fondateur), et seulement sur les
 * routes de la salle. L'invité garde sa navigation propre.
 */

const TABS: { href: string; label: string; count?: number; accent?: boolean }[] = [
  { href: "/data-room", label: "Contenu" },
  { href: "/permissions", label: "Autorisations", count: 3 },
  { href: "/checklist", label: "Suivi de la diligence", count: 16, accent: true },
  { href: "/qa", label: "Questions-réponses", count: 2, accent: true },
  { href: "/nda", label: "Signatures" },
  { href: "/audit", label: "Journal d'audit" },
];

const ROOM_ROUTES = new Set(TABS.map((t) => t.href));

export function RoomTabs({ dealName }: { dealName: string }) {
  const pathname = usePathname();
  if (!ROOM_ROUTES.has(pathname)) return null;

  return (
    <div className="mb-6">
      {/* Fil d'Ariane */}
      <div className="flex items-center gap-[7px] text-[12.5px] text-[#9DA0A8] mb-4">
        <Link href="/espaces" className="hover:text-[#1A1B1F]">Data room</Link>
        <span className="text-[#D5D2CA]">/</span>
        <span className="font-[600] text-[#1A1B1F] truncate">Due diligence — {dealName}</span>
      </div>

      {/* En-tête de la salle */}
      <div className="flex items-start gap-4 mb-[22px]">
        <span className="grid place-items-center w-[52px] h-[52px] shrink-0 rounded-[6px] bg-[#FBEDE6] text-[#C24619]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[22px] font-[700] tracking-[-0.02em]">Due diligence — {dealName}</div>
          <div className="flex items-center gap-2 text-[12.5px] text-[#6E727A] mt-[5px] flex-wrap">
            Rattachée à
            <Link href="/deal" className="inline-flex items-center gap-[5px] border border-[#E4E2DC] rounded-[5px] px-[9px] py-[3px] font-[600] text-[#33353B] hover:border-[#C9C6BD] hover:bg-[#FAFAF8]">
              Levée {dealName}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9DA0A8" strokeWidth="2.4" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
            </Link>
            <span className="text-[#D5D2CA]">·</span>
            à jour à l&apos;instant
            <span style={{ fontFamily: "var(--font-plex-mono), monospace" }} className="text-[9px] font-[600] text-[#147A5C] bg-[#E4F3EC] rounded-[4px] px-2 py-[3px]">ACTIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="border border-[#E4E2DC] rounded-[5px] px-3 py-2 text-[13px] font-[600] text-[#33353B] hover:border-[#C9C6BD] hover:bg-[#FAFAF8] cursor-pointer">Afficher un aperçu</span>
          <Link href="/invitations" className="rounded-[5px] bg-[#E85C2B] px-3.5 py-2 text-[13px] font-[600] text-white hover:bg-[#D24E1F]">Partager</Link>
          <span className="grid place-items-center border border-[#E4E2DC] rounded-[5px] w-[34px] h-[34px] text-[#6E727A] hover:border-[#C9C6BD] hover:bg-[#FAFAF8] cursor-pointer text-[16px]">⋯</span>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-[22px] border-b border-[#ECEBE6] text-[13px] font-[600] overflow-x-auto">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                "flex items-center gap-2 py-[9px] px-px -mb-px border-b-2 whitespace-nowrap transition-colors " +
                (active ? "border-[#E85C2B] text-[#1A1B1F]" : "border-transparent text-[#6E727A] hover:text-[#1A1B1F]")
              }
            >
              {tab.label}
              {typeof tab.count === "number" && (
                <span
                  style={{ fontFamily: "var(--font-plex-mono), monospace" }}
                  className={
                    tab.accent
                      ? "text-[10px] font-[600] bg-[#FBEDE6] text-[#C24619] rounded-[4px] px-[7px] py-0.5"
                      : "text-[11px] font-[500] text-[#A0A3AB]"
                  }
                >
                  {tab.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
