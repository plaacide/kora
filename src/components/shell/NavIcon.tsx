/**
 * Icônes de la navigation latérale.
 *
 * Un seul composant qui aiguille sur la clé de l'entrée : les icônes vivent à
 * côté de `nav.ts`, donc ajouter un écran sans son icône se voit tout de suite.
 *
 * Tracé uniforme — 16px, `currentColor`, épaisseur 1.6 — pour que la colonne
 * reste calme : des icônes d'épaisseurs différentes créent un bruit visuel qui
 * fatigue plus qu'il n'aide à repérer.
 */
export function NavIcon({ name }: { name: string }) {
  const path = PATHS[name] ?? PATHS.fallback;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden
    >
      {path}
    </svg>
  );
}

const PATHS: Record<string, React.ReactNode> = {
  // Vue d'ensemble
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  pipeline: (
    <>
      <rect x="3" y="4" width="5" height="12" rx="1.5" />
      <rect x="9.5" y="4" width="5" height="16" rx="1.5" />
      <rect x="16" y="4" width="5" height="8" rx="1.5" />
    </>
  ),

  // Deal
  dealSheet: (
    <>
      <path d="M6 2.75h7.5L18 7.25v14H6z" />
      <path d="M13 2.75V7.5H18" />
      <path d="M9 12.5h6M9 16h4" />
    </>
  ),
  dataRoom: (
    <>
      <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h7A1.5 1.5 0 0 1 19 10v7.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 3 17.5z" />
    </>
  ),
  viewer: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.75" />
    </>
  ),
  qa: (
    <>
      <path d="M20.5 15.5a2 2 0 0 1-2 2H8l-4.5 3.5v-15a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
      <path d="M10 9.2a2 2 0 1 1 2.6 1.9c-.5.2-.6.5-.6 1" />
      <path d="M12 14.2h.01" />
    </>
  ),
  checklist: (
    <>
      <path d="M4 6.5l1.6 1.6L8.5 5" />
      <path d="M4 12.5l1.6 1.6L8.5 11" />
      <path d="M4 18.5l1.6 1.6L8.5 17" />
      <path d="M12 6.8h8M12 12.8h8M12 18.8h5" />
    </>
  ),
  readiness: (
    <>
      <path d="M3.5 17a9 9 0 1 1 17 0" />
      <path d="M12 17l4.2-4.6" />
      <circle cx="12" cy="17" r="1.2" />
    </>
  ),
  permissions: (
    <>
      <circle cx="8.5" cy="9" r="3" />
      <path d="M14.5 11.5h6" />
      <path d="M18 8.5v6" />
      <path d="M3 19.5c.8-2.8 3-4.2 5.5-4.2s4.7 1.4 5.5 4.2" />
    </>
  ),
  invitations: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  versions: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3.2 4.5V9h4.5" />
      <path d="M12 8v4.4l3 1.8" />
    </>
  ),
  nda: (
    <>
      <path d="M6 2.75h7.5L18 7.25V14" />
      <path d="M13 2.75V7.5H18" />
      <path d="M6 2.75v14.5" />
      <path d="M4.5 21c1.6-.9 2.7-2.4 4-4.4 1.1-1.7 2.6-1.4 2.8.2.2 1.4 1 1.9 2 1.2l2-1.4" />
    </>
  ),
  audit: (
    <>
      <path d="M12 2.75l7.5 3v6c0 5-3.4 8.4-7.5 9.5-4.1-1.1-7.5-4.5-7.5-9.5v-6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),

  // Organisation
  security: (
    <>
      <rect x="4.5" y="10" width="15" height="10.5" rx="2" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
      <path d="M12 14v2.5" />
    </>
  ),
  roadmap: (
    <>
      <path d="M5 21V4.5" />
      <path d="M5 4.5c3-1.6 6-1.6 9 0s6 1.6 9 0" strokeWidth="0" />
      <path d="M5 5c2.6-1.5 5.4-1.5 8 0s5.4 1.5 8 0v8c-2.6 1.5-5.4 1.5-8 0s-5.4-1.5-8 0z" />
    </>
  ),

  fallback: <circle cx="12" cy="12" r="8" />,
};
