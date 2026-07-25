/**
 * Postes proposés à l'inscription, par persona.
 *
 * Le poste n'est pas décoratif : il s'affiche dans « Équipe sur la levée », que
 * lit un investisseur. En texte libre, on récoltait « ceo », « CEO & Founder »,
 * « pdg » — trois écritures d'un même poste, impossibles à aligner.
 *
 * La liste dépend de la persona choisie juste au-dessus dans le formulaire :
 * proposer « Partner » à un fondateur, ou « CTO » à un fonds, serait du bruit.
 * `other` reste toujours disponible et rouvre un champ libre — on ne bloque
 * personne dont le poste n'est pas prévu.
 *
 * ⚠️ Module NEUTRE volontairement (ni "use client", ni "use server") : exporter
 * une constante depuis un module directive-é la remplace par une référence à
 * l'exécution (cf. AGENTS.md).
 */
export type PersonaInscription = "founder" | "investor" | "sae";

/** Clé de repli quand aucun poste de la liste ne convient. */
export const POSTE_AUTRE = "other";

export const POSTES: Record<PersonaInscription, readonly string[]> = {
  founder: ["ceo", "cofounder", "cto", "coo", "cfo", "cmo", "headProduct", "headOps"],
  investor: ["partner", "principal", "investmentDirector", "analyst", "headPortfolio", "advisor"],
  sae: ["programDirector", "programManager", "portfolioLead", "mentor", "operationsLead"],
};
