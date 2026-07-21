"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SanzaLogo } from "@/components/ui/SanzaLogo";
import { cn } from "@/lib/cn";

const LIENS = [
  { href: "#produit", label: "Produit" },
  { href: "#fondateurs", label: "Fondateurs" },
  { href: "#sae", label: "Accompagnateurs" },
  { href: "#investisseurs", label: "Investisseurs" },
  { href: "#tarifs", label: "Tarifs" },
];

/**
 * Barre de navigation du site public.
 *
 * Claire et collante, comme la maquette : fond craie translucide, flou, texte
 * Encre. Le héros sombre défile DESSOUS, ce qui donne le contraste sans avoir
 * à inverser les couleurs au défilement.
 */
export function SiteNav() {
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
    <header className="sticky top-0 z-50 bg-[rgba(247,245,240,0.92)] backdrop-blur-[10px] border-b border-line">
      <div className="mx-auto max-w-[1180px] px-5 md:px-8 py-4 flex items-center justify-between gap-4">
        <Link href="/" aria-label="Sanza" className="shrink-0">
          <SanzaLogo size={24} />
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {LIENS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[14px] font-[550] text-ink-secondary hover:text-ink transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/connexion"
            className="text-[14px] font-[600] text-ink hover:text-primary transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href="/inscription"
            data-analytics="signup_founder_click"
            className="sz-cta text-[14px] px-5 py-2.5"
          >
            Créer un compte
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          className="lg:hidden grid place-items-center w-11 h-11 -mr-2 text-ink"
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
        <div className={cn("lg:hidden border-t border-line bg-bg px-5 py-3 flex flex-col")}>
          {LIENS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-3 text-[15px] font-[550] text-ink-secondary"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/connexion"
            onClick={() => setOpen(false)}
            className="py-3 text-[15px] font-[600] text-ink"
          >
            Se connecter
          </Link>
          <Link
            href="/inscription"
            onClick={() => setOpen(false)}
            data-analytics="signup_founder_click"
            className="sz-cta mt-2 mb-1 text-[15px] py-3 text-center"
          >
            Créer un compte
          </Link>
        </div>
      )}
    </header>
  );
}
