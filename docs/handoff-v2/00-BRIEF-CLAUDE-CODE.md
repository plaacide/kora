# À coller dans Claude Code — brief Sanza

Tu implémentes **Sanza**, une dealroom pour lever des fonds en Afrique (React + le design system existant du repo). Tout est déjà conçu : suis les maquettes et les specs, ne réinvente pas.

## Ordre de travail
1. Lis d'abord `sanza_handoff/INSTRUCTIONS-CLAUDE.md` (marque, tokens, logo, fonts).
2. **App (dealroom)** — implémente selon `sanza_handoff/APP-DASHBOARD.md`, maquette de référence `Sanza App v5.dc.html`.
3. **Site marketing** — implémente selon `sanza_handoff/SITE-REFONTE.md`, maquettes `Sanza Site v3.dc.html`, `Sanza Institutions.dc.html`, `Sanza Accelerateurs.dc.html`.

## Règles non négociables
- **Fidélité aux maquettes** : hiérarchie, libellés FR, densité, composants. Ouvre les `.dc.html` dans un navigateur pour voir l'interaction réelle (nav, onglets, modals, sélecteurs).
- **Système visuel** : blanc, hairlines `#ECEBE6`, pas d'ombres, rayons courts (app 6/5/4 · site 8/6/4), avatars carrés-arrondis, **orange `#E85C2B` en accent seul**, Instrument Sans + IBM Plex Mono. Tokens dans `INSTRUCTIONS-CLAUDE.md`.
- **App = contenu pleine largeur** (conteneur `width:100%`, padding latéral fixe ~32–48px, plafond ~1600–1800px). PAS de `max-width` centré comme dans la maquette — c'est la seule correction demandée. Le **site marketing reste centré** (`max-width:1240px`).
- **Différenciateur produit** partout : la diligence et les indicateurs **s'adaptent au financeur (VC / DFI / Banque)**. Angle OHADA/SYSCOHADA.

## Logique métier (détaillée dans les 2 docs)
Organisation → plusieurs **levées** → chacune agrège plusieurs **data rooms** et **investisseurs**. Data room : arbo indexée, droits par dossier, NDA + preuve, journal chaîné, suivi de diligence (checklist pondérée par financeur), Q&R. Ma levée : multi-levées, audience VC/DFI/Banque pilotant la bande « En bref », historique de financement, rattachement data room ↔ levée (N–N).

## Livrables attendus
Composants réutilisables : `DataTable`, `Toggle`, `Segmented`, `StatusBadge`, `AvatarStack`, `Modal`, `TabBar`, `KpiTile`, `ProgressBar`, `SanzaLogo`. i18n FR. Responsive (grilles 3-col → 1-col mobile).

Commence par l'app (écran Accueil puis Ma levée), puis le site. Signale toute ambiguïté avant de coder une section entière.
