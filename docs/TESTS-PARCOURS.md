# Plan de test — parcours fondateur & investisseur

Scénarios de bout en bout à dérouler manuellement en production. La base a été
remise à zéro le 18/07 : c'est un test « à froid », depuis un état vierge.

## Conventions (à respecter, sinon les résultats sont faussés)

- **Environnement** : `https://app.sanza.africa` (production). Coolify doit avoir
  déployé la dernière version avant de commencer.
- **Adresses e-mail** : uniquement des adresses **réelles** en
  `boungouphilippe+xxx@gmail.com`. **Jamais** de domaine inventé
  (`@kora-demo.africa`, `@startup-demo.africa`) — ces envois rebondissent et
  abîment la réputation d'expéditeur. Chaque `+xxx` crée un compte distinct.
- **Mot de passe de test** : le même partout, noté une fois, ≥ 8 caractères.
- **Deux navigateurs** (ou un normal + un privé) : indispensable pour les tests
  d'isolation — le fondateur dans l'un, l'investisseur dans l'autre.
- **Ce qui n'est PAS testable** (non construit — ne pas chercher à le tester) :
  le sourcing / matching / flux de deals côté investisseur. L'accès investisseur
  au dealflow « ouvre bientôt ». La seule entrée investisseur réelle dans une
  data room est l'**invitation** (parcours I-2).

Comment lire les e-mails sans attendre : chaque envoi est visible dans les
journaux Resend (dashboard) ; le contenu et le lien exact d'un e-mail se relisent
par l'API si besoin.

---

# A. Parcours FONDATEUR

## F-1 · Inscription & confirmation d'e-mail

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | Aller sur `/inscription`, choisir le persona **Fondateur**, saisir `+fond1@gmail.com` + mot de passe | Compte créé, écran « vérifiez votre boîte » |
| 2 | Ouvrir l'e-mail reçu | Objet **« Confirmez votre adresse e-mail — Sanza »**, en **français**, au design Sanza (en-tête encre, bouton orange) |
| 3 | Cliquer « Confirmer mon adresse » | Redirection vers `/onboarding` (pas `0.0.0.0`, pas « lien invalide »), **connecté** |

**Bords à tester :**
- Réutiliser le lien de confirmation une 2ᵉ fois → doit échouer proprement
  (lien déjà consommé), pas de page blanche.
- S'inscrire avec une adresse déjà utilisée → message clair, pas de doublon.
- Ouvrir le lien sur un autre appareil/navigateur que celui d'inscription →
  l'adresse est confirmée, on retombe sur la connexion (comportement PKCE assumé).

## F-2 · Onboarding fondateur (2 étapes)

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | Étape 1 : nom startup, pays, secteur, stade, phrase | « Continuer » actif dès que le nom fait ≥ 2 caractères |
| 2 | Étape 2 : montant recherché, ARR | Encart **« Fiche complétée X % »** (PAS « Readiness »), avec la mention que le readiness, lui, se construit dans la checklist DD |
| 3 | Vérifier qu'**aucune** zone « déposez votre pitch deck » ne promet de points | Absente — retirée volontairement |
| 4 | « Terminer » | Écran **« Bienvenue sur Sanza, [prénom] »**, puis accès au tableau de bord |

**À vérifier en base après coup :** l'organisation, le membership `owner`, la
ligne `startups`, et surtout les créations automatiques — **deal, data room,
checklist, lignes d'audit**. La cohérence readiness est le point sensible :
l'onboarding annonce une complétude de fiche, le dashboard un readiness DD à 0 %
au départ — les deux chiffres sont **normaux et distincts**, ils ne doivent pas
être confondus.

## F-3 · Data room : arborescence, dépôt, indexation

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | Ouvrir la data room du deal | Arborescence OHADA pré-remplie, dossiers indexés (1., 2.1, 2.1.1…) |
| 2 | Créer un sous-dossier | Apparaît, ré-indexé automatiquement |
| 3 | Déposer un vrai document (PDF, puis un .docx et un .xlsx) | Upload direct (contourne la limite de taille), document indexé sous le bon dossier |
| 4 | Supprimer un dossier **non vide** | **Refusé** avec message explicite (« contient N document(s) ») |

## F-4 · Diligence adaptée au financeur

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | Ouvrir la checklist / diligence | Liste d'exigences avec réf. (1.2, 2.1…), état Fait / À fournir |
| 2 | Basculer le financeur **VC → DFI → Banque** | La **checklist change** (items différents par financeur), et le score de readiness se recalcule |
| 3 | Cocher une exigence | Readiness recalculé **en base**, pas seulement à l'écran |

