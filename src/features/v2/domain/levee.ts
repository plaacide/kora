/**
 * Les paramètres d'une levée, et la façon de les dire.
 *
 * POURQUOI CE FICHIER EXISTE. Les libellés — « Série A », « Prise de
 * participation » — vivaient dans le formulaire de configuration, et la vue de
 * levée les réécrivait EN DUR de son côté. Deux vérités pour une même donnée :
 * l'écran affichait « Série A · Prise de participation · 25 – 150 M XOF » quelle
 * que soit la levée, y compris une levée vide. Un seul endroit les nomme
 * désormais, et il est testable.
 */

export const STADES: ReadonlyArray<readonly [string, string]> = [
  ["pre_seed", "Pré-amorçage"],
  ["seed", "Amorçage"],
  ["serie_a", "Série A"],
  ["serie_b_plus", "Série B et plus"],
];

export const INSTRUMENTS_LEVEE: ReadonlyArray<readonly [string, string]> = [
  ["equity", "Prise de participation"],
  ["convertible", "Obligation convertible"],
  ["safe", "SAFE"],
  ["dette", "Dette"],
];

export const DEVISES: ReadonlyArray<readonly [string, string]> = [
  ["XOF", "XOF — Franc CFA"],
  ["EUR", "EUR — Euro"],
  ["USD", "USD — Dollar US"],
  ["GHS", "GHS — Cedi"],
  ["NGN", "NGN — Naira"],
];

export const LEADS: ReadonlyArray<readonly [string, string]> = [
  ["recherche", "Recherché"],
  ["trouve", "Trouvé"],
  ["sans_lead", "Ce tour s’en passe"],
];

function dans(
  liste: ReadonlyArray<readonly [string, string]>,
  cle: string | null,
): string | null {
  if (!cle) return null;
  // La clé inconnue est rendue TELLE QUELLE plutôt que remplacée par un tiret :
  // une valeur venue d'une version antérieure doit rester lisible, même mal
  // habillée, plutôt que de disparaître.
  return liste.find(([valeur]) => valeur === cle)?.[1] ?? cle;
}

export const libelleStade = (cle: string | null) => dans(STADES, cle);
export const libelleInstrumentLevee = (cle: string | null) =>
  dans(INSTRUMENTS_LEVEE, cle);
export const libelleLead = (cle: string | null) => dans(LEADS, cle);

const compact = new Intl.NumberFormat("fr-FR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/**
 * La fourchette de ticket, dite comme on la dit à l'oral.
 *
 * « 25 – 150 M XOF » plutôt que « 25 000 000 – 150 000 000 XOF » : sur une
 * ligne de synthèse, les zéros se comptent au lieu de se lire. La devise n'est
 * écrite qu'une fois, à la fin — la répéter des deux côtés alourdit sans rien
 * préciser.
 *
 * `null` quand rien n'est renseigné : l'écran saura dire « non renseigné » à sa
 * façon, plutôt que d'afficher un tiret décidé ici.
 */
export function fourchetteTicket(
  min: number | null,
  max: number | null,
  devise: string,
): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) {
    return `${compact.format(min)} – ${compact.format(max)} ${devise}`;
  }
  if (min != null) return `à partir de ${compact.format(min)} ${devise}`;
  return `jusqu’à ${compact.format(max as number)} ${devise}`;
}

export interface UsageDesFonds {
  poste: string;
  part: number;
}

/**
 * La répartition de l'usage des fonds — « Réseau 60 % · Équipe 25 % ».
 *
 * Les postes sont rendus DANS L'ORDRE DONNÉ, sans tri : le fondateur les a
 * saisis dans l'ordre de ses priorités, et les réordonner par montant
 * changerait ce qu'il a voulu dire.
 */
export function repartition(usages: readonly UsageDesFonds[]): string | null {
  const retenus = usages.filter((u) => u.poste.trim() && u.part > 0);
  if (retenus.length === 0) return null;

  return retenus.map((u) => `${u.poste} ${u.part} %`).join(" · ");
}

/**
 * La somme des parts vaut-elle bien cent ?
 *
 * Rend l'écart, ou `null` quand tout tombe juste. On ne REFUSE pas une
 * répartition incomplète — un fondateur peut n'avoir affecté que 80 % au
 * moment où il remplit — mais l'écran doit pouvoir le signaler.
 */
export function ecartDeRepartition(usages: readonly UsageDesFonds[]): number | null {
  const retenus = usages.filter((u) => u.poste.trim());
  if (retenus.length === 0) return null;

  const somme = retenus.reduce((total, u) => total + u.part, 0);
  return somme === 100 ? null : somme - 100;
}

/**
 * Ce qu'une ligne de journal raconte, en français.
 *
 * LE JOURNAL PORTE DES CODES — `commitment.recorded`, `raise_investor.saved` —
 * et l'écran affichait des phrases inventées : « Engagement confirmé enregistré
 * — Sahel Growth Fund, 120 M XOF » sur toutes les levées, y compris celles qui
 * n'avaient jamais rien enregistré. On traduit ce qui s'est réellement passé.
 *
 * Une action inconnue rend son code plutôt qu'une phrase vague : le jour où une
 * action est ajoutée sans être traduite, l'écran le montre au lieu de la taire.
 */
const ACTIONS_JOURNAL: Record<string, string> = {
  "raise.opened": "Levée ouverte",
  "raise.updated": "Levée modifiée",
  "raise.closed": "Levée clôturée",
  "raise_investor.saved": "Investisseur enregistré",
  "raise_investor.deleted": "Investisseur retiré",
  "commitment.recorded": "Engagement enregistré",
  "commitment.requalified": "Engagement requalifié",
  "interaction.logged": "Interaction consignée",
  "update.published": "Mise à jour publiée",
};

export function libelleActionJournal(action: string): string {
  return ACTIONS_JOURNAL[action] ?? action;
}

/**
 * Une échéance dite comme on la dit — « demain », « en retard · 26 juil. ».
 *
 * Les trois jours qui viennent portent un mot plutôt qu'une date : « demain »
 * se comprend sans compter, « 2 août » demande de savoir quel jour on est.
 */
export function libelleEcheance(
  iso: string | null,
  maintenant: Date = new Date(),
): { texte: string; enRetard: boolean } {
  if (!iso) return { texte: "sans échéance", enRetard: false };

  const jour = new Date(iso);
  const zero = (d: Date) => {
    const c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return c.getTime();
  };

  const ecart = Math.round((zero(jour) - zero(maintenant)) / 86_400_000);

  if (ecart < 0) {
    const date = jour.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    return { texte: `en retard · ${date}`, enRetard: true };
  }
  if (ecart === 0) return { texte: "aujourd’hui", enRetard: false };
  if (ecart === 1) return { texte: "demain", enRetard: false };

  return {
    texte: jour.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    enRetard: false,
  };
}
