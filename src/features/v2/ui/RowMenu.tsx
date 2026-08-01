"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

import { Icon } from "./Icon";

interface Position {
  top: number;
  left: number;
}

import type { IconName } from "./Icon";

export interface MenuItem {
  label: string;
  href?: string;
  /** Une entrée qui AGIT plutôt que de mener quelque part. */
  onSelect?: () => void;
  destructive?: boolean;
  /**
   * L'icône du geste.
   *
   * Une par geste, et jamais deux gestes sous la même : dans une liste qu'on
   * parcourt vite, la forme est reconnue avant le mot. C'est aussi ce qui
   * permet de distinguer « Masquer aux invités » de « Supprimer » sans lire.
   */
  icon?: IconName;
  /** Une séparation AU-DESSUS de cette entrée — pour isoler le destructif. */
  separateur?: boolean;
}

/**
 * Un menu « ⋯ » complet : déclencheur et liste, portés par un seul composant.
 *
 * Le menu se rend dans un portail (`document.body`), pas à l'endroit où il
 * est déclaré : plusieurs lignes vivent dans des conteneurs qui coupent leur
 * contenu (`.v2-folder-card` en `overflow:hidden`, les enveloppes de tableau
 * en `overflow:auto` pour le défilement horizontal). Un menu en
 * `position:absolute` y serait rogné à mi-hauteur — un portail en
 * `position:fixed` s'affranchit de tous ces conteneurs.
 */
function Menu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    // Aligné sur le bord droit du bouton, comme un menu qui se déroule vers le
    // bas. La valeur suit la largeur de `.v2-row-menu-list` — les deux doivent
    // changer ensemble, sinon le menu déborde du côté qu'il devait longer.
    setPosition({ top: rect.bottom + 4, left: rect.right - 232 });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;

    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (trigger.current?.contains(target) || menu.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    // Un menu positionné en fixe se désolidarise de sa ligne dès qu'on
    // défile — le fermer plutôt que le laisser flotter au mauvais endroit.
    const onScroll = () => setOpen(false);

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  return (
    <>
      <button
        aria-expanded={open}
        aria-label={`Options — ${label}`}
        className="v2-icon-button"
        onClick={toggle}
        ref={trigger}
        type="button"
      >
        <Icon name="more" />
      </button>

      {open && position && typeof document !== "undefined"
        ? createPortal(
            <div
              className="v2-row-menu-list"
              ref={menu}
              role="menu"
              style={{ top: position.top, left: position.left }}
            >
              {items.map((item) =>
                item.href ? (
                  <Link
                    data-destructive={item.destructive}
                    data-separateur={item.separateur}
                    href={item.href}
                    key={item.label}
                    onClick={() => setOpen(false)}
                    role="menuitem"
                  >
                    {item.icon && <Icon name={item.icon} />}
                    {item.label}
                  </Link>
                ) : (
                  <button
                    data-destructive={item.destructive}
                    data-separateur={item.separateur}
                    key={item.label}
                    onClick={() => {
                      setOpen(false);
                      item.onSelect?.();
                    }}
                    role="menuitem"
                    type="button"
                  >
                    {item.icon && <Icon name={item.icon} />}
                    {item.label}
                  </button>
                ),
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/**
 * Un menu « ⋯ » dont l'appelant fournit les entrées.
 *
 * Les deux menus ci-dessous portent des libellés d'exemple ; celui-ci sert
 * quand les actions sont réelles et propres à un écran.
 */
export function ActionsMenu({
  items,
  label,
}: {
  items: MenuItem[];
  label: string;
}) {
  return <Menu items={items} label={label} />;
}

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
  return (
    <Menu
      items={[
        { label: "Ouvrir", href, icon: "arrow" },
        // TROIS OPTIONS SONT RETIRÉES, pas grisées : « Modifier »,
        // « Dupliquer la structure » et « Exporter l'index » n'avaient aucune
        // action derrière elles. Une entrée de menu qui ne fait rien est pire
        // qu'une entrée absente — on la clique, rien ne se passe, et l'on croit
        // l'application cassée. Elles reviendront avec l'écran de réglages
        // d'opération, qui est en tête de la roadmap.
        { label: "Clôturer", href: "?dialogue=cloture", icon: "check" },
        { label: "Archiver", href: "?dialogue=archivage", icon: "folder" },
      ]}
      label={label}
    />
  );
}

/**
 * Menu « ⋯ » générique — CRUD, Partager, Audit.
 *
 * Aucune des maquettes n'ouvre ce menu sur les lignes de pipeline, de mises à
 * jour ou de data room : le bouton `⋯` y est dessiné, son contenu ne l'est
 * jamais. Ce sont donc des options d'exemple, pas des libellés du handoff —
 * elles tiennent la place et montrent le motif d'interaction en attendant les
 * vraies actions de chaque contexte.
 */
export function SampleRowMenu({ label }: { label: string }) {
  return (
    <Menu
      items={[
        { label: "Voir le détail" },
        { label: "Modifier" },
        { label: "Dupliquer" },
        { label: "Partager…" },
        { label: "Voir le journal d’audit" },
        { label: "Supprimer", destructive: true },
      ]}
      label={label}
    />
  );
}