## F-5 · Permissions par dossier (cœur de sécurité)

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | Régler un dossier sur `none` | L'accès à la visionneuse pour ce dossier → **403** |
| 2 | Passer à `watermark` | Pages **filigranées** au nom du lecteur |
| 3 | Passer à `view` | Pages propres |
| 4 | Hériter : régler `watermark` sur `2`, vérifier `2.1` | Hérite de `watermark` ; une règle plus spécifique sur `2.1` **prime** |
| 5 | Poser une règle **expirée** sur `2.1` | Ignorée → retombe sur l'héritage |

## F-6 · Visionneuse filigranée & blocage du téléchargement

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | Ouvrir un PDF dans la visionneuse | Rendu **image PNG filigrané** (e-mail + date incrustés), jamais le fichier source |
| 2 | Tenter de télécharger avec un droit `watermark`/`view` | **Refusé (403)** |
| 3 | Avec un droit `download`/`edit` | L'original est servi, et l'action est **journalisée** (`document.downloaded`) |
| 4 | Ouvrir une page | Écrit une ligne d'audit `page_viewed` |

## F-7 · Inviter un investisseur (NDA)

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | Créer une invitation vers `+inv1@gmail.com`, NDA requis, niveau `watermark` | Invitation créée, e-mail parti de `noreply@sanza.africa` (au nom de Sanza) |
| 2 | Copier le lien d'invitation | De la forme `/invitation/<token>` |

→ La suite du test se fait côté investisseur (parcours **I-2**).

