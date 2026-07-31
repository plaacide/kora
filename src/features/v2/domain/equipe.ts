/**
 * Les rôles internes — écran 33.
 *
 * Quatre rôles, et la maquette les décrit par ce qu'ils PEUVENT faire, pas par
 * un rang. C'est ce qui permet à un fondateur de choisir sans deviner : « prépare,
 * dépose, gère l'équipe — pas de partage externe » se décide, « administrateur »
 * se subit.
 *
 * Les invités externes ne figurent jamais ici. Un investisseur, une banque, un
 * auditeur ne sont pas des collaborateurs à qui on donne un rôle : ce sont des
 * accès à durée limitée sur un périmètre choisi, et ils vivent dans Partage et
 * accès. Les mélanger dans un même tableau est la confusion que cet écran
 * existe pour empêcher.
 */

export type RoleInterne = "owner" | "admin" | "member" | "internal_viewer";

export interface Role {
  cle: RoleInterne;
  label: string;
  /** Ce que le rôle permet, dans les mots de la maquette. */
  pouvoir: string;
  tone: "orange" | "neutral";
}

export const ROLES: readonly Role[] = [
  {
    cle: "owner",
    label: "Propriétaire",
    pouvoir: "Tout, y compris partage externe et clôture.",
    tone: "orange",
  },
  {
    cle: "admin",
    label: "Administrateur",
    pouvoir: "Prépare, dépose, gère l’équipe — pas de partage externe.",
    tone: "neutral",
  },
  {
    cle: "member",
    label: "Contributeur",
    pouvoir: "Dépose et met à jour les pièces de son périmètre.",
    tone: "neutral",
  },
  {
    cle: "internal_viewer",
    label: "Lecteur interne",
    pouvoir: "Consulte sans modifier — pour les conseils.",
    tone: "neutral",
  },
] as const;

export function role(cle: string): Role {
  return ROLES.find((r) => r.cle === cle) ?? ROLES[2];
}

/** `guest` n'est pas un rôle d'équipe : c'est un accès externe. */
export function estInterne(cle: string): boolean {
  return ROLES.some((r) => r.cle === cle);
}

export interface Membre {
  id: string;
  userId: string;
  nom: string;
  email: string | null;
  initiales: string;
  role: RoleInterne;
  /** Dernière trace au journal, ou `null` s'il n'a encore rien fait. */
  derniereActivite: string | null;
  /** Vrai pour la personne connectée : on ne se retire pas soi-même. */
  cestMoi: boolean;
}

export function initiales(nom: string, email: string | null): string {
  const source = nom.trim() || email?.split("@")[0] || "";
  const mots = source.split(/[\s.\-_]+/).filter(Boolean).slice(0, 2);
  const lettres = mots.map((mot) => mot[0]?.toUpperCase() ?? "").join("");
  return lettres || "?";
}

/**
 * L'ordre du tableau : par rôle, du plus large au plus étroit, puis par nom.
 *
 * Trier par date d'arrivée ferait remonter les comptes de test créés en premier
 * ; trier par activité ferait bouger les lignes d'un jour à l'autre. Le rôle
 * est la seule clé stable qui répond à la question qu'on se pose en ouvrant cet
 * écran : qui peut quoi.
 */
export function trier(membres: readonly Membre[]): Membre[] {
  const rang = (cle: string) => ROLES.findIndex((r) => r.cle === cle);
  return [...membres].sort(
    (a, b) => rang(a.role) - rang(b.role) || a.nom.localeCompare(b.nom, "fr"),
  );
}

/**
 * Peut-on encore rétrograder ou retirer ce membre ?
 *
 * La base refuse de laisser une organisation sans propriétaire — mais un bouton
 * qui échoue au clic est un bouton qu'on croit cassé. La même règle est donc
 * énoncée ici, pour être dite AVANT le geste plutôt qu'après.
 */
export function dernierProprietaire(
  membre: Membre,
  membres: readonly Membre[],
): boolean {
  return (
    membre.role === "owner" &&
    membres.filter((m) => m.role === "owner").length <= 1
  );
}
