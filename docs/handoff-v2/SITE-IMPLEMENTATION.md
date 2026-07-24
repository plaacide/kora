# Sanza — Implémentation du site marketing (sanza.africa)

> Pour Claude Code. Tu connais déjà la codebase (dashboard ex-Kora rebrandé Sanza) : **modifie l'existant, ne repars pas de zéro**. Réutilise les composants, tokens et conventions déjà en place (`INSTRUCTIONS-CLAUDE.md` = source de vérité pour la marque : couleurs, `SanzaLogo`, typo, motif écho).

## 0. Contexte produit — à respecter absolument
- Sanza = dealroom panafricain qui connecte investisseurs et fondateurs.
- **Proposition de valeur centrale : « Le dealflow africain, enfin structuré. »** Elle repose sur 3 piliers, dans cet ordre : (1) profils startup structurés et vérifiés, (2) data rooms sécurisées, (3) mise en relation directe investisseur ↔ fondateur. Le hero et la page entière doivent raconter ça — pas de features inventées.
- **Phase bêta "fondateurs d'abord"** : inscription ouverte aux fondateurs (1er mois offert, puis 15 000 FCFA/mois) ; les investisseurs rejoignent une **liste d'attente gratuite**. Les fonctionnalités côté investisseur sont affichées "Bientôt disponible" — transparence assumée, ne pas maquiller.
- Tagline : « Faites résonner vos deals. » Ton : direct, crédible, sans jargon VC anglophone inutile. Tout en français.

## 1. Référence de design
La maquette de référence est `Sanza Site.dc.html` (fournie dans ce dossier / le projet design). Structure à reproduire :
1. Nav (logo, liens, CTA « Référencer ma startup »)
2. Hero sombre (Encre) avec arcs de résonance décoratifs + double CTA (fondateur primaire / investisseur waitlist secondaire)
3. Les 3 piliers produit (features investisseur marquées "Bientôt")
4. Section transparence bêta (pourquoi fondateurs d'abord)
5. Pricing (Bêta gratuite 1 mois → 15 000 FCFA/mois ; investisseurs : waitlist gratuite)
6. CTA final double + footer
Respecte les espacements, la hiérarchie et le copy de la maquette ; adapte au framework existant (composants, responsive).

## 2. Micro-animations à ajouter (soigné, jamais gadget)
Toutes en CSS/Framer Motion léger, 150–400 ms, easing `cubic-bezier(0.22,1,0.36,1)` :
- **Logo** : `animate={true}` sur le hero uniquement (vibration du « a », déjà spécifiée).
- **Reveal au scroll** : sections en fade + translateY(16px), stagger 60–80 ms entre cartes (IntersectionObserver, une seule fois, pas en boucle).
- **CTA primaires** : hover = fond #D14E20 + translateY(-1px) + ombre douce ; active = scale(0.98).
- **Cartes piliers** : hover = bordure passe de #E8E5DC à rgba(232,92,43,0.35) + légère élévation.
- **Arcs de résonance du hero** : pulsation très lente (opacité 0.2→0.35, 6 s, infinite) — subtile.
- **Chiffres du pricing** : count-up au premier affichage (IBM Plex Mono).
- **Nav** : fond translucide + blur au scroll (backdrop-filter), transition douce.
- Respecter `prefers-reduced-motion: reduce` → tout désactiver.

## 3. Consolidations nécessaires
- **SEO/meta** : title « Sanza — Le dealflow africain, enfin structuré », description, OG image (à générer depuis le hero), favicon depuis `icon.svg`, lang="fr".
- **Performance** : fonts en `display=swap` + preconnect ; images lazy ; pas de lib d'animation lourde si CSS suffit.
- **Accessibilité** : contrastes AA (le brume #8B8FA3 jamais sur craie pour du texte < 18px), focus visibles, alt sur tout, hit targets ≥ 44px mobile.
- **Formulaires** : CTA fondateur → flux signup existant (voir `AUTH-ONBOARDING.md`) ; CTA investisseur → formulaire waitlist minimal (email + société + ticket moyen), stocké en base, email de confirmation (template dans `emails/`).
- **Responsive** : mobile-first ; hero lisible à 360px ; nav → menu burger.
- **Analytics** : événements sur les 2 CTA (signup_founder_click, waitlist_investor_submit).
- **Erreurs & états vides** : page 404 brandée (motif écho), états de chargement skeleton sur le dashboard si tu y touches.

## 4. Ce qu'il ne faut PAS faire
- Ne pas réintroduire de KYC dans l'onboarding.
- Pas d'écho orange sur d'autres lettres que le « a » final ; orange réservé CTA + logo.
- Pas de contenu placeholder visible (équipe, témoignages) : si une section manque de contenu réel, ne pas la créer.
- Ne pas casser les parcours existants du dashboard ; le site marketing et l'app partagent les tokens mais restent des surfaces distinctes.

## 5. Ordre de travail suggéré
1. Vérifier que le rebranding `INSTRUCTIONS-CLAUDE.md` est bien appliqué partout (grep Kora).
2. Construire/adapter la page marketing d'après `Sanza Site.dc.html`.
3. Brancher les 2 CTA (signup + waitlist).
4. Passe micro-animations + reduced-motion.
5. Passe consolidation (SEO, perf, a11y, 404, analytics).
