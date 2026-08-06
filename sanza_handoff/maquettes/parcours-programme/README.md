# Handoff : Sanza — Dealroom de levée de fonds (parcours fondateur V2 + Lever)

## Vue d'ensemble
Sanza est une dealroom pour lever des fonds en Afrique : préparation des pièces exigées par les financeurs (VC, DFI, banque), data room sécurisée, partage nominatif à règles fines, suivi de due diligence, pilotage de la levée (module **Lever**) et mises à jour adaptées au type de financeur.

Ce paquet contient **51 écrans + 2 prototypes cliquables** couvrant le parcours fondateur complet, ainsi que le design system de référence.

## À propos des fichiers de design
Les fichiers de ce paquet sont des **références de design réalisées en HTML statique** — des prototypes montrant l'apparence et le comportement attendus, PAS du code de production à copier tel quel. La mission est de **recréer ces écrans dans l'environnement du codebase cible** (React, Vue, etc.) avec ses patterns et bibliothèques établis — ou, si aucun environnement n'existe encore, de choisir le framework le plus adapté et d'y implémenter ces designs.

## Fidélité
**Haute fidélité (hifi).** Couleurs, typographies, espacements, rayons et libellés sont finaux. Recréer les écrans au pixel près. Tous les styles sont portés par `screens/parcours.css` (variables CSS en tête de fichier) + styles inline dans chaque écran.

