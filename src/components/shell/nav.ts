export interface NavItem {
  /** Clé du namespace `shell.nav` */
  key: string;
  href: string;
}

export interface NavGroup {
  /** Clé du namespace `shell.groups` */
  key: string;
  items: NavItem[];
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
      { key: "dashboard", href: "/dashboard" },
      { key: "pipeline", href: "/pipeline" },
    ],
  },
  {
    key: "deal",
    items: [
      { key: "dealSheet", href: "/deal" },
      { key: "dataRoom", href: "/data-room" },
      { key: "viewer", href: "/visionneuse" },
      { key: "permissions", href: "/permissions" },
      { key: "invitations", href: "/invitations" },
      { key: "versions", href: "/versions" },
      { key: "nda", href: "/nda" },
      { key: "audit", href: "/audit" },
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
