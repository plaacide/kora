# Rebranding Kora → Sanza — instructions d'implémentation

Contexte : plateforme de dealflow panafricaine. Le site actuel (dashboard "Kora") doit adopter l'identité **Sanza**. Domaine : **sanza.africa**.

## 1. Renommage
- Remplacer partout `Kora` / `kora` → `Sanza` / `sanza` (UI, titres `<title>`, meta, emails d'exemple).
- Emails et URLs d'exemple : `*@sanza.africa`, `sanza.africa`.

## 2. Tokens de marque
Ajouter ces variables CSS (ou équivalent Tailwind) :

```css
:root {
  --sz-encre:     #171A2C;  /* fonds sombres, texte principal */
  --sz-vibration: #E85C2B;  /* accent unique — CTA, échos du logo */
  --sz-vibration-soft: #F08A5E; /* échos sur fond sombre */
  --sz-craie:     #F4EFE6;  /* fonds clairs chauds */
  --sz-papier:    #FFFFFF;
  --sz-brume:     #8B8FA3;  /* texte secondaire */
  --sz-texte-2:   #4A4E63;
  --sz-bordure:   #E8E5DC;
}
```

Typographie (Google Fonts) :
- **Instrument Sans** (400–700) : tout — titres, UI, corps.
- **IBM Plex Mono** (400–600) : chiffres, montants, références de deals (`DEAL-2026-0142`), emails.

## 3. Le logo « vibration »
Concept : le dernier « a » de « sanza » vibre — deux échos orange décalés à droite, DERRIÈRE la lettre. Toujours en bas de casse, Instrument Sans 700, letter-spacing -0.015em.

Composant React (à utiliser partout, ne pas recréer en image) :

```jsx
export function SanzaLogo({ size = 32, dark = false, animate = false }) {
  const main = dark ? '#fff' : '#171A2C';
  const echo = dark ? '#F08A5E' : '#E85C2B';
  const e = (off, op, delay) => (
    <span style={{ position: 'absolute', left: off, top: 0, color: echo, opacity: op,
      animation: animate ? `sz-vib 2.4s ease-in-out infinite ${delay}` : 'none' }}>a</span>
  );
  return (
    <span style={{ position: 'relative', display: 'inline-block', fontFamily: "'Instrument Sans',sans-serif",
      fontWeight: 700, fontSize: size, letterSpacing: '-0.015em', color: main, lineHeight: 1 }}>
      sanz
      <span style={{ position: 'relative', display: 'inline-block' }}>
        {e('0.52em', 0.3, '0s')}
        {e('0.26em', 0.55, '0s')}
        <span style={{ position: 'relative' }}>a</span>
      </span>
    </span>
  );
}
```

```css
@keyframes sz-vib {
  0%,100% { transform: translateX(0) }
  20% { transform: translateX(0.10em) }
  40% { transform: translateX(0.03em) }
  60% { transform: translateX(0.07em) }
  80% { transform: translateX(0.02em) }
}
```

Icône seule (favicon, avatar, app icon) : carré arrondi Encre (#171A2C, radius = 25% du côté), « a » blanc centré avec 1–2 échos orange (#F08A5E). Fichiers SVG fournis dans ce dossier (`icon.svg`, `favicon.svg`).

Règles :
- Les deux échos sont décalés d'environ un demi-glyphe (0.26em) et d'un glyphe entier (0.52em) : à petite taille ils doivent rester lisibles comme des lettres répétées, jamais comme un bloc plein. Jamais d'écho sur une autre lettre. Jamais d'écho sur fond orange.
- Zone de protection : hauteur du « s » sur les 4 côtés. Taille min : 20 px de haut.
- `animate={true}` uniquement sur l'écran de connexion / splash — statique partout ailleurs.

## 4. Application au dashboard
- Sidebar : fond Encre (#171A2C), logo `SanzaLogo dark size={22}` en tête, item actif = fond rgba(232,92,43,0.14) + texte #F08A5E.
- Boutons primaires : fond #E85C2B, texte blanc, radius 9px, hover #D14E20.
- Fond de page : #F7F5F0 (craie très clair) ; cartes blanches, bordure #E8E5DC, radius 12px.
- Badges de statut : garder les couleurs fonctionnelles existantes ; l'orange est réservé aux CTA et au logo.
- Montants / IDs : IBM Plex Mono.
- Liens : #E85C2B, hover #171A2C.

## 5. Motif « écho » (décoration)
Groupes de 3 barres verticales (radius plein) : 2 orange (opacités 0.3 / 0.55) + 1 pleine (blanc sur sombre, Encre sur clair), hauteurs variées. Usage : bordure de bannière, headers vides, écrans d'onboarding. Jamais en fond entier.

## 6. Authentification & onboarding
Spécification complète des écrans login / signup / onboarding investisseur (2 étapes) / fondateur (2 étapes) / bienvenue dans `AUTH-ONBOARDING.md`. Pas d'étape KYC pour le moment.

## 7. Meta / favicon
- `<title>Sanza — Le dealflow africain, enfin structuré</title>`
- Tagline marketing : « Faites résonner vos deals. »
- favicon.svg fourni ; générer les PNG 32/180/512 depuis `icon.svg`.
