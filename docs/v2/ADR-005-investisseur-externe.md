# ADR-005 : L'investisseur externe

**Statut :** Proposé — option A recommandée, C en repli
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

## Arbitrage

**A**, et **C** si la friction se révèle coûteuse — les deux partagent la même
table d'accès, le choix ne se fige donc pas. B est à écarter : il rend faux un
texte affiché à l'investisseur.

## Conséquences

- Devient plus simple : la révocation, le journal, l'écran 27 « audience ».
- Devient plus dur : l'onboarding investisseur, qui existe mais n'a jamais été
  joué de bout en bout.
- À revisiter : le NDA Dealroom (écran 23) se place avant l'entrée ; il réutilise
  le mécanisme NDA existant plutôt qu'un second.

## Suites

1. [ ] Trancher l'option.
2. [ ] Identifiant de Dealroom opaque dans l'URL publique.
3. [ ] Vérifier que le rendu brandé ne peut pas être mis en cache entre
       locataires.
4. [ ] Servir bannière et logos par URL signée, jamais depuis un bucket public.
5. [ ] Jouer le parcours investisseur de bout en bout, ce qui n'a jamais été
       fait.
