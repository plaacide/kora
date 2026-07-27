/**
 * Le conseil contextuel — la phrase qui lit la situation et dit quoi faire.
 *
 * PRÉSENTE SUR QUATRE ÉCRANS DE LA MAQUETTE, et absente du produit jusqu'ici.
 * C'est ce qui distingue un tableau de bord d'un cockpit : un programme qui lit
 * « 3 invitations envoyées · 0 acceptée » sait compter. Ce qu'il ne sait pas,
 * c'est laquelle appeler ce matin.
 *
 *     « Trois invitations partent, personne n'a encore accepté. C'est fréquent
 *       la première semaine : une relance nominative convertit mieux qu'un
 *       rappel automatique. CoolBricks a ouvert le lien sans finir — c'est
 *       celle-là qu'il faut appeler. »
 *
 * TROIS RÈGLES qui rendent ce mécanisme honnête :
 *
 *  1. Le conseil NOMME. « CoolBricks a ouvert le lien sans finir » vaut dix
 *     fois « certaines invitations ont été ouvertes ». Sans nom, c'est un
 *     bandeau publicitaire ; avec, c'est une consigne.
 *  2. Il ne se déclenche que sur un état RÉEL et vérifiable. Aucune phrase
 *     n'est rendue « au cas où » — pas de conseil vaut mieux qu'un conseil qui
 *     décrit une situation qui n'est pas celle du lecteur.
 *  3. UN SEUL à la fois, le plus urgent. Trois conseils empilés ne se lisent
 *     pas, et le programme ne saurait plus par quoi commencer — soit l'inverse
 *     exact du but.
 *
 * Module NEUTRE (cf. AGENTS.md) : rendu côté serveur, mais il ne dépend
 * d'aucun runtime. Il renvoie une CLÉ et des paramètres, jamais du texte : la
 * traduction reste dans les catalogues.
 */

export interface EtatCohorte {
  /** Entreprises ayant accepté. */
  membres: number;
  /** Salles ouvertes par ces entreprises. */
  salles: number;
  /** Invitations parties, sans réponse, non périmées. */
  enAttente: number;
  /** Invitations parties au total (acceptées comprises). */
  envoyees: number;
  /** Nom d'une invitation OUVERTE sans suite — la plus prometteuse. */
  ouverteSansSuite: string | null;
  /** Nom d'une entreprise arrivée mais dont le dossier est vide. */
  arriveeSansDossier: string | null;
  /** Une entreprise a un dossier entamé mais n'a pas donné son accord de listage. */
  entameeSansAccord: string | null;
}

export interface Conseil {
  /** Clé sous `cohorts.advice`. */
  cle: string;
  params: Record<string, string | number>;
}

/**
 * Le conseil du jour, ou rien.
 *
 * L'ORDRE EST LA LOGIQUE. On descend du plus actionnable au plus général :
 * quelqu'un à appeler maintenant, puis quelqu'un à accompagner, puis un geste
 * à faire, puis le simple constat. Le premier qui s'applique gagne.
 */
export function conseilCohorte(e: EtatCohorte): Conseil | null {
  // 1. Quelqu'un a ouvert le lien sans finir. C'est le coup de fil du jour :
  //    il a vu, il a hésité, il est joignable.
  if (e.ouverteSansSuite) {
    return {
      cle: e.membres === 0 ? "openedNoneJoined" : "opened",
      params: { nom: e.ouverteSansSuite, envoyees: e.envoyees },
    };
  }

  // 2. Une entreprise est arrivée et son dossier est vide. Le moment où un
  //    accompagnement se joue — et où il se perd si personne ne dit rien.
  if (e.arriveeSansDossier) {
    return { cle: "joinedEmpty", params: { nom: e.arriveeSansDossier } };
  }

  // 3. Un dossier est entamé mais l'entreprise n'a pas donné son accord : la
  //    publication est bloquée par un geste qui ne dépend pas du programme.
  if (e.entameeSansAccord) {
    return { cle: "startedNoConsent", params: { nom: e.entameeSansAccord } };
  }

  // 4. Des invitations dorment, aucune ouverte. Rien à cibler : on explique ce
  //    qui marche, sans désigner personne.
  if (e.membres === 0 && e.enAttente > 0) {
    return { cle: "waiting", params: { n: e.enAttente } };
  }

  // 5. Cohorte vide et aucune invitation : l'état vide de l'écran dit déjà
  //    tout. Un conseil de plus ferait doublon.
  return null;
}
