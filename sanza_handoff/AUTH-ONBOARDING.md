# Sanza — écrans d'authentification & onboarding

À implémenter avec les tokens et le composant `SanzaLogo` définis dans `INSTRUCTIONS-CLAUDE.md`. Routes suggérées : `/login`, `/signup`, `/onboarding/investisseur/[1-2]`, `/onboarding/fondateur/[1-2]`, `/bienvenue`.

## Gabarit auth (login & signup)
Split-screen : panneau gauche 400px fixe fond Encre (#171A2C), reste blanc avec formulaire centré (max-width 360–380px).

### Panneau gauche (commun)
- Logo `SanzaLogo dark size={34}` en haut.
- **Décor "arcs de résonance"** : cercles concentriques en trait fin (1.5px) débordant d'un coin, du plus orange au plus blanc en s'éloignant. SVG :

```html
<svg style="position:absolute;right:-160px;bottom:-160px;pointer-events:none"
     width="480" height="480" viewBox="0 0 480 480" fill="none">
  <circle cx="240" cy="240" r="80"  stroke="rgba(232,92,43,0.22)" stroke-width="1.5"/>
  <circle cx="240" cy="240" r="130" stroke="rgba(232,92,43,0.15)" stroke-width="1.5"/>
  <circle cx="240" cy="240" r="180" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>
  <circle cx="240" cy="240" r="232" stroke="rgba(255,255,255,0.05)" stroke-width="1.5"/>
</svg>
```
Coin bas-droit sur /login, coin haut-gauche sur /signup (parent `position:relative;overflow:hidden`).

### /login — panneau gauche
- Titre : « Le dealflow africain, **enfin structuré.** » (partie 2 en #E85C2B)
- Sous-texte : « 240 investisseurs et 1 800 startups se rencontrent sur Sanza. »
- 2 badges pill (fond rgba(255,255,255,0.07), bordure rgba(255,255,255,0.10)) : icône bouclier « KYC vérifié », icône barres « Deals suivis » (icônes stroke #F08A5E, 2.2px).

### /login — formulaire
Titre « Bon retour » / « Connectez-vous à votre espace ». Champs : Email professionnel, Mot de passe (+ lien « Oublié ? » à droite du label). CTA plein « Se connecter » (#E85C2B, radius 9px, hover #D14E20). Séparateur « ou », puis SSO : « Continuer avec Google », « Continuer avec LinkedIn » (boutons blancs, bordure #E8E5DC). Footer : « Pas encore de compte ? Créer un compte ».

### /signup — panneau gauche
- Titre : « Faites résonner vos deals. »
- 3 items avec icônes dans des carrés arrondis (30px, fond rgba(232,92,43,0.16), icône stroke #F08A5E) : bouclier-check « Deals vérifiés, screening OFAC / UE / ONU » · base de données « Data rooms et syndication intégrées » · courbe « Reporting KPI automatisé post-investissement ».
- Footer : `sanza.africa` en IBM Plex Mono.

### /signup — formulaire
Titre « Créer votre compte » / « Vous êtes… ». Sélecteur de rôle : 2 cartes radio (Investisseur 📊 « Je cherche des opportunités d'investissement » / Fondateur 🚀 « Je lève des fonds pour ma startup ») — carte active : bordure 2px #E85C2B + fond rgba(232,92,43,0.06). Champs : Nom complet, Email professionnel, Mot de passe. CTA « Continuer ». Mention CGU + politique de confidentialité en 11px.

## Gabarit onboarding (toutes étapes)
- Fond de page #F7F5F0. Header blanc sticky : logo `SanzaLogo size={19}` à gauche ; à droite `ÉTAPE n / total` (IBM Plex Mono 11px #8B8FA3) + barre de progression 120×4px (#E8E5DC, remplissage #E85C2B).
- Carte centrée 560px, blanc, bordure #E8E5DC, radius 16px, padding 36/40px.
- Boutons bas : secondaire blanc bordé (« Plus tard » ou « ← Retour ») + primaire orange.
- Chips sélectionnables (pill radius 999px) : inactif bordure #E8E5DC texte #4A4E63 ; actif bordure #E85C2B, fond rgba(232,92,43,0.08), texte #C64B1E.

**⚠ Pas d'étape de vérification d'identité (KYC) pour le moment — retirée du parcours.**

### Investisseur — étape 1/2 « Votre profil d'investisseur »
Sous-titre « Pour ne vous montrer que les deals pertinents ». Chips type d'investisseur : Fonds VC, Business angel, DFI, Family office, Corporate (choix unique). 2 champs : Organisation · Ticket moyen (USD, valeur en Plex Mono). CTA « Continuer → ».

### Investisseur — étape 2/2 « Votre thèse d'investissement »
Sous-titre « Sélectionnez tout ce qui s'applique » (multi-choix). Secteurs : Agritech, Fintech, Santé, Logistique, Énergie, Éducation. Géographies : Afrique de l'Ouest / Est / Nord / australe. Stades : Pré-seed, Seed, Série A, Série B+. CTA « Terminer ».

### Fondateur — étape 1/2 « Votre startup »
Sous-titre « Ces informations composent votre fiche visible par les investisseurs ». Grille 2 col : Nom de la startup · Pays (select) · Secteur (select) · Stade (select), puis « En une phrase » (textarea). CTA « Continuer → ».

### Fondateur — étape 2/2 « Votre levée »
Sous-titre « Alimenter votre score de readiness — visible des investisseurs ». Montant recherché (USD) · Revenus annuels ARR (Plex Mono). Zone d'upload pitch deck (bordure pointillée #C9CBD6, hover bordure #E85C2B, icône ↑ dans carré orange clair) avec mention « ajoutera +18 pts à votre readiness ». Encart score : barre de progression + « Complétez la data room après l'inscription pour dépasser 80. » CTA « Terminer ».

### /bienvenue
Plein écran Encre #171A2C, arcs de résonance dans deux coins opposés, contenu centré 480px :
- Motif écho (2 groupes de 3 barres : 2 orange opacité 0.3/0.55 + 1 blanche)
- « Bienvenue sur Sanza, {prénom} » + « Votre profil est prêt. {n} deals correspondent déjà à votre thèse… »
- Checklist translucide (fond rgba(255,255,255,0.06)) : ✓ Profil investisseur — Complet · ✓ Thèse d'investissement — Complète · ○ Inviter votre équipe — Optionnel
- CTA « Accéder au dealroom → »

## Comportements
- Après signup : router selon le rôle vers son onboarding ; chaque étape sauvegarde au fur et à mesure (bouton « Plus tard » = skip, on peut revenir).
- Le score de readiness du fondateur se recalcule à chaque champ rempli.
- SSO Google/LinkedIn : pré-remplir nom/email puis aller au choix de rôle.
