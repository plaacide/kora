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
 * LE PÉRIMÈTRE EST MONDIAL. Il ne l'était pas : l'Afrique, puis onze pays rangés
 * sous « International ». Deux raisons de l'avoir élargi. Le pays
 * d'immatriculation d'abord — une entreprise africaine s'immatricule
 * couramment à Maurice, au Luxembourg ou au Delaware, et le formulaire
 * d'onboarding n'en proposait que cinq. Les investisseurs ensuite : « France ·
 * International » disait moins que « France · Europe ».
 *
 * « Autre pays » reste, et c'est désormais le seul habitant d'« International ».
 * Un champ fermé sans échappatoire se contourne en salissant le champ voisin.
 */

export const ZONES = [
  // L'UEMOA d'abord : huit pays, une monnaie, un droit des sociétés commun
  // (OHADA) et les mêmes pièces d'immatriculation. C'est le premier marché de
  // Sanza, et le fondateur qui le cherche ne doit pas défiler pour le trouver.
  "UEMOA",
  "CEMAC",
  "Afrique Centrale (hors CEMAC)",
  "Afrique de l’Ouest (hors UEMOA)",
  "Afrique de l’Est",
  "Afrique Australe",
  "Afrique du Nord",
  "Europe",
  "Amériques",
  "Moyen-Orient",
  "Asie",
  "Océanie",
  // Le fourre-tout assumé : il ne porte plus que « Autre pays ». Tant qu'il
  // contenait la France et les États-Unis, « International » ne regroupait rien.
  "International",
] as const;

export type Zone = (typeof ZONES)[number];

