/**
 * La frontière entre ce que la base dit et ce que le fondateur lit.
 *
 * POURQUOI CE FICHIER EXISTE. Cinquante-sept retours d'échec renvoyaient une
 * chaîne libre, et trente-six d'entre eux y mettaient `error.message` — la
 * contrainte Postgres partait telle quelle vers le navigateur. Les deux
 * `traduire()` locales, écrites séparément dans `team/` et `abonnement/`,
 * finissaient elles aussi par `return message` dès qu'une clé manquait. Et
 * l'interface écrivait `res.error ?? "message humain"` : comme `error` était
 * toujours renseigné, LES VINGT-QUATRE REPLIS HUMAINS ÉTAIENT DU CODE MORT.
 *
 * Le remède n'est pas de corriger trente-six lignes — la trente-septième
 * reviendrait sans que rien ne la signale, un message brut étant un `string`
 * parfaitement valide. Le remède est que le type refuse le texte libre :
 * `code` est une union fermée, aucun champ ne porte de phrase. `error.message`
 * ne compile plus, et le compilateur énumère le travail à notre place.
 *
 * Un seul endroit met les mots, et il est testé.
 */

import { texteDeRefus } from "../billing/limites";

export type CodeErreur =
  // Transverses
  | "droits.insuffisants"
  | "session.expiree"
  | "session.absente"
  | "inattendu"
  // Limites de plan — le texte vient de `billing/limites`, qui porte déjà
  // l'issue à proposer.
  | "limite.operations_actives"
  | "limite.membres_internes"
  | "limite.visiteurs_externes"
  | "limite.stockage"
  | "limite.autre"
  // Opération
  | "operation.nom_requis"
  | "operation.introuvable"
  // Équipe
  | "equipe.adresse_invalide"
  | "equipe.droits_insuffisants"
  | "equipe.role_invalide"
  | "equipe.dernier_proprietaire"
  | "equipe.retrait_de_soi"
  | "equipe.nomination_reservee"
  | "equipe.membre_introuvable"
  | "equipe.deja_membre"
  | "equipe.invitation_traitee"
  | "equipe.invitation_non_creee"
  // Partage et accès
  | "acces.destinataire_requis"
  | "acces.adresse_invalide"
  | "acces.perimetre_vide"
  | "acces.invitation_introuvable"
  | "acces.invitation_expiree"
  | "acces.invitation_revoquee"
  | "acces.invitation_deja_acceptee"
  | "acces.autre_adresse"
  // Demandes d'accès
  | "demande.introuvable"
  | "demande.deja_traitee"
  | "demande.expiree"
  | "demande.relance_unique"
  // Data room
  | "document.nom_requis"
  | "document.introuvable"
  | "document.invalide"
  | "document.version_invalide"
  | "document.envoi_echoue"
  | "document.trop_volumineux"
  | "document.deja_depose"
  | "document.envoi_annule"
  | "dossier.nom_requis"
  | "dossier.introuvable"
  | "dossier.non_vide"
  | "dossier.sous_dossiers"
  | "dossier.invalide"
  // Préparation
  | "exigence.intitule_trop_court"
  | "exigence.statut_inconnu"
  | "exigence.doublon"
  | "exigence.introuvable"
  | "preuve.introuvable"
  // Levée
  | "levee.nom_requis"
  | "levee.introuvable"
  | "levee.deja_en_cours"
  | "levee.aucune_en_cours"
  | "investisseur.requis"
  | "investisseur.nom_requis"
  | "investisseur.introuvable"
  | "engagement.montant_requis"
  | "engagement.montant_negatif"
  | "engagement.introuvable"
  | "interaction.introuvable"
  | "maj.introuvable"
  | "maj.deja_publiee"
  | "maj.titre_trop_court"
  | "maj.vide"
  | "maj.destinataire_requis"
  // Abonnement
  | "abonnement.plan_inconnu"
  | "abonnement.droits_insuffisants"
  | "abonnement.sans_tarif_public"
  | "abonnement.aucun"
  | "abonnement.aucune_resiliation"
  | "abonnement.tarif_illisible"
  | "abonnement.expire"
  // Paiement
  | "paiement.lenteur_prestataire"
  | "paiement.ouverture_impossible"
  // Sécurité
  | "securite.action_inconnue"
  | "securite.deconnexion_impossible"
  // Double facteur
  | "mfa.activation_impossible"
  | "mfa.code_invalide"
  | "mfa.desactivation_impossible";

