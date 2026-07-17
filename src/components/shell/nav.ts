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

/** Navigation telle qu'elle doit apparaître pour ce rôle. */
export function navFor(role: string | null | undefined): NavGroup[] {
  if (isInternalRole(role)) return navGroups;
  return navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.internalOnly) }))
    .filter((g) => g.items.length > 0);
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
      { key: "versions", href: "/versions", internalOnly: true },
      // L'invité doit pouvoir relire le NDA qu'il a signé : c'est sa preuve.
      { key: "nda", href: "/nda" },
      { key: "audit", href: "/audit", internalOnly: true },
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
