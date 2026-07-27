# Sanza — onboarding & premiers états du persona Programme (17 écrans)

**Spécification d'implémentation.** Maquette : `Sanza Programme Onboarding.dc.html` (les 17 écrans, numérotés, dans l'ordre du parcours). Complète `PROGRAMME-COHORTES-DEALROOM.md` (modèle de données §2, navigation §1) — lisez les deux, celui-ci décrit le *parcours*, l'autre les *règles*.

---

## 0. Règles absolues

1. Réutiliser `SanzaLogo`, `NavIcon`, `EncryptionBadge`, `ResonanceArcs`, `Topbar`, `Sidebar`, `EmptyState`, `Modal`, `personaLabel`. Ne rien redessiner.
2. Aucun texte en dur — namespace `onboarding.sae` + textes des états vides dans le namespace de chaque écran, fr **et** en.
3. Zéro emoji. Icônes trait 1.6. Grammaire des vides : ce qui manque + à quoi sert l'écran + **une** action. Jamais « aucune donnée ».
4. Chaque étape d'onboarding **enregistre à la validation** (server action) — un abandon ne perd rien ; « Enregistrer et quitter » est présent sur chaque écran d'étape.
5. Aucune étape bloquante après la confirmation d'email : le compte est utilisable même sans cohorte ni invitation.
6. En cas de doute, s'arrêter et demander. Un commit par écran ou groupe d'écrans. Lint + tsc sans nouvelle erreur.

## 1. Auth (écrans 01–02)

