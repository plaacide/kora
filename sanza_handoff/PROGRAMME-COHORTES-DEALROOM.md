# Sanza — persona Programme : cohortes multiples, dealroom, demandes d'accès

**Spécification d'implémentation + décisions produit.** Maquettes de référence :
`Sanza Programme Onboarding.dc.html` (17 écrans, du signup aux états vides), `Sanza Programme Marketplace.dc.html` (cohortes → vitrine → fiche → demandes), `Sanza Programme.dc.html` (portefeuille piloté).

---

## 0. Règles absolues

1. **Le programme ne lit jamais un document.** Aucune route, aucun réglage, aucune exception ne lui donne accès au contenu d'une data room. Il voit des états (préparation, pièces manquantes par intitulé, dernier signe d'activité) et des chiffres saisis par l'entreprise. Cette limite est l'argument qui fait signer les fondateurs — toute PR qui l'entame est refusée d'office.
2. **Aucun texte en dur** — namespaces `next-intl` (`cohorts`, `dealroom`, `requests`, `reports`), fr + en.
3. Réutiliser `SanzaLogo`, `NavIcon`, `EncryptionBadge`, `ResonanceArcs`, `Modal`, `EmptyState`, `Topbar`, `personaLabel`. Ne rien recopier.
4. Migrations pour toute table nouvelle ; RLS systématique ; pas de dépendance npm nouvelle.
5. Zéro emoji ; icônes trait 1.6 ; grammaire des états vides : ce qui manque + à quoi servira l'écran + une action.
6. En cas de doute : s'arrêter et demander. Un commit par section, lint + tsc sans nouvelle erreur.

## 1. Navigation — modifications de `nav.ts` (assumées, à porter)

- `cohort` : « Ma cohorte » → **« Mes cohortes »**, route `/cohortes` (liste) + `/cohortes/[id]` (détail). L'écran actuel `/cohorte` devient le détail.
- Deux entrées nouvelles dans `ECRANS_PROGRAMME` : **`/dealroom`** et **`/rapports`**. Ordre final : `/portefeuille`, `/cohortes`, `/dealroom`, `/demandes`, `/rapports`, `/securite`, `/roadmap`.
- `NavIcon.tsx` : ajouter les clés `dealroom` (devanture : fronton + porte) et `reports` (document à barres) — tracés dans les maquettes, 16 px / 1.6, comme le commentaire du composant l'exige.
- Topbar : identique aux autres personas (recherche `shell.searchPlaceholder`, FR, Déconnexion), **sans** `ShareButton` (pas de `dealId`).

## 2. Modèle de données

```
cohorts            id, org_id (programme), name, starts_on, ends_on, goal, seats, archived_at
cohort_members     cohort_id, startup_org_id, joined_at        -- n-n : une entreprise, plusieurs cohortes
cohort_links       (existe) + cohort_id                        -- l'invitation vise UNE cohorte
listing_consents   startup_org_id, program_org_id, cohort_id, deal_id designé, granted_at, revoked_at
showcase_entries   cohort_id, startup_org_id, published_at, unpublished_at
access_requests    id, investor_user, startup_org_id, deal_id, instrument, message,
                   status (pending / recommended / forwarded / dismissed / granted / refused),
                   program_note, decided_by, decided_at
program_notes      program_org_id, startup_org_id, body, author, created_at   -- privées au programme
program_threads    type (question / suggestion), startup_org_id, body, status (open / answered / read)
mandates           startup_org_id, program_org_id, deal_id, granted_at, revoked_at
```

Décisions qui règlent les ambiguïtés :
- **Une entreprise dans deux cohortes** : `cohort_members` est n-n ; l'accord de listage (`listing_consents`) est **par cohorte** — accepter d'être dans le dealroom de la Saison 4 n'autorise pas celui du programme Dette.
- **Le consentement désigne la salle** : l'entreprise choisit quel `deal_id` (quelle data room) la vitrine pointe. Plusieurs salles ⇒ elle désigne ; aucune désignée ⇒ non listable.
- **`cohort_limit`** existant : devient le palier de `seats` par défaut à la création d'une cohorte ; dépassement = écran de contact, pas un compteur bloqué silencieux.
- **Invitation d'une organisation déjà sur Sanza** : matcher par domaine email et proposer le rattachement de l'org existante — jamais de doublon d'organisation.
- **Archivage d'une cohorte** : fige la vitrine (les fiches passent en lecture « programme terminé »), ne révoque aucun accès accordé, n'efface rien.

## 3. `/cohortes` et `/cohortes/[id]`

