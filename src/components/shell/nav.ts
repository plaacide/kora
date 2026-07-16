export interface NavItem {
  label: string;
  href: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: "Vue d'ensemble",
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Pipeline", href: "/pipeline" },
      { label: "Calendrier", href: "/calendrier" },
      { label: "Portefeuille", href: "/portefeuille" },
      { label: "Recherche", href: "/recherche" },
    ],
  },
  {
    title: "Deal · Kalyx Foods",
    items: [
      { label: "Fiche deal", href: "/deal" },
      { label: "Data room", href: "/data-room" },
      { label: "Visionneuse", href: "/visionneuse" },
      { label: "Checklist DD", href: "/checklist" },
      { label: "Q&A", href: "/qa" },
      { label: "KYC / AML", href: "/kyc" },
      { label: "Syndication", href: "/syndication" },
      { label: "Readiness Score", href: "/readiness" },
      { label: "Permissions", href: "/permissions" },
      { label: "Invitations & NDA", href: "/invitations" },
      { label: "Audit trail", href: "/audit" },
      { label: "Versions", href: "/versions" },
    ],
  },
  {
    title: "Reporting",
    items: [
      { label: "Collecte KPI", href: "/kpi" },
      { label: "Rapport LP", href: "/rapport-lp" },
      { label: "Comparateur IC", href: "/comparateur" },
    ],
  },
  {
    title: "Organisation",
    items: [
      { label: "Paramètres", href: "/parametres" },
      { label: "Facturation", href: "/facturation" },
      { label: "Sécurité", href: "/securite" },
      { label: "Notifications", href: "/notifications" },
      { label: "Aide", href: "/aide" },
    ],
  },
];
