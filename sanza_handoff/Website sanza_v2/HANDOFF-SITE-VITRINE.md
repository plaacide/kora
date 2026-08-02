# Handoff — Site vitrine Sanza (page d'accueil, direction 2a)

**Source de vérité : `site-vitrine-2a.html` (dans ce dossier — export exact du bloc `#2a`, autonome, s'ouvre dans un navigateur).**
Reproduire ce design à l'identique. Ne pas réinterpréter, ne pas « améliorer », ne pas changer les espacements, tailles, couleurs ou textes. En cas de doute : copier la valeur exacte du fichier source.

## Contexte
- Page d'accueil marketing de Sanza (data room, préparation à la levée, mise en relation investisseurs — Afrique de l'Ouest et centrale).
- Direction retenue : **2a — SaaS conversion-focused**, style chaleureux Sanza (PAS le style Modernist rouge du produit interne).
- Les blocs `#1a`, `#1b`, `#1c` du fichier sont des explorations abandonnées — les ignorer.

## Stack conseillée
- Next.js ou site statique — au choix de l'équipe.
- Fonts : Google Fonts `Archivo` (700/800, titres) + `Inter` (400/500/600, texte). Déjà chargées via `fonts.googleapis.com` dans la source.
- Aucune dépendance JS requise : toutes les animations sont **CSS pur** (keyframes).

## Tokens (extraits de la source — ne pas dériver d'autres valeurs)
- Orange primaire (CTA, marque) : `#E85C2B` · orange foncé (liens, kickers) : `#C24619`
- Fond teinté chaud : `#FDF4EF` · bordure teintée : `#F5C6AE`
- Encre : `#101828` · texte secondaire : `#475467` · tertiaire : `#667085` · muted : `#98A2B3`
- Bordures : `#E4E7EC` (forte) / `#F2F4F7` (faible) · fond gris : `#F9FAFB`
- Succès : fond `#ECFDF3`, texte `#027A48` · PDF chip : `#FEE4E2` / `#B42318`
- Radius : 6px (boutons), 8–10px (cartes), 999px (pills), 12px (preview hero), 14px (bandeau CTA final)
- Bandeau CTA final : fond `#101828`

## Structure de la page (ordre exact)
1. **Nav** — logo S orange + « Sanza », liens (Produit, Pour les programmes, Pour les financeurs, Tarifs), « Se connecter », CTA « Commencer gratuitement ».
2. **Hero centré** — fond dégradé `#FDF4EF → #fff`. Pill « Data room · Préparation · Mise en relation investisseurs ». H1 : **« Levez des fonds sans jamais perdre le fil de votre dossier. »** (Archivo 700, 50px, tracking −.025em). Sous-titre, 2 CTA (orange plein + outline), ligne de réassurance (« Sans carte bancaire · Data room prête en 14 jours · Vos documents restent sous votre contrôle »).
3. **Aperçu produit hero** — carte 920px, coins arrondis en haut seulement, coupée par la section suivante : « Levée Seed 2026 · CoolBricks », badge « Readiness 82 % », 3 tuiles (Data room / Préparation / Investisseurs).
4. **Barre logos** — « Ils font confiance à Sanza » + 5 noms (Savane Accelerator, Banque Atlantique, Impact Partners, BOAD, Teranga Capital). Remplacer par les vrais logos clients en niveaux de gris.
5. **3 sections bénéfices alternées** (texte ↔ capture vidéo) : Data room / Préparation / Mise en relation. Kicker uppercase orange, H2 Archivo 30px, paragraphe, lien flèche orange.
6. **Témoignage + métriques** — fond `#F9FAFB` : citation Aminata Koné (CoolBricks) + grille 2×2 (−60 %, 14 jours, 250+, 12 pays).
7. **Bande sécurité** — Chiffrement AES-256, Journal d'audit complet, NDA & filigrane natifs, Vous restez propriétaire de vos données.
8. **CTA final** — carte sombre `#101828` arrondie 14px : titre + « Créer mon espace » (orange) + « Voir les tarifs » (outline blanc).
9. **Footer** — © 2026 Sanza · Confidentialité · Sécurité · Contact.