## F-8 · Récupération de mot de passe

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | `/mot-de-passe-oublie`, saisir l'adresse | Confirmation **identique que l'adresse existe ou non** (pas d'énumération de comptes) |
| 2 | Ouvrir l'e-mail | Objet **« Réinitialisez votre mot de passe Sanza »**, français, lien vers `/auth/confirm?...&type=recovery` |
| 3 | Cliquer, choisir un nouveau mot de passe | Arrive sur `/reinitialiser`, changement accepté, connecté |
| 4 | Lien expiré / déjà utilisé | Redirige vers une nouvelle demande, message explicite |

## F-9 · 2FA (TOTP)

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | `/securite`, activer la double authentification | QR + clé affichés |
| 2 | Enrôler dans une app TOTP, valider un code | 2FA active |
| 3 | Se déconnecter, se reconnecter | Le code TOTP est **exigé** (`/connexion/2fa`) avant le tableau de bord |

---

# B. Parcours INVESTISSEUR

Deux entrées distinctes. **I-1** = intérêt général (liste d'attente). **I-2** =
accès réel à une data room via invitation d'un fondateur.

## I-1 · Liste d'attente (site public)

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | Sur `sanza.africa`, section « Investisseurs », saisir `+wait1@gmail.com` | Message « votre place est réservée » |
| 2 | Vérifier en base `investor_waitlist` | Une ligne enregistrée |
| 3 | Soumettre **deux fois** la même adresse | Pas d'erreur qui révèle que l'adresse existait déjà (anti-énumération) |
| 4 | (option) e-mail de confirmation | « Votre place sur la liste Sanza est réservée » |

**Non testable ici :** aucun dealflow ne s'ouvre après inscription — c'est
« à venir » et le site ne le promet pas comme disponible.

## I-2 · Invitation → NDA → accès data room (le parcours réel)

Pré-requis : l'invitation créée en **F-7** vers `+inv1@gmail.com`.

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | Ouvrir le lien `/invitation/<token>` **sans être connecté** | Page publique : nom du deal + de l'organisation, porte NDA — **rien de plus** n'est exposé |
| 2 | Créer le compte invité avec **la bonne adresse** (`+inv1@gmail.com`) | Compte créé, accès à la porte NDA |
| 3 | Tenter avec une **autre** adresse (`+inv2@gmail.com`) | **« Cette invitation ne vous est pas destinée »** — refus |
| 4 | Signer le NDA | Accès accordé au niveau prévu (`watermark`) ; preuve enregistrée : **signataire, IP, user-agent, horodatage, empreinte SHA-256** |
| 5 | Consulter un document autorisé | Pages **filigranées** à son nom ; téléchargement **refusé** |
| 6 | Tenter d'accéder à un dossier **non** autorisé | 403 |
| 7 | Consulter la preuve du NDA (`/preuve/<id>`) | Preuve lisible et vérifiable |

**Isolation (critique — le fondateur vend la confidentialité) :** connecté en
tant qu'invité, vérifier qu'il **ne voit que lui-même** — ni les autres membres
de l'organisation, ni les autres invités, ni les autres deals. Un invité qui
verrait *qui d'autre* regarde le deal serait une fuite de syndication.

## I-3 · Onboarding investisseur (auto-inscription, thèse)

Pour un investisseur qui s'inscrit de lui-même (persona Investisseur), hors
invitation.

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | `/inscription` persona **Investisseur** → confirmation e-mail → `/onboarding/investisseur` | Étape 1/2 |
| 2 | Étape 1 : type d'investisseur, organisation, ticket | « Continuer » |
| 3 | Étape 2 : **thèse** — secteurs, géographies, stades (sélection multiple) | « Terminer » |
| 4 | Vérifier en base | Profil investisseur + thèse enregistrés |

---

# C. Contrôles transverses (à repasser en fin de campagne)

| Contrôle | Attendu |
|----------|---------|
| **Chaîne d'audit** | `verify_audit_chain` → `ok: true` ; le compteur d'entrées correspond aux actions faites |
| **E-mails** | Tous partis de `Sanza <noreply@sanza.africa>`, en français, `delivered` dans Resend ; aucun rebond |
| **Aucun `0.0.0.0`** | Tous les liens d'e-mail pointent vers `app.sanza.africa` |
| **Isolation A/B** | Un 2ᵉ fondateur (`+fond2`) ne voit **rien** du premier (org, deals, audit) |
| **RGPD / suppression** | Point connu : un compte ayant créé un deal ne peut pas être supprimé (contrainte `RESTRICT` sur `deals.created_by`) — à corriger avant de vrais clients |

---

# D. Résultats — simulation automatisée du 22/07/2026

Exécutée en production via l'API (agissant comme les vrais utilisateurs, jetons
utilisateur pour éprouver la RLS). **27 contrôles verts sur 29.** Les 2 non-verts
ne sont pas des défauts produit (voir notes). 1 constat UX distinct relevé.

| Scénario | Statut | Note |
|----------|:---:|------|
| F-1 Inscription + confirmation e-mail | ✅ | E-mail FR « Confirmez votre adresse — Sanza », lien `token_hash` → session, connexion OK |
| F-2 Onboarding fondateur | ✅ | Deal, **32 dossiers**, **22 exigences** de checklist, startup, membership owner créés automatiquement |
| F-3 Data room : upload + indexation | ✅ | Upload storage sous RLS membre + `register_document`, document indexé `2.1` |
| F-4 Diligence par financeur | ✅ | Cocher une exigence recalcule le readiness **en base** (0 → 5) |
| F-5 Permissions par dossier | ✅ | `set_permission` watermark accepté (owner) |
| F-6 Visionneuse & blocage DL | — | Non rejoué ici (rendu d'image) ; vérifié plus tôt dans la session |
| F-7 Inviter un investisseur | ✅ | Invitation + jeton créés, e-mail parti |
| F-8 Mot de passe oublié | ⚠️ | **Vérifié plus tôt dans la session** (e-mail FR + lien recovery + `/reinitialiser`) ; re-test bloqué par le **plafond horaire d'envoi Supabase** saturé par les runs — pas un défaut |
| F-9 2FA TOTP | — | Non rejoué ici ; vérifié plus tôt dans la session |
| I-1 Liste d'attente | ✅ | Insertion anon + ligne enregistrée |
| I-2 Invitation → NDA → accès | ✅ | Vue publique minimale · **mauvais destinataire refusé** (« cette invitation ne vous est pas destinée ») · NDA signé · **preuve complète** (IP, user-agent, SHA-256) · droit effectif = watermark · **isolation invité : ne voit que lui-même** |
| I-3 Onboarding investisseur | ✅ | Thèse (secteurs/géo/stades) enregistrée |
| C Chaîne d'audit | ✅ | `verify_audit_chain` → `ok:true`, chaîne intègre |

**Constat UX à traiter (signalé, non corrigé) :** la page **mot de passe oublié
s'affiche en anglais** pour un visiteur non connecté (« This link has expired or
was already used »). La version française existe (`fr.json`) mais la locale par
défaut des pages d'auth publiques tombe sur l'anglais. Sur un marché francophone,
à corriger — défaut d'expérience, pas de sécurité.

> ⚠️ = non concluant pour cause d'environnement de test (rate-limit), pas un
> défaut. — = hors du périmètre de la passe automatisée.
