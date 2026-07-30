"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { MouseEvent, ReactNode } from "react";

/**
 * Push plein écran — TRANSITIONS.md §3.
 *
 * L'écran sortant doit glisser à -24 % PENDANT que l'entrant arrive : les deux
 * coexistent le temps du mouvement. C'est exactement ce que l'API View
 * Transitions du navigateur produit, et rien d'autre ne le fait sans garder
 * l'ancienne page montée à la main.
 *
 * Next expose bien un drapeau `experimental.viewTransition`, mais il s'appuie
 * sur le composant `<ViewTransition>` de React, absent de React 19.2 stable —
 * il faudrait passer React en canary. On appelle donc `startViewTransition`
 * nous-mêmes.
 *
 * La difficulté tient à un point : le navigateur capture l'état d'arrivée dès
 * que la promesse rendue se résout. Il faut donc la tenir ouverte jusqu'à ce
 * que le routeur ait vraiment rendu la nouvelle page — d'où le rendez-vous
 * entre `PushLink`, qui l'ouvre, et `PushTransitions`, qui la referme au
 * changement de chemin.
 */

const MARKER = "data-nav";
const CLEAR_AFTER = 520;

/** Filet de sécurité : une navigation avortée laisserait l'écran figé. */
const NAVIGATION_TIMEOUT = 2000;

let releaseNavigation: (() => void) | null = null;
let clearTimer: number | undefined;

function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

/**
 * Marque la navigation qui suit comme un retour.
 *
 * Sans ce marqueur, revenir en arrière pousserait encore vers la gauche et la
 * profondeur mentirait sur le sens du parcours.
 */
export function markBackNavigation(): void {
  document.documentElement.setAttribute(MARKER, "back");

  window.clearTimeout(clearTimer);
  clearTimer = window.setTimeout(() => {
    document.documentElement.removeAttribute(MARKER);
  }, CLEAR_AFTER);
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

    if (back) markBackNavigation();

    // Là où l'API manque (Firefox à ce jour), la navigation reste instantanée.
    if (!supportsViewTransitions()) {
      router.push(href);
      return;
    }

    document.startViewTransition(
      () =>
        new Promise<void>((resolve) => {
          const finish = () => {
            window.clearTimeout(guard);
            releaseNavigation = null;
            resolve();
          };

          const guard = window.setTimeout(finish, NAVIGATION_TIMEOUT);
          releaseNavigation = finish;
          router.push(href);
        }),
    );
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
 * Referme la transition dès que le nouveau chemin est rendu, et marque les
 * retours du navigateur — `popstate` précède le rendu, le marqueur arrive donc
 * à temps.
 */
export function PushTransitions() {
  const pathname = usePathname();

  useEffect(() => {
    releaseNavigation?.();
  }, [pathname]);

  useEffect(() => {
    const onPopState = () => markBackNavigation();
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
      window.clearTimeout(clearTimer);
    };
  }, []);

  return null;
}
