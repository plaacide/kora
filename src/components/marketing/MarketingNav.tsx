"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SanzaLogo } from "@/components/ui/SanzaLogo";
import { cn } from "@/lib/cn";

export type NavActive = "produit" | "institutions" | "accelerateurs" | "tarifs" | null;

const LIENS: { href: string; label: string; key: NavActive }[] = [
  { href: "/#produit", label: "Produit", key: "produit" },
  { href: "/institutions", label: "Institutions", key: "institutions" },
  { href: "/accelerateurs", label: "Accélérateurs", key: "accelerateurs" },
  { href: "/abonnement", label: "Tarifs", key: "tarifs" },
];

/**
 * Nav marketing — sticky BLANCHE (brief) : le hero sombre défile dessous.
 * Identique sur les 3 pages ; `active` passe l'onglet courant en orange.
 */
export function MarketingNav({ active = null }: { active?: NavActive }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 bg-white/92 backdrop-blur-[10px] border-b border-[#ECEBE6]">
      <div className="mx-auto max-w-[1240px] px-6 md:px-10 h-[60px] flex items-center justify-between gap-4">
        <Link href="/" aria-label="Sanza" className="shrink-0">
          <SanzaLogo size={23} />
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {LIENS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-[14px] font-[550] transition-colors",
                active === l.key
                  ? "text-[#C24619]"
                  : "text-[#4A4E63] hover:text-[#1A1B1F]",
              )}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/connexion"
            className="text-[14px] font-[600] text-[#1A1B1F] hover:text-[#C24619] transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href="/inscription"
            data-analytics="signup_founder_click"
            className="inline-flex items-center justify-center rounded-[7px] bg-[#E85C2B] text-white px-4 py-2.5 text-[14px] font-[650] hover:bg-[#D24E1F] transition-colors"
          >
            Créer ma dealroom
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          className="lg:hidden grid place-items-center w-11 h-11 -mr-2 text-[#1A1B1F]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            {open ? (
              <>
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </>
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-[#ECEBE6] bg-white px-6 py-3 flex flex-col">
          {LIENS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={cn(
                "py-3 text-[15px] font-[550]",
                active === l.key ? "text-[#C24619]" : "text-[#4A4E63]",
              )}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/connexion"
            onClick={() => setOpen(false)}
            className="py-3 text-[15px] font-[600] text-[#1A1B1F]"
          >
            Se connecter
          </Link>
          <Link
            href="/inscription"
            onClick={() => setOpen(false)}
            data-analytics="signup_founder_click"
            className="mt-2 mb-1 inline-flex items-center justify-center rounded-[7px] bg-[#E85C2B] text-white py-3 text-[15px] font-[650]"
          >
            Créer ma dealroom
          </Link>
        </div>
      )}
    </header>
  );
}
