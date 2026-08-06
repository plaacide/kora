# ADR-005 : L'investisseur externe

**Statut :** **ACCEPTÉ le 6 août 2026** — **option B**, contre la recommandation
initiale. Tranché par le fondateur : « la Dealroom est accessible sans compte ».
**Date :** 5 août 2026
**Branche :** `v2/rebuild`
**Décideur :** fondateur
**Déclencheur :** écrans 29 à 33 du paquet `parcours-programme`.

## Contexte

Les écrans 30 à 33 vivent **hors de l'application** : URL brandée par Dealroom,
non indexée, ouverte par un lien nominatif — « le lien est personnel, transféré
il n'ouvre pas l'accès » (29), « invitation liée à l'adresse e-mail » (23).

Le mécanisme existe déjà pour la vitrine de cohorte : `accept_showcase_invite()`
compare l'adresse du compte connecté à celle de l'invitation. Ce qui implique,
noir sur blanc, que **l'investisseur a un compte**. Or l'écran 29 ne montre qu'un
bouton « Accéder à la Dealroom » : le paquet ne dit nulle part si l'on demande à
un investisseur de s'inscrire.

Trois risques concrets, indépendants de l'option retenue :

- **Énumération.** Une URL en `/d/<slug>` lisible révèle l'existence et le nom
  des Dealrooms. Un identifiant opaque coûte la même chose à écrire.
- **Cache.** Une page brandée rendue côté serveur et mise en cache par chemin
  peut servir le contenu d'un locataire à un autre. Le cache doit porter
  l'identité, ou ne pas exister.
- **Fuite par les fichiers.** Les logos partenaires et la bannière sont des
  fichiers : servis depuis un bucket public, ils fuient hors de la Dealroom.

## Options

### A — Compte investisseur obligatoire (mécanisme actuel)

**Pour :** identité vérifiée, révocation propre, journal nominatif — l'écran 27
affiche « a consulté 3 fiches », ce qui exige une identité. Rien à construire :
le parcours `/onboarding/investisseur` existe.
**Contre :** friction. Un partenaire à qui l'on montre une sélection doit créer
un compte.

### B — Lien à usage unique, session courte sans compte

**Pour :** aucune friction.
**Contre :** « transféré, il n'ouvre pas l'accès » devient faux — un lien qui
ouvre une session est transférable par nature. Contredit un texte affiché à
l'investisseur, écran 29.

### C — Code envoyé par e-mail à l'entrée

**Pour :** tient la promesse du 29 sans imposer un mot de passe. L'adresse est
prouvée à chaque session.
**Contre :** un aller-retour par session ; dépend de la délivrabilité e-mail.

## Arbitrage — rendu le 6 août 2026

**B. La Dealroom s'ouvre sans compte.** Un investisseur — ou toute autre
personne à qui le lien parvient — voit la Dealroom, puis **choisit** de créer un
compte ou non. Le compte est proposé, jamais exigé.

C'est l'inverse de la recommandation ci-dessus, et le fondateur a tranché en
connaissance de l'objection : la friction d'une inscription devant une
sélection qu'on veut *montrer* pèse plus lourd que ce que l'identité apporte.

### Ce que cet arbitrage rend faux, et qu'il faut corriger

Trois textes de la maquette supposent l'option A. Ils ne décrivent plus le
produit et doivent être réécrits avant d'être intégrés :

| Écran | Le texte qui devient faux |
|---|---|
| 29 — e-mail d'invitation | « le lien est personnel, transféré il n'ouvre pas l'accès » |
| 23 — publier | « invitation liée à l'adresse e-mail » |
| 27 — audience | « a consulté 3 fiches », attribué nominativement |

**Le lien EST l'accès.** Un lien transféré ouvre la Dealroom : c'est la
conséquence directe et assumée du choix. En découlent trois règles :

- **La révocation change de nature.** On ne retire pas l'accès à quelqu'un qui
  n'a pas d'identité. Révoquer, c'est désormais éteindre un lien — pour tous
  ceux qui l'ont. Prévoir plusieurs liens par Dealroom si l'on veut pouvoir en
  couper un sans couper les autres.
- **L'audience se scinde en deux.** Les visiteurs sans compte se comptent
  (combien de vues, quelles fiches) mais ne se nomment pas. Seuls ceux qui ont
  créé un compte apparaissent nommément à l'écran 27. L'écran doit montrer les
  deux, et dire lequel est lequel — un compteur anonyme présenté comme une
  identité serait un mensonge d'interface.
- **Le consentement de l'entreprise doit le dire.** Une entreprise qui accepte
  d'être publiée accepte désormais d'être vue **sans authentification**. Le
  texte de l'accord (ADR-002) doit l'énoncer : c'est ce sur quoi elle s'engage.

### Ce qui devient plus important, pas moins

Les trois risques listés en contexte étaient conditionnels ; ils sont maintenant
la seule protection qui reste :

1. **Identifiant opaque** dans l'URL publique — c'est désormais le *seul* secret
   qui protège la Dealroom. Un slug lisible se devine.
2. **Aucun cache par chemin** : une page brandée servie depuis le cache d'un
   locataire à un autre n'a plus aucune barrière d'authentification derrière
   elle pour rattraper l'erreur.
3. **Bannière et logos par URL signée**, jamais depuis un bucket public — sans
   quoi les fichiers d'une Dealroom fuient hors d'elle.

## Conséquences

- Devient plus simple : l'entrée, qui n'a plus d'onboarding ; la démonstration
  à un partenaire, qui tient dans un lien.
- Devient plus dur : la révocation, le journal nominatif, l'écran 27
  « audience » — tout ce que l'identité rendait gratuit.
- À revisiter : le NDA Dealroom (écran 23). Un NDA suppose un signataire
  identifié ; il ne peut donc plus se placer *avant* l'entrée. Soit il
  disparaît, soit il devient la marche qui déclenche la création de compte.
  **Non tranché.**

## Suites

1. [x] Trancher l'option — **B, le 6 août 2026**.
2. [ ] Identifiant de Dealroom opaque dans l'URL publique. **Devenu critique** :
       c'est le seul secret qui protège la Dealroom.
3. [ ] Vérifier que le rendu brandé ne peut pas être mis en cache entre
       locataires.
4. [ ] Servir bannière et logos par URL signée, jamais depuis un bucket public.
5. [ ] Jouer le parcours investisseur de bout en bout, ce qui n'a jamais été
       fait.
6. [ ] Réécrire les trois textes que l'arbitrage rend faux (écrans 29, 23, 27).
7. [ ] Décider du sort du NDA Dealroom, qui ne peut plus précéder l'entrée.
8. [ ] Énoncer dans l'accord de l'entreprise qu'elle sera vue sans
       authentification.