/**
 * Un échec ne porte QU'un code. Pas de `message`, pas de `details` : le premier
 * champ de texte libre rouvrirait exactement la porte qu'on ferme ici.
 */
export interface Echec {
  ok: false;
  code: CodeErreur;
}

/**
 * `object` et non `Record<string, never>` : ce dernier rendait `{ ok: true }`
 * seul inassignable, alors que c'est le succès le plus courant.
 */
export type Resultat<T = object> = ({ ok: true } & T) | Echec;

export function echec(code: CodeErreur): Echec {
  return { ok: false, code };
}

/**
 * Ce que le fondateur lit.
 *
 * Chaque texte répond dans l'ordre : ce qui s'est passé, la conséquence quand
 * elle n'est pas évidente, puis ce qu'il peut faire. Deux phrases au plus —
 * une erreur qui s'explique en trois paragraphes est une erreur mal nommée.
 */
const MESSAGES: Record<CodeErreur, string> = {
  "droits.insuffisants":
    "Vous n’avez pas l’autorisation de faire cela. Demandez à un administrateur de l’organisation.",
  "session.expiree":
    "Votre session a expiré. Reconnectez-vous pour reprendre où vous en étiez.",
  "session.absente": "Connectez-vous d’abord pour continuer.",
  inattendu:
    "L’action n’a pas abouti. Réessayez ; si cela se reproduit, écrivez-nous.",

  "limite.operations_actives": texteDeRefus("active_deals"),
  "limite.membres_internes": texteDeRefus("internal_users"),
  "limite.visiteurs_externes": texteDeRefus("external_visitors"),
  "limite.stockage": texteDeRefus("storage_gb"),
  "limite.autre": texteDeRefus("inconnue"),

  "operation.nom_requis": "Donnez un nom à cette opération.",
  "operation.introuvable":
    "Cette opération n’existe plus. Elle a peut-être été supprimée depuis un autre onglet.",

  "equipe.adresse_invalide": "Cette adresse e-mail n’est pas valide.",
  "equipe.droits_insuffisants":
    "Seuls le propriétaire et les administrateurs gèrent l’équipe.",
  "equipe.role_invalide": "Ce rôle n’est pas un rôle d’équipe.",
  "equipe.dernier_proprietaire":
    "C’est le seul propriétaire. Nommez-en un autre avant de changer celui-ci — sinon plus personne ne pourrait administrer l’organisation.",
  "equipe.retrait_de_soi":
    "Vous ne pouvez pas vous retirer vous-même depuis cet écran.",
  "equipe.nomination_reservee":
    "Seul un propriétaire peut nommer un autre propriétaire.",
  "equipe.membre_introuvable": "Ce collaborateur n’existe plus.",
  "equipe.deja_membre": "Cette personne fait déjà partie de l’équipe.",
  "equipe.invitation_traitee":
    "Cette invitation a déjà été acceptée ou révoquée.",
  "equipe.invitation_non_creee":
    "L’invitation n’a pas pu être créée. Réessayez dans un instant.",

  "acces.destinataire_requis": "Indiquez l’adresse du destinataire.",
  "acces.adresse_invalide": "Cette adresse e-mail n’est pas valide.",
  "acces.perimetre_vide":
    "Un accès doit ouvrir au moins un dossier. Choisissez ce que cette personne pourra consulter.",
  "acces.invitation_introuvable": "Cet accès n’existe plus.",
  "acces.invitation_expiree":
    "Cette invitation a expiré. Le lien ne fonctionne plus : envoyez-en une nouvelle.",
  "acces.invitation_revoquee":
    "Cette invitation a été révoquée. Le lien ne fonctionne plus.",
  "acces.invitation_deja_acceptee": "Cette invitation a déjà été acceptée.",
  "acces.autre_adresse":
    "Cette invitation vise une autre adresse. Connectez-vous avec celle qui l’a reçue.",

  "demande.introuvable": "Cette demande n’existe plus.",
  "demande.deja_traitee": "Cette demande a déjà reçu une réponse.",
  "demande.expiree": "Cette demande a expiré. Elle doit être relancée.",
  "demande.relance_unique":
    "Vous avez déjà relancé cette demande une fois. Contactez la personne directement.",

  "document.nom_requis": "Le nom ne peut pas être vide.",
  "document.introuvable": "Cette pièce n’existe plus.",
  "document.invalide": "Cette pièce ne peut pas être utilisée ici.",
  "document.version_invalide": "Cette version n’existe plus.",
  "document.envoi_echoue":
    "L’envoi du fichier a été interrompu. Vérifiez votre connexion puis réessayez.",
  "document.trop_volumineux":
    "Ce fichier dépasse la taille autorisée. Compressez-le ou déposez-le en plusieurs pièces.",
  "document.deja_depose":
    "Une pièce portant ce nom vient d’être déposée. Renommez le fichier avant de réessayer.",
  // Un dépôt annulé n'est pas un incident : le texte le dit sans dramatiser.
  "document.envoi_annule": "Envoi annulé. Rien n’a été déposé.",
  "dossier.nom_requis": "Donnez un nom au dossier.",
  "dossier.introuvable": "Ce dossier n’existe plus.",
  "dossier.non_vide":
    "Ce dossier contient des pièces. Déplacez-les ou supprimez-les avant de le retirer.",
  "dossier.sous_dossiers":
    "Ce dossier contient des sous-dossiers. Videz-le avant de le retirer.",
  "dossier.invalide": "Ce dossier ne peut pas recevoir cette pièce.",

  "exigence.intitule_trop_court": "L’intitulé est trop court.",
  "exigence.statut_inconnu": "Ce statut n’existe pas.",
  "exigence.doublon": "Cette exigence figure déjà dans la liste.",
  "exigence.introuvable": "Cette exigence n’existe plus.",
  "preuve.introuvable": "Cette pièce n’est plus associée à cette exigence.",

  "levee.nom_requis": "Indiquez un nom pour cette levée.",
  "levee.introuvable": "Cette levée n’existe plus.",
  "levee.deja_en_cours":
    "Une levée est déjà en cours sur cette opération. Clôturez-la avant d’en ouvrir une autre.",
  "levee.aucune_en_cours":
    "Aucune levée n’est en cours sur cette opération. Ouvrez-en une d’abord.",
  "investisseur.requis": "Choisissez un investisseur.",
  "investisseur.introuvable": "Cet investisseur n’est plus au pipeline.",
  "investisseur.nom_requis": "Indiquez le nom de cet investisseur.",
  "engagement.montant_requis": "Indiquez le montant engagé.",
  "engagement.montant_negatif": "Le montant engagé ne peut pas être négatif.",
  "engagement.introuvable": "Cet engagement n’existe plus.",
  "interaction.introuvable": "Cette interaction n’existe plus.",
  "maj.introuvable": "Cette mise à jour n’existe plus.",
  "maj.deja_publiee":
    "Cette mise à jour est déjà publiée. Publiez une correction plutôt que de la modifier.",
  "maj.titre_trop_court": "Le titre est trop court.",
  "maj.vide": "Une mise à jour vide ne se publie pas.",
  "maj.destinataire_requis":
    "Choisissez au moins un destinataire avant de publier.",

  "abonnement.plan_inconnu": "Ce plan n’existe pas ou n’est plus proposé.",
  "abonnement.droits_insuffisants":
    "Seuls le propriétaire et les administrateurs gèrent l’abonnement.",
  "abonnement.sans_tarif_public":
    "Ce plan n’a pas de tarif public. Écrivez-nous pour l’activer.",
  "abonnement.aucun": "Aucun abonnement à résilier.",
  "abonnement.aucune_resiliation":
    "Aucune résiliation en cours — votre abonnement suit son cours.",
  "abonnement.tarif_illisible":
    "Le tarif de ce plan n’a pas pu être lu. Réessayez dans un instant.",
  "abonnement.expire":
    "Votre abonnement a expiré. Reprenez un plan pour retrouver cette action.",

  // « Rien ne vous a été débité » avant tout le reste : c.est la seule question
  // que se pose quelqu.un dont le paiement vient d.échouer.
  "paiement.lenteur_prestataire":
    "Notre prestataire de paiement met plus de temps que d’habitude à répondre. Rien ne vous a été débité — réessayez dans quelques minutes.",
  "paiement.ouverture_impossible":
    "Le paiement n’a pas pu être ouvert et rien ne vous a été débité. Réessayez dans un instant, ou écrivez-nous.",

  "securite.action_inconnue": "Cette action de sécurité n’existe pas.",
  "securite.deconnexion_impossible":
    "Les autres sessions n’ont pas pu être fermées. Réessayez dans un instant.",

  "mfa.activation_impossible":
    "La double authentification n’a pas pu être activée. Réessayez dans un instant.",
  // La cause la plus fréquente est une horloge décalée, pas un mauvais code :
  // le dire évite de retaper trois fois la même chose.
  "mfa.code_invalide":
    "Ce code n’est pas le bon. Vérifiez l’heure de votre téléphone, puis saisissez le code affiché.",
  "mfa.desactivation_impossible":
    "La double authentification n’a pas pu être désactivée. Réessayez dans un instant.",
};

