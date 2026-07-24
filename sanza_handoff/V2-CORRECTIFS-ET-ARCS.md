# Sanza — corrections & mise à niveau UI (v2)

Ce document remplace les indications précédentes sur les écrans d'auth/onboarding. Il corrige trois défauts constatés sur l'implémentation actuelle et étend le fond des écrans d'onboarding à toute la plateforme.

---

## 1. ⚠ CORRECTIF PRIORITAIRE — le logo est cassé

Sur l'implémentation actuelle le logo affiche un **bloc orange** après « sanza » au lieu de deux lettres fantômes. Cause : les échos sont décalés de 0.16em / 0.08em, soit ~4 px à 25 px de police — la lettre pleine les recouvre à 96 %, seul un liseré orange dépasse.

**Nouvelles valeurs (obligatoires, à appliquer partout) : `0.52em` et `0.26em`** — soit un glyphe entier et un demi-glyphe. Le motif doit se lire comme une lettre répétée à 19 px comme à 46 px.

```jsx
export function SanzaLogo({ size = 32, dark = false, animate = false }) {
  const main = dark ? '#fff' : '#171A2C';
  const echo = dark ? '#F08A5E' : '#E85C2B';
  const e = (off, op) => (
    <span style={{ position: 'absolute', left: off, top: 0, color: echo, opacity: op,
      animation: animate ? 'sz-vib 2.4s ease-in-out infinite' : 'none' }}>a</span>
  );
  return (
    <span style={{ position: 'relative', display: 'inline-block', fontFamily: "'Instrument Sans',sans-serif",
      fontWeight: 700, fontSize: size, letterSpacing: '-0.015em', color: main, lineHeight: 1 }}>
      sanz
      <span style={{ position: 'relative', display: 'inline-block' }}>
        {e('0.52em', 0.3)}
        {e('0.26em', 0.55)}
        <span style={{ position: 'relative' }}>a</span>
      </span>
    </span>
  );
}
```

Icône seule (favicon, avatar) : un seul écho à `0.30em`. Les SVG du dossier `sanza_handoff/` ont été corrigés — réimportez-les.

## 2. Autres correctifs de fond

- **Tout en français.** L'écran d'inscription mélange « Create an account / Full name / Work email / Password / Language » avec du français. Traduire intégralement : Créer votre compte · Nom complet · Email professionnel · Mot de passe. Le sélecteur de langue sort du formulaire (lien discret en pied de page : Français / English).
- **Zéro emoji.** Remplacer 📊 🚀 🎯 par des icônes SVG en trait (stroke 2px, `currentColor`), 19 px, dans la couleur du texte secondaire — orange quand la carte est sélectionnée.
- **Plus de vide vertical.** Les écrans actuels ont une carte perdue au milieu d'une page vide. Voir §3 et §4 : chaque écran doit remplir sa hauteur.

## 3. Écrans d'authentification — nouvelle composition

Split `52% / 48%`, hauteur `100vh`, aucune zone morte.

**Colonne gauche** (`#FAF8F4`, padding 52px 64px, flex column) :
1. Logo en haut (25px)
2. `flex:1` centré verticalement : le formulaire, largeur max 392px (login) / 452px (signup)
3. Pied de page : `© 2026 Sanza` + liens Confidentialité / CGU / Aide (12px, `#9B9EAE`)

Ordre du formulaire login : titre 32px « Bon retour » → « Pas encore de compte ? Créer un compte » → **boutons SSO Google et LinkedIn d'abord** → séparateur « OU PAR EMAIL » → email + mot de passe → CTA orange pleine largeur.

Signup : titre « Créer votre compte » → « Déjà inscrit ? Se connecter » → sélecteur de rôle 3 cartes (Fondateur / Investisseur / Programme, icônes SVG, carte active = bordure 1.5px `#E85C2B` + fond `#FDF1EA`) → Nom complet, Email professionnel, Mot de passe → CTA → mention CGU.

Champs : fond blanc, bordure `#E2DED4`, radius 10px, padding 13px 14px, texte 14px.

**Colonne droite** (`#171A2C`, contenu centré verticalement) — c'est là que se jouait le vide. Composition :
- Arcs de résonance dans deux coins opposés (voir §4)
- Login : badge pill « Bêta privée · fondateurs » → titre 36px → sous-titre → **carte produit en verre** (`rgba(255,255,255,0.055)`, bordure `rgba(255,255,255,0.10)`, radius 16px) montrant un deal fictif : nom, réf mono, badge Série A, barre « Dossier complété 82 % », trois métriques (2,4 M$ · 14 accès · 6 j) → ligne de deux mentions de confiance avec icônes.
- Signup : titre 36px « Faites résonner vos deals. » → 3 lignes-features en cartes de verre (icône dans carré arrondi orange 34px + titre + description) → `sanza.africa` en mono.

