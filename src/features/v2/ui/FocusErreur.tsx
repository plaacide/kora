"use client";

import { useEffect, useRef } from "react";

/**
 * Poser le curseur sur le premier champ fautif après un échec de validation.
 *
 * POURQUOI. Les actions savent quel champ est en cause et l'écran l'affiche,
 * mais rien n'y conduisait : sur le formulaire de levée et sa douzaine de
 * champs, il fallait parcourir la page pour trouver lequel corriger. Pour
 * quelqu'un qui navigue au clavier ou au lecteur d'écran, cela veut dire
 * repartir du début du formulaire à chaque tentative.
 *
 * COMMENT. Le composant ne connaît aucun nom de champ : il cherche le premier
 * `aria-invalid="true"` dans le formulaire qui le contient. Il suit donc
 * automatiquement tout champ correctement marqué, sans liste à tenir à jour.
 *
 * `cle` doit changer à chaque soumission refusée — l'état rendu par l'action
 * fait l'affaire. Sans elle, le focus ne serait posé qu'au premier rendu et une
 * deuxième erreur passerait inaperçue.
 */
export function FocusPremiereErreur({ cle }: { cle: unknown }) {
  const ancre = useRef<HTMLSpanElement>(null);
  const precedente = useRef<unknown>(null);

  useEffect(() => {
    // Au montage, `cle` vaut son état initial : déplacer le curseur à ce
    // moment-là volerait le focus à quelqu'un qui commence juste à saisir.
    if (precedente.current === null) {
      precedente.current = cle;
      return;
    }
    if (precedente.current === cle) return;
    precedente.current = cle;

    const form = ancre.current?.closest("form");
    const fautif = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!fautif) return;

    fautif.focus({ preventScroll: true });
    // `focus` seul peut laisser le champ sous un en-tête collant.
    fautif.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [cle]);

  return <span hidden ref={ancre} />;
}
