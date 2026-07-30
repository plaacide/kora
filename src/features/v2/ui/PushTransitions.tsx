"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { MouseEvent, ReactNode } from "react";

/**
 * Push plein écran — TRANSITIONS.md §3.
 *
 * L'écran entrant vient de la droite pendant que le sortant recule d'un quart
 * de largeur en s'estompant : les deux coexistent le temps du mouvement.
 * C'est exactement ce que l'API View Transitions du navigateur produit, et
 * rien d'autre ne le fait sans garder l'ancienne page montée à la main.
 *
 * Next expose bien `experimental.viewTransition`, mais il s'appuie sur le
 * composant `<ViewTransition>` de React, absent de React 19.2 stable — il
 * aurait fallu passer React en canary. On appelle donc `startViewTransition`
 * directement.
 *
 * Deux difficultés, deux rendez-vous.
 *
 * 1. Le navigateur fige l'état d'arrivée dès que la promesse rendue se
 *    résout. Elle reste donc ouverte jusqu'à ce que le routeur ait rendu la
 *    nouvelle page — `PushLink` l'ouvre, `PushTransitions` la referme au
 *    changement de chemin.
 *
 * 2. Le sens du retour (`data-nav="back"`) doit rester posé jusqu'à la fin
 *    RÉELLE du mouvement, pas un délai estimé. En développement, le rendu de
 *    la page suivante peut prendre plusieurs centaines de millisecondes
 *    (compilation à la volée) avant même que l'animation ne démarre — un
 *    délai fixe trop court retirerait le marqueur EN PLEIN MOUVEMENT. Le
 *    navigateur, voyant le nom d'animation changer en cours de route,
 *    interromprait le retour et repartirait de zéro en sens inverse : un
 *    à-coup visible au milieu du geste. Le marqueur se retire donc sur
 *    `transition.finished`, jamais sur une horloge.
 */

const MARKER = "data-nav";

/** Filet de sécurité : une navigation avortée laisserait l'écran figé. */
const NAVIGATION_TIMEOUT = 2000;

let releaseNavigation: (() => void) | null = null;

function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

function runTransition(navigate: () => void, back: boolean): void {
  if (back) document.documentElement.setAttribute(MARKER, "back");

  // Là où l'API manque (Firefox à ce jour), la navigation reste instantanée.
  if (!supportsViewTransitions()) {
    navigate();
    if (back) document.documentElement.removeAttribute(MARKER);
    return;
  }

  const transition = document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        const finish = () => {
          window.clearTimeout(guard);
          releaseNavigation = null;
          resolve();
        };

        const guard = window.setTimeout(finish, NAVIGATION_TIMEOUT);
        releaseNavigation = finish;
        navigate();
      }),
  );

  if (back) {
    transition.finished.finally(() => {
      document.documentElement.removeAttribute(MARKER);
    });
  }
}

/** Un clic qui doit garder son comportement natif : nouvel onglet, téléchargement… */
function isModifiedClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

export function PushLink({
  href,
  back = false,
  children,
  className,
  ...rest
}: {
  href: string;
  /** Remonte d'un niveau : le mouvement s'inverse. */
  back?: boolean;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
  title?: string;
}) {
  const router = useRouter();

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (isModifiedClick(event)) return;
    event.preventDefault();
    runTransition(() => router.push(href), back);
  }

  return (
    <a className={className} href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  );
}

/**
 * Monté une fois par le layout V2.
 *
 * Referme la transition dès que le nouveau chemin est rendu — ce même effet
 * sert `PushLink` et le bouton retour du navigateur.
 *
 * Note : le bouton retour du navigateur (`popstate`) n'est pas encore
 * enveloppé dans une transition — Next.js gère cette navigation par ses
 * propres moyens, en dehors de `PushLink`. Il navigue donc pour l'instant
 * sans le mouvement animé ; seul le lien « ← Toutes les opérations » (et tout
 * futur usage de `PushLink`) en bénéficie.
 */
export function PushTransitions() {
  const pathname = usePathname();

  useEffect(() => {
    releaseNavigation?.();
  }, [pathname]);

  return null;
}
