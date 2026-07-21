/**
 * Jours restants avant une échéance d'abonnement.
 *
 * Isolé dans un module plutôt qu'écrit dans le composant : lire l'horloge est
 * un effet, et le faire pendant le rendu est signalé par le compilateur React
 * (« Cannot call impure function during render »). La règle vaut aussi pour un
 * composant serveur, où le calcul est pourtant sans danger — l'isoler coûte
 * une ligne et évite d'ajouter une exception à la pile.
 *
 * `null` en entrée comme en sortie : une organisation sans échéance n'est
 * jamais soumise à l'abonnement, ce n'est pas « zéro jour ».
 */
export function joursRestants(echeance: string | null | undefined): number | null {
  if (!echeance) return null;
  const ms = new Date(echeance).getTime() - new Date().getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/**
 * Instant décalé de `ms`, au format ISO — pour borner une requête.
 *
 * Isolé ici pour la même raison que `joursRestants` : `Date.now()` appelé dans
 * le rendu d'un composant est signalé par le compilateur React, même côté
 * serveur où il est sans danger.
 */
export function isoDans(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}
