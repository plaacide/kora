# Ce qui reste à faire

État au 19 juillet 2026. Ce fichier existe parce que le découpage n'a longtemps
vécu que dans une conversation — et qu'il s'y est perdu une fois.

Le positionnement de référence : **le fondateur a un guide de levée**, le SAE a
un **cockpit de portefeuille**. Tout ce qui suit s'y rattache.

---

## Avant tout le reste — deux risques qui ne sont pas du code

Aucun des deux ne se règle en écrivant une ligne. Ils passent devant toute
fonctionnalité parce qu'ils mettent en jeu ce qui ne se répare pas.

- [ ] **Sauvegardes Supabase.** L'offre gratuite n'en fait aucune. Aujourd'hui
      la base ne contient qu'un dossier de test ; dès qu'une startup y dépose
      ses statuts, son pacte d'actionnaires et ses états financiers, une
      fausse manœuvre est définitive. Le plan Pro (~25 $/mois) règle la
      question.
- [ ] **VPS — expiration le 18 août 2026.** Vérifier le renouvellement
      automatique. À défaut, la plateforme s'éteint pendant que des startups
      la testent.

---

## Bloc 1 — Offre

L'offre n'est PAS à décider : elle est publiée sur le site depuis le
repositionnement. Fondateur 15 000 F/mois (1er mois offert, sans carte),
Programme 150 000 F/mois (≤ 10 startups, paliers 25 et 50, abonnements de la
cohorte inclus), Investisseur gratuit.

Ce qui manquait, c'est qu'aucune de ces règles n'était appliquée : ni plan, ni
échéance, ni blocage.

- [x] Plan et échéance sur l'organisation, mois offert à l'inscription
- [x] Verrou sur les écritures (dans `deal_org_for_write`, seul point de
      passage des 29 RPC) et sur la lecture (garde du groupe `(app)`)
- [x] Écran de régularisation + avertissement les 7 derniers jours
- [ ] Encaissement à la main : chaque paiement se pose en SQL
      (`update organizations set paid_until = …`). Volontaire — à ce volume,
      une ligne par paiement coûte moins qu'une intégration d'agrégateur.
- [ ] Coordonnées de paiement réelles dans `src/app/abonnement/page.tsx`
      (aujourd'hui : « écrivez-nous à contact@sanza.africa »)
- [ ] Paliers 10 / 25 / 50 startups : publiés, pas encore contraints

## Bloc 2 — Site vitrine

- [x] Page d'accueil refaite fidèlement à la maquette
- [ ] Pages restantes alignées sur le repositionnement

## Bloc 3 — Rôle SAE, cockpit de portefeuille

**Mine à désamorcer en même temps :** `create_deal` fait
`select m.org_id … limit 1` **sans `order by`** — l'organisation est choisie
arbitrairement. Sans effet tant qu'une personne n'appartient qu'à une
organisation ; c'est exactement l'hypothèse que le rôle SAE fait sauter.

- [x] Socle : le SAE est une ORGANISATION, liée d'org à org par
      `cohort_links`. `can_see_deal` n'est pas touché — le programme ne voit
      aucun document parce que rien ne le lui accorde. Une interdiction
      s'oublie, une absence de chemin non.
- [x] Consentement : la startup accepte elle-même, et les deux côtés peuvent
      rompre le lien
- [x] Canal de lecture `sae_portfolio()` — une FONCTION, pas une politique
      RLS : les colonnes y sont énumérées, ce qui n'y figure pas ne sort pas
- [x] Un programme qui cesse de payer cesse de voir sa cohorte (`org_active`)
- [x] Mines désamorcées : sept `limit 1` sans `order by`
- [x] Les trois écrans : /portefeuille, /cohorte, /rejoindre/[token]
- [x] Les accès expirent à 90 jours par défaut, `extend_access` pour prolonger
- [ ] **Non vérifié faute de compte `sae`** : les écrans n'ont jamais été vus
      en vrai, et l'acceptation jamais jouée de bout en bout
- [ ] Export bailleur (PDF / XLSX) — aucun générateur n'est présent dans le
      projet aujourd'hui, c'est une dépendance à ajouter

**Décision prise en route.** L'accès aux documents pour un programme passe par
le fondateur, qui l'invite comme un investisseur — flux existant, audité,
révocable. La promesse du site (« le fondateur reste seul maître des accès à
sa data room ») tient donc mot pour mot. Si un accès d'office devenait
souhaitable, il faudrait d'abord retirer cette phrase de la page d'accueil.

## Bloc 4 — Dashboard portefeuille et export

- [ ] Dashboard agrégé du programme (les agrégats existent, c'est du
      réassemblage)
- [ ] Export bailleurs — part de zéro, aucun générateur PDF/XLSX

## Bloc 4 bis — Checklist et data room

- [x] Chaque exigence sait dans quel dossier sa pièce se dépose
- [x] Rattacher une preuve valide l'exigence et recalcule le score
- [x] Une exigence accepte plusieurs preuves (PV et états financiers sur trois
      exercices, rapport CAC général et spécial, bénéficiaires effectifs,
      assurances)

## Bloc 5 — Vocabulaire et écrans — **fermé**

- [x] Vocabulaire du fondateur sur les 11 écrans
- [x] Vue investisseur distincte de la vue fondateur
- [x] Icônes de dossiers à la place des triangles typographiques
- [x] ~~Fidélité aux 9 écrans de la maquette du dashboard~~ — **abandonné
      sciemment**. La seule maquette disponible est pré-rebranding (primaire
      indigo au lieu du vibration) et conçue pour des fonds : pipeline,
      syndication, rapport LP. La suivre fidèlement aurait défait le
      repositionnement. Ce qu'elle apportait de réellement utile — densité,
      échelle typographique, craft des tableaux — est déjà dans `globals.css`.

---

## Ménage avant de faire tester

Rien de structurant, mais c'est tout ce qu'un testeur externe verrait
d'anormal.

- [ ] Supprimer les données de test : compte `placideb@icloud.com` et son
      invitation acceptée, créés pour vérifier le parcours d'invitation
- [ ] Traduire les gabarits d'e-mail Supabase encore en anglais
- [ ] 3 erreurs de lint préexistantes (`SanzaLogo.tsx`, `dashboard/page.tsx`)
- [ ] `SALES_NOTIFY_EMAIL` dans Coolify — sans elle, personne n'est prévenu
      d'une demande de démo SAE (non vérifiable d'ici)
- [ ] SPF à la racine de `sanza.africa` — hygiène, pas correctif : les
      invitations partent et arrivent

---

## Vérifié, ne pas rouvrir

Ces points ont été confirmés contre la production, pas seulement contre le
code. Notés ici pour éviter de les re-diagnostiquer.

- Les invitations **fonctionnent** : envoi depuis `noreply@sanza.africa`,
  lien correct, page d'acceptation en 200. Le rebond observé le 19 juillet
  était une boîte iCloud pleine — rien à corriger.
- `EMAIL_FROM` est bien configuré en production.
- Le lien d'invitation passe par `originFromHeaders()`. C'était une mise en
  défense, pas une réparation : Traefik transmet correctement le domaine.
