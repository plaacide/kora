/**
 * Registre des moments où l'interface est OCCUPÉE.
 *
 * L'enquête produit ne doit jamais s'inviter pendant une action (§2 du
 * handoff) : un modal ouvert, un dépôt en cours, une visionneuse. Détecter ces
 * états depuis l'extérieur — en fouillant le DOM, en devinant des classes —
 * serait fragile et casserait à la première refonte. Chaque composant qui
 * occupe l'utilisateur le DÉCLARE donc lui-même, en une ligne.
 *
 * Un COMPTEUR, pas un booléen : deux modals peuvent se superposer, et un
 * booléen remis à faux par le premier qui se ferme rouvrirait la porte alors
 * que le second est encore là.
 *
 * ⚠️ Module NEUTRE (ni "use client", ni "use server") : il est importé des
 * deux côtés, et une constante exportée depuis un module directive-é est
 * remplacée par une référence à l'exécution (cf. AGENTS.md).
 */
type Ecouteur = () => void;

let occupations = 0;
const ecouteurs = new Set<Ecouteur>();

function notifier(): void {
  for (const e of ecouteurs) e();
}

/**
 * Déclare l'interface occupée. Renvoie la fonction de libération — à appeler
 * au démontage, sans quoi le compteur ne redescend jamais et l'enquête ne
 * s'affiche plus du tout.
 */
export function marquerOccupe(): () => void {
  occupations += 1;
  notifier();
  let libere = false;
  return () => {
    // Idempotent : React peut rejouer un nettoyage d'effet en mode strict, et
    // un double décompte rendrait le compteur négatif.
    if (libere) return;
    libere = true;
    occupations = Math.max(0, occupations - 1);
    notifier();
  };
}

export function interfaceOccupee(): boolean {
  return occupations > 0;
}

export function surChangementOccupation(fn: Ecouteur): () => void {
  ecouteurs.add(fn);
  return () => {
    ecouteurs.delete(fn);
  };
}
