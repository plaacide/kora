# Préparation à la bêta — synthèse

**Date :** 2 août 2026 · **Branche :** `v2/rebuild` · **Recette :**
`https://v2.sanza.africa` sur `jourzsgjnutktsrgxkoo`

Ce document ne dit pas que le produit est prêt. Il dit **ce qui a été vérifié,
comment, et ce qui ne l'a pas été** — de sorte que la décision d'ouvrir soit
prise en connaissance de cause plutôt que sur une impression.

Les trois documents qu'il résume portent les preuves :
[`TEST-RESULTS.md`](TEST-RESULTS.md), [`CRITICAL-FLOWS.md`](CRITICAL-FLOWS.md),
[`SECURITY-REPORT.md`](SECURITY-REPORT.md), plus
[`KNOWN-ISSUES.md`](KNOWN-ISSUES.md).

---

## 1. Verdict

**Ouvrable à une bêta fermée, avec un aveu.**

Le seul point bloquant — la limite d'envoi d'e-mails de Supabase, qui avait
produit deux `429` le 1er août — a été relevé le 2 août.

**L'aveu :** les parcours **de valeur** ne sont pas couverts par des essais
automatisés. Déposer une pièce, ouvrir une data room à un invité, révoquer un
accès, franchir une limite de plan — rien de tout cela n'est éprouvé à l'écran.
Ce que la suite couvre bien, ce sont les parcours **d'entrée**.

C'est l'inverse de la répartition qu'on voudrait. Pour une bêta **fermée**, avec
des utilisateurs connus et joignables, c'est acceptable. Pour une ouverture
publique, non.

---

## 2. Ce qui a été mesuré aujourd'hui

```text
36 tests · 34 passés · 0 échoué · 2 ignorés · 56 s
contre la recette déployée, sur deux comptes réels
```

La première exécution comptait un échec, dû à un correctif poussé mais pas
encore déployé. **Le déploiement fait, la suite est au vert.** Les deux tests
ignorés le sont légitimement : le compte installé ne peut pas atteindre le
bandeau d'onboarding, et le compte neuf les couvre.

**La suite authentifiée n'avait jamais tourné avant aujourd'hui.** C'est le
changement principal de cette journée, et il a immédiatement produit trois
constats qu'aucune relecture n'avait donnés.

---

## 3. Les quatre choses que l'exécution a révélées

**1. Une suite qui ne tourne jamais pourrit en silence.** Trois tests avaient
vieilli sans qu'on le sache — dont l'un bloqué par une validation native de
navigateur, sans un mot dans les journaux.

**2. Neuf tests s'ignoraient d'eux-mêmes.** Le parcours d'onboarding exige un
compte sans organisation ; le compte installé y est redirigé. **Le parcours le
plus critique de la bêta n'était éprouvé nulle part**, et le rapport affichait
« ignorés » sans que personne y regarde. Corrigé par un second compte, détruit
et recréé à chaque exécution.

**3. Un appel à une fonction inexistante tournait à chaque affichage.**
`inbox()` appelait `mes_invitations`, absente de la base, et l'erreur était
jetée avec le reste du résultat.

**4. Ma propre documentation se trompait, deux fois.** `KNOWN-ISSUES`
affirmait qu'aucun lien ne menait aux écrans hors périmètre — c'était faux.
L'arbre des connexions annonçait que `cohort_links` n'existait pas — les quatre
tables et sept fonctions du sous-système cohorte existent.

---

## 4. Ce qui a été livré depuis le 1er août

| | |
|---|---|
| **Huit promesses retirées** | Le produit annonçait une adaptation qu'aucune fonction ne produisait. Deux d'entre elles étaient de ma main. |
| **Le référentiel en table** | Vingt-deux exigences sorties d'un littéral JSONB. Équivalence prouvée par empreinte md5. |
| **Le plan varie enfin** | Forme juridique, pays, stade. Cinq différences mesurées entre deux entreprises ; dix-sept exigences au lieu de vingt-deux pour une entreprise individuelle. |
| **Trois écrans de démonstration fermés** | Ils nommaient une banque réelle. |
| **Accessibilité des formulaires** | `aria-describedby` : de zéro à six paires appariées. Le curseur va sur le premier champ fautif, y compris dans la levée, qui n'a ni `<form>` ni attributs `name`. |
| **L'inscription réparée** | Expéditeur Resend corrigé, destinations ramenées vers la V2, y compris pour les liens déjà envoyés. |

---

## 5. Ce qui reste, par gravité

### Bloquant

**Aucun.** La limite d'envoi Supabase a été relevée le 2 août ; c'était le
dernier point dont l'échec ne laissait aucune issue à un utilisateur.

### À faire avant d'ouvrir

| | Qui |
|---|---|
| Éprouver les limites de plan **à l'écran** | Moi |
| Éprouver l'accès invité à une data room | Moi |
| Trancher `complete_onboarding(p_create_room)` (B-05) | Vous |

### Après la bêta

Les exigences manquantes pour la dette, le DFI, l'audit et la diligence — votre
expertise, pas la mienne. Les extensions sectorielles, qui attendent votre
validation. Le référentiel contributif ouvert aux investisseurs et
accélérateurs. Les cohortes, **moins loin qu'annoncé**. Le dépôt de PDF de
factures, l'usage des fonds, l'import d'une liste reçue.

---

## 6. Ce que ce dossier n'est pas

Une garantie. Il rapporte trente-six tests sur un produit qui en mériterait
plusieurs centaines, et il nomme lui-même les six domaines qu'il ne couvre pas.

Sa valeur n'est pas de rassurer mais de **délimiter** : après l'avoir lu, on
sait exactement ce qu'on ignore. C'est ce qui manquait au 1er août, quand la
seule mesure disponible était la conviction de celui qui avait écrit le code.
