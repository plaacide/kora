export const dynamic = "force-dynamic";

/**
 * La sonde de santé, et l'état des dépendances qu'on ne voit pas autrement.
 *
 * POURQUOI ELLE DIT PLUS QUE « ok ». Trois pannes de suite ont eu la même
 * cause : une variable d'environnement absente du déploiement. La clé de
 * service Supabase d'abord, qui faisait échouer un paiement déjà encaissé ;
 * le secret du crochet e-mail ensuite ; la clé Resend enfin, qui a fait
 * répondre 500 à Supabase et bloqué toute inscription. Chaque fois, il a fallu
 * lire les journaux pour découvrir un fait qui tient en un booléen.
 *
 * CE QU'ELLE NE DIT JAMAIS : la valeur d'une variable, ni même son nom quand
 * elle est présente. Seulement ce qui MANQUE, et en vocabulaire fonctionnel —
 * « courriel » plutôt que `RESEND_API_KEY`. Un déploiement incomplet n'est pas
 * un secret : c'est une panne, et la taire ne protège personne.
 */
function manquants(): string[] {
  const requis: Array<[string, string]> = [
    ["NEXT_PUBLIC_SUPABASE_URL", "base"],
    ["SUPABASE_SERVICE_ROLE_KEY", "base-admin"],
    ["RESEND_API_KEY", "courriel"],
    ["EMAIL_FROM", "courriel-expediteur"],
    ["SEND_EMAIL_HOOK_SECRET", "courriel-crochet"],
  ];

  return requis
    .filter(([variable]) => !process.env[variable])
    .map(([, nom]) => nom);
}

export function GET() {
  const absents = manquants();

  return Response.json(
    {
      status: "ok",
      service: "sanza",
      // Vide quand tout est posé. Non vide, c'est la liste des choses qui
      // échoueront — sans qu'aucun écran ne le dise.
      configuration_manquante: absents,
    },
    {
      // 200 même incomplet : l'application RÉPOND, et l'hébergeur ne doit pas
      // la redémarrer en boucle pour une clé d'e-mail. C'est le corps de la
      // réponse qu'on lit, pas le code.
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
