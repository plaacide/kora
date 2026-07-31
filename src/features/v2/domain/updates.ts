/**
 * Les mises à jour aux financeurs — écrans 46 à 50.
 *
 * Le cœur de cet écran n'est pas le formulaire, c'est la SUGGESTION : quels
 * chiffres a-t-on intérêt à donner à qui. Une banque veut savoir si elle sera
 * remboursée, une DFI si l'impact est réel, un VC si ça croît. Leur envoyer les
 * mêmes huit lignes, c'est ne répondre à aucun des trois.
 *
 * Le catalogue ci-dessous ne porte que des DÉFINITIONS — libellé, ce que le
 * chiffre mesure, famille. Les valeurs viennent du fondateur, jamais d'ici :
 * Sanza propose quoi dire, pas quoi déclarer.
 */

export type Instrument = "capital" | "dette" | "dfi";
export type Financeur = "vc" | "banque" | "dfi";

/**
 * `phrase` n'est pas un doublon de `label`.
 *
 * Mettre un libellé en minuscules au milieu d'une phrase donne « pour vc ou
 * fonds d'investissement » : DFI, VC et ESG sont des sigles, ils ne se
 * décapitalisent pas. On écrit donc les deux formes plutôt que d'espérer
 * qu'une transformation automatique s'en sorte.
 */
export const INSTRUMENTS: readonly {
  cle: Instrument;
  label: string;
  court: string;
  aide: string;
  phrase: string;
}[] = [
  {
    cle: "capital",
    label: "Capital",
    court: "Capital",
    aide: "Prise de participation",
    phrase: "capital",
  },
  {
    cle: "dette",
    label: "Dette",
    court: "Dette",
    aide: "Prêt ou ligne de crédit",
    phrase: "dette",
  },
  {
    cle: "dfi",
    label: "Financement DFI ou à impact",
    court: "DFI",
    aide: "Capital, dette ou mixte",
    phrase: "financement DFI ou à impact",
  },
] as const;

/** L'étiquette d'instrument du tableau — « Capital », « Dette », « DFI ». */
export function instrumentCourt(cle: string): string {
  return INSTRUMENTS.find((i) => i.cle === cle)?.court ?? cle;
}

export const FINANCEURS: readonly {
  cle: Financeur;
  label: string;
  court: string;
  aide: string;
  phrase: string;
}[] = [
  {
    cle: "vc",
    label: "VC ou fonds d’investissement",
    court: "VC et fonds equity",
    aide: "Croissance et sortie",
    phrase: "un VC ou un fonds d’investissement",
  },
  {
    cle: "banque",
    label: "Banque ou prêteur",
    court: "Banque",
    aide: "Capacité de remboursement",
    phrase: "une banque ou un prêteur",
  },
  {
    cle: "dfi",
    label: "DFI ou investisseur à impact",
    court: "DFI et impact",
    aide: "Impact, ESG et gouvernance",
    phrase: "une DFI ou un investisseur à impact",
  },
] as const;

/** Le libellé de tableau — une colonne n'a pas la place d'une phrase. */
export function financeurCourt(cle: string): string {
  return FINANCEURS.find((f) => f.cle === cle)?.court ?? cle;
}

export function libelleInstrument(cle: string): string {
  return INSTRUMENTS.find((i) => i.cle === cle)?.label ?? cle;
}

export function libelleFinanceur(cle: string): string {
  return FINANCEURS.find((f) => f.cle === cle)?.label ?? cle;
}

export type Famille =
  | "Croissance"
  | "Remboursement"
  | "Impact"
  | "ESG"
  | "Gouvernance";

export interface Definition {
  cle: string;
  libelle: string;
  /** Ce que le chiffre mesure exactement — la phrase qui évite le malentendu. */
  definition: string;
  famille: Famille;
  /** Unité suggérée, affichée en aide de saisie. */
  unite: string;
}

/**
 * Ce que Sanza sait proposer.
 *
 * Volontairement court. Un catalogue de soixante lignes obligerait le fondateur
 * à trier, ce qui est précisément le travail qu'on lui épargne. Ce qui manque
 * se crée en indicateur personnalisé — et c'est le bon endroit, parce qu'un
 * indicateur propre à une entreprise ne se devine pas.
 */
