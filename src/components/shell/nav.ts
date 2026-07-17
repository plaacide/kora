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

export const navGroups: NavGroup[] = [
  {
    key: "overview",
    items: [
      { key: "dashboard", href: "/dashboard" },
      { key: "pipeline", href: "/pipeline" },
      { key: "calendar", href: "/calendrier" },
      { key: "portfolio", href: "/portefeuille" },
      { key: "search", href: "/recherche" },
    ],
  },
  {
    key: "deal",
    items: [
      { key: "dealSheet", href: "/deal" },
      { key: "dataRoom", href: "/data-room" },
      { key: "viewer", href: "/visionneuse" },
      { key: "checklist", href: "/checklist" },
      { key: "qa", href: "/qa" },
      { key: "kyc", href: "/kyc" },
      { key: "syndication", href: "/syndication" },
      { key: "readiness", href: "/readiness" },
      { key: "permissions", href: "/permissions" },
      { key: "invitations", href: "/invitations" },
      { key: "audit", href: "/audit" },
      { key: "versions", href: "/versions" },
    ],
  },
  {
    key: "reporting",
    items: [
      { key: "kpi", href: "/kpi" },
      { key: "lpReport", href: "/rapport-lp" },
      { key: "icComparator", href: "/comparateur" },
    ],
  },
  {
    key: "organisation",
    items: [
      { key: "settings", href: "/parametres" },
      { key: "billing", href: "/facturation" },
      { key: "security", href: "/securite" },
      { key: "notifications", href: "/notifications" },
      { key: "help", href: "/aide" },
    ],
  },
];
