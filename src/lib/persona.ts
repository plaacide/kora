/**
 * À qui parle-t-on ?
 *
 * Module NEUTRE (ni "use client" ni "use server") : il exporte des constantes
 * et des fonctions pures, il doit rester importable des deux côtés — voir
 * AGENTS.md.
 *
 * Sanza sert trois métiers qui n'ont ni le même travail ni le même
 * vocabulaire :
 *
 *   · fondateur  — il lève. Il a UNE opération, la sienne. Il veut savoir ce
 *                  qu'il lui manque et qui regarde son dossier.
 *   · investisseur — il consulte le dossier d'un autre. Il ne possède rien.
 *   · fonds      — il suit un portefeuille d'opérations. C'est le seul pour
 *                  qui « pipeline » et « deal » veulent dire quelque chose.
 *   · programme  — incubateur, accélérateur, structure d'accompagnement. Il
 *                  suit une COHORTE de startups sans posséder leurs dossiers :
 *                  il voit où chacune en est, jamais leurs documents.
 *
 * Le rôle d'adhésion ne suffit pas à les distinguer : un fondateur et un
 * gérant de fonds sont tous deux `owner` de leur organisation. Le type de
 * compte tranche.
 */

export type Persona = "founder" | "investor" | "fund" | "sae";

/**
 * `role` vient de l'adhésion à l'organisation du deal courant, `accountType`
 * du profil. Un invité est toujours traité en investisseur : il consulte un
 * dossier qui n'est pas le sien, quel que soit son type de compte.
 */
export function personaFor(
  accountType: string | null | undefined,
  role: string | null | undefined,
): Persona {
  if (role === "guest") return "investor";
  if (accountType === "founder") return "founder";
  if (accountType === "investor") return "investor";
  if (accountType === "sae") return "sae";
  // Compte antérieur aux personas, ou rôle interne sans type : le tableau de
  // bord complet reste le comportement le moins surprenant.
  return "fund";
}
