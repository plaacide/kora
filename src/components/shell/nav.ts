export interface NavItem {
  /** Clé du namespace `shell.nav` */
  key: string;
  href: string;
  /**
   * Écran réservé au côté vendeur (owner/admin/member). Un investisseur n'a
   * pas à voir qui d'autre est invité, la checklist interne, le pipeline du
   * fonds ni le journal d'audit.
   *
   * Ce drapeau ne protège RIEN : il évite d'exposer un menu inutile. La
   * protection est dans la RLS et les RPC.
   */
  internalOnly?: boolean;
  /**
   * Écran propre au PROGRAMME. Sans ce drapeau, le groupe « Cohorte »
   * apparaîtrait aussi chez un fonds ou un fondateur, pour qui il ne veut rien
   * dire — ils n'ont pas de cohorte.
   */
  saeOnly?: boolean;
}

export interface NavGroup {
  /** Clé du namespace `shell.groups` */
  key: string;
  items: NavItem[];
}

export const INTERNAL_ROLES = ["owner", "admin", "member"];

export function isInternalRole(role: string | null | undefined): boolean {
  return INTERNAL_ROLES.includes(role ?? "");
}

/**
 * Écrans qui n'ont aucun sens pour un fondateur.
 *
 * Le pipeline suit un PORTEFEUILLE d'opérations : un fondateur n'en a qu'une,
 * la sienne. Lui montrer un kanban à une colonne, c'est lui faire croire qu'il
 * a manqué une étape.
 */
const HORS_SUJET_FONDATEUR = ["/pipeline"];

/**
 * Ce que voit un PROGRAMME — liste blanche, et non liste noire.
 *
 * Les autres métiers se définissent par soustraction, parce qu'ils possèdent
 * un dossier. Le programme, lui, n'en possède aucun : data room, visionneuse,
 * checklist, versions, NDA ne s'appliquent à rien chez lui. Énumérer ce qu'il
 * a le droit de voir est plus sûr — un écran ajouté demain n'apparaîtra pas
 * chez lui par accident.
 */
const ECRANS_PROGRAMME = ["/portefeuille", "/cohorte", "/securite", "/roadmap"];

/**
 * Navigation telle qu'elle doit apparaître pour ce rôle et ce métier.
 *
 * `persona` est facultatif : sans lui, on retombe sur le comportement
 * historique (interne = tout). Ce n'est pas une protection — la RLS et les RPC
 * s'en chargent — mais un menu qui ne propose que ce qui a du sens.
 */
export function navFor(
  role: string | null | undefined,
  persona?: "founder" | "investor" | "fund" | "sae",
): NavGroup[] {
  const roleOk = isInternalRole(role)
    ? navGroups
    : navGroups.map((g) => ({
        ...g,
        items: g.items.filter((i) => !i.internalOnly),
      }));

  // Les écrans de cohorte n'existent que pour le programme.
  const base =
    persona === "sae"
      ? roleOk
      : roleOk.map((g) => ({ ...g, items: g.items.filter((i) => !i.saeOnly) }));

  if (persona === "sae") {
    return navGroups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => ECRANS_PROGRAMME.includes(i.href)),
      }))
      .filter((g) => g.items.length > 0);
  }

  const filtre =
    persona === "founder"
      ? base.map((g) => ({
          ...g,
          items: g.items.filter((i) => !HORS_SUJET_FONDATEUR.includes(i.href)),
        }))
      : base;

  return filtre.filter((g) => g.items.length > 0);
}

/**
 * Navigation V0 — UNIQUEMENT des écrans qui existent.
 *
 * Règle : on n'affiche jamais un lien qui mène à une 404. Ce qui n'est pas
 * encore construit vit sur /roadmap, où l'utilisateur peut le voter.
 * Toute entrée ajoutée ici doit avoir sa page dans src/app/(app)/.
 */
export const navGroups: NavGroup[] = [
  {
    key: "overview",
    items: [
      // Le tableau de bord agrège l'activité du fonds, le pipeline liste des
      // opérations que l'invité n'a pas à connaître.
      { key: "dashboard", href: "/dashboard", internalOnly: true },
      { key: "pipeline", href: "/pipeline", internalOnly: true },
    ],
  },
  {
    key: "deal",
    items: [
      { key: "dealSheet", href: "/deal", internalOnly: true },
      { key: "dataRoom", href: "/data-room" },
      { key: "viewer", href: "/visionneuse" },
      { key: "qa", href: "/qa" },
      { key: "checklist", href: "/checklist", internalOnly: true },
      { key: "readiness", href: "/readiness", internalOnly: true },
      { key: "permissions", href: "/permissions", internalOnly: true },
      { key: "invitations", href: "/invitations", internalOnly: true },
      { key: "contacts", href: "/contacts", internalOnly: true },
      { key: "versions", href: "/versions", internalOnly: true },
      // L'invité doit pouvoir relire le NDA qu'il a signé : c'est sa preuve.
      { key: "nda", href: "/nda" },
      { key: "audit", href: "/audit", internalOnly: true },
    ],
  },
  {
    key: "cohort",
    items: [
      { key: "portfolio", href: "/portefeuille", internalOnly: true, saeOnly: true },
      { key: "cohort", href: "/cohorte", internalOnly: true, saeOnly: true },
    ],
  },
  {
    key: "organisation",
    items: [
      { key: "security", href: "/securite" },
      { key: "roadmap", href: "/roadmap" },
    ],
  },
];