## Structure du paquet
- `screens/` — les 51 écrans HTML (1440px) + `index.html` (sommaire cliquable) + `parcours.css` (tokens + composants du shell) + `assets/` (illustrations d'états vides)
- `screens/proto-d-piloter-levee.html` et `proto-e-informer-financeur.html` — visites guidées cliquables (iframe + étapes)
- `design-system/` — `sanza-v2.html` (catalogue des composants avec tous leurs états, re-teintés Sanza) + `icons/icon-data.js` (198 icônes en données SVG `{ viewBox, body }`)

## Design tokens (source : screens/parcours.css `:root`)
- **Accent orange (unique)** : `--orange` #E85C2B · hover `--orange-h` #D24E1F · texte sur clair `--orange-text` #C24619 · fond doux `--orange-soft` #FDF4EF · bordure douce `--orange-border` #F5C6AE
- **Encre** : `--ink` #14161F (rail, visionneuse #101828/#1D2433)
- **Texte** : `--text` #1A1B1F · `--text-2` #475467 · `--text-3` #667085 · `--text-4` #98A2B3
- **Surfaces** : blanc · bande `--band` #FAFAF8 · filets `--line` #ECEBE6 · `--line-soft` #F1F0EC
- **Sémantique** : succès `--green` #147A5C (fond #EAF4F1) · info `--blue` #185FA5 (fond #EAF1F8) · alerte `--amber` #B54708 (fond #FFFAEB) · erreur `--red` #B42318 (fond #FEF3F2)
- **Type** : `--sans` Inter (corps) · `--head` Archivo (titres, semibold, tracking −0.01/−0.02em) · `--serif` Source Serif 4 (grands montants) · mono pour dates/références
- **Rayons** : sm 4px · md 6px · lg 10px · pastilles 999px (statuts uniquement)
- **Ombres** : quasi nulles ; cartes = blanc + filet 1px ; panneaux latéraux = 0 12px 32px rgba(16,24,40,.10) ; dialogues = 0 24px 64px rgba(16,24,40,.22)
- Interdits : dégradés, grosses ombres, rouge décoratif, emoji.

## Shell applicatif (identique sur presque tous les écrans)
1. **Rail global 60px** (encre #14161F) : marque S, Accueil, Opérations, Invitations, Recherche — puis Équipe, Sécurité, Aide, avatar. Item actif : fond rgba(255,255,255,.08) + liseré orange inset 2px.
2. **Panneau contextuel d'opération 240px** (`.ctx`, fond #FAFAF8, filet droit) : retour, titre de l'opération + badge Privée/Partagée, groupe « Piloter » (Vue d'ensemble, Préparation, Partage et accès, **Lever**, Activité — dans cet ordre), arborescence Documents. Item actif : fond blanc + inset filet + texte semibold.
3. **Espace de travail** : topbar 56px (fil d'Ariane, recherche 260px, CTA orange), zone `.work` padding 24/28px, cartes blanches à filets.
4. **Panneau latéral droit** 460–560px (`.sidepanel`) pour détails/formulaires, avec scrim rgba(16,24,40,.32) ; **assistants 4 étapes** en page focalisée (720–760px centrée) avec stepper.

## Écrans (voir screens/index.html pour la liste cliquable)
- 01-07 : inscription, invitation, confirmation e-mail, onboarding (entreprise, objectif, détails capital), plan généré
- 08-13 : vue d'ensemble ×3 états (arrivée / préparation / partagée), plan de préparation, panneau d'exigence, import de liste reçue
- 14-19 : data room (vide avec structure suggérée, remplie), dépôt multiple, confirmation d'associations, détail de pièce + versions, visionneuse sécurisée (filigrane e-mail + horodatage)
- 20-26 : assistant de partage 4 étapes, tableau des accès (8 états), prévisualisation « comme l'invité », demande d'accès reçue
- 27-34 : pipeline investisseurs, fiche (résumé + activité documentaire), journal global, invitation cohorte, consentement dealroom, équipe et rôles, sécurité/2FA
- 35-45 (**Lever**) : non configuré, configuration, vue de la levée, pipeline colonnes/tableau, ajouter un investisseur, fiche 7 onglets, interaction, engagement, vue Engagements, clôture
- 46-51 (**Mises à jour**) : liste, assistant (audience+instrument → indicateurs → commentaire → vérification), publiée, planche de référence des états

## Règles produit NON NÉGOCIABLES (à implémenter telles quelles)
1. **Trois dimensions jamais fusionnées** : étape de relation (À cibler → … → Engagé/Refusé), état d'accès documentaire (Non invité → … → Révoqué), niveau d'engagement financier (Aucun → Intérêt indicatif → Soft-commit → Confirmé → Retiré). Trois badges séparés, trois colonnes séparées.
2. L'ajout au pipeline **ne crée jamais d'accès** ; l'accès passe par l'assistant de partage (4 étapes, défauts sûrs : e-mail vérifié + NDA + filigrane activés, téléchargement désactivé).
3. Les **consultations sont des signaux**, jamais convertis en étape ni en engagement ; les montants sont **déclarés** par l'équipe.
4. Les **intérêts indicatifs ne sont pas additionnés** au montant sécurisé.
5. Une demande d'accès reste une demande ; décliner ne demande aucune justification.
6. Mises à jour : indicateurs proposés selon **instrument × type de financeur** (Dette+DFI = remboursement + impact/ESG) ; chaque indicateur porte définition, période, valeur, statut (Déclaré / Vérifié en interne / Audité) et interrupteur de partage ; prévisualisation exacte avant publication ; publication = instantané versionné.
7. Versions dans le détail de la pièce ; associations pièce↔exigence toujours confirmées par l'utilisateur ; « À actualiser » plutôt que « manquant ».
8. Jamais de cartes statistiques à zéro dans les états vides.
9. Libellés selon l'instrument : capital = Investisseurs, dette = Prêteurs/Financeurs, DFI = Institutions.
10. Glisser-déposer dans le pipeline = changement d'étape uniquement.

## Interactions et états
- Hover : fond #F1F0EC (neutres) / #D24E1F (primaire) ; press un cran plus sombre ; jamais de scale ni de pulsation ; transitions 120–180ms sur couleur/bordure uniquement.
- Focus clavier : double anneau blanc + orange 2px.
- États système : chargement (spinner statique fin), vide (jamais de zéros), erreur, enregistrement, succès, absence de droit — voir screens/51-variantes-etats.html (planche de référence exhaustive de TOUS les badges/états).

## Données d'exemple (à reprendre pour seed/fixtures)
Nimba Solar (Sénégal, énergie) · Série A 2026 · 500 000 000 XOF · confirmés 120 M (Sahel Growth Fund) · soft-commit 80 M (Horizon Ventures) · restant 300 M · clôture 30-11-2026. Relations : Amina Diallo (Diligence/accès actif/confirmé), Kwame Mensah (Intéressé/NDA signé/soft-commit), Clara Morel (Premier échange/invitation envoyée), David Mensima (Contacté/aucun accès/relance demain). Indicateurs Dette+Banque et compléments DFI dans l'écran 48.

## Icônes et illustrations
- Icônes : lucide-style stroke 1.75, tailles 14–18px (inline SVG dans les écrans) ; le set complet extrait est dans `design-system/icons/icon-data.js` (198 entrées `{ viewBox, body }`).
- Illustrations d'états vides : `screens/assets/empty-*.png` (extraites du design system, orange Sanza).

## Fichiers
- `screens/index.html` — sommaire ; chaque écran est autonome (ouvrir dans un navigateur).
- `screens/parcours.css` — source de vérité des tokens et du shell.
- `design-system/sanza-v2.html` — catalogue complet des composants et de leurs états (boutons, inputs, form controls, badges, alertes, toasts, tables, tabs, dropdowns, upload, date picker, tooltips, sidebar, header, charts, empty states…).
