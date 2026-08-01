"use client";

import { useEffect } from "react";

/**
 * Un message porté par l'URL, qui s'efface de l'URL après avoir été lu.
 *
 * CE QU'IL CORRIGE. Les erreurs de l'onboarding voyagent en paramètre —
 * `?erreur=enregistrement` — parce que les actions redirigent au lieu de rendre
 * un état. Le message restait donc collé à l'adresse : on corrigeait sa saisie,
 * on rechargeait, et l'échec s'affichait encore. Pire, l'adresse gardée en
 * favori ou renvoyée à un collègue rouvrait toujours sur une erreur qui n'avait
 * plus lieu d'être.
 *
 * On retire le paramètre par `replaceState` et non par une navigation : le
 * message reste à l'écran pour ce rendu-ci — c'est bien lui qu'on veut lire —
 * mais il ne survit pas au rechargement. Aucune requête serveur, aucun
 * remontage : le formulaire à moitié rempli n'est pas perdu au passage.
 */
export function AvisEphemere({ parametre = "erreur" }: { parametre?: string }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(parametre)) return;

    url.searchParams.delete(parametre);
    // `?` seul en fin d'adresse quand il ne reste aucun paramètre : on le retire.
    const suite = url.searchParams.toString();
    window.history.replaceState(
      window.history.state,
      "",
      url.pathname + (suite ? `?${suite}` : "") + url.hash,
    );
  }, [parametre]);

  return null;
}
