# Ce qui a été vérifié côté sécurité, et ce qui ne l'a pas été

**Date :** 2 août 2026 · **Base :** `jourzsgjnutktsrgxkoo`

Chaque ligne porte sa preuve — une requête, une politique, un refus observé. Ce
qui n'a pas été éprouvé est listé à part, sans être présenté comme sûr.

---

## 1. Cloisonnement des données

| Table | Politique de lecture | Vérifié |
|---|---|---|
| `deals` | `can_see_deal(id)` | ✅ requête |
| `checklist_items` | `can_see_deal(deal_id)` **ET** `is_org_internal(org_id)` | ✅ requête |
| `startups` | `owner_id = auth.uid()` — **propriétaire seul** | ✅ requête |
| `checklist_catalog` | RLS activé, **aucune politique** = refus par défaut | ✅ requête |
| `checklist_catalog_variants` | idem | ✅ requête |

Le référentiel n'est donc lisible que par des fonctions `security definer`. Un
client ne peut pas parcourir le catalogue ; il ne voit que son propre plan.

**Conséquence assumée sur `startups` :** la lecture propriétaire seul empêche un
collaborateur pourtant autorisé sur l'opération de lire l'entreprise. C'est
pourquoi `plan_basis` est `security definer` avec `can_see_deal` comme garde —
et non parce que c'était plus court à écrire.

---

## 2. Le journal ne se réécrit pas

Tentative de suppression d'une entrée d'audit, sous rôle privilégié :

```text
ERROR: P0001: audit_log est append-only (ni UPDATE ni DELETE autorisés)
CONTEXT: PL/pgSQL function audit_log_immutable()
```

**Refus observé, pas supposé.** Le déclencheur tient même face à un rôle qui
contourne RLS.

---

## 3. Les secrets

| | État |
|---|---|
| Clé de service | Dans `.env.local` et Coolify. **Jamais lue ni affichée** par un outil de cette session. |
| Mots de passe de test | Tirés au sort par `creer-compte-essai.mjs`, écrits dans `.env.test.local` (ignoré par git, `0600`). |
| Clé Genius Pay | Jamais transmise, jamais demandée. |
| `SEND_EMAIL_HOOK_SECRET` | Vérifié présent par la sonde de santé, **valeur jamais exposée**. |

**Un incident, et sa correction.** Un mot de passe de test généré s'est affiché
dans la conversation, un masquage `sed` ayant échoué silencieusement — l'alternance
`\|` n'existe pas en expression régulière BSD. Le mot de passe a été **renouvelé
immédiatement**, et sa révocation vérifiée :

```text
signInWithPassword(ancien) → REVOQUE : Invalid login credentials
```

La leçon est portée par le script : il n'affiche plus jamais de mot de passe, et
aucune commande ne relit `.env.test.local`.

---

## 4. La sonde de santé ne ment plus

Elle répondait `configuration_manquante: []` pendant que **toute inscription
échouait** : `EMAIL_FROM` valait `onboarding@resend.dev`, l'adresse de test
partagée de Resend, qui refuse par 403 tout destinataire autre que le titulaire
du compte.

Une variable posée à une valeur qui garantit l'échec est **pire qu'une variable
absente : elle rassure**. La sonde vérifie désormais la validité et non la seule
présence.

```text
GET /api/health → {"configuration_manquante":[]}   (2 août, après correction)
```

---

## 5. Les tests refusent la production

`e2e/verifier-cible.ts` refuse de démarrer sur `bileqzpguyynkktndazs`, **et
refuse aussi toute base non reconnue** — un projet inconnu peut être une
production déguisée. `creer-compte-essai.mjs` porte le même garde-fou avant
toute écriture.

Éprouvé indirectement : la suite a tourné contre la recette et le garde-fou n'a
pas déclenché.

---

## 6. L'accès invité — éprouvé le 2 août

C'était le trou le plus coûteux du dossier : personne n'avait vérifié qu'un
invité ne voit que ce qu'on lui a ouvert.

**Montage.** Une opération de trente-deux dossiers. Une invitation en lecture
seule portant **un seul dossier** — « 2.1 États financiers SYSCOHADA ». Trois
documents déposés :

| Document | Dossier | `hidden_from_guests` |
|---|---|---|
| bilan ouvert | 2.1 — **ouvert** | non |
| bilan masqué | 2.1 — ouvert | **oui** |
| lbc confidentiel | 6.2 — **non ouvert** | non |

**Ce que l'invité atteint, sous son identité réelle :**

