"use client";

import { useFormStatus } from "react-dom";

/**
 * Un bouton de soumission qui dit qu'il travaille — et qui ne part qu'une fois.
 *
 * CE QU'IL CORRIGE. Les trois étapes de l'onboarding soumettaient par
 * `<form action={serverAction}>` avec un `<button type="submit">` nu : rien
 * n'était désactivé pendant l'envoi. Sur une connexion lente — celle de la
 * plupart des fondateurs visés — un second clic partait avant la réponse du
 * premier, et `complete_onboarding` créait alors deux organisations.
 *
 * LA LARGEUR NE BOUGE PAS. Les deux libellés sont rendus l'un sur l'autre dans
 * la même cellule de grille : le bouton fait la largeur du plus long dès le
 * départ. Sans cela, « Continuer » qui devient « Enregistrement… » élargit le
 * bouton en cours de route et fait sauter la ligne entière.
 */
export function BoutonEnvoi({
  children,
  className,
  enCours,
  name,
  value,
}: {
  /** Le libellé au repos. */
  children: React.ReactNode;
  className?: string;
  /**
   * Le libellé pendant l'envoi. À OMETTRE quand le formulaire porte plusieurs
   * boutons de soumission : `useFormStatus` ne dit pas lequel a été pressé, et
   * afficher « Génération… » sur le bouton qu'on n'a pas cliqué est un
   * mensonge. Le bouton se contente alors d'être désactivé.
   */
  enCours?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className={className}
      disabled={pending}
      name={name}
      type="submit"
      value={value}
    >
      {enCours ? (
        <span className="v2-envoi-labels" data-pending={pending}>
          <span>{children}</span>
          <span>{enCours}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
