"use client";

import { useEffect, useState } from "react";
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
  formAction,
  name,
  sansValidation,
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
  /**
   * Une action DIFFÉRENTE de celle du formulaire.
   *
   * Deux boutons d'un même formulaire ne font pas toujours la même chose :
   * « Créer la cohorte » écrit, « Créer ma cohorte plus tard » passe. Sans
   * cela il fallait un second formulaire imbriqué — que le HTML interdit — ou
   * un champ caché lu par l'action, qui ne dit pas son nom.
   */
  formAction?: (formData: FormData) => void | Promise<void>;
  name?: string;
  /**
   * Soumettre SANS passer par la validation du navigateur.
   *
   * Pour les boutons qui expriment l'absence de réponse — « Je ne sais pas
   * encore », « Remplir plus tard ». Sans cela, un champ `required` du
   * formulaire les bloquerait, et l'échappatoire n'en serait plus une.
   */
  sansValidation?: boolean;
  value?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className={className}
      disabled={pending}
      formAction={formAction}
      formNoValidate={sansValidation}
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

/**
 * La même garde, pour un bouton posé HORS de son formulaire.
 *
 * POURQUOI UNE SECONDE VARIANTE. L'assistant de création d'opération pose son
 * bouton dans un pied de page, relié au formulaire par `form="…"`. Il n'est donc
 * pas descendant du `<form>`, et `useFormStatus` — qui lit un contexte React —
 * ne le voit pas : le bouton restait cliquable pendant tout l'envoi, et un
 * double clic sur connexion lente créait DEUX opérations, la seconde consommant
 * une place de plan.
 *
 * On écoute l'évènement `submit` natif du formulaire visé. C'est le seul signal
 * disponible de l'extérieur, et il suffit : le navigateur ne l'émet qu'une fois
 * par envoi accepté.
 */
export function BoutonEnvoiExterne({
  children,
  className,
  enCours,
  form,
}: {
  children: React.ReactNode;
  className?: string;
  enCours: string;
  /** L'identifiant du `<form>` que ce bouton soumet. */
  form: string;
}) {
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    const cible = document.getElementById(form);
    if (!cible) return;

    const surEnvoi = () => setEnvoi(true);
    cible.addEventListener("submit", surEnvoi);

    // Le retour arrière du navigateur restitue la page depuis son cache sans
    // la remonter : sans cela, le bouton resterait désactivé pour toujours.
    const surRetour = (e: PageTransitionEvent) => {
      if (e.persisted) setEnvoi(false);
    };
    window.addEventListener("pageshow", surRetour);

    return () => {
      cible.removeEventListener("submit", surEnvoi);
      window.removeEventListener("pageshow", surRetour);
    };
  }, [form]);

  return (
    <button
      aria-busy={envoi}
      className={className}
      disabled={envoi}
      form={form}
      type="submit"
    >
      <span className="v2-envoi-labels" data-pending={envoi}>
        <span>{children}</span>
        <span>{enCours}</span>
      </span>
    </button>
  );
}
