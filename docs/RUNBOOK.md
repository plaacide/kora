# Runbook Kora

Document d'exploitation. À tenir à jour — c'est ce qu'on lit quand ça va mal.

## 1. Architecture en une ligne

Next.js (Vercel) → Supabase (Postgres + Auth + Storage, région UE). Aucun autre
service à opérer aujourd'hui.

## 2. Environnements

| | |
|---|---|
| Code | github.com/plaacide/kora (`main`) |
| Hébergement app | Vercel — déploiement auto à chaque push sur `main` |
| Base / Auth | Supabase, projet `bileqzpguyynkktndazs` (UE) |
| Local | `npm run dev` → http://localhost:3000 |

### Variables d'environnement

| Variable | Où | Secrète ? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` | Non (publique) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + `.env.local` | Non (publique — la RLS protège) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Serveur uniquement**, jamais côté client | **OUI — critique** |

> La clé `anon` est faite pour tourner dans le navigateur. Ce qui protège les
> données, c'est la **RLS**, pas le secret de cette clé.

## 3. Sauvegardes — À VÉRIFIER

**Action requise :** confirmer le plan Supabase du projet.

- **Plan Free** : sauvegardes limitées, **pas de PITR** (restauration à un instant T).
  Insuffisant dès qu'il y a de vraies données clients.
- **Plan Pro** : sauvegardes quotidiennes + PITR.

**Recommandation :** passer en **Pro avant d'accueillir le premier client réel**.
Une data room sans restauration possible est un risque existentiel.

Vérifier : Supabase → Database → Backups. Tester une restauration **une fois**
avant la mise en production (une sauvegarde jamais testée n'est pas une sauvegarde).

## 4. Posture de sécurité actuelle

| Couche | État |
|---|---|
| Isolation multi-tenant (RLS) | ✅ vérifiée par test A/B |
| 2FA TOTP + enforcement AAL2 | ✅ vérifiée |
| Journal d'audit append-only + chaîne de hash | ✅ `verify_audit_chain()` |
| CSP (nonce, `strict-dynamic`) + HSTS + `X-Frame-Options: DENY` | ✅ |
| Rate-limit auth applicatif | ⚠️ en mémoire, par instance — défense en profondeur seulement |
| Rate-limit auth Supabase | ✅ appliqué côté serveur (protection qui fait foi) |
| Monitoring d'erreurs (Sentry) | ❌ pas branché — nécessite un compte Sentry |
| Confirmation email | ❌ **désactivée** (mode dev) — à réactiver avec un SMTP |
| Chiffrement par-tenant (KMS) | ❌ non fait — durcissement prévu avant les vrais deals |

## 5. Vérifier l'intégrité du journal d'audit

Le journal est chaîné : toute modification casse la chaîne.

```sql
select * from public.verify_audit_chain('<org_id>');
-- attendu : ok = true, broken_at = null
```

Si `ok = false` → **incident majeur** : le journal a été altéré. Ne pas écraser,
conserver en l'état et investiguer.

## 6. Incidents courants

**Fuite suspectée de la clé `service_role`**
→ Supabase → Settings → API → régénérer la clé, puis mettre à jour Vercel et
redéployer. Toute intégration l'utilisant doit être mise à jour.

**Compte compromis**
→ Supabase → Authentication → Users : révoquer les sessions de l'utilisateur.
Vérifier son activité dans `audit_log`.

**Le build Vercel échoue**
→ Cause déjà rencontrée : variables d'env absentes au build. Le code ne doit
**jamais** instancier le client Supabase au rendu (uniquement dans les handlers),
sinon le prerender plante sans clés.

**Déploiement inaccessible (redirige vers vercel.com/login)**
→ Vercel → Settings → Deployment Protection → mettre Vercel Authentication sur
« Only Preview Deployments » pour rendre la production publique.

## 7. Dette technique connue (à traiter avant les vrais clients)

1. **Sauvegardes** : passer Supabase en Pro + tester une restauration.
2. **Confirmation email** : réactiver + SMTP dédié + emails brandés.
3. **Sentry** : brancher le monitoring d'erreurs.
4. **Rate-limit partagé** (Upstash Redis) si le trafic le justifie.
5. **Revue de sécurité indépendante** avant d'héberger de vrais deals (3–10 k$).
6. **Chiffrement par-tenant (KMS)** pour les documents sensibles.
