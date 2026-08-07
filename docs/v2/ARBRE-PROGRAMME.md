# Arbre des connexions — Parcours Programme

La boussole du branchement du parcours **programme** — accélérateurs,
incubateurs, studios. Le parcours fondateur a le sien :
[ARBRE-CONNEXIONS.md](ARBRE-CONNEXIONS.md).

**Dernière vérification : 7 août 2026, matin**, branche `v2/rebuild`.
Re-dérivé depuis le code : quels fichiers importent de `features/v2/server`,
quelles RPC sont réellement appelées, combien de tests passent.
Ce document se périme : le relire avant de s'y fier.

| Marque | Sens |
|---|---|
| 🟢 | Branché — l'écran lit ou écrit la vraie base |
| 🟡 | Le socle et les fonctions existent, l'écran est encore en fixtures |
| 🔴 | Fixture — aucune donnée réelle |
| 📧 | Gabarit d'e-mail |

## Le compte, au fichier près

**25 pages et 4 coques.** Douze fichiers du parcours lisent ou écrivent.

| | |
|---|---|
| Pages branchées | **10** |
| Coques branchées | **2** — coque programme, nav de cohorte |
| Pages en fixtures | 15 |
| RPC réellement appelées | **25** |
| Tests du domaine V2 | **352** |
| Migrations du parcours | **15**, du 6 au 7 août |

**Règles pures et testées :** `cohorte.ts`, `portefeuille.ts`, `questions.ts`,
`challenges.ts`, `dealroom.ts`.

### Entrer 🟢

```
🟢 Porte d'entrée /v2            metierDuCompte() → profiles.account_type
🟢 Onboarding programme (00a-d)  save_programme · set_programme_focus ·
                                 create_cohort · finish_programme_onboarding
🟢 Logo du programme             set_org_logo → bucket `branding` (public)
⚠️ Aucun chemin n'y mène          l'inscription propose « Un programme » mais ne
                                 redirige toujours pas vers ce tunnel.
```

### Cohortes 🟢 · Portefeuille 🟢 · Questions 🟢

```
🟢 01/02 Liste                   listerCohortes()
🟢 04/05 Entreprises             listerInvitations() · invite_to_cohort
🟢 06/07 Portefeuille            sae_portfolio()
🟢 08    Questions & suggestions cohort_threads · cohort_companies ·
                                 create_program_thread
🔴 03 · 17 · 37 · 39             états de cohorte non branchés
```

**Ce qui manque encore au portefeuille :** la tendance « +6 pts sur 30 jours »
— `cohort_snapshots` a la bonne colonne mais reste **vide**, rien ne l'alimente.

### Challenges — LOT COMPLET 🟢

```
🟢 09/09b Liste                  cohort_challenges · cohort_challenge_progress
🟢 10/16  Bibliothèque           challenge_library · challenge_template_detail
🟢 11/12  Créer / personnaliser  create_challenge
🟢 13     Assigner               assign_challenge
🟢 14/15  Suivi et panneau       lecture directe (RLS du programme)
🟢 42     Vue entreprise         challenge_for_startup · set_challenge_criterion
🟢 Validation automatique        startup_requirement_facts ·
                                 refresh_challenge_progress
```

Six tables, trois énumérations, `startups.presented_deal_id`. La progression
est **persistée** et **ne recule jamais** : la réévaluation est monotone, donc
rejouable à chaque ouverture d'écran.

⚠️ **Deux manques qui appartiennent au fondateur :**
- Le **contenu des treize autres modèles Sanza**. La maquette n'en nomme que
  trois et un seul porte de vrais critères ; les autres affichent « Critère 1 ».
  La bibliothèque affichera ce que la base contient, sans changer une ligne.
- L'**écran par lequel une entreprise désigne son opération présentée**. Sans
  lui, `presented_deal_id` reste vide et aucun critère connecté ne se validera
  chez un vrai fondateur. C'est un écran du parcours FONDATEUR.

### Dealrooms 🟡

```
🟢 18/19  Liste                  dealroom_list()
🔴 20-24  Assistant de création  create_dealroom existe, l'écran ne l'appelle pas
🔴 25-28  Gestion                dealroom_companies existe
🔴 38 · 40 · 41                  cohorte, demandes, activité
```

Six tables, sept fonctions d'écriture, une lecture **publique**. La règle de
l'écran 22 est appliquée **deux fois** — à la publication ET à chaque lecture —
pour qu'une entreprise qui retire son accord disparaisse sans attendre que le
programme republie.

⚠️ **Les `showcase_*` ne sont PAS supprimées**, contrairement à ce
qu'envisageait la suite n°2 d'ADR-002. Sa suite n°3 demandait de vérifier
d'abord : **neuf fichiers V1 les lisent encore**, dont `/vitrine` et
`/vitrine/[org]`, en production. La suppression sera un lot à part, après la
bascule de la V1.

### Investisseur, hors application 🟡

```
🟡 30-33  /v2/d/[dealroom]       dealroom_public(token) — éprouvée sous `anon`
📧 29     docs/emails/dealroom-01-invitation-investisseur.html
```

La fonction publique existe et a été vérifiée **sans aucune identité**. Les
écrans, non.

⚠️ Trois textes de maquette sont devenus faux et restent à réécrire : le lien
« personnel » du 29, l'invitation « liée à l'adresse » du 23, l'audience
nominative du 27. **Le lien EST l'accès.** Le NDA a disparu de l'entrée — il
reste sur la demande d'accès à une data room, où un signataire existe.

### Le reste du rail 🔴

```
🔴 34 /v2/programme · 35 /v2/demandes · 36 /v2/rapports
```

## Les décisions

Les cinq ADR sont tranchées. Il ne reste **aucune question ouverte** —
ADR-002 (Dealroom de premier rang), ADR-003 (lecture énumérée, copie,
progression persistée, acquis conservé), ADR-004 (trois canaux), ADR-005
(ouverture sans compte, NDA supprimé de l'entrée).

## L'état de la base de staging

Projet `jourzsgjnutktsrgxkoo`. L'autre, `bileqzpguyynkktndazs`, est la
**production** — ne pas y toucher.

**Le registre ne correspond à aucun nom de fichier** : les versions inscrites
sont des heures d'APPLICATION, pas de fichier, et 67 lignes sont préfixées
`bootstrap_`. `supabase db push` ne peut donc rien réconcilier. Le seul chemin
vers un dépôt et un staging qui s'accordent est une **reconstruction
complète** — elle demande la CLI et le mot de passe de la base.

Onze migrations « manquantes » ont leur contenu déjà en base, vérifié par
empreinte. Deux seraient destructrices si on les rejouait
(`exigences_deux_axes`, `pipeline_deux_axes`). `checklist_metadata()` doit
rester absente.

## Données de démonstration sur le staging

Posées pour vérifier les écrans à l'œil, et jetables :

- **MTN INCUBATEUR** — FINEO PRE-SEED et Nimba Solar rattachées, deux devises,
  Nimba portant deux opérations ; un Challenge « Préparer votre Demo Day ».
- **ZZ-TEST Organisation E2E** — deux entreprises, deux Challenges (dont un à
  échéance dépassée), deux messages dans le fil, deux Dealrooms dont une
  publiée et une en brouillon.
- Un modèle Sanza : « Préparer le dossier investisseur », 5 critères.
