"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Icon } from "./Icon";

/**
 * Menu « ⋯ » d'une ligne d'opération — écran 54.
 *
 * Les six options sont celles de la maquette, dans son ordre : les deux
 * premières ouvrent, les trois suivantes changent le cycle de vie, la dernière
 * exporte. Aucune n'est destructrice — la maquette ne propose pas de
 * suppression, et l'archivage y est présenté comme réversible.
 */
export function RowMenu({
  href,
  label,
}: {
  /** Cible de « Ouvrir ». */
  href: string;
  /** Nom de l'opération, pour l'intitulé accessible du bouton. */
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Un menu qui ne se referme ni au clic extérieur ni à Échap piège l'utilisateur.
  useEffect(() => {
    if (!open) return;

    const onPointer = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items: Array<[string, string | null]> = [
    ["Ouvrir", href],
    ["Modifier", null],
    ["Dupliquer la structure", null],
    ["Clôturer", "?dialogue=cloture"],
    ["Archiver", "?dialogue=archivage"],
    ["Exporter l’index", null],
  ];

  return (
    <div className="v2-row-menu" ref={root}>
      <button
        aria-expanded={open}
        aria-label={`Options — ${label}`}
        className="v2-icon-button"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Icon name="more" />
      </button>

      {open && (
        <div className="v2-row-menu-list" role="menu">
          {items.map(([text, target]) =>
            target ? (
              <Link href={target} key={text} onClick={() => setOpen(false)} role="menuitem">
                {text}
              </Link>
            ) : (
              <button key={text} role="menuitem" type="button">
                {text}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
