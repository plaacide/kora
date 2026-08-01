"use client";

import { useEffect, useState } from "react";

import { Icon } from "./Icon";

/**
 * Un message qui s'efface tout seul — mais pas n'importe lequel.
 *
 * CE QUI S'EFFACE ET CE QUI RESTE. Une bonne nouvelle a fait son travail dès
 * qu'elle est lue : « votre plan est ouvert » n'appelle aucun geste, et laisser
 * le bandeau en place encombre un écran qu'on va continuer d'utiliser.
 *
 * Un message qui DEMANDE quelque chose, lui, ne doit jamais disparaître seul :
 * « votre opérateur valide encore, rafraîchissez dans une minute » a besoin
 * d'être là quand on revient au bout de cette minute. L'effacer serait effacer
 * la consigne.
 *
 * NETTOIE AUSSI L'ADRESSE. Sans ça, `?paiement=ok` survit dans l'URL : un
 * rechargement, un signet, un partage de lien, et l'on revoit « paiement
 * confirmé » sans avoir rien payé. On remplace l'entrée d'historique plutôt
 * que d'en ajouter une, pour que le bouton Retour continue de faire ce qu'on
 * attend de lui.
 */
export function MessageTemporaire({
  bon,
  texte,
  secondes = 30,
}: {
  /** `true` pour une bonne nouvelle — c'est elle, et elle seule, qui s'efface. */
  bon: boolean;
  texte: string;
  secondes?: number;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // L'adresse se nettoie dans tous les cas, même pour un message qui reste :
    // le paramètre a été consommé au rendu, il n'a plus rien à faire là.
    const url = new URL(window.location.href);
    if (url.searchParams.has("paiement")) {
      url.searchParams.delete("paiement");
      window.history.replaceState(null, "", url.toString());
    }

    if (!bon) return;

    const minuterie = setTimeout(() => setVisible(false), secondes * 1000);
    return () => clearTimeout(minuterie);
  }, [bon, secondes]);

  if (!visible) return null;

  return (
    <p className={bon ? "v2-panel-callout" : "v2-panel-note"} role="status">
      <Icon name={bon ? "check" : "clock"} />
      {texte}
    </p>
  );
}