export const CATALOGUE: readonly Definition[] = [
  // Croissance — ce qu'un fonds equity regarde d'abord.
  {
    cle: "revenu",
    libelle: "Revenu",
    definition: "Chiffre d’affaires reconnu sur la période",
    famille: "Croissance",
    unite: "montant",
  },
  {
    cle: "croissance",
    libelle: "Croissance du revenu",
    definition: "Variation du revenu par rapport à la période comparable",
    famille: "Croissance",
    unite: "%",
  },
  {
    cle: "marge_brute",
    libelle: "Marge brute",
    definition: "Revenu − coût des ventes, en part du revenu",
    famille: "Croissance",
    unite: "%",
  },
  {
    cle: "clients",
    libelle: "Clients actifs",
    definition: "Clients ayant transigé au moins une fois sur la période",
    famille: "Croissance",
    unite: "nombre",
  },
  {
    cle: "burn",
    libelle: "Consommation de trésorerie",
    definition: "Trésorerie nette consommée par mois sur la période",
    famille: "Croissance",
    unite: "montant / mois",
  },
  {
    cle: "runway",
    libelle: "Autonomie financière",
    definition: "Mois d’activité couverts par la trésorerie au rythme actuel",
    famille: "Croissance",
    unite: "mois",
  },

  // Remboursement — ce qu'un prêteur regarde d'abord.
  {
    cle: "flux_operationnel",
    libelle: "Flux de trésorerie opérationnel",
    definition: "Encaissements − décaissements d’exploitation",
    famille: "Remboursement",
    unite: "montant",
  },
  {
    cle: "dscr",
    libelle: "DSCR — couverture du service de la dette",
    definition: "Flux opérationnel / service de la dette",
    famille: "Remboursement",
    unite: "x",
  },
  {
    cle: "tresorerie",
    libelle: "Trésorerie disponible",
    definition: "Soldes bancaires consolidés à la date de clôture",
    famille: "Remboursement",
    unite: "montant",
  },
  {
    cle: "covenants",
    libelle: "Covenants",
    definition: "Respect des ratios contractuels du prêt",
    famille: "Remboursement",
    unite: "respectés / non respectés",
  },
  {
    cle: "dette_totale",
    libelle: "Dette totale",
    definition: "Encours consolidé à la date de clôture",
    famille: "Remboursement",
    unite: "montant",
  },
  {
    cle: "dso",
    libelle: "Délai moyen de paiement clients",
    definition: "DSO — créances / chiffre d’affaires × jours",
    famille: "Remboursement",
    unite: "jours",
  },

  // Impact — ce qu'une DFI regarde d'abord.
  {
    cle: "emplois",
    libelle: "Emplois directs",
    definition: "CDI + CDD de plus de 6 mois, au dernier jour de la période",
    famille: "Impact",
    unite: "nombre",
  },
  {
    cle: "beneficiaires",
    libelle: "Bénéficiaires desservis",
    definition: "Personnes ou ménages nouvellement servis sur la période",
    famille: "Impact",
    unite: "nombre",
  },
  {
    cle: "emissions",
    libelle: "Émissions évitées",
    definition: "Méthodologie déclarée par l’entreprise",
    famille: "Impact",
    unite: "tCO₂e",
  },

  // ESG et gouvernance — exigés par les DFI, utiles à tous.
  {
    cle: "incidents_es",
    libelle: "Incidents E&S majeurs",
    definition: "Incidents graves et mesures correctives engagées",
    famille: "ESG",
    unite: "nombre",
  },
  {
    cle: "parite",
    libelle: "Part de femmes dans l’effectif",
    definition: "Femmes / effectif total au dernier jour de la période",
    famille: "ESG",
    unite: "%",
  },
  {
    cle: "conseil",
    libelle: "Réunions du conseil tenues",
    definition: "Séances tenues sur la période, procès-verbaux signés",
    famille: "Gouvernance",
    unite: "nombre",
  },
] as const;

export function definition(cle: string): Definition | null {
  return CATALOGUE.find((d) => d.cle === cle) ?? null;
}

/**
 * Les familles pertinentes pour une audience.
 *
 * Deux axes, donc neuf combinaisons — mais pas neuf réponses différentes :
 * c'est le FINANCEUR qui décide de ce qu'il regarde, l'instrument précise
 * seulement s'il faut prouver un remboursement.
 *
 *   · un VC veut la croissance ;
 *   · une banque veut la capacité de remboursement ;
 *   · une DFI veut le remboursement ET l'impact, l'ESG et la gouvernance.
 *
 * Et quel que soit le financeur, une opération en dette doit montrer qu'elle se
 * rembourse. Un VC qui prête n'est plus dans la même conversation.
 */
export function famillesRecommandees(
  instrument: Instrument,
  financeur: Financeur,
): readonly Famille[] {
  const familles = new Set<Famille>();

  if (financeur === "vc") familles.add("Croissance");
  if (financeur === "banque") familles.add("Remboursement");
  if (financeur === "dfi") {
    familles.add("Remboursement");
    familles.add("Impact");
    familles.add("ESG");
    familles.add("Gouvernance");
  }

  // L'instrument précise, il ne remplace pas.
  if (instrument === "dette") familles.add("Remboursement");
  if (instrument === "dfi") {
    familles.add("Impact");
    familles.add("ESG");
  }
  if (instrument === "capital") familles.add("Croissance");

  return [...familles];
}

/** Les indicateurs suggérés, dans l'ordre du catalogue. */
export function recommandes(
  instrument: Instrument,
  financeur: Financeur,
): readonly Definition[] {
  const familles = famillesRecommandees(instrument, financeur);
  return CATALOGUE.filter((d) => familles.includes(d.famille));
}