## 4. 🎨 Le fond « arcs de résonance » — à étendre à TOUTE la plateforme

C'est l'élément d'identité à généraliser. Cercles concentriques en trait fin qui débordent d'un coin, du plus orange (intérieur) au plus transparent (extérieur).

```html
<svg style="position:absolute;right:-190px;top:-150px;pointer-events:none"
     width="560" height="560" viewBox="0 0 560 560" fill="none">
  <circle cx="280" cy="280" r="88"  stroke="rgba(232,92,43,0.26)" stroke-width="1.5"/>
  <circle cx="280" cy="280" r="146" stroke="rgba(232,92,43,0.16)" stroke-width="1.5"/>
  <circle cx="280" cy="280" r="206" stroke="rgba(255,255,255,0.09)" stroke-width="1.5"/>
  <circle cx="280" cy="280" r="268" stroke="rgba(255,255,255,0.055)" stroke-width="1.5"/>
</svg>
```

À implémenter comme composant réutilisable, par exemple `<ResonanceArcs corner="top-right" size={560} tone="dark" />`, le parent portant `position:relative; overflow:hidden`.

**Règles d'application :**

| Contexte | Usage |
|---|---|
| Panneaux Encre (auth, bienvenue, hero site) | 2 jeux d'arcs, coins opposés, 520–680px |
| Écrans vides (empty states, 404, chargement) | 1 jeu, coin bas-droit, 480px |
| Cartes sombres dans une page claire (encart « Bon à savoir », carte « Et bien plus ») | 1 jeu réduit, 200–260px, coin bas-droit |
| Modales de confirmation à fond Encre | 1 jeu, 320px |
| Bandeaux d'en-tête sombres du dealroom | 1 jeu très large et très discret (opacités ÷ 2) |

**Sur fond clair** (`#F4F1EA` / `#FAF8F4`) : mêmes cercles avec `rgba(232,92,43,0.12)` puis `rgba(23,26,44,0.05)` — réservé aux grandes surfaces vides, jamais derrière un tableau ou une liste dense.

**Interdits :** jamais derrière du texte long ou un tableau de données ; jamais plus de 2 jeux par écran ; jamais de remplissage (`fill`), uniquement du trait 1.5px ; ne pas animer.

## 5. Onboarding — remplacer la carte isolée par une grille

Header sticky blanc (56px) : logo 20px · à droite `ÉTAPE n / 2` en mono + barre de progression 140×4px + lien « Enregistrer et quitter ».

Corps : fond `#F4F1EA`, contenu centré verticalement, **grille `288px 1fr`, gap 40px, largeur 1040px** :

- **Rail gauche** : titre « VOTRE INSCRIPTION », puis les 3 étapes reliées par un trait vertical 2px — pastille 24px (orange pleine = active, coche blanche = faite, bordure grise = à venir), titre + sous-titre. Étape 3 = « Votre data room — après l'inscription ». En dessous, un encart contextuel : carte Encre avec arcs à l'étape 1 (« Bon à savoir : votre fiche reste modifiable »), carte blanche à l'étape 2 expliquant **Fiche** vs **Dossier**.
- **Carte formulaire droite** : blanc, bordure `#E8E5DC`, radius 18px, padding 40px 44px. Titre 24px + sous-titre, champs en grille 2 colonnes, filet `#F0EDE4` avant la ligne d'actions (lien secondaire à gauche, CTA orange à droite).

Ajouts utiles : compteur de caractères sur « En une phrase » (68 / 120) ; chips « Calendrier visé » à l'étape 2 ; encart « Fiche complétée 60 % » expliquant la suite.

⚠ Le bouton « Continuer » ne doit pas rester en orange pâle permanent : état désactivé = `#F0EDE4` + texte `#A9ACBB`, actif = `#E85C2B`.

## 6. Écran Bienvenue

Plein écran Encre, arcs dans deux coins opposés (640 et 680px), contenu centré 660px : wordmark 46px → titre 38px « Bienvenue sur Sanza, {prénom} » → paragraphe → checklist en **une seule carte de verre** (lignes séparées par `rgba(255,255,255,0.07)`, pastille orange à coche pour les items faits) → deux CTA côte à côte : « Accéder au dealroom → » (orange) et « Déposer mes documents » (verre).

## 7. Rappel des tokens

`#171A2C` Encre · `#E85C2B` Vibration · `#F08A5E` Vibration claire (sur fond sombre) · `#FAF8F4` / `#F4F1EA` fonds clairs · `#E2DED4` / `#E8E5DC` bordures · `#4A4E63` texte secondaire · `#8B8FA3` texte tertiaire.
Instrument Sans partout ; IBM Plex Mono pour chiffres, montants, références et libellés d'étape.
