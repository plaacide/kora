# Sanza — écrans Cohortes → Dealroom → Demandes (maquette Marketplace)

**Spécification d'implémentation des 5 écrans** de `Sanza Programme Marketplace.dc.html`. Les règles produit et le modèle de données vivent dans `PROGRAMME-COHORTES-DEALROOM.md` (§2 modèle, §4 vitrine, §5 demandes) — ce fichier décrit l'UI exacte. En cas de conflit entre les deux : la spec règles gagne, signalez le conflit.

## 0. Règles absolues
Identiques à `ONBOARDING-PROGRAMME.md` §0 (composants réutilisés, i18n fr+en, zéro emoji, arrêt en cas de doute, un commit par écran). S'y ajoute : **aucun chiffre de fiche n'est saisi ni corrigé par le programme** — tout vient des indicateurs de l'entreprise.

## 1. `/cohortes` — liste
Cartes pleine largeur, grille `1.6fr 150px 200px 150px 130px` : nom + badge `EN COURS / DÉMARRAGE`, période · n entreprises · n data rooms | Recherché | Préparation moyenne (barre, verte ≥ 70 %) | À relancer (rouge si > 2) | Dans la vitrine. Header : « 3 cohortes actives · 31 entreprises · 38 data rooms », actions « Archives » + « Nouvelle cohorte » (Encre).

## 2. `/cohortes/[id]` — détail
- Fil d'Ariane « Mes cohortes / {nom} ». Sous-titre : n entreprises · n data rooms · période · échéance (demo day).
- Actions d'en-tête : « Rapport bailleur » (secondaire), « Publier la vitrine » (orange ; désactivé avec raison si rien de listable).
- Filtres chips : Toutes / Décrochent / Dans la vitrine + « Trié par risque » à droite.
- **Barre de sélection** au-dessus de la table : « n entreprises listées dans le dealroom · sur N · vous choisissez qui apparaît · x en attente d'accord » + « Tout décocher » + « Mettre à jour le dealroom ». Fond `#FEFAF7` bordure `#F0C4AE` quand n > 0.
- Table, grille `30px 1.7fr 150px 120px 170px 150px` : **case à cocher** (17 px, orange cochée ; inerte + fond `#F4F1EA` sans `listing_consent`, title « En attente de l'accord de l'entreprise ») | entreprise + badge d'état (`DÉCROCHE / PRÊTE / EN COURS`) | n salles | recherché | préparation (barre : rouge < 45, orange, verte ≥ 75) | statut : `DANS LE DEALROOM` / « Non listée » / « Accord en attente » (ambre).
- Note sous la table : plusieurs salles par entreprise, le dealroom pointe la salle **désignée** ; retirer du dealroom ne coupe pas les accès accordés.
- Panneau latéral **Questions & suggestions** (380 px) : entrées avec badge `QUESTION` (bleu) / `SUGGESTION` (ambre), entreprise, statut `EN ATTENTE / RÉPONDUE / LUE`, date ; composeur en pied avec bascule Question/Suggestion et la phrase « Une suggestion n'attend pas de réponse. Une question, oui. »

## 3. `/vitrine` (vue investisseur invité)
- Topbar dédiée : logo, « Vitrine {programme} » + badge cohorte, « Vous consultez en tant qu'investisseur invité », avatar. Pas de sidebar.
- Bandeau de filtres : **revenus = intervalle** (double curseur, bornes affichées en mono orange), lignes chips INSTRUMENT (Equity/Dette/Mezzanine) · STADE · SECTEUR, compteur « n filtres actifs · n résultats ».
- Grille de cartes (4 colonnes) : sigle, nom, secteur · ville, puis 3 lignes label/valeur (Recherché, Revenus ARR, Croissance), filet, « Dossier prêt n % » + barre, badges STADE + INSTRUMENT. Toute la carte cliquable → fiche.
- Aucune donnée confidentielle ; total recherché agrégé en tête.

## 4. Fiche entreprise
- En-tête : sigle 46 px, nom, secteur · ville · stade · montant, badge `DOSSIER n %`.
- **Bascule « Lecture equity » / « Lecture dette »** (chips) — change la liste des 8 lignes label/valeur :
  - Equity : ARR · Croissance · Marge brute · Runway · CAC/LTV · Tour recherché · Dilution envisagée · Cap table.
  - Dette : CA 12 mois · EBITDA · Couverture du service de la dette · Endettement · BFR · Garanties · Saisonnalité · Cycle de trésorerie.
- Valeur absente → « non communiqué », italique, gris — jamais calculée à sa place.
- Pied : « Chiffres renseignés par l'entreprise · mise à jour le {date} » (bandeau si > 90 j) + « Aucun document n'est consultable depuis cette fiche » + CTA unique « Demander l'accès à la data room » → crée `access_requests(pending)` avec l'instrument filtré.

## 5. `/demandes`
- En-tête : « Vous filtrez et recommandez. L'entreprise accorde — sauf mandat explicite de sa part. » + badge `n EN ATTENTE`.
- Par demande : qui (sigle, nom, organisation · type), quelle entreprise, quelle salle, instrument recherché, ancienneté ; badge **`MANDAT ACCORDÉ`** (vert) ou **`DÉCISION STARTUP`** (ambre).
- Actions : sans mandat « Transmettre avec avis favorable » (orange) / « Transmettre sans avis » / « Écarter » (texte rouge) + légende « L'entreprise tranchera — vous éclairez sa décision » ; avec mandat le bouton orange devient « Accorder l'accès ».
- Pied d'écran : chaque issue écrite au journal d'audit de l'entreprise ; un refus se conserve.

## 6. Contrôles
- [ ] Case de listage réellement inerte sans consentement (RLS testée, pas seulement l'UI).
- [ ] « Mettre à jour le dealroom » ne publie que consenties **et** dossier entamé.
- [ ] La bascule equity/dette ne montre jamais une grille mélangée ; « non communiqué » jamais remplacé par 0.
- [ ] Demander l'accès depuis une fiche filtrée « Dette » porte `instrument=dette`.
- [ ] Chaque transition de demande visible dans le journal d'audit de l'entreprise concernée.
- [ ] Chaînes fr + en ; rapport de PR avec divergences.
