// Module NEUTRE volontairement : pas de directive "use client".
//
// Il n'est importé que par des composants clients, qui lui transmettent leur
// frontière. Y mettre "use client" en ferait un module dont Next remplace les
// exports non-composants par des références — `expandedShellClass` cesserait
// d'être une fonction, sans que TypeScript ni le build ne le signalent.
// Voir AGENTS.md.

import { useCallback, useEffect, useState } from "react";

/**
 * Mode plein écran de la visionneuse, partagé par TOUS les types de documents
 * (pages rendues comme grilles de tableur) : un lecteur ne devrait pas avoir à
 * se demander si le bouton existe selon le format qu'il ouvre.
 *
 * Implémenté en superposition plutôt qu'avec l'API Fullscreen du navigateur :
 * celle-ci sort de la page, masque la barre d'adresse et le reste de
 * l'application, et se referme sur des raccourcis que le lecteur ne contrôle
 * pas toujours. Ici on reste dans le document, ce qui garde la barre d'outils
 * (numéro de page, onglets de feuilles) accessible.
 *
 * IMPORTANT : le panneau agrandi DOIT être monté via un portail sur
 * `document.body`. Le wrapper d'animation de page (`.animate-in`) conserve un
 * `transform`, et tout transform non nul fait de l'élément le bloc conteneur
 * de ses descendants `position: fixed` — `inset-0` se résolvait alors contre
 * une boîte de 54 px au lieu de la fenêtre. Rien dans le code ne le signale :
 * le panneau s'affiche simplement écrasé en haut de l'écran.
 */
export function useExpanded() {
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => setExpanded((e) => !e), []);
  const collapse = useCallback(() => setExpanded(false), []);

  useEffect(() => {
    if (!expanded) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.addEventListener("keydown", onKey);

    // La page dessous ne doit pas défiler pendant qu'on lit en grand.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [expanded]);

  return { expanded, toggle, collapse };
}

/**
 * Plan de superposition du panneau agrandi.
 *
 * Doit passer AU-DESSUS de la barre supérieure (`z-[60]`), sinon celle-ci
 * recouvre la barre d'outils du document et le bouton de sortie devient
 * inatteignable — on se retrouve enfermé en plein écran.
 *
 * Doit rester SOUS les infobulles et les modales (`z-[100]`), pour que les
 * bulles d'aide de la barre d'outils restent lisibles une fois agrandi.
 */
export const EXPANDED_Z = "z-[70]";

/**
 * Classes du conteneur selon l'état. En plein écran on retire l'arrondi et
 * l'ombre : la carte devient la page.
 */
export function expandedShellClass(expanded: boolean): string {
  return expanded
    ? `fixed inset-0 ${EXPANDED_Z} flex flex-col rounded-none border-0 shadow-none`
    : "";
}
