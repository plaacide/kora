"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { navFor } from "./nav";
import type { Persona } from "@/lib/persona";
import { usePersonaLabel } from "./persona-label";
import { NavIcon } from "./NavIcon";
import type { DealRef } from "@/lib/current-deal";
import { cn } from "@/lib/cn";

export function Sidebar({
  deals,
  currentDealId,
  role,
  persona = "fund",
  bloquees = {},
  aideMenu,
}: {
  deals: DealRef[];
  currentDealId: string | null;
  role: string | null;
  persona?: Persona;
  /**
   * Entrées non encore atteignables : href → la CONDITION à remplir, déjà
   * traduite. Grisées plutôt que masquées (§8) — un menu qui s'allonge tout
   * seul au fil des jours désoriente, alors qu'une entrée grisée qui dit
   * pourquoi enseigne le produit.
   *
   * La phrase est passée toute faite : elle dépend de données que seul le
   * serveur connaît, et la reconstruire ici demanderait de lui redemander.
   */
  bloquees?: Record<string, string>;
  /** La phrase unique sous le menu. Absente = plus rien n'est grisé. */
  aideMenu?: string;
}) {
  const pathname = usePathname();
  const t = useTranslations("shell");
  // Vocabulaire du métier : un fondateur lève, il ne « source » pas.
  const mot = usePersonaLabel("shell", persona);
  const label = (cle: string, chemin: "nav" | "groups") =>
    mot(`${chemin}.${cle}`);

  // « Mes levées » : l'entrée /deal liste désormais les levées (une par data
  // room), indépendamment de l'objectif — plus de swap diligence.
  const navLabel = (cle: string) => label(cle, "nav");

  return (
    <nav
      aria-label={t("mainNav")}
      className="w-[226px] shrink-0 h-[calc(100vh-56px)] sticky top-[56px] overflow-y-auto border-r border-[#E2DED4] bg-[#FAF8F4] px-3 pt-4 pb-5"
    >
      {navFor(role, persona).map((group) => {
        // Handoff : pas d'en-tête sur les destinations principales (Accueil,
        // Data room, Ma levée) — elles se listent directement, comme la
        // maquette. Seuls les groupes « annexes » (compte, cohorte) gardent un
        // libellé. Le sélecteur de deal disparaît aussi : une seule levée, et
        // l'organisation vit désormais dans la topbar.
        const avecLibelle = group.key !== "overview" && group.key !== "deal";
        return (
        <div key={group.key} className="mb-3.5">
          {avecLibelle && (
            <div className="px-2.5 pb-1.5 pt-1 font-mono text-[9.5px] font-[600] uppercase tracking-[0.1em] text-[#B0B2B9]">
              {label(group.key, "groups")}
            </div>
          )}

          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  {bloquees[item.href] ? (
                    // Un `span`, pas un `Link` désactivé : rien à cliquer, rien
                    // à tabuler. `aria-disabled` seul laisserait le lien
                    // navigable au clavier vers un écran qui n'a rien à dire.
                    // Grisée, SANS sa propre phrase. La maquette met UNE ligne
                    // sous tout le menu — répéter la condition sous chaque
                    // entrée transforme la colonne en pavé de texte, et on ne
                    // lit plus aucune des trois.
                    <span
                      title={bloquees[item.href]}
                      className="flex items-center gap-[11px] rounded-[5px] px-2.5 py-2 text-[13.5px] font-medium text-[#B7BAC4] cursor-default"
                    >
                      <NavIcon name={item.key} />
                      <span className="truncate">{navLabel(item.key)}</span>
                    </span>
                  ) : (
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-[11px] rounded-[5px] px-2.5 py-2 text-[13.5px] transition-colors",
                      active
                        ? "bg-[#FBEDE6] text-[#C24619] font-[600]"
                        : "text-[#55585F] font-medium hover:bg-[#F1F0EB] hover:text-[#1A1B1F]",
                    )}
                  >
                    <NavIcon name={item.key} />
                    <span className="truncate">{navLabel(item.key)}</span>
                  </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        );
      })}

      {/* UNE ligne, sous tout le menu — comme la maquette. Elle dit la
          condition la plus proche d'être remplie, pas les trois : le programme
          n'a qu'une chose à faire ensuite, et c'est celle-là qu'il faut
          nommer. Rendue seulement s'il reste quelque chose de grisé. */}
      {aideMenu && (
        <p className="px-2.5 pt-3 mt-1 text-[10.5px] leading-snug text-[#B7BAC4] border-t border-[#EFEDE7]">
          {aideMenu}
        </p>
      )}
    </nav>
  );
}
