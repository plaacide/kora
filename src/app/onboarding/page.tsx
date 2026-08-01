import { redirect } from "next/navigation";

/**
 * L'onboarding V1 renvoie vers celui de la V2.
 *
 * POURQUOI CE FICHIER N'EST PLUS UN ÉCRAN. Les e-mails de confirmation déjà
 * expédiés portent `next=%2Fonboarding` — une valeur figée dans des boîtes de
 * réception, que ni un correctif ni un redéploiement ne peuvent réécrire.
 * Quelqu'un qui confirme aujourd'hui une adresse inscrite hier atterrissait
 * donc dans la V1, après avoir rempli le formulaire de la V2.
 *
 * Corriger la source ne suffisait pas : `signUp` pose désormais
 * `next=/v2/onboarding` (cf. `app/actions/auth.ts`) et les défauts du crochet
 * e-mail visent la V2, mais l'un comme l'autre ne valent que pour les envois à
 * venir. Cette redirection est ce qui rattrape les liens déjà en circulation.
 *
 * ELLE EST LÉGITIME parce que la V1 est abandonnée et que la V2 devient la
 * production — aucun nouvel inscrit n'a de raison d'entrer par l'ancien
 * parcours. Le dispatcher par persona qui occupait ce fichier reste dans
 * l'historique git si la décision devait être revue ; le retour arrière tient
 * en un `git revert`.
 */
export default function OnboardingPage() {
  redirect("/v2/onboarding");
}
