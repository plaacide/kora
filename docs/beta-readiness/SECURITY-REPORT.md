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

## 6. Ce qui n'a PAS été vérifié

Ce chapitre est le plus important du document.

| | Pourquoi c'est un risque |
|---|---|
| **Les limites de plan, à l'écran** | Vérifiées en SQL sous identité authentifiée, jamais dans un navigateur. Une limite contournable par l'interface ne se verrait pas. |
| **L'accès invité à une data room** | Aucun test n'ouvre une salle côté destinataire. C'est pourtant le cœur du produit et le principal risque de fuite. |
| **La suppression de pièces dans Storage** | `delete_document` retire la ligne ; **le fichier survit dans le bucket** (B-06). Non exposé aujourd'hui, à trancher avant de l'exposer. |
| **La double authentification** | Aucun compte de test n'en porte. |
| **Le filigrane et le téléchargement** | Non éprouvés. |
| **Les en-têtes de sécurité HTTP** | Non mesurés sur la recette. |

---

## 7. Verdict

Le cloisonnement par RLS, l'immuabilité du journal et le refus de viser la
production sont **vérifiés**. Le traitement des secrets est correct, un incident
près, corrigé et documenté.

**Rien de tout cela ne dit que les limites de plan tiennent à l'écran, ni qu'un
invité ne voit que ce qu'on lui a ouvert.** Ce sont les deux vérifications qui
manquent, et ce sont les deux qui coûteraient le plus cher si elles cédaient.