## Captures produit animées (« vidéos »)
**→ HTML/CSS complet, prêt à copier : `captures-video-produit.html` (même dossier).** Il contient les keyframes et les 3 blocs, autonomes (une seule dépendance : Google Fonts). Intégrer tels quels — le reste de cette section décrit ce que fait le code.

Les 3 blocs capture des sections bénéfices sont des **maquettes produit animées en CSS pur**, boucle synchronisée de **14 s** — pas de vraies vidéos, pas de GIF, pas de lib d'animation :

- **Cadre** : hauteur 280px, radius 10px, `overflow:hidden`, fond dégradé teinté ; mini-fenêtre produit (barre titre avec 3 points + badge) posée au centre avec ombre portée.
- **Ken burns** : `kbA/kbB/kbC` — zoom `scale(1.05) → ~1.3` avec translation vers la zone d'intérêt, puis retour (ease-in-out).
- **Curseur** : flèche SVG animée en `left/top` (`curA/curB/curC`) + anneau de clic orange (`ringA/B/C`) au moment du clic.
- **Scénarios** (moments en % de la boucle) :
  - *Data room* : clic dossier « 02 Finances » (~26 %) → il se teinte orange (`folderHit`) → 3 documents apparaissent en cascade (`docIn1-3`) → toast journal d'audit « Banque Atlantique a consulté “Cap table” » (57–86 %, `toastA`).
  - *Préparation* : clic sur « Pacte d'associés » (~30 %) → la ligne passe de « À déposer » (pointillés orange) à « ✓ Déposé à l'instant » (crossfade `swapOut34/swapIn34`), le badge passe 18/24 → 19/24, la barre Readiness monte 58 % → 79 % (`barGrow`).
  - *Dealroom* : Teranga Capital « Due diligence » avec point vert pulsant (`livePulse` 2s) ; clic « Approuver » (~38 %) → devient « ✓ Accès accordé » (`swapOut42/swapIn42`) ; nouvelle ligne « Banque Atlantique — Nouvelle demande d'accès » glisse à 72 % (`rowLate`).
- **Chrome vidéo** : bandeau bas en dégradé sombre, libellé « ▶ Aperçu produit — … » + « 0:14 », barre de progression orange 3px (`vidbar`, 14s linear).
- **Interaction** : `:hover` sur le cadre = pause de toutes les animations (`animation-play-state:paused`).
- **Accessibilité** : envelopper toutes les animations dans `@media (prefers-reduced-motion: no-preference)` ; en reduced motion, afficher l'état final statique.
- Ces maquettes seront remplacées à terme par de vraies captures vidéo produit — garder le même cadre (280px, chrome vidéo, pause au survol).

## Règles à ne pas violer
1. Ne pas centrer ce qui est aligné à gauche (et inversement — le hero 2a est centré, les sections bénéfices sont alignées à gauche).
2. Ne pas remplacer les couleurs par une palette Tailwind « proche » — utiliser les hex exacts.
3. Ne pas ajouter de sections (FAQ, pricing, blog…) sans validation.
4. Un seul H1. Boutons : padding 14px 26px (hero) / 10px 18px (nav).
5. Textes : copier-coller depuis la source, y compris ponctuation française (« », ·, —, espaces insécables).
6. Toutes les durées d'animation = 14s partagées, sinon les scénarios se désynchronisent.

## Reste à faire (hors périmètre de ce handoff)
- Pages Produit, Programmes, Financeurs, Tarifs (même système visuel).
- Vrais logos clients, vraie photo/identité du témoignage, liens footer.
- Responsive mobile (la source est un desktop 1240px ; empiler les grilles 2 colonnes, hero à 32px).
