# Sanza — enquête produit in-app (4 questions, déclenchée après 30 min)

**Maquette de référence :** `Sanza Enquete UX.dc.html` (prototype cliquable + les 5 écrans).
Spécification d'implémentation. Les règles de la section 0 ne se négocient pas.

---

## 0. Règles absolues

1. **Ne réinventez rien.** Réutilisez `Modal` seulement si nécessaire — ce carton **n'est pas un modal** : pas de backdrop, pas de blocage, pas de piège au clavier. C'est un `aside` en `position: fixed` qui laisse l'app entièrement utilisable derrière.
2. **Aucun texte en dur.** Toutes les chaînes passent par `next-intl`, nouveau namespace `survey` dans `src/messages/fr.json` ET `en.json`.
3. **Zéro emoji**, icônes en trait (`currentColor`, strokeWidth 1.6–2), comme partout ailleurs.
4. **Aucune question obligatoire.** Chaque écran a une sortie sans réponse.
5. **Ne déclenchez jamais pendant une action.** Voir §2 : la liste des états de blocage est exhaustive et doit être respectée à la lettre.
6. **RGPD / consentement :** les réponses sont liées au `user_id` et à l'`org_id`, et c'est dit dans les CGU. N'enregistrez **aucune** donnée avant que l'utilisateur clique « D'accord » sur l'écran 0 — l'affichage du carton n'est pas un consentement.
7. **Vous ne créez pas de table sans passer par une migration**, vous ne modifiez pas la RLS d'une table existante, vous n'ajoutez pas de dépendance npm.
8. **En cas de doute, vous vous arrêtez et vous demandez.**
9. Un commit par section. `npm run lint` et `npx tsc --noEmit` sans nouvelle erreur.

---

## 1. Données

Nouvelle table, nouvelle migration (nom horodaté selon la convention du dépôt) :

```sql
create table survey_responses (
  id            bigint generated always as identity primary key,
  org_id        uuid not null references organizations(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  -- réponses, toutes nullables : aucune question n'est obligatoire
  mood          text check (mood in ('fluide','correct','bloque')),
  frictions     text[] default '{}',
  price_fair    text,
  price_too_high text,
  comment       text,
  -- contexte, pour croiser les réponses
  readiness     int,          -- score du deal courant au moment de la réponse
  docs_count    int,
  usage_minutes int,          -- minutes cumulées au déclenchement
  completed     boolean not null default false,
  created_at    timestamptz not null default now()
);
```

RLS : `insert`/`update` réservés à l'utilisateur lui-même (`user_id = auth.uid()`), `select` réservé au personnel interne Sanza. Un fondateur ne lit jamais les réponses des autres.

Table de suivi de l'invitation (pour ne pas relancer indéfiniment) — ou colonnes sur le profil existant, à votre appréciation, mais il faut persister :
`survey_last_prompt_at`, `survey_dismissed_forever boolean`, `survey_completed_at`.

⚠️ Le compteur d'usage doit être **serveur ou persistant**, pas un `useState`. Un fondateur qui recharge la page ne repart pas de zéro. Somme des minutes de session actives, plafonnée (une session inactive ne compte pas : arrêtez le compteur après 2 min sans interaction).

## 2. Déclenchement

Conditions **toutes** requises :
- `usage_minutes >= 30` (valeur en constante nommée, pas en littéral)
- `survey_dismissed_forever` faux
- `survey_completed_at` nul
- `survey_last_prompt_at` nul **ou** > 7 jours
- l'utilisateur est sur une route de la salle ou le dashboard — jamais sur `/login`, `/onboarding/*`, `/invitation/*`

**États de blocage — ne jamais afficher si :**
- un `Modal` est ouvert (partage, invitation, renommage, suppression…)
- un upload est en cours (`Uploader` actif) ou une pièce en cours de traitement
- la visionneuse (`/visionneuse`) est ouverte
- un formulaire a des modifications non enregistrées
- la fenêtre n'a pas le focus, ou l'onglet est masqué (`document.visibilityState`)

Si une condition de blocage tombe, on attend et on réessaie **60 s plus tard** — on ne renonce pas, et on ne fait pas la queue de plusieurs invitations.

## 3. Le carton

`position: fixed; right: 24px; bottom: 24px;` fond blanc, bordure `#E2DED4`, radius 12, ombre `0 18px 44px rgba(26,27,31,0.20)`, padding 18.
Deux largeurs : **300 px** replié (écrans 0 et 5), **372 px** déployé (écrans 1 à 4). L'entrée est la seule animation : `szrise` 0,34 s `cubic-bezier(.2,.8,.2,1)` — 14 px de bas en haut + fondu. Respectez `prefers-reduced-motion` (pas de translation).

Bandeau haut des écrans 1 à 4 : 4 points (le point actif est une barre de 16 px, `#E85C2B`, les suivants `#E2DED4` de 5 px), compteur `n / 4` en IBM Plex Mono 10 px `#9DA0A8`, puis une croix `×` alignée à droite qui vaut **« Plus tard »** (pas un abandon définitif).

