/**
 * Les pays et leurs zones — pour les listes déroulantes du produit.
 *
 * Saisir un pays à la main produit « Cote d'ivoire », « RCI », « Côte
 * d'Ivoire » et « Ivory Coast » dans la même base : quatre valeurs pour un
 * pays, aucun regroupement possible, et un filtre par zone impossible à
 * écrire. Une liste ferme le sujet.
 *
 * La ZONE n'est pas saisie : elle se déduit du pays. Demander les deux
 * laisserait un jour « Ghana · Afrique de l'Est » dans la base, et personne
 * pour dire lequel des deux a raison.
 *
 * Le périmètre couvre l'Afrique, plus « International » pour un investisseur
 * hors continent — un fonds londonien ou parisien reste un cas courant sur un
 * tour africain, et l'omettre obligerait à laisser le champ vide.
 */

export const ZONES = [
  "Afrique de l’Ouest",
  "Afrique Centrale",
  "Afrique de l’Est",
  "Afrique Australe",
  "Afrique du Nord",
  "International",
] as const;

export type Zone = (typeof ZONES)[number];

/** Pays d'exercice, rangés par zone. Le libellé fait foi : c'est lui qu'on stocke. */
export const PAYS: Array<[string, Zone]> = [
  // Afrique de l'Ouest
  ["Bénin", "Afrique de l’Ouest"],
  ["Burkina Faso", "Afrique de l’Ouest"],
  ["Cap-Vert", "Afrique de l’Ouest"],
  ["Côte d’Ivoire", "Afrique de l’Ouest"],
  ["Gambie", "Afrique de l’Ouest"],
  ["Ghana", "Afrique de l’Ouest"],
  ["Guinée", "Afrique de l’Ouest"],
  ["Guinée-Bissau", "Afrique de l’Ouest"],
  ["Liberia", "Afrique de l’Ouest"],
  ["Mali", "Afrique de l’Ouest"],
  ["Mauritanie", "Afrique de l’Ouest"],
  ["Niger", "Afrique de l’Ouest"],
  ["Nigeria", "Afrique de l’Ouest"],
  ["Sénégal", "Afrique de l’Ouest"],
  ["Sierra Leone", "Afrique de l’Ouest"],
  ["Togo", "Afrique de l’Ouest"],

  // Afrique Centrale
  ["Cameroun", "Afrique Centrale"],
  ["Congo", "Afrique Centrale"],
  ["Gabon", "Afrique Centrale"],
  ["Guinée équatoriale", "Afrique Centrale"],
  ["République centrafricaine", "Afrique Centrale"],
  ["République démocratique du Congo", "Afrique Centrale"],
  ["Tchad", "Afrique Centrale"],

  // Afrique de l'Est
  ["Burundi", "Afrique de l’Est"],
  ["Djibouti", "Afrique de l’Est"],
  ["Éthiopie", "Afrique de l’Est"],
  ["Kenya", "Afrique de l’Est"],
  ["Madagascar", "Afrique de l’Est"],
  ["Maurice", "Afrique de l’Est"],
  ["Ouganda", "Afrique de l’Est"],
  ["Rwanda", "Afrique de l’Est"],
  ["Somalie", "Afrique de l’Est"],
  ["Soudan", "Afrique de l’Est"],
  ["Tanzanie", "Afrique de l’Est"],

  // Afrique Australe
  ["Afrique du Sud", "Afrique Australe"],
  ["Angola", "Afrique Australe"],
  ["Botswana", "Afrique Australe"],
  ["Mozambique", "Afrique Australe"],
  ["Namibie", "Afrique Australe"],
  ["Zambie", "Afrique Australe"],
  ["Zimbabwe", "Afrique Australe"],

  // Afrique du Nord
  ["Algérie", "Afrique du Nord"],
  ["Égypte", "Afrique du Nord"],
  ["Libye", "Afrique du Nord"],
  ["Maroc", "Afrique du Nord"],
  ["Tunisie", "Afrique du Nord"],

  // Hors continent
  ["France", "International"],
  ["Royaume-Uni", "International"],
  ["Allemagne", "International"],
  ["Pays-Bas", "International"],
  ["Suisse", "International"],
  ["États-Unis", "International"],
  ["Canada", "International"],
  ["Émirats arabes unis", "International"],
  ["Inde", "International"],
  ["Chine", "International"],
  ["Autre pays", "International"],
];

const ZONE_PAR_PAYS = new Map<string, Zone>(PAYS);

/** La zone d'un pays, ou `null` s'il n'est pas de la liste. */
export function zoneDuPays(pays: string | null): Zone | null {
  if (!pays) return null;
  return ZONE_PAR_PAYS.get(pays) ?? null;
}

/**
 * « Ghana · Afrique de l'Ouest » — la forme de la maquette 40.
 *
 * Un pays hors liste s'affiche seul plutôt que d'être écarté : une valeur
 * saisie avant que la liste existe reste lisible.
 */
export function paysAvecZone(pays: string | null): string {
  if (!pays) return "—";
  const zone = zoneDuPays(pays);
  return zone ? `${pays} · ${zone}` : pays;
}

/** Les pays groupés par zone, dans l'ordre des zones — pour les `optgroup`. */
export function paysParZone(): Array<{ zone: Zone; pays: string[] }> {
  return ZONES.map((zone) => ({
    zone,
    pays: PAYS.filter(([, z]) => z === zone).map(([nom]) => nom),
  })).filter((groupe) => groupe.pays.length > 0);
}
