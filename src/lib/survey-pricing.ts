/**
 * Devise et échelle de prix de l'écran 3, selon le pays de la startup.
 *
 * La §4 du handoff exigeait que la devise suive le pays plutôt que d'être
 * figée en FCFA, et demandait la table de correspondance en configuration.
 * La voici. Deux décisions produit y sont inscrites, prises explicitement :
 *
 *  1. LA SOURCE est `startups.country`, saisi par le fondateur à l'onboarding.
 *     `organizations.default_currency` existe mais vaut « XOF » pour tout le
 *     monde — personne ne l'a jamais renseignée : s'y fier aurait affiché des
 *     francs CFA à un Nigerian, et sa réponse aurait été inexploitable.
 *
 *  2. L'ÉCHELLE NGN est l'équivalent économique du barème FCFA au taux
 *     courant (1 XOF ≈ 2,5 ₦), et non des paliers ronds. On compare ainsi des
 *     prix de même poids réel d'un pays à l'autre — c'est ce qu'on cherche à
 *     mesurer. Le taux bouge ; ces montants sont donc à revoir, d'où leur
 *     présence ici, en un seul endroit, plutôt que dispersés dans l'écran.
 *
 * XOF et XAF sont à parité fixe : un seul barème les couvre.
 *
 * ⚠️ Module NEUTRE (cf. AGENTS.md) : importé côté client comme serveur.
 */

export interface Palier {
  /** Montant, dans la devise du barème. */
  montant: number;
  /** Dernier palier : affiché avec un « + », il n'a pas de borne haute. */
  ouvert?: boolean;
}

export interface BaremePrix {
  devise: string;
  paliers: readonly Palier[];
}

const FCFA: BaremePrix = {
  devise: "XOF",
  paliers: [
    { montant: 5_000 },
    { montant: 15_000 },
    { montant: 30_000 },
    { montant: 50_000 },
    { montant: 75_000, ouvert: true },
  ],
};

const FRANC_CEMAC: BaremePrix = { ...FCFA, devise: "XAF" };

const NAIRA: BaremePrix = {
  devise: "NGN",
  paliers: [
    { montant: 12_000 },
    { montant: 37_000 },
    { montant: 75_000 },
    { montant: 125_000 },
    { montant: 190_000, ouvert: true },
  ],
};

/**
 * Les valeurs sont celles RÉELLEMENT stockées dans `startups.country` — la
 * liste de l'onboarding, en français, accents compris. Les traduire ici
 * romprait la correspondance : c'est la valeur en base qui fait foi, pas son
 * libellé affiché.
 */
const PAR_PAYS: Record<string, BaremePrix> = {
  "Côte d'Ivoire": FCFA,
  Sénégal: FCFA,
  Bénin: FCFA,
  Mali: FCFA,
  Togo: FCFA,
  "Burkina Faso": FCFA,
  Cameroun: FRANC_CEMAC,
  Nigeria: NAIRA,
};

/** Pays inconnu, « Autre » ou non renseigné : le marché principal, l'UEMOA. */
export function baremePour(pays: string | null | undefined): BaremePrix {
  return (pays && PAR_PAYS[pays]) || FCFA;
}

/**
 * Libellé d'un palier. `Intl` gère le placement du symbole et les séparateurs,
 * qui diffèrent d'une langue à l'autre — « 5 000 F CFA » contre « XOF 5,000 ».
 */
export function libellePalier(
  p: Palier,
  devise: string,
  locale: string,
): string {
  const n = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: devise,
    // Symbole court : « ₦ 12 000 » plutôt que « 12 000 NGN ». Un code ISO au
    // milieu d'un choix de prix se lit comme du jargon.
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(p.montant);
  return p.ouvert ? `${n} +` : n;
}

/**
 * Valeur enregistrée. On stocke le MONTANT ET LA DEVISE — « 15000 XOF » —
 * jamais l'indice du palier : les barèmes bougeront, et un indice rendrait
 * toutes les réponses passées illisibles.
 */
export function valeurPalier(p: Palier, devise: string): string {
  return `${p.montant} ${devise}`;
}
