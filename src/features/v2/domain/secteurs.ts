/**
 * Les secteurs d'activité — pour la fiche d'entreprise.
 *
 * DEUX ERREURS DE SUITE, ET LA SECONDE ÉTAIT LA MIENNE. L'onboarding en
 * proposait cinq, écrits en dur : une entreprise de logistique ou de BTP
 * n'avait rien à cocher. J'ai corrigé en en mettant trente-six, rangés en
 * quatre groupes — et une liste de trente-six oblige à lire trente-six lignes
 * pour cocher la bonne. On ne demande pas ici un code d'activité, on demande de
 * quoi vit l'entreprise.
 *
 * Dix suffisent, « Autre » compris. Chacun est assez large pour accueillir sans
 * hésitation : une fintech se range dans « Services financiers », une plateforme
 * agricole dans « Agriculture et agroalimentaire ». Le doute qu'on ne veut pas,
 * c'est « ma startup de livraison est-elle en Logistique ou en Commerce en
 * ligne ? » — une question dont la réponse n'intéresse personne.
 *
 * PAS DE GROUPES. Ils servaient à rendre trente-six entrées parcourables ; sur
 * dix, ils ajoutent une hiérarchie que l'œil doit traverser pour rien.
 */

export const SECTEURS: readonly string[] = [
  "Agriculture et agroalimentaire",
  "Commerce et distribution",
  "Éducation et formation",
  "Énergie",
  "Industrie et BTP",
  "Santé",
  "Services financiers",
  "Technologies et télécoms",
  "Transport et logistique",
  // L'échappatoire reste, et elle est en dernier. Un champ fermé sans issue se
  // contourne en salissant le champ voisin.
  "Autre secteur",
];
