"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SanzaLogo } from "@/components/ui/SanzaLogo";
import { cn } from "@/lib/cn";

const LIENS = [
  { href: "#produit", label: "Produit" },
  { href: "#beta", label: "La bêta" },
  { href: "#tarifs", label: "Tarifs" },
];

/**
 * Barre de navigation du site public.
 *
 * Transparente sur le héros sombre, puis fond translucide flouté dès qu'on
 * défile : sans ce basculement, les liens blancs deviennent illisibles dès
 * que la section claire passe dessous.
 */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Le menu mobile ouvert bloque le défilement derrière lui.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled
          ? "bg-[rgba(23,26,44,0.82)] backdrop-blur-md border-b border-white/10"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto max-w-[1140px] px-5 h-[68px] flex items-center gap-6">
        <Link href="/" aria-label="Sanza" className="shrink-0">
          <SanzaLogo size={26} dark />
        </Link>

        <nav className="hidden md:flex items-center gap-6 ml-2">
          {LIENS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] font-medium text-white/70 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden md:flex items-center gap-3">
          <Link
            href="/connexion"
            className="text-[13px] font-medium text-white/70 hover:text-white transition-colors"
          >
            Se connecter
          </Link>
          <Link href="/inscription" className="sz-cta text-[13px] px-4 py-2">
            Référencer ma startup
          </Link>
        </div>

        {/* Cible tactile de 44px minimum, comme demandé pour le mobile. */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          className="ml-auto md:hidden grid place-items-center w-11 h-11 -mr-2 text-white"
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
        <div className="md:hidden bg-encre border-t border-white/10 px-5 py-4 flex flex-col gap-1">
          {LIENS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-3 text-[15px] font-medium text-white/80"
            >
              {l.label}
            </a>
          ))}
          <Link href="/connexion" onClick={() => setOpen(false)} className="py-3 text-[15px] font-medium text-white/80">
            Se connecter
          </Link>
          <Link
            href="/inscription"
            onClick={() => setOpen(false)}
            className="sz-cta mt-2 text-[15px] px-4 py-3 text-center"
          >
            Référencer ma startup
          </Link>
        </div>
      )}
    </header>
  );
}