Boutons : primaire `#E85C2B` (désactivé `#F1F0EB` / texte `#A9ACBB`), radius 6, 13 px semi-gras. Liens de sortie : 12 px, `#9DA0A8`, soulignés à 2 px d'écart.
Chips : radius 999, inactif `#fff` bordure `#E4E2DC` texte `#33353B` ; actif fond `#FDF1EA`, bordure et texte `#E85C2B` / `#C24619`.

## 4. Les cinq écrans

**0 — Invitation repliée** (300 px). Icône bulle dans un carré `#FDF1EA`. Titre « Une minute pour nous aider ? », corps « Quatre questions courtes sur votre expérience. Aucune n'est obligatoire. » Sorties : « Plus tard » / bouton « D'accord ».
→ « D'accord » crée la ligne `survey_responses` (`completed=false`) et enregistre le contexte (`readiness`, `docs_count`, `usage_minutes`).

**1 — Humeur.** « Comment ça se passe, dans Sanza ? » Trois cartes empilées, cliquables en entier :
`fluide` « Ça coule » / « Je fais ce que je viens faire » · `correct` « Correct » / « Quelques hésitations » · `bloque` « Je bloque » / « Je ne trouve pas mon chemin ».
Le clic **avance automatiquement** après 220 ms — pas de bouton Continuer. Sortie : « Ne plus me demander ».

**2 — Friction.** « Qu'est-ce qui vous a ralenti aujourd'hui ? », aide « Plusieurs réponses possibles ». Chips : Trouver un document · Comprendre la complétude · Inviter un investisseur · Le vocabulaire employé · La lenteur · **Rien de particulier**.
Règle : « Rien de particulier » est exclusif — le cocher vide les autres, cocher un autre le décoche. Sortie « Passer » ; « Continuer » actif dès une sélection.

**3 — Prix.** Titre « Et côté prix ? ». Chapeau : « Le premier mois reste offert. Votre réponse nous aide à fixer le tarif du deuxième — par mois et par data room. »
Deux questions couplées, mêmes tranches :
- « Un prix qui vous paraîtrait juste » — aide « Ni suspect, ni cher : le prix que vous paieriez sans hésiter. »
- « À partir de quel prix c'est trop cher » — aide « Le prix au-delà duquel vous renonceriez. »

Tranches par défaut : `5 000 F · 15 000 F · 30 000 F · 50 000 F · 75 000 F +`.
⚠️ **La devise et l'échelle doivent suivre le pays de l'organisation**, pas être figées en FCFA. Prévoyez la table de correspondance en configuration ; si elle n'existe pas encore, demandez avant de coder une conversion.
Sortie « Je préfère ne pas répondre » ; « Continuer » actif quand les **deux** sont renseignés.
Ne posez jamais cette question en première position, et jamais si l'écran 1 a reçu `bloque` **et** l'écran 2 au moins deux frictions — un utilisateur en difficulté ne donne pas un prix utile : sautez à l'écran 4.

**4 — Champ libre.** « Une chose à améliorer en priorité ? » `textarea` 3 lignes, `resize: none`, placeholder « Facultatif — et lu à la main chaque semaine. » Sorties : « Envoyer sans commentaire » / « Envoyer ».

**5 — Remerciement** (300 px). Pastille orange à coche. « Merci — c'est noté. » / « Nous lisons chaque réponse. Si votre remarque devient une modification, vous le verrez dans "Roadmap". » Bouton « Fermer ».
→ passe `completed=true` et remplit `survey_completed_at`.

## 5. Enregistrement

Une écriture **par écran validé**, pas une seule à la fin : un abandon en cours de route doit laisser les réponses déjà données. Server action dédiée (`app/actions/survey.ts`), une seule ligne mise à jour par `id`.
« Plus tard » / croix → met `survey_last_prompt_at = now()`. « Ne plus me demander » → `survey_dismissed_forever = true`.

## 6. Accessibilité

`role="dialog"` **non modal** (`aria-modal="false"`), `aria-labelledby` sur le titre de l'écran courant. Focus posé sur le titre à l'ouverture, jamais volé pendant que l'utilisateur tape ailleurs. `Échap` = « Plus tard ». Navigation clavier complète, cibles ≥ 32 px de haut. Le changement d'écran est annoncé (`aria-live="polite"`).

## 7. Contrôles avant de rendre la main

- [ ] Le carton n'apparaît jamais par-dessus un modal, un upload, la visionneuse.
- [ ] Rechargement de page : le compteur de 30 min ne repart pas de zéro.
- [ ] « Plus tard » ne réapparaît pas avant 7 jours ; « Ne plus me demander » ne réapparaît jamais — vérifié après reconnexion.
- [ ] Abandon à l'écran 3 : les réponses 1 et 2 sont en base.
- [ ] Aucune ligne en base si l'utilisateur ferme l'écran 0.
- [ ] Toutes les chaînes dans `fr.json` et `en.json`, aucune en dur.
- [ ] Rapport de PR : ce qui est fait, ce qui est laissé de côté et pourquoi, et la question posée sur la devise (§4, écran 3).
