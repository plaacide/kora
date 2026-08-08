import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * La Dealroom vue de l'extérieur — écrans 30 à 33.
 *
 * ⚠️ AUCUNE AUTHENTIFICATION ICI, ET C'EST LE POINT. L'arbitrage d'ADR-005 du
 * 6 août a tranché que la Dealroom s'ouvre SANS COMPTE : le lien EST l'accès.
 * Cette lecture est donc la seule du produit à ne pas appeler `requireV2User`,
 * et `dealroom_public` est la seule fonction accordée au rôle `anon`.
 *
 * C'est aussi pour cela qu'elle prend un JETON et non un identifiant : la page
 * s'ouvrant à qui a l'adresse, l'adresse est le secret. Un slug lisible se
 * devine, et révélerait au passage le nom des Dealrooms d'un programme.
 *
 * La fonction rend une ligne par entreprise, avec les champs de la Dealroom
 * répétés — on les regroupe ici. Une Dealroom sans aucune entreprise publiée
 * rend malgré tout UNE ligne, avec `entreprise` à null : elle existe, elle est
 * simplement vide.
 */

export interface FicheVitrine {
  nom: string;
  secteur: string | null;
  pays: string | null;
  stade: string | null;
  montant: number | null;
  devise: string | null;
}

export interface VitrineLue {
  titre: string;
  sousTitre: string | null;
  description: string | null;
  contact: string | null;
  logo: string | null;
  banniere: string | null;
  accent: string | null;
  partenaires: readonly string[];
  poweredBy: boolean;
  entreprises: readonly FicheVitrine[];
}

interface RangeeVitrine {
  titre: string | null;
  sous_titre: string | null;
  description: string | null;
  contact: string | null;
  logo: string | null;
  banniere: string | null;
  accent: string | null;
  partenaires: string[] | null;
  powered_by: boolean | null;
  entreprise: string | null;
  secteur: string | null;
  pays: string | null;
  stade: string | null;
  montant: number | string | null;
  devise: string | null;
}

/** `numeric` arrive en CHAÎNE de PostgREST — l'additionner concaténerait. */
function nombre(valeur: number | string | null): number | null {
  if (valeur === null) return null;
  const n = typeof valeur === "number" ? valeur : Number(valeur);
  return Number.isFinite(n) ? n : null;
}

export async function lireVitrine(token: string): Promise<VitrineLue | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("dealroom_public", {
    p_token: token,
  });

  if (error) {
    // ADR-001 : le visiteur ne verra jamais le message de Postgres. Mais sans
    // cette trace, un lien mort et une panne se ressemblent.
    console.error("[v2 vitrine] dealroom_public", error);
    return null;
  }

  const lignes = (data ?? []) as RangeeVitrine[];
  const tete = lignes[0];
  // Aucune ligne = lien révoqué, Dealroom non publiée, ou jeton inconnu. Les
  // trois se répondent de la même façon : cette adresse n'ouvre rien.
  if (!tete) return null;

  return {
    accent: tete.accent,
    banniere: tete.banniere,
    contact: tete.contact,
    description: tete.description,
    entreprises: lignes
      .filter((l) => l.entreprise !== null)
      .map((l) => ({
        devise: l.devise,
        montant: nombre(l.montant),
        nom: l.entreprise!,
        pays: l.pays,
        secteur: l.secteur,
        stade: l.stade,
      })),
    logo: tete.logo,
    partenaires: tete.partenaires ?? [],
    poweredBy: tete.powered_by ?? true,
    sousTitre: tete.sous_titre,
    titre: tete.titre ?? "Sélection d’entreprises",
  };
}