**01 — Inscription.** Sélecteur de rôle à 3 cartes (Fondateur / Investisseur / **Programme** « J'accompagne des startups ») + nom, email pro, mot de passe, CGU. Le rôle choisi fixe `persona = "sae"` et tout le parcours qui suit.
**02 — Confirmation d'email.** L'écran qui accompagne `docs/emails/auth-01-confirm-signup.html` : adresse affichée, « Renvoyer le lien » (limité : 1/min), « Modifier l'adresse », note indésirables — qui précise que les invitations aux entreprises partiront du même expéditeur. Lien valable 24 h.

## 2. Onboarding en 3 étapes (03–05)

Gabarit : header sticky (logo, `ÉTAPE n / 3`, barre 130×4, « Enregistrer et quitter ») ; corps en grille `250px 1fr` — rail d'étapes reliées à gauche + encart contextuel, carte formulaire à droite.

**03 — Votre structure.** Type (Accélérateur / Incubateur / Venture studio / Programme public — chips choix unique), nom, pays, site web (optionnel), volume accompagné/an (optionnel). Encart Encre + arcs : « Vous ne verrez jamais les documents de vos entreprises. »
**04 — Votre première cohorte.** Nom, places (défaut = `cohort_limit` de l'organisation), début, fin visée, objectif (chips : Préparer à lever / Accès à la dette / Mise en conformité / Croissance commerciale). Encart « Deux notions » : cohorte vs dealroom.
**05 — Inviter vos entreprises.** Zone emails (virgules ou collage de liste), note : chaque fondateur accepte lui-même et garde la main sur ses documents. **Sautable** (« Je le ferai plus tard »). Matching par domaine si l'organisation existe déjà (spec Programme §2).

## 3. Bienvenue (06)

Plein écran Encre, arcs deux coins, checklist honnête : Structure ✓ · Cohorte ✓ · « 3 entreprises invitées — **en attente de leur réponse** » (pas une coche). Deux CTA : « Ouvrir ma cohorte » / « Inviter d'autres entreprises ». C'est le seul écran où l'attente se dit sans être un échec.

## 4. Le vide en cascade (07–10) — le cœur du sujet

Le programme ne possède rien : ses données n'existent que si des entreprises acceptent puis déposent. Trois vides successifs à rendre supportables :

**07 — Mes cohortes, aucune cohorte** (si l'étape 04 a été sautée). Explique ce qu'est une cohorte, une action : en créer une.
**08 — Cohorte, aucune entreprise.** « Rien n'apparaîtra ici avant qu'une entreprise ait accepté » + inviter. Compteur `0 / 15 places` jamais seul à l'écran.
**09 — Invitations envoyées, aucune réponse.** **Ne pas masquer l'attente** : table des invitations (email, entreprise, date, statut `ENVOYÉE / LIEN OUVERT / À RELANCER`), relance unitaire + groupée, bandeau de conseil qui désigne la meilleure cible (« lien ouvert sans finir — celle-là s'appelle »). Expiration 30 j.
**10 — Première entreprise, dossier à 0 %.** Bandeau vert « X a rejoint votre cohorte » + quoi faire maintenant (indiquer les pièces socle). Table à une ligne, badge `NOUVELLE`, montant « non renseigné », préparation 0 % sans barre pleine de gris menaçant. **« Publier le dealroom » désactivé avec sa raison** (aucun accord de listage, aucun dossier entamé). Sidebar : seul « Rapports » reste grisé, note « Rapports s'ouvre dès qu'une entreprise a entamé son dossier ».

Règle transverse sidebar : les entrées non atteignables sont grisées **avec la condition réelle en pied** — la liste des écrans grisés évolue de 07 à 10 (07 : tout sauf Mes cohortes ; 08–09 : Dealroom, Demandes, Rapports ; 10 : Rapports seul).

## 5. Les autres écrans vides (11–15)

**11 — Portefeuille.** Pas d'indicateurs à zéro (un dashboard à 0 % se lit comme un produit cassé) : EmptyState « Vos indicateurs attendent le premier dépôt » + ce qui les calculera. Actions : voir ma cohorte / relancer.
**12 — Questions & suggestions.** Explique la différence (une question attend une réponse, une suggestion non), visibilité limitée à l'entreprise visée. Action : écrire à une entreprise.
**13 — Dealroom.** « Aucune entreprise n'est encore listable » + les deux conditions nommées (accord de l'entreprise, dossier entamé). « Publier » désactivé. Deux cartes : ce que l'investisseur verra / ce qu'il pourra demander.
**14 — Demandes d'accès.** D'où viendront les demandes ; **pas de bouton** (rien à faire) ; rappel du rôle : transmettre avec avis / sans avis / écarter — l'entreprise accorde.
**15 — Rapports.** **Refuser de générer** sous le seuil (≥ 1 entreprise au dossier entamé), seuil nommé à l'écran, liste de ce que le rapport contiendra.

## 6. Compte (16–17)

**16 — Sécurité, premier jour.** Bandeau ambre : 2FA non activée — « vous verrez passer des dossiers confidentiels de tiers ; c'est la première chose que votre bailleur demandera ». Liste : 2FA (Activer, primaire) / mot de passe / sessions actives / journal de sécurité vide présenté comme normal. 2FA **visible, pas bloquante**.
**17 — Roadmap.** Trois colonnes En cours / Ensuite / À l'étude + EmptyState « Vous n'avez encore rien demandé » avec « Proposer une amélioration ».

## 7. Navigation et chrome (rappel, détails dans la spec Programme §1)

Sidebar : Portefeuille · Mes cohortes · Dealroom · Demandes d'accès · Rapports · [Mon compte] Sécurité · Roadmap — icônes `NavIcon.tsx`, plus deux tracés à ajouter (`dealroom`, `reports`). L'entrée active se calcule sur les **deux** groupes (Sécurité/Roadmap s'allument aussi). Topbar identique aux autres personas — recherche `shell.searchPlaceholder` (« Rechercher un deal, un document… », pas de surcharge `shell.sae.*`), FR, Déconnexion — **sans** `ShareButton` (pas de `dealId`).

## 8. Contrôles avant de rendre la main

- [ ] Un compte neuf traverse 01→17 sans jamais voir « aucune donnée », un spinner texte, ou un bouton mort sans raison affichée.
- [ ] Rechargement en cours d'onboarding : on reprend à l'étape atteinte, rien de perdu.
- [ ] Étape 05 sautée → l'écran 07 (aucune cohorte n'existe que si 04 aussi a été sauté) et 08–09 restent cohérents.
- [ ] Invitations : relance limitée (1 / 7 jours par invitation), expiration 30 j visible.
- [ ] La sidebar grisée change bien entre 07, 08–09 et 10, avec la condition exacte en pied.
- [ ] « Publier le dealroom » : désactivé tant que les deux conditions ne sont pas remplies — testé, pas seulement stylé.
- [ ] Toutes les chaînes dans fr.json **et** en.json.
- [ ] Rapport de PR : fait / laissé de côté et pourquoi / divergences constatées avec cette spec.
