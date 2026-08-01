# Exigences sectorielles — Santé et Services financiers

**Statut :** brouillon à valider. **Rien de ceci ne doit partir en migration avant
votre relecture**, pour une raison simple : je ne suis pas juriste, et le droit
bancaire et sanitaire varie d'un pays à l'autre de l'UEMOA et de la CEMAC.

Chaque exigence porte donc un indice de confiance :

- **A** — la licence existe partout en zone UEMOA/CEMAC, sous ce nom ou un nom
  très proche. Je la donnerais sans hésiter.
- **B** — elle existe, mais son intitulé, son autorité de tutelle ou son seuil de
  déclenchement changent selon le pays.
- **C** — je crois qu'elle existe, je ne la garantis pas. **À confirmer avant
  publication.**

Aucune de ces exigences ne doit être présentée au fondateur comme une garantie de
conformité — voir la règle générale du plan de préparation : c'est un point de
départ, jamais une liste exhaustive.

---

## 1. Sur quoi l'extension se déclenche

```text
startups.sector = "Services financiers"   →  extension fintech
startups.sector = "Santé"                 →  extension santé
```

**Limite connue.** Une fintech qui se range dans « Technologies et télécoms »
n'aura pas l'extension. Les dix secteurs ne comportent pas « Fintech », et je ne
propose pas de l'ajouter : ce serait le onzième, et « Services financiers » le
couvre déjà correctement pour qui le choisit.

Ces deux secteurs représentent **2 valeurs sur 10** : huit fondateurs sur dix ne
verront aucune exigence supplémentaire. C'est normal — l'extension ne concerne
que les activités réellement soumises à agrément.

---

## 2. Services financiers — fintech

Domaine proposé : `company_registration` pour les agréments,
`technology_and_ip` pour les données, `governance_and_ownership` pour la
conformité.

### 2.1 Le socle, quel que soit le modèle d'activité

| # | Intitulé | Niveau | Conf. |
|---|---|---|---|
| F1 | **Agrément ou convention permettant l'activité** | requis | **A** |
| F2 | **Dispositif LBC/FT et déclaration à la CENTIF** | requis | **A** |
| F3 | **Déclaration auprès de l'autorité de protection des données** | requis | **B** |

**F1 — Agrément ou convention permettant l'activité.**
> Selon votre modèle : agrément d'établissement de monnaie électronique, de
> système financier décentralisé, d'établissement de crédit, ou convention avec
> un établissement déjà agréé. Aucun financeur n'ira plus loin sans cette pièce.

L'intitulé reste volontairement large parce que la voie dépend de l'activité —
voir 2.2. C'est la seule exigence que je qualifierais de bloquante : un
investisseur ou une banque s'arrête là.

**F2 — Dispositif LBC/FT et déclaration CENTIF.**
> Politique anti-blanchiment, procédure de vérification de la clientèle, et
> désignation du correspondant CENTIF.

En UEMOA la CENTIF (Cellule nationale de traitement des informations
financières) existe dans chaque État membre. En CEMAC l'équivalent est l'ANIF.
Le catalogue contient déjà « Politique LBC/FT et screening » — **cette exigence
sectorielle doit la remplacer, pas s'y ajouter**, en précisant la déclaration.

**F3 — Autorité de protection des données.**
> L'autorité varie : CDP au Sénégal, ARTCI en Côte d'Ivoire, APDP au Bénin.
> Confirmez le nom de la vôtre.

Confiance **B** : l'obligation est générale, l'autorité et la forme
(déclaration simple ou autorisation préalable) changent selon le pays.

### 2.2 Selon la voie réglementaire — à choisir, pas à cumuler

| # | Intitulé | Niveau | Conf. |
|---|---|---|---|
| F4 | **Agrément d'établissement de monnaie électronique** | recommandé | **A** |
| F5 | **Agrément de système financier décentralisé** | recommandé | **A** |
| F6 | **Agrément d'établissement de crédit** | recommandé | **B** |
| F7 | **Convention de partenariat avec un établissement agréé** | recommandé | **A** |

**F4 — Monnaie électronique (EME).** La voie des portefeuilles et du paiement
mobile. Délivré par la BCEAO en UEMOA, par la COBAC en CEMAC. Un capital minimum
s'applique — **le montant est à confirmer, je ne le donne pas de mémoire.**

**F5 — Système financier décentralisé (SFD).** La voie du crédit et de l'épargne
à petite échelle — microfinance. En CEMAC on parle d'établissement de
microfinance (EMF), sous COBAC.

**F6 — Établissement de crédit.** La voie lourde. En UEMOA, agrément du ministre
des Finances sur avis conforme de la Commission bancaire de l'UMOA. Rare pour
une jeune entreprise ; je la garde pour ne pas laisser un trou.

**F7 — Convention avec un établissement agréé.** **C'est la voie réelle de la
plupart des fintechs** : opérer comme prestataire technique d'une banque ou d'un
EME, sans agrément propre. Le contrat de partenariat devient alors la pièce
maîtresse du dossier — et sa durée, sa clause de résiliation et son
exclusivité sont exactement ce qu'un investisseur examine.

