import { z } from "zod";

import type { CodeErreur } from "./erreurs";
import { DEVISES, INSTRUMENTS_LEVEE, LEADS, STADES } from "./levee";

/**
 * Les règles d'une levée, vérifiées avant d'écrire.
 *
 * POURQUOI CE FICHIER EXISTE. `saveV2Raise` ne vérifiait RIEN : elle passait
 * ses dix-sept paramètres à `save_raise` tels quels. Un montant cible négatif,
 * une fourchette de ticket inversée — minimum au-dessus du maximum —, une part
 * de capital à 250 %, une devise inventée : tout était accepté et rangé en
 * base. L'écran de levée affichait ensuite « 25 M – 5 M XOF » sans que rien
 * n'ait signalé quoi que ce soit.
 *
 * Les règles sont celles du §27 du brief de fiabilisation. Elles vivent ici,
 * pures, plutôt que dans l'action : c'est la seule façon de les tester sans
 * base, et l'écran peut appeler les mêmes avant d'envoyer.
 *
 * CE QU'ELLES NE FONT PAS. Elles n'exigent pas qu'une levée soit complète. Un
 * fondateur ouvre une levée avec un nom et remplit le reste sur trois semaines ;
 * refuser un enregistrement partiel lui ferait perdre ce qu'il vient de saisir.
 * On refuse ce qui est FAUX, pas ce qui est inachevé.
 */

/** Le champ à mettre en évidence — jamais du texte libre. */
export type ChampLevee =
  | "nom"
  | "montantCible"
  | "montantEngage"
  | "devise"
  | "stade"
  | "instrument"
  | "lead"
  | "valorisation"
  | "ticketMin"
  | "ticketMax"
  | "partCapital"
  | "echeance"
  | "usagesFonds";

export interface ProblemeLevee {
  champ: ChampLevee;
  code: CodeErreur;
}

const cles = (liste: ReadonlyArray<readonly [string, string]>) =>
  liste.map(([cle]) => cle);

/**
 * Un montant : positif, fini, et pas absurde.
 *
 * Le plafond n'est pas une coquetterie. `numeric` en base accepte des nombres
 * que `Intl.NumberFormat` rend en notation scientifique, et l'écran affichait
 * alors « 1E+21 XOF ». Mille milliards suffisent à toute levée que Sanza verra.
 */
const PLAFOND = 1_000_000_000_000;

const montant = z
  .number()
  .finite()
  .nonnegative()
  .max(PLAFOND)
  .nullable()
  .optional();

export const schemaLevee = z.object({
  nom: z.string().trim().min(2).max(120).nullable().optional(),
  montantCible: montant,
  montantEngage: montant,
  devise: z.enum(cles(DEVISES) as [string, ...string[]]).nullable().optional(),
  stade: z.enum(cles(STADES) as [string, ...string[]]).nullable().optional(),
  instrument: z
    .enum(cles(INSTRUMENTS_LEVEE) as [string, ...string[]])
    .nullable()
    .optional(),
  lead: z.enum(cles(LEADS) as [string, ...string[]]).nullable().optional(),
  valorisation: montant,
  ticketMin: montant,
  ticketMax: montant,
  partCapital: z.number().finite().min(0).max(100).nullable().optional(),
  echeance: z.string().nullable().optional(),
  usagesFonds: z
    .array(z.object({ poste: z.string(), part: z.number().finite() }))
    .nullable()
    .optional(),
});

export type SaisieLevee = z.input<typeof schemaLevee>;

/** Le champ de chaque règle simple, pour n'écrire la correspondance qu'une fois. */
const CHAMPS: Record<string, { champ: ChampLevee; code: CodeErreur }> = {
  nom: { champ: "nom", code: "levee.nom_requis" },
  montantCible: { champ: "montantCible", code: "levee.montant_invalide" },
  montantEngage: { champ: "montantEngage", code: "levee.montant_invalide" },
  valorisation: { champ: "valorisation", code: "levee.montant_invalide" },
  ticketMin: { champ: "ticketMin", code: "levee.montant_invalide" },
  ticketMax: { champ: "ticketMax", code: "levee.montant_invalide" },
  devise: { champ: "devise", code: "levee.devise_inconnue" },
  stade: { champ: "stade", code: "levee.stade_inconnu" },
  instrument: { champ: "instrument", code: "levee.instrument_inconnu" },
  lead: { champ: "lead", code: "levee.lead_inconnu" },
  partCapital: { champ: "partCapital", code: "levee.part_capital_invalide" },
};

/**
 * Ce qui cloche, dans l'ordre du formulaire.
 *
 * Rend TOUS les problèmes et non le premier : corriger un champ pour découvrir
 * le suivant, trois fois de suite, est la façon la plus sûre de faire
 * abandonner quelqu'un.
 */
export function validerLevee(saisie: SaisieLevee): ProblemeLevee[] {
  const problemes: ProblemeLevee[] = [];

  const analyse = schemaLevee.safeParse(saisie);
  if (!analyse.success) {
    for (const souci of analyse.error.issues) {
      const connu = CHAMPS[String(souci.path[0])];
      if (connu && !problemes.some((p) => p.champ === connu.champ)) {
        problemes.push(connu);
      }
    }
  }

  // Les règles croisées, que le schéma ne peut pas voir champ par champ.
  const { ticketMin, ticketMax, echeance, usagesFonds } = saisie;

  if (
    typeof ticketMin === "number" &&
    typeof ticketMax === "number" &&
    ticketMin > ticketMax
  ) {
    problemes.push({ champ: "ticketMin", code: "levee.ticket_incoherent" });
  }

  // Une date illisible passait jusqu'en base, où elle devenait `null` sans un
  // mot : le fondateur croyait avoir posé une échéance.
  if (echeance && Number.isNaN(new Date(echeance).getTime())) {
    problemes.push({ champ: "echeance", code: "levee.echeance_invalide" });
  }

  if (usagesFonds && usagesFonds.length > 0) {
    const retenus = usagesFonds.filter((u) => u.poste.trim());
    const somme = retenus.reduce((total, u) => total + u.part, 0);

    if (retenus.some((u) => u.part < 0)) {
      problemes.push({ champ: "usagesFonds", code: "levee.usage_negatif" });
    } else if (retenus.length > 0 && somme > 100) {
      // On refuse le dépassement, PAS le total inférieur à cent : un fondateur
      // qui n'a affecté que 80 % de son tour a le droit de l'enregistrer.
      problemes.push({ champ: "usagesFonds", code: "levee.usage_depasse" });
    }
  }

  return problemes;
}