export function messageDErreur(code: CodeErreur): string {
  return MESSAGES[code];
}

/**
 * Les fragments que la base emploie, et le code qui leur correspond.
 *
 * L'ordre compte : le premier fragment trouvé gagne. « invitation introuvable
 * ou déjà traitée » doit donc précéder « invitation introuvable », sans quoi le
 * second l'attraperait et dirait moins que ce qui s'est passé.
 */
const FRAGMENTS: ReadonlyArray<readonly [string, CodeErreur]> = [
  ["invitation introuvable ou déjà traitée", "equipe.invitation_traitee"],
  ["seul un propriétaire nomme un propriétaire", "equipe.nomination_reservee"],
  ["dernier propriétaire", "equipe.dernier_proprietaire"],
  ["retrait de soi-même", "equipe.retrait_de_soi"],
  ["membre introuvable", "equipe.membre_introuvable"],
  ["rôle interne attendu", "equipe.role_invalide"],
  // La base écrit l'apostrophe des deux façons selon la migration.
  ["déjà dans l’équipe", "equipe.deja_membre"],
  ["déjà dans l'équipe", "equipe.deja_membre"],

  ["un accès doit ouvrir au moins un dossier", "acces.perimetre_vide"],
  ["périmètre invalide", "acces.perimetre_vide"],
  ["invitation déjà acceptée", "acces.invitation_deja_acceptee"],
  ["invitation expirée", "acces.invitation_expiree"],
  ["invitation révoquée", "acces.invitation_revoquee"],
  ["cette invitation vise une autre adresse", "acces.autre_adresse"],
  ["invitation adressée à une autre adresse", "acces.autre_adresse"],
  ["cette invitation ne vous est pas destinée", "acces.autre_adresse"],
  ["invitation inconnue", "acces.invitation_introuvable"],
  ["invitation introuvable", "acces.invitation_introuvable"],

  ["vous avez déjà relancé cette demande une fois", "demande.relance_unique"],
  ["cette demande a déjà reçu une réponse", "demande.deja_traitee"],
  ["cette demande a expiré", "demande.expiree"],
  ["demande introuvable", "demande.introuvable"],

  ["le dossier contient des sous-dossiers", "dossier.sous_dossiers"],
  ["le dossier contient", "dossier.non_vide"],
  ["dossier introuvable", "dossier.introuvable"],
  ["dossier invalide", "dossier.invalide"],
  ["document introuvable", "document.introuvable"],
  ["document invalide", "document.invalide"],
  ["version invalide", "document.version_invalide"],
  ["pièce introuvable", "document.introuvable"],

  ["exigence déjà présente", "exigence.doublon"],
  ["intitulé trop court", "exigence.intitule_trop_court"],
  ["libellé trop court", "exigence.intitule_trop_court"],
  ["preuve introuvable", "preuve.introuvable"],
  ["élément introuvable", "exigence.introuvable"],

  ["cette data room a déjà une levée en cours", "levee.deja_en_cours"],
  ["la data room cible a déjà une levée en cours", "levee.deja_en_cours"],
  ["une levée est déjà en cours", "levee.deja_en_cours"],
  ["aucune levée en cours", "levee.aucune_en_cours"],
  ["levée introuvable", "levee.introuvable"],
  ["investisseur introuvable", "investisseur.introuvable"],
  ["engagement introuvable", "engagement.introuvable"],
  ["interaction introuvable", "interaction.introuvable"],
  ["mise à jour déjà publiée", "maj.deja_publiee"],
  ["mise à jour introuvable", "maj.introuvable"],
  ["brouillon introuvable ou déjà publié", "maj.deja_publiee"],
  ["aucun destinataire", "maj.destinataire_requis"],
  ["impossible de publier une réponse vide", "maj.vide"],
  ["titre trop court", "maj.titre_trop_court"],
  ["note vide", "maj.vide"],

  ["plan inconnu", "abonnement.plan_inconnu"],
  ["aucun abonnement en cours", "abonnement.aucun"],
  ["aucune résiliation à reprendre", "abonnement.aucune_resiliation"],
  ["abonnement expiré", "abonnement.expire"],

  ["action de sécurité inconnue", "securite.action_inconnue"],

  ["nom requis", "operation.nom_requis"],
  ["deal introuvable", "operation.introuvable"],
  ["salle inconnue", "operation.introuvable"],

  ["non authentifié", "session.absente"],
  ["adresse invalide", "equipe.adresse_invalide"],
  ["email invalide", "equipe.adresse_invalide"],

  // En dernier : ces deux-là apparaissent dans des messages plus précis.
  ["droits insuffisants", "droits.insuffisants"],
  ["accès refusé", "droits.insuffisants"],
  ["réservé", "droits.insuffisants"],
];