| Contrôle | Attendu | Mesuré |
|---|---|---|
| Dossiers visibles | 1 sur 32 | **1** — « 2.1 » seul |
| Documents visibles | 1 sur 3 | **1** — « bilan ouvert » seul |
| Document masqué du même dossier | invisible | **0 ligne** |
| Document d'un dossier non ouvert | invisible | **0 ligne** |
| Plan de préparation | invisible | **0 exigence** |
| Fiche entreprise | invisible | **0 ligne** |

**La demande nommée échoue aussi.** Interroger directement le document par son
nom — une requête forgée, pas un clic — rend zéro ligne. La frontière est
portée par la RLS, pas par ce que l'écran choisit d'afficher : c'est ce qui
compte, puisqu'un client peut interroger l'API sans passer par l'écran.

**Révocation.** Après `revoke_invitation`, sous la même identité :

```text
0 dossier · 0 document · 0 opération
```

Immédiate et totale, sans reconnexion ni délai.

---

## 7. Ce qui n'a PAS été vérifié

Ce chapitre est le plus important du document.

| | Pourquoi c'est un risque |
|---|---|
| **La double authentification** | Aucun compte de test n'en porte. |
| **Le filigrane et le téléchargement** | Non éprouvés. |
| **Les en-têtes de sécurité HTTP** | Non mesurés sur la recette. |

---

## 8. Le Storage — éprouvé le 2 août

**Le bucket est privé et n'a AUCUNE politique de lecture.** `storage.objects`
porte la RLS et une seule politique, en écriture. Un client authentifié ne peut
donc ni lister ni télécharger directement : tout passe par les routes de
l'application.

**Aucune URL signée n'est émise.** Les fichiers sont servis en flux par
`/api/document/:versionId/download`, ce qui permet un contrôle à chaque requête
plutôt qu'un jeton qui s'échappe. Deux barrières indépendantes s'y appliquent :

1. La version est lue sous l'identité de l'appelant — si la RLS la lui cache,
   la route rend **404** sans jamais toucher au bucket.
2. `my_document_permission` doit rendre `download` ou `edit`. **Fermé par
   défaut** : tout le reste rend **403**.

**Mesuré :** un invité en lecture seule sur le dossier voit la pièce
(`piece_visible = 1`) mais son niveau est `view`. La route lui refuserait donc
l'original ; il n'obtient que la visionneuse filigranée.

### Une régression corrigée au passage

`delete_document` ne touche aucun objet de stockage — aucune cascade en base ne
le peut. Le chemin **V1** (`app/actions/crud.ts`) nettoyait le bucket ; le
chemin **V2** ne le faisait pas. Un fondateur qui supprimait une pièce laissait
donc ses octets en place, en croyant l'avoir effacée.

Ce n'était pas un choix mais un oubli, et son propre commentaire l'avouait. Le
nettoyage est aligné sur celui de la V1 : la ligne part d'abord, le fichier
ensuite — si le bucket résiste, il reste un objet orphelin, coûteux mais
inoffensif, alors que l'inverse laisserait une pièce visible au contenu disparu.

**Ce qui reste non mesuré ici :** le filigrane lui-même, et le comportement de
la visionneuse sur un document volumineux.

---

## 9. Les limites de plan — éprouvées à l'écran le 2 août

Elles ne l'avaient été qu'en SQL. Une limite peut tenir en base et se présenter
à l'utilisateur comme une panne — « l'action n'a pas abouti, réessayez » —, ce
qui l'envoie buter deux fois sur le même mur sans comprendre.

Un test de navigateur vérifie désormais que le refus **se dit** : le message
nomme le motif (« votre plan n'autorise pas une opération de plus ») et offre
une issue (« archivez-en une terminée, ce qui est réversible, ou changez de
plan »). Et l'opération refusée n'existe nulle part — un refus ne laisse pas de
trace à moitié créée.

En base, la même limite refuse aussi une insertion directe :

```text
ERROR: P0001: limite atteinte : active_deals
```

---

## 10. Verdict

Sont vérifiés, preuve à l'appui : le cloisonnement par RLS, l'immuabilité du
journal, le refus de viser la production, l'étanchéité de l'accès invité, les
limites de plan à l'écran, et le Storage — bucket privé sans politique de
lecture, aucun lien signé, double barrière avant tout téléchargement.

Une régression a été trouvée et corrigée en le vérifiant : la V2 ne nettoyait
pas le bucket à la suppression d'une pièce, contrairement à la V1.

**Ce qui reste non mesuré**, et qu'il faut nommer plutôt que taire : le
filigrane, la double authentification, les en-têtes de sécurité HTTP, et le
comportement de la visionneuse sur des documents volumineux. Aucun n'est un
risque de fuite ; ce sont des questions de robustesse et de finition.