Liste : cartes par cohorte (période, n entreprises, n data rooms, volume recherché, préparation moyenne, à relancer, n listées). Détail : table entreprises (colonnes des maquettes : case de listage, entreprise + badge d'état, data rooms, recherché, préparation, statut dealroom) triée **par risque** ; barre de sélection au-dessus ; panneau latéral Questions & suggestions.

**Questions vs suggestions** — deux objets, pas un chat :
- une **question** attend une réponse ; statuts `EN ATTENTE / RÉPONDUE` ; relance possible à 7 jours.
- une **suggestion** n'attend rien ; statut `LUE` au premier affichage côté startup.
- visibles uniquement de l'entreprise visée ; écrites au journal des deux côtés ; pas de fil libre.

Invitations en attente : les montrer (email, date, statut `ENVOYÉE / LIEN OUVERT / À RELANCER`), relance unitaire et groupée, expiration 30 jours. Ne jamais afficher « 0 entreprise » quand des invitations courent.

## 4. `/dealroom` — la vitrine

- **Publication choisie** : le programme coche entreprise par entreprise (`showcase_entries`). Conditions cumulées : `listing_consent` actif + dossier entamé (> 0 pièce). Bouton « Publier » désactivé avec raison sinon.
- **Dépublier ≠ révoquer** : retirer une fiche ne coupe aucun accès accordé.
- **Audience** : la vitrine n'est pas publique. Accès par invitation nominative du programme à ses investisseurs (réutiliser le mécanisme d'invitation, niveau « vitrine »). Pas d'indexation, pas de lien anonyme.
- Filtres investisseur : revenus (intervalle double curseur), instrument (equity / dette / mezzanine), stade, secteur, pays. Compteur de résultats.
- **Fiche entreprise** : chiffres saisis par l'entreprise dans ses indicateurs — jamais par le programme. Deux lectures commutables :
  - *Equity* : ARR, croissance, marge brute, runway, CAC/LTV, tour recherché, dilution envisagée, cap table.
  - *Dette* : CA 12 mois, EBITDA, couverture du service de la dette, endettement, BFR, garanties, saisonnalité, cycle de trésorerie.
  - Valeur absente ⇒ « non communiqué » en italique — on n'invente ni ne calcule à sa place. Date de dernière mise à jour sur chaque fiche ; bandeau au-delà de 90 jours. Devise : celle de l'organisation.
- Aucune pièce consultable depuis la fiche ; un seul CTA : « Demander l'accès à la data room ».

## 5. `/demandes` — le point de rencontre

Flux : l'investisseur demande depuis une fiche → `access_requests(pending)` → le programme **filtre** :
- **Transmettre avec avis favorable** → `recommended`, la startup tranche ;
- **Transmettre sans avis** → `forwarded`, idem ;
- **Écarter** → `dismissed`, l'investisseur est notifié sobrement, la startup ne voit rien.
- **Mandat** (`mandates`, par salle, révocable) : s'il existe, le programme peut `granted` directement — le badge « MANDAT ACCORDÉ » vs « DÉCISION STARTUP » doit être visible sur chaque demande.

Chaque transition s'écrit au **journal d'audit de l'entreprise** (qui a demandé, ce que le programme a recommandé, qui a tranché, quand). Un refus se conserve. Demande sans réponse : expire à 30 jours, relançable une fois.

## 6. `/rapports`

Rapport de cohorte pour bailleur : période, entreprises, montants recherchés, préparation par catégorie de pièces, invitations/accès accordés. **Refuser de générer** sous le seuil (au moins une entreprise au dossier entamé) plutôt que produire un PDF à cases vides. Snapshot mensuel automatique des indicateurs agrégés pour donner la tendance — un bailleur lit des courbes, pas un instantané.

## 7. Onboarding (écrans 01→06 de la maquette)

Signup rôle Programme → **confirmation email** (`auth-01-confirm-signup.html`) → structure (type, nom, pays) → première cohorte (nom, dates, places, objectif) → invitations (sautable) → bienvenue avec checklist honnête (« 3 entreprises invitées — en attente de leur réponse »). Sécurité : proposer la **2FA à la première session** — le programme verra passer des états de dossiers de tiers ; ne pas la rendre bloquante, la rendre visible.

## 8. États vides (écrans 07→17) — reprendre les textes de la maquette

Sidebar : entrées non atteignables grisées avec la condition réelle en pied (« Rapports s'ouvre dès qu'une entreprise a entamé son dossier »). Pas d'indicateurs à zéro au portefeuille ; l'attente d'invitations est montrée, pas masquée.

## 9. À ne pas construire (refus motivés)

- Accès document « lecture programme », même optionnel — rupture de la promesse fondatrice.
- Notation des startups par le programme — se retourne contre lui à la première fuite.
- Chat libre programme ↔ startup — questions/suggestions structurées suffisent, un fil non lu est une dette.
- Vitrine publique indexée — le dealflow africain se partage sous invitation, pas en annuaire.

## 10. Contrôles avant de rendre la main

- [ ] Un compte programme neuf traverse les 17 écrans sans jamais voir « aucune donnée » ni un bouton mort sans explication.
- [ ] Impossible de lister une entreprise sans `listing_consent` actif ET salle désignée — vérifié par test RLS, pas seulement par l'UI.
- [ ] Dépublication : les accès accordés survivent.
- [ ] Chaque `access_request` transitionnée apparaît dans le journal d'audit de l'entreprise.
- [ ] `nav.ts`, `NavIcon.tsx`, i18n fr/en mis à jour ensemble.
- [ ] Rapport : génération refusée sous le seuil, avec le seuil nommé à l'écran.
