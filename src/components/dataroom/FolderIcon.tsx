/**
 * Icônes de l'arborescence.
 *
 * L'arbre affichait « ▶ », un caractère typographique : sa forme, son poids et
 * son alignement dépendent de la police du système, il ne s'aligne pas sur la
 * grille des autres icônes et il rend mal sur certains écrans. Un tracé
 * vectoriel se comporte partout pareil.
 *
 * Deux signes distincts, parce qu'ils disent deux choses différentes : le
 * chevron indique qu'on PEUT déplier, l'icône de dossier indique ce QU'EST la
 * ligne. Les confondre obligeait à deviner.
 */

/** Chevron de dépliage. Pivote de 90° à l'ouverture. */
export function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="transition-transform"
      style={{ transform: open ? "rotate(90deg)" : "none" }}
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

/**
 * Dossier — ouvert ou fermé. Le dossier ouvert est incliné, comme une
 * chemise dont on a soulevé le rabat : la différence se lit d'un coup d'œil,
 * même à 14 pixels.
 */
export function FolderIcon({
  open = false,
  filled = false,
}: {
  open?: boolean;
  /** Rempli quand le dossier contient au moins un document. */
  filled?: boolean;
}) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      fillOpacity={filled ? 0.14 : 0}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      {open ? (
        <>
          <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h4l2 2.5h7a1.5 1.5 0 0 1 1.5 1.5v.5" />
          <path d="M3 8.5v9A1.5 1.5 0 0 0 4.5 19h12.2a1.5 1.5 0 0 0 1.45-1.1l1.6-5.4a1 1 0 0 0-.96-1.28H7.4a1.5 1.5 0 0 0-1.44 1.08L4.2 18" />
        </>
      ) : (
        <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h7A1.5 1.5 0 0 1 19 10v7.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 3 17.5z" />
      )}
    </svg>
  );
}