/** Pays d'exercice, rangés par zone. Le libellé fait foi : c'est lui qu'on stocke. */
export const PAYS: Array<[string, Zone]> = [
  // UEMOA
  ["Burkina Faso", "UEMOA"],
  ["Bénin", "UEMOA"],
  ["Côte d’Ivoire", "UEMOA"],
  ["Guinée-Bissau", "UEMOA"],
  ["Mali", "UEMOA"],
  ["Niger", "UEMOA"],
  ["Sénégal", "UEMOA"],
  ["Togo", "UEMOA"],

  // CEMAC
  ["Cameroun", "CEMAC"],
  ["Congo", "CEMAC"],
  ["Gabon", "CEMAC"],
  ["Guinée équatoriale", "CEMAC"],
  ["République centrafricaine", "CEMAC"],
  ["Tchad", "CEMAC"],

  // Afrique Centrale (hors CEMAC)
  ["République démocratique du Congo", "Afrique Centrale (hors CEMAC)"],

  // Afrique de l’Ouest (hors UEMOA)
  ["Cap-Vert", "Afrique de l’Ouest (hors UEMOA)"],
  ["Gambie", "Afrique de l’Ouest (hors UEMOA)"],
  ["Ghana", "Afrique de l’Ouest (hors UEMOA)"],
  ["Guinée", "Afrique de l’Ouest (hors UEMOA)"],
  ["Liberia", "Afrique de l’Ouest (hors UEMOA)"],
  ["Mauritanie", "Afrique de l’Ouest (hors UEMOA)"],
  ["Nigeria", "Afrique de l’Ouest (hors UEMOA)"],
  ["Sierra Leone", "Afrique de l’Ouest (hors UEMOA)"],

  // Afrique de l’Est
  ["Burundi", "Afrique de l’Est"],
  ["Djibouti", "Afrique de l’Est"],
  ["Kenya", "Afrique de l’Est"],
  ["Madagascar", "Afrique de l’Est"],
  ["Maurice", "Afrique de l’Est"],
  ["Ouganda", "Afrique de l’Est"],
  ["Rwanda", "Afrique de l’Est"],
  ["Somalie", "Afrique de l’Est"],
  ["Soudan", "Afrique de l’Est"],
  ["Tanzanie", "Afrique de l’Est"],
  ["Éthiopie", "Afrique de l’Est"],

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
  ["Libye", "Afrique du Nord"],
  ["Maroc", "Afrique du Nord"],
  ["Tunisie", "Afrique du Nord"],
  ["Égypte", "Afrique du Nord"],

  // Europe
  ["Albanie", "Europe"],
  ["Allemagne", "Europe"],
  ["Andorre", "Europe"],
  ["Autriche", "Europe"],
  ["Belgique", "Europe"],
  ["Biélorussie", "Europe"],
  ["Bosnie-Herzégovine", "Europe"],
  ["Bulgarie", "Europe"],
  ["Chypre", "Europe"],
  ["Croatie", "Europe"],
  ["Danemark", "Europe"],
  ["Espagne", "Europe"],
  ["Estonie", "Europe"],
  ["Finlande", "Europe"],
  ["France", "Europe"],
  ["Grèce", "Europe"],
  ["Hongrie", "Europe"],
  ["Irlande", "Europe"],
  ["Islande", "Europe"],
  ["Italie", "Europe"],
  ["Kosovo", "Europe"],
  ["Lettonie", "Europe"],
  ["Liechtenstein", "Europe"],
  ["Lituanie", "Europe"],
  ["Luxembourg", "Europe"],
  ["Macédoine du Nord", "Europe"],
  ["Malte", "Europe"],
  ["Moldavie", "Europe"],
  ["Monaco", "Europe"],
  ["Monténégro", "Europe"],
  ["Norvège", "Europe"],
  ["Pays-Bas", "Europe"],
  ["Pologne", "Europe"],
  ["Portugal", "Europe"],
  ["Roumanie", "Europe"],
  ["Royaume-Uni", "Europe"],
  ["Russie", "Europe"],
  ["République tchèque", "Europe"],
  ["Saint-Marin", "Europe"],
  ["Serbie", "Europe"],
  ["Slovaquie", "Europe"],
  ["Slovénie", "Europe"],
  ["Suisse", "Europe"],
  ["Suède", "Europe"],
  ["Ukraine", "Europe"],

  // Amériques
  ["Antigua-et-Barbuda", "Amériques"],
  ["Argentine", "Amériques"],
  ["Bahamas", "Amériques"],
  ["Barbade", "Amériques"],
  ["Belize", "Amériques"],
  ["Bolivie", "Amériques"],
  ["Brésil", "Amériques"],
  ["Canada", "Amériques"],
  ["Chili", "Amériques"],
  ["Colombie", "Amériques"],
  ["Costa Rica", "Amériques"],
  ["Cuba", "Amériques"],
  ["Dominique", "Amériques"],
  ["El Salvador", "Amériques"],
  ["Grenade", "Amériques"],
  ["Guatemala", "Amériques"],
  ["Guyana", "Amériques"],
  ["Haïti", "Amériques"],
  ["Honduras", "Amériques"],
  ["Jamaïque", "Amériques"],
  ["Mexique", "Amériques"],
  ["Nicaragua", "Amériques"],
  ["Panama", "Amériques"],
  ["Paraguay", "Amériques"],
  ["Pérou", "Amériques"],
  ["République dominicaine", "Amériques"],
  ["Saint-Kitts-et-Nevis", "Amériques"],
  ["Saint-Vincent-et-les-Grenadines", "Amériques"],
  ["Sainte-Lucie", "Amériques"],
  ["Suriname", "Amériques"],
  ["Trinité-et-Tobago", "Amériques"],
  ["Uruguay", "Amériques"],
  ["Venezuela", "Amériques"],
  ["Équateur", "Amériques"],
  ["États-Unis", "Amériques"],

  // Moyen-Orient
  ["Arabie saoudite", "Moyen-Orient"],
  ["Arménie", "Moyen-Orient"],
  ["Azerbaïdjan", "Moyen-Orient"],
  ["Bahreïn", "Moyen-Orient"],
  ["Géorgie", "Moyen-Orient"],
  ["Irak", "Moyen-Orient"],
  ["Iran", "Moyen-Orient"],
  ["Israël", "Moyen-Orient"],
  ["Jordanie", "Moyen-Orient"],
  ["Koweït", "Moyen-Orient"],
  ["Liban", "Moyen-Orient"],
  ["Oman", "Moyen-Orient"],
  ["Qatar", "Moyen-Orient"],
  ["Syrie", "Moyen-Orient"],
  ["Turquie", "Moyen-Orient"],
  ["Yémen", "Moyen-Orient"],
  ["Émirats arabes unis", "Moyen-Orient"],

  // Asie
  ["Afghanistan", "Asie"],
  ["Bangladesh", "Asie"],
  ["Bhoutan", "Asie"],
  ["Birmanie", "Asie"],
  ["Brunei", "Asie"],
  ["Cambodge", "Asie"],
  ["Chine", "Asie"],
  ["Corée du Nord", "Asie"],
  ["Corée du Sud", "Asie"],
  ["Inde", "Asie"],
  ["Indonésie", "Asie"],
  ["Japon", "Asie"],
  ["Kazakhstan", "Asie"],
  ["Kirghizistan", "Asie"],
  ["Laos", "Asie"],
  ["Malaisie", "Asie"],
  ["Maldives", "Asie"],
  ["Mongolie", "Asie"],
  ["Népal", "Asie"],
  ["Ouzbékistan", "Asie"],
  ["Pakistan", "Asie"],
  ["Philippines", "Asie"],
  ["Singapour", "Asie"],
  ["Sri Lanka", "Asie"],
  ["Tadjikistan", "Asie"],
  ["Taïwan", "Asie"],
  ["Thaïlande", "Asie"],
  ["Timor oriental", "Asie"],
  ["Turkménistan", "Asie"],
  ["Viêt Nam", "Asie"],

  // Océanie
  ["Australie", "Océanie"],
  ["Fidji", "Océanie"],
  ["Kiribati", "Océanie"],
  ["Micronésie", "Océanie"],
  ["Nauru", "Océanie"],
  ["Nouvelle-Zélande", "Océanie"],
  ["Palaos", "Océanie"],
  ["Papouasie-Nouvelle-Guinée", "Océanie"],
  ["Samoa", "Océanie"],
  ["Tonga", "Océanie"],
  ["Tuvalu", "Océanie"],
  ["Vanuatu", "Océanie"],
  ["Îles Marshall", "Océanie"],
  ["Îles Salomon", "Océanie"],

  // International
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

/**
 * La zone franc seule — UEMOA puis CEMAC, quatorze pays.
 *
 * POURQUOI UN SOUS-ENSEMBLE PLUTÔT QUE DE RÉDUIRE `PAYS`. La liste complète sert
 * aussi à l'écran investisseurs, où un fonds ghanéen, kényan ou londonien est un
 * cas courant sur un tour africain. La couper partout aurait rendu ces
 * relations impossibles à enregistrer — sur un écran que personne n'a demandé de
 * changer.
 *
 * Ici, c'est le pays d'IMMATRICULATION d'une entreprise cliente : le périmètre
 * commercial de Sanza, pas celui de ses interlocuteurs.
 */
export function paysZoneFranc(): Array<{ zone: Zone; pays: string[] }> {
  return paysParZone().filter((g) => g.zone === "UEMOA" || g.zone === "CEMAC");
}
