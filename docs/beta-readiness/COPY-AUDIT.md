# Audit des textes visibles

**Méthode :** recherche exhaustive des formulations proscrites au §5 du brief,
puis lecture des écrans du périmètre bêta.

## Marqueurs proscrits — résultat

| Formulation | Occurrences dans la copie visible |
|---|---|
| Oups | **0** |
| Une erreur est survenue | **0** |
| Erreur inattendue | **0** |
| Veuillez réessayer ultérieurement | **0** |
| Quelque chose s'est mal passé | **0** |
| Propulsé par l'IA | **0** |
| Analyse intelligente | **0** |
| Recommandation intelligente | **0** |
| Expérience fluide | **0** |
| Solution innovante | **0** |
| Il vous suffit / Vous pouvez simplement | **0** |

Les quelques correspondances trouvées par `grep` sont **la liste des mots
interdits elle-même**, dans `domain/erreurs.test.ts`, plus un commentaire de
code. Aucune n'atteint un écran.

Aucun emoji dans l'interface. Les `✓` rencontrés sont des coches typographiques
dans des pastilles d'étape, pas des emoji.

## Ce qui a changé

| Ancien texte | Nouveau texte | Écran |
|---|---|---|
| `duplicate key value violates unique constraint` | Cette personne fait déjà partie de l'équipe. | Équipe |
| `permission denied for relation deals` | Seuls le propriétaire et les administrateurs gèrent l'équipe. | Équipe |
| `le dossier contient 3 document(s)` | Ce dossier contient des pièces. Déplacez-les ou supprimez-les avant de le retirer. | Data room |
| `The resource already exists` | Une pièce portant ce nom vient d'être déposée. Renommez le fichier avant de réessayer. | Dépôt |
| `Payload too large` | Ce fichier dépasse la taille autorisée. Compressez-le ou déposez-le en plusieurs pièces. | Dépôt |
| `MFA challenge failed` | La double authentification n'a pas pu être activée. Réessayez dans un instant. | Sécurité |
| `Email link is invalid or has expired` (via `errorRaw`) | Ce lien n'est plus valide. Demandez un nouveau lien de réinitialisation. | Connexion |
| Une erreur est survenue. | L'action n'a pas abouti. Réessayez ; si cela se reproduit, écrivez-nous. | Connexion, Nouvelle opération |
| Le paiement n'a pas pu être ouvert. | Le paiement n'a pas pu être ouvert **et rien ne vous a été débité**. Réessayez dans un instant, ou écrivez-nous. | Abonnement |
| *(aucun message)* | Le ticket minimum dépasse le maximum. Inversez les deux montants. | Levée |
| Valider *(bouton mort)* | Archiver l'opération | Liste des opérations |
| Indiquez un montant. | Indiquez le montant engagé. / Le montant engagé ne peut pas être négatif. | Engagements |

Le catalogue complet, avec ses 81 textes, est dans
`src/features/v2/domain/erreurs.ts` — et testé : longueur minimale, ponctuation
finale, absence de jargon, absence de formulation proscrite.

## Règle appliquée aux messages d'erreur

Chaque texte répond dans l'ordre : ce qui s'est passé, la conséquence quand elle
n'est pas évidente, ce qu'on peut faire. Deux phrases au plus.

Une exception assumée : les messages de paiement disent **d'abord** qu'aucun
débit n'a eu lieu. C'est la seule question qu'on se pose à cet instant, et
l'ordre canonique la reléguerait en fin de phrase.

## Libellés vagues

Un seul subsiste : **« Continuer »** dans `Onboarding.tsx:212`, sur l'étape
« objectif ».

Il est **volontairement conservé**. L'étape suivante dépend du choix fait ; le
bouton ne peut pas nommer une action unique sans mentir dans la moitié des cas.
Le bouton voisin, lui, est explicite : « Je ne sais pas encore ».

Aucun `OK`, aucun `Valider`, aucun `Soumettre`.

## Données fictives encore présentes

**Trois écrans**, tous hors périmètre bêta — mais **aucun n'est correctement
fermé**, et c'est un manquement au §3 du brief.

| Écran | Fixture | Accès | Statut |
|---|---|---|---|
| `CohortJoin` | « Nimba Solar », « Série A 2026 » — écran entier en dur | `/v2/invitations/rejoindre` | ⚠️ atteignable par URL |
| `Invitations` — panneau cohorte | « Nimba Solar · Énergie · Sénégal » | `/v2/invitations?vue=cohorte` | ⚠️ atteignable par URL |
| `ImportList` | « Banque Atlantique Sénégal » | `…/preparation?import=1` | ⚠️ atteignable par URL |

Les deux premiers relèvent des **cohortes**, dont la table `cohort_links`
n'existe pas. Le troisième est l'import de liste reçue : rien en base ne fait
l'extraction, et `checklist_items` n'a pas de colonne pour porter la provenance
— l'écran est resté une maquette délibérément.

**Aucun n'est protégé par un drapeau.** Le brief demande que le hors-périmètre
soit « masqué, désactivé, protégé par feature flag, ou inaccessible ». Un
paramètre d'URL deviné suffit à les afficher.

**Recommandation : les fermer avant la bêta.** C'est une heure de travail, et
c'est ce qui sépare « hors périmètre » de « présent mais faux ».

### Dans les parcours bêta

**Zéro fixture.** Le rail d'opération, la liste des opérations, la data room, la
préparation, le partage, la levée et le pipeline lisent tous la base. Les états
vides affichent un état vide, jamais une donnée inventée.

## Réserve

Cet audit porte sur les textes **présents dans le code**. Il ne dit pas si le
bon texte s'affiche au bon moment — cela demande la suite authentifiée.
