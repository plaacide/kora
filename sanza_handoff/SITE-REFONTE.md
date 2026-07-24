# Sanza — Site marketing (refonte) · handoff Claude Code

Maquettes de référence (ouvrir dans le navigateur pour l'interaction réelle) :
- **`Sanza Site v3.dc.html`** — page d'accueil
- **`Sanza Institutions.dc.html`** — page banques & DFI
- **`Sanza Accelerateurs.dc.html`** — page accélérateurs & hubs

Ce document dit **quoi implémenter et pourquoi**. Réimplémenter dans la stack du site existant, en réutilisant les tokens de marque de `INSTRUCTIONS-CLAUDE.md`. Remplace le récit précédent (`SITE-IMPLEMENTATION.md`, orienté marketplace/matching).

---

## 0. Pivot de positionnement (important)
L'ancien site vendait une **marketplace / matching de dealflow** (fiche startup, score d'affinité, cohortes). Le produit réel est une **dealroom pour lever des fonds en Afrique**. Le nouveau site raconte CE produit. Le matching investisseurs reste un « à venir », pas le message principal.

**Promesse centrale :** *data room sécurisée + suivi de due diligence + investisseurs, dans un seul espace — adapté à qui vous finance (VC, DFI, banque).*
**Différenciateur clé (à garder partout) :** la diligence et les indicateurs **s'adaptent au type de financeur**. Angle Afrique / OHADA / SYSCOHADA, unique face à DocSend.

---

