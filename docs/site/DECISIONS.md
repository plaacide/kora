# Vitrine — décisions

## 1. « Commencer gratuitement » est conservé — **provisoire, 2 août 2026**

Le brief prévoit ce CTA, et il est gardé tel quel pour la bêta : il mènera à
`v2.sanza.africa`.

**Ce que cela suppose, et qui n'est pas vérifié.** Le dossier de préparation à la
bêta conclut à une bêta **fermée** — les parcours de valeur (dépôt de pièces,
data room partagée, accès invité côté destinataire) ne sont pas couverts par des
essais automatisés, ce qui se tient avec des utilisateurs joignables, pas avec un
public libre.

Or « gratuitement » promet une inscription ouverte. Si la bêta reste sur
invitation, cette phrase est une promesse que le produit ne tient pas — sur la
première page que les gens voient, et après deux jours passés à retirer huit
promesses du même genre de l'application.

**Décision du fondateur :** conserver pour l'instant, revoir plus tard. Elle est
écrite ici pour être rouverte, pas pour être oubliée.

**À rouvrir quand** : l'ouverture de la bêta est décidée, ou dès qu'un premier
utilisateur non invité arrive par cette page.

## 2. « Readiness » devient « Dossier prêt » — **tranché, 2 août 2026**

La maquette `site-vitrine-2a.html` écrit **Readiness** à trois endroits : le
jeton vert de l'aperçu du hero (« Readiness 82 % »), l'intitulé de la jauge dans
la capture Préparation, et « votre score de readiness » dans le paragraphe de la
section Préparation.

Le brief interdit de réinterpréter les textes de la source — c'est pourquoi ils
avaient d'abord été copiés tels quels, et la réserve remontée plutôt que tranchée
à la place du fondateur.

**Décision du fondateur :** traduire. Un terme anglais isolé sur une page
française tombe mal, et l'application nomme déjà cet indicateur **« dossier
prêt »** (cf. `DEALROOM-VITRINE-DEMANDES.md` §3, « Dossier prêt n % »). Le site
et le produit disent désormais la même chose.

**Ce que cela implique.** C'est la **seule divergence de texte** entre la page
servie et sa source de vérité. Toute reprise ultérieure du fichier de maquette —
ré-export, nouvelle direction, relecture ligne à ligne — réintroduira
« Readiness » si personne ne se souvient de ceci. D'où cette entrée, et la note
dans le handoff.

**À rouvrir quand** : la maquette est ré-exportée, ou si le produit renomme son
indicateur.

## 3. La barre de logos et le bloc témoignage sont retirés — **tranché, 2 août 2026**

La maquette porte deux blocs de preuve sociale, tous deux repris tels quels
pendant la construction :

- **« Ils font confiance à Sanza »** au-dessus de cinq institutions nommées :
  Savane Accelerator, Banque Atlantique, Impact Partners, BOAD, Teranga Capital.
- **Un témoignage** signé Aminata Koné (CEO, CoolBricks · Levée Seed 500 K€ —
  Abidjan), et quatre métriques : −60 % de temps de due diligence, 14 jours pour
  une data room prête, 250+ entreprises accompagnées, 12 pays.

Rien de tout cela n'est vérifié. Ce sont des valeurs de maquette, écrites pour
montrer une mise en page. Tant que la page vivait sur une route non indexée, la
question ne se posait pas.

**Décision du fondateur, au moment de faire de cette page l'accueil :** les
retirer. Sur le site d'une société réelle, ces deux blocs affirment
publiquement que cinq institutions nommées sont clientes, et attribuent une
citation à une personne nommée qui ne l'a pas dite. La page ne l'affirme pas
tant que ce n'est pas vrai.

**Ce que leur retrait a déplacé.** Les deux blocs ne portaient pas que du texte,
ils portaient deux filets :

- La barre de logos **tranchait l'aperçu produit du hero**, dont le bas n'a ni
  bordure ni rayon. Son filet supérieur passe aux sections bénéfices, sinon la
  carte flotte, ouverte, sur du blanc.
- Le bloc témoignage **séparait les bénéfices de la bande sécurité**. Son filet
  passe à la bande sécurité.

**Pour les remettre** : le balisage et le CSS se relisent dans l'historique
(`git show c2e5a68` et `fb59409`), et les deux filets repris sont commentés à
l'endroit où ils ont été posés. Ne pas les remettre sans les retirer de là.

**À rouvrir quand** : un vrai client accepte d'être cité, les références sont
confirmées avec leurs logos, et les chiffres peuvent être soutenus.