/** Les autres, ceux qu'on peut ajouter en connaissance de cause. */
export function disponibles(
  instrument: Instrument,
  financeur: Financeur,
): readonly Definition[] {
  const familles = famillesRecommandees(instrument, financeur);
  return CATALOGUE.filter((d) => !familles.includes(d.famille));
}

/**
 * La phrase qui explique la suggestion — écran 47.
 *
 * Elle existe parce qu'une liste préremplie sans justification se subit. Dire
 * pourquoi ces indicateurs-là, c'est permettre au fondateur d'être en
 * désaccord, ce qui est le but : il connaît son financeur mieux que nous.
 */
export function pourquoiCesIndicateurs(
  instrument: Instrument,
  financeur: Financeur,
): string {
  const familles = famillesRecommandees(instrument, financeur);
  const dit: Record<Famille, string> = {
    Croissance: "la croissance et la trajectoire",
    Remboursement: "la capacité de remboursement",
    Impact: "l’impact mesuré",
    ESG: "l’ESG",
    Gouvernance: "la gouvernance",
  };

  const liste = familles.map((f) => dit[f]);
  const enumere =
    liste.length > 1
      ? `${liste.slice(0, -1).join(", ")} et ${liste[liste.length - 1]}`
      : (liste[0] ?? "les fondamentaux");

  const qui = FINANCEURS.find((f) => f.cle === financeur)?.phrase ?? "ce financeur";
  const quoi = INSTRUMENTS.find((i) => i.cle === instrument)?.phrase ?? "capital";

  return `Pour ${qui} sur une opération en ${quoi}, la suggestion porte sur ${enumere}. Vous pouvez la modifier avant publication.`;
}

/** Un indicateur retenu dans une mise à jour. */
export interface IndicateurRetenu {
  cle: string;
  libelle: string;
  definition: string;
  periode: string;
  valeur: string;
  /**
   * L'unité du chiffre : « XOF », « % », « x », « mois »…
   *
   * Elle est saisie AVEC la valeur et non déduite du catalogue : « 123 000 »
   * ne veut rien dire sans savoir en quoi, et l'entreprise qui lève en euros
   * ne se laissera pas afficher des francs CFA parce que le catalogue dit
   * « montant ».
   */
  unite?: string;
  /** « +9 % vs T1 », « stable » — la comparaison, facultative. */
  precision?: string;
  verification: "declare" | "verifie";
}

/**
 * Les unités proposées, par famille d'indicateur.
 *
 * Une liste fermée serait fausse — une entreprise mesure ce qu'elle veut — donc
 * c'est une SUGGESTION : le champ reste libre. Les devises viennent en tête
 * pour les montants, parce que c'est le cas qui revient.
 */
export const DEVISES = ["XOF", "EUR", "USD", "GHS", "NGN", "MAD", "TND"] as const;

export function unitesSuggerees(d: Definition | null): readonly string[] {
  if (!d) return [...DEVISES];
  if (d.unite === "montant" || d.unite.startsWith("montant"))
    return [...DEVISES];
  return [d.unite];
}

/**
 * La valeur telle qu'elle se lit — « 123 000 XOF », « 10 % », « 1,6x ».
 *
 * Le chiffre est saisi à la main : on le formate s'il EST un nombre, et on le
 * laisse tel quel sinon. « Respectés » n'a pas de séparateur de milliers, et
 * forcer un format sur ce qu'on ne comprend pas revient à effacer ce que le
 * fondateur a voulu écrire.
 */
export function valeurLisible(indicateur: {
  valeur: string;
  unite?: string;
}): string {
  const brut = indicateur.valeur.trim();
  if (!brut) return "—";

  const unite = indicateur.unite?.trim();
  const nombre = Number(brut.replace(/\s/g, "").replace(",", "."));

  if (!Number.isFinite(nombre) || brut === "") {
    return unite ? `${brut} ${unite}` : brut;
  }

  const chiffres = nombre.toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  });

  if (!unite) return chiffres;
  // « 1,6x » et « 10 % » ne se ponctuent pas pareil : le signe pourcent prend
  // une espace en français, le multiplicateur se colle au nombre.
  if (unite === "x") return `${chiffres}${unite}`;
  return `${chiffres} ${unite}`;
}

export const VERIFICATIONS = [
  { cle: "declare", label: "Déclaré" },
  { cle: "verifie", label: "Vérifié en interne" },
] as const;

export function libelleVerification(cle: string): string {
  return VERIFICATIONS.find((v) => v.cle === cle)?.label ?? "Déclaré";
}

/**
 * La période suggérée : le trimestre civil échu.
 *
 * `maintenant` est un paramètre et non `new Date()` pris à l'intérieur — sans
 * quoi la fonction serait intestable, et une suggestion de période qu'on ne
 * peut pas vérifier est une suggestion qu'on n'ose pas corriger.
 */
export function trimestreEchu(maintenant: Date): string {
  const trimestre = Math.floor(maintenant.getMonth() / 3);
  return trimestre === 0
    ? `T4 ${maintenant.getFullYear() - 1}`
    : `T${trimestre} ${maintenant.getFullYear()}`;
}
