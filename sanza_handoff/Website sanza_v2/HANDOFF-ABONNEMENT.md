# SANZA — Handoff Abonnement & Paiement (écrans 75–77)

**Destinataire : Claude Code**
**Objet : implémenter la page Abonnement, la modale de paiement et la résiliation selon les écrans de référence `parcours/75-77`**
**Règle : zéro réinterprétation — copier les structures, les textes et les tokens des écrans HTML.**

---

## 0. Fichiers de référence

| Écran | Fichier | Rôle |
|---|---|---|
| 75 | `abonnement/75-passer-plan-ready.html` | Modale de changement de plan → paiement via Genius Pay |
| 76 | `abonnement/76-abonnement-facturation.html` | Page Abonnement complète (`/reglages/abonnement`) |
| 77 | `abonnement/77-resilier-abonnement.html` | Modale de confirmation de résiliation |

Tokens/CSS : `abonnement/parcours.css` (ne rien recréer, mapper sur les composants existants du repo).

---

## 1. Décision structurante — paiement

**Sanza ne collecte AUCUNE donnée de paiement.**

- Supprimer du code existant : le choix « Mobile money / Carte bancaire », le champ « Numéro qui recevra la demande de paiement », et tout state associé.
- Le bouton primaire de la modale 75 est **« Continuer vers le paiement → »** : il crée la transaction côté backend puis **redirige vers le checkout Genius Pay**, qui demande lui-même l'opérateur et le numéro.
- Ne jamais afficher « Gratuit » comme prix d'un plan payant : le montant affiché = montant réellement dû aujourd'hui (proratisé si applicable — c'est le backend qui le calcule et le renvoie).

## 2. Modale « Passer au plan X » (écran 75)

Structure exacte :
1. Kicker `Votre abonnement` + titre `Passer au plan Ready`
2. Champ **Facturation** : 2 options radio-cards (pattern écran 11 des Challenges) — `Mensuelle · 15 000 F CFA / mois` / `Annuelle · 150 000 F CFA / an · 2 mois offerts`. Sélection = bordure orange 1.5px + fond `--orange-soft`.
3. Récapitulatif 3 lignes (`kv` rows) : Plan / Prochaine échéance / **À régler aujourd'hui** (seule valeur en graisse 600, taille 15px)
4. Encadré fond `--band` : « Le paiement se fait sur la page sécurisée de **Genius Pay**. Vous y choisirez votre moyen de paiement — mobile money (Wave, Orange Money, MTN, Moov) ou carte bancaire. Sanza ne conserve aucune donnée de paiement. »
5. Note grise : « Nous vous préviendrons avant chaque échéance. Sans paiement, votre espace passe en lecture seule — rien n'est supprimé. »
6. Footer : `Annuler` (btn-text-grey) / `Continuer vers le paiement →` (btn-primary)

Montants : **placeholder** — brancher sur l'API pricing.

## 3. Page Abonnement (écran 76) — ordre des sections

1. **Plan actuel** (card) : nom + badge `Actif` (vert) + description à gauche ; prix `21 750 XOF` + « par mois · facturation mensuelle » à droite. Pied de carte : Renouvellement / Moyen de paiement (`Mobile money · via Genius Pay`) / bouton `Passer à l'annuel · −17 %`.
2. **Usage** (card) : lignes label + valeur tabulaire + progressbar. Barre **ambre** quand limite atteinte (`1 sur 1`). Visiteurs externes : pas de barre, valeur `illimité`. Note : visiteurs externes jamais facturés.
3. **Ce que votre plan ouvre** (card) : grille 3 colonnes, check vert 13px + texte 13px `--text-2`.
4. **Changer de plan** (card) : header avec toggle segmenté `Mensuel / Annuel · −17 %` (le −17 % vit DANS le toggle, pas en texte vert isolé). Une ligne par plan : nom + description | prix tabulaire aligné droite | bouton `Choisir` **btn-grey** (jamais orange — l'orange est réservé à l'action primaire de la page). Clic Choisir → modale 75. Footer : phrase downgrade (aucune donnée supprimée, période réglée honorée).
5. **Factures** (card) : empty state une ligne ; dès la 1re facture → table (date, montant, statut, PDF).
6. **Résiliation** (card compacte) : texte à gauche + bouton `Résilier mon abonnement` btn-grey à droite. Jamais de lien flottant seul.

## 4. Modale Résiliation (écran 77)

1. Titre `Résilier votre abonnement ?` + sous-titre : plan entier jusqu'au **{date}**, période réglée due, rien n'est coupé aujourd'hui.
2. 3 puces check vert : aucune donnée supprimée / lecture seule après échéance / réabonnement possible à tout moment.
3. Champ facultatif `Ce qui vous fait partir` (textarea, placeholder « Trop cher, levée terminée, une fonction qui manque… ») + helper « Personne ne vous rappellera pour vous retenir — c'est pour savoir ce qu'il faut corriger. »
4. Footer : `Garder mon abonnement` (btn-grey) / **`Confirmer la résiliation` en ROUGE** (`--red`, fond plein) — action destructive ≠ orange primaire.

## 5. États à couvrir

- `loading` : skeletons sur les cards (pattern existant)
- `limit_reached` : barre usage ambre + CTA upgrade contextualisé
- `payment_pending` : retour de Genius Pay en attente → badge ambre sur Plan actuel
- `payment_failed` : bandeau erreur « Le paiement n'a pas abouti. Aucun montant n'a été débité. Réessayer. »
- `cancelled_grace` : badge « Résilié — actif jusqu'au {date} » + bouton « Reprendre mon abonnement »
- `read_only` : après échéance, bandeau lecture seule + CTA réabonnement

## 6. Copywriting — règles

Vouvoiement, phrases courtes, jamais « Êtes-vous sûr ? », jamais de culpabilisation. Toujours expliquer : ce qui se passe / pourquoi / quoi faire ensuite. Les textes des écrans 75-77 sont finaux — les copier verbatim.

## 7. Ne pas faire

- Recréer un composant modale/bouton/badge parallèle
- Mettre « Choisir » en orange
- Demander le numéro de téléphone ou l'opérateur dans Sanza
- Afficher « Gratuit » sur un plan payant
- Supprimer des données à la résiliation