const LIMITES: Record<string, CodeErreur> = {
  active_deals: "limite.operations_actives",
  internal_users: "limite.membres_internes",
  external_visitors: "limite.visiteurs_externes",
  storage_gb: "limite.stockage",
};

/**
 * Le SEUL endroit du codebase qui a le droit de regarder un message Postgres.
 *
 * Tout ce qui n'est pas reconnu devient `inattendu` — jamais le texte d'origine.
 * C'est délibéré : une erreur qu'on n'a pas su nommer est un trou dans ce
 * catalogue, et le fondateur n'a pas à lire nos trous. Le message brut part
 * dans `console.error`, où il sert à qui peut en faire quelque chose.
 */
/**
 * Ce qu'un dépôt refusé par le stockage veut dire, à partir du seul statut.
 *
 * Le corps de la réponse porte le message anglais de Supabase Storage ; le
 * statut suffit à dire ce que le fondateur doit faire, et lui ne parle pas
 * anglais.
 */
export function codeDepotRefuse(statut: number): CodeErreur {
  if (statut === 413) return "document.trop_volumineux";
  if (statut === 409) return "document.deja_depose";
  if (statut === 401 || statut === 403) return "droits.insuffisants";
  return "document.envoi_echoue";
}

export function codeDepuisPostgres(message: string): CodeErreur {
  const bas = message.toLowerCase();

  const limite = bas.match(/limite atteinte\s*:\s*([a-z_]+)/);
  if (limite) return LIMITES[limite[1]] ?? "limite.autre";

  // Le palier programme n'est pas une limite d'abonnement du fondateur.
  if (bas.includes("palier atteint")) return "limite.autre";

  const trouve = FRAGMENTS.find(([fragment]) => bas.includes(fragment));
  return trouve ? trouve[1] : "inattendu";
}