Ces quatre exigences ne se cumulent pas. **Comment les présenter est une
question ouverte** : quatre lignes dont trois seront écartées, ou une seule
ligne F1 dont la description énumère les voies ? Je penche pour la seconde, et
je ne tranche pas seul.

### 2.3 Ce que je ne propose pas, faute de certitude

- Autorisation BCEAO pour les transferts transfrontaliers — confiance **C**,
  dépend du volume et de la nature des flux.
- Agrément de bureau de change — hors périmètre d'une fintech classique.
- Certification PCI-DSS — c'est une norme privée, pas une licence. Elle
  relèverait d'une exigence « recommandée » en `technology_and_ip`, pas d'un
  agrément.

---

## 3. Santé

Domaine proposé : `company_registration` pour les autorisations,
`team_and_people` pour les inscriptions ordinales, `impact_esg` pour les
déchets.

### 3.1 Le socle

| # | Intitulé | Niveau | Conf. |
|---|---|---|---|
| S1 | **Autorisation d'ouverture et d'exploitation de l'établissement** | requis | **A** |
| S2 | **Inscription à l'Ordre des professionnels employés** | requis | **A** |
| S3 | **Plan de gestion des déchets d'activités de soins** | recommandé | **B** |
| S4 | **Traitement des données de santé** | requis | **B** |

**S1 — Autorisation d'ouverture.**
> Délivrée par le ministère de la Santé. Son absence expose à une fermeture
> administrative — c'est le premier point qu'un financeur vérifie.

**S2 — Inscription à l'Ordre.**
> Ordre des médecins, des pharmaciens, des chirurgiens-dentistes ou des
> sages-femmes selon les profils employés. L'inscription est nominative.

Point qu'un fondateur non-médecin découvre souvent tard : dans plusieurs pays,
**l'exercice et parfois la détention du capital d'une officine sont réservés à
un professionnel inscrit**. Si votre modèle est une pharmacie, la structure
capitalistique elle-même peut être contrainte — confiance **B** sur l'étendue,
**A** sur l'existence de la règle.

**S3 — Déchets de soins.** Filière d'élimination des déchets à risque infectieux
et des piquants-tranchants. Souvent adossé à une autorisation environnementale.

**S4 — Données de santé.** Les données de santé sont des données personnelles
**sensibles** : le régime est plus strict que pour F3, avec fréquemment une
autorisation préalable et non une simple déclaration. Confiance **B** sur la
forme, **A** sur le fait que le régime est renforcé.

### 3.2 Selon l'activité

| # | Intitulé | Niveau | Conf. |
|---|---|---|---|
| S5 | **Licence d'exploitation d'officine** | recommandé | **A** |
| S6 | **Autorisation d'importation et de distribution de médicaments** | recommandé | **B** |
| S7 | **Autorisations de mise sur le marché des produits distribués** | recommandé | **B** |
| S8 | **Enregistrement des dispositifs médicaux** | recommandé | **C** |
| S9 | **Avis d'un comité d'éthique** | recommandé | **B** |
| S10 | **Conventionnement avec les organismes de couverture maladie** | recommandé | **B** |

**S8** est en **C** : je sais que le sujet est réglementé, je ne connais pas
l'état réel de l'harmonisation en UEMOA et en CEMAC. **À vérifier ou à
retirer.**

**S9** ne concerne que la recherche clinique. **S10** (IPM, CMU, mutuelles)
n'est pas une licence mais conditionne souvent le modèle économique — un
financeur le demandera, ce qui suffit à le mettre dans le plan.

### 3.3 Le trou que je vous signale

**La télémédecine et la santé numérique n'ont, à ma connaissance, pas de cadre
d'agrément stabilisé dans la plupart de ces pays.** Une startup de téléconsultation
tombe donc entre S1 (elle n'exploite pas d'établissement physique) et S4 (elle
traite bien des données de santé).

C'est probablement le profil le plus courant parmi vos futurs utilisateurs, et
c'est celui pour lequel je n'ai pas de réponse solide. **Ne rien afficher vaut
mieux qu'afficher une exigence inventée.**

---

## 4. Ce que j'attends de vous avant d'implémenter

1. **Valider ou corriger** les lignes marquées **B** et **C**. Les **A** peuvent
   partir telles quelles.
2. **Trancher la présentation des voies alternatives** (2.2) : quatre exigences
   dont trois écartées, ou une exigence dont la description énumère.
3. **Confirmer que F2 remplace** l'exigence « Politique LBC/FT et screening »
   déjà au catalogue, au lieu de faire doublon.
4. Dire si **S8** doit être retirée.

Une fois ces quatre points réglés, l'implémentation dépend du chantier
« catalogue » : tant que les exigences sont un littéral JSONB dans
`apply_checklist_template`, ajouter dix-sept lignes conditionnelles rendrait
cette fonction ingérable. **Le catalogue en table vient d'abord.**

---

## 5. Ce que ce document n'est pas

Un avis juridique. Les intitulés et les autorités citées viennent de ma
connaissance générale du droit OHADA, UEMOA et CEMAC, pas d'une lecture des
textes en vigueur au jour d'aujourd'hui. Un cabinet local corrigerait
probablement plusieurs lignes, et le coût de cette relecture est très inférieur
à celui d'un fondateur qui présente à sa banque un dossier construit sur une
exigence inexacte.