## 1. Système visuel (= celui de l'app, cf. APP-DASHBOARD.md)
Aligner le site sur l'app, pas l'inverse. Supprimer l'ancien style (beige `#F7F5F0`, cercles concentriques pulsants, cartes 16–18px très arrondies, emoji 📁, grosses ombres).
- Surfaces **blanches** ; bandes alternées `#FAFAF8` (clair) et `#14161F` (hero/sécurité/footer).
- Hairlines `#ECEBE6` (séparateurs internes `#F1F0EC`). Ombres quasi nulles (une ombre douce seulement sous les aperçus produit).
- **Rayons courts** : conteneurs/cartes 8px, boutons/chips 6–7px, badges 4px. Pas de pilules sauf toggles.
- **Orange en accent seul** : CTA, wordmark, liens, chiffres clés, état actif. Décor = **anneaux SVG statiques** très discrets (bordure `rgba(232,92,43,0.16)`), jamais d'animation pulsante.
- Typo : **Instrument Sans** (titres/UI) + **IBM Plex Mono** (chiffres, montants, URLs, empreintes, eyebrows). H1 ~54–58px/700 letter-spacing -0.03em ; H2 ~34px ; eyebrow mono 11px uppercase gris.
- Tokens couleurs : encre `#1A1B1F`, secondaire `#6E727A`, muet `#9DA0A8`, orange `#E85C2B`/hover `#D24E1F`/texte `#C24619`, tint `#FBEDE6`/`#FEF8F4`, vert `#147A5C`/`#E4F3EC`, bleu `#185FA5`/`#E9F2FB`. Hero sombre `#14161F`, footer `#12141F`.
- Container centré `max-width:1240px`, padding `40px` latéral. (Le site marketing reste centré — la consigne « pleine largeur » ne concernait que l'app.)

---

## 2. Page d'accueil (`Sanza Site v3`)
Sections, dans l'ordre :
1. **Nav** sticky blanche : wordmark · Produit · Institutions · Accélérateurs · Tarifs · Se connecter · CTA « Créer ma dealroom ».
2. **Hero sombre** : eyebrow `DEALROOM · AFRIQUE · OHADA` ; H1 « Levez des fonds sans jamais perdre le fil de votre dossier. » ; sous-titre (promesse centrale, « adapté à qui vous finance » en gras) ; 2 CTA ; **aperçu produit = la bande "En bref" de l'app** (chrome navigateur + sélecteur VC/DFI/Banque + 5 tuiles d'indicateurs).
3. **Bande de confiance** : Chiffré · SOC 2 / Conforme OHADA-SYSCOHADA / Journal infalsifiable / NDA intégré / Hébergé pour l'Afrique.
4. **Le constat** (3 colonnes, bordure haute orange) : pièces éparpillées · financeurs différents · zéro visibilité.
5. **Le produit en action** — bloc à **onglets interactifs** (aperçu dans un chrome navigateur, l'URL change par onglet) :
   - *Data room & droits* : arbo indexée (Index/Dossier/Droits/Visible) + toggles Oui/Masqué.
   - *Diligence adaptée* : **mini-sélecteur VC/DFI/Banque qui change la checklist** (items Fait/À fournir + réf. 1.2, 2.1…). C'est le moment fort.
   - *NDA & signatures* : table signataires + empreinte + preuve PDF.
   - *Signal de lecture* : qui a lu quoi + mini bar-chart 7 jours + encart « Signal ».
6. **Financeurs** (`#financeurs`, fond clair) : 3 cartes VC · Equity / DFI · Impact / Banque · Dette — « regarde X » + 3 puces de ce qu'ils scrutent.
7. **Sécurité** (`#securite`, sombre) : 4 cellules — servi page par page · journal chaîné · accès révocables · Chiffré SOC 2.
8. **CTA final** + **Footer** (colonnes Produit / Pour qui [→ Institutions, Accélérateurs, Fondateurs] / Société).

### État interactif (accueil)
- `feat` (0–3) : onglet produit actif → contenu + URL + style des boutons.
- `aud` (0–2) dans l'onglet *Diligence adaptée* : jeu de pièces de checklist par financeur (voir §4 pour les listes exactes).
- Le sélecteur d'audience du hero peut rester statique (VC par défaut) ou refléter `aud`.

---

## 3. Page Institutions financières (`Sanza Institutions`)
Cible : **banques & DFI** (côté financeur/prêteur).
1. Nav (Institutions actif) ; CTA « Demander un accès » (accès sur invitation).
2. Hero sombre : « Sourcez, analysez et suivez vos financements — sur des dossiers déjà conformes. »
3. **Ce que Sanza apporte** (3 cartes) : dealflow qualifié (pièces OHADA/SYSCOHADA en règle, data room prête) · instruction accélérée à votre grille · suivi post-financement (reporting SYSCOHADA, covenants côté banque, impact côté DFI).
4. **À votre grille de lecture** (2 cartes tableau) : Banque (DSCR 1,4× · EBITDA/marge · gearing · garanties) vs DFI (emplois · part femmes · producteurs · politique E&S). Montre que le même dossier se lit différemment.
5. **Conformité & traçabilité** : puces (screening OFAC/UE/ONU/UEMOA + KYC/AML · journal chaîné · NDA avant accès · SYSCOHADA) + aperçu sombre « Journal d'audit » (pastilles PAGE CONSULTÉE / NDA SIGNÉ / EXPORT REFUSÉ).
6. CTA + footer.

**Logique métier institutions :** accès sur invitation ; filtres de sourcing (secteur, géo, stade, ticket) ; droits par dossier ; export contrôlable (refus possible, journalisé) ; suivi de portefeuille distinct banque (échéances/covenants) vs DFI (impact).

---

## 4. Page Accélérateurs & hubs (`Sanza Accelerateurs`)
Cible : **structures d'accompagnement**.
1. Nav (Accélérateurs actif) ; CTA « Parler à l'équipe ».
2. Hero sombre : « Menez toute votre cohorte jusqu'à la levée. »
3. **Ce que Sanza apporte** (3 cartes) : vue portefeuille de cohorte (readiness + data rooms) · préparation à la levée (modèles data room OHADA + checklist par financeur) · demo day & mise en relation avec les investisseurs de la plateforme.
4. **Tableau de bord cohorte** (aperçu) : « dossier prêt moyen », bar-chart, barres de readiness par startup + puces (onboarding groupé · rôle mentor/lecteur · alertes retard).
5. **Reporting bailleurs** : Sanza consolide capitaux levés / emplois soutenus / avancement → rapport prêt pour bailleurs & partenaires publics (aperçu chiffres sombre).
6. CTA + footer.

**Logique métier accélérateurs :** rôle « organisation programme » chapeautant N startups (chacune sa dealroom) ; readiness agrégé au niveau cohorte ; rôle mentor/lecteur en lecture seule sur les data rooms ; reporting bailleur = agrégation multi-startups.

### Listes de checklist par financeur (onglet « Diligence adaptée » de l'accueil + préparation cohorte)
- **VC :** Statuts & cap table (fait) · Prévisionnels 3 ans · Rétention/churn · Pacte d'associés.
- **DFI :** Politique E&S (fait) · Mesure d'impact (emplois, femmes) · Composition & indépendance du conseil · Déclaration fiscale NINEA/IFU.
- **Banque :** États financiers SYSCOHADA certifiés (fait) · Plan de trésorerie & BFR · Garanties & sûretés · Relevés bancaires 12 mois.

---

## 5. Navigation & liens
- Header identique sur les 3 pages ; item actif en orange.
- Accueil → liens vers `Sanza Institutions` et `Sanza Accelerateurs` (nav + bloc footer « Pour qui »).
- Institutions ↔ Accélérateurs se renvoient l'une vers l'autre (CTA secondaire croisé).
- Tous les CTA principaux pointent vers l'app (`Sanza App v5` / route app en prod). « Tarifs » → page tarifs.

## 6. Rappels d'implémentation
1. Réutiliser le design system + tokens ; ne pas réintroduire l'ancien beige/emoji/cercles animés.
2. i18n FR par défaut ; montants & données en IBM Plex Mono.
3. Anneaux décoratifs = SVG/`border-radius:50%` statiques, opacité très basse.
4. Les 3 aperçus produit doivent rester fidèles à l'app réelle (mêmes libellés, mêmes indicateurs par audience) — cohérence marketing ↔ produit.
5. Responsive : les grilles 3-colonnes passent en 1 colonne sur mobile ; le hero réduit le H1 (~34px).
