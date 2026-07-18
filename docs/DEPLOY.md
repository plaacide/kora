# Mise en production — Sanza

Cible : image Docker unique (Next.js + LibreOffice) sur **Fly.io**, région
`cdg` (Paris), domaine **sanza.africa**, base **Supabase**.

> ⚠️ Aucun secret ne doit transiter par un chat, un ticket ou un commit.
> Les clés se copient **depuis leur source vers la commande/le champ**, rien d'autre.

---

## 0. Prérequis (une seule fois)

```bash
# macOS
brew install flyctl
flyctl auth login          # ouvre le navigateur
```

---

## 1. Appliquer les migrations en attente

Dans Supabase → **SQL Editor**, exécuter dans cet ordre :

1. `supabase/migrations/20260719160000_checklist_custom.sql` — DD personnalisable
2. `supabase/migrations/20260719180000_personas.sql` — onboarding investisseur/fondateur

Vérification rapide (SQL editor) :

```sql
select column_name from information_schema.columns
where table_name = 'profiles' and column_name = 'account_type';   -- doit renvoyer 1 ligne
select proname from pg_proc where proname = 'add_checklist_item'; -- doit renvoyer 1 ligne
```

---

## 2. Configurer Supabase pour la production

**Authentication → URL Configuration**
- *Site URL* : `https://sanza.africa`
- *Redirect URLs* : ajouter `https://sanza.africa/**`

Sans ça, les liens de confirmation et d'invitation pointent vers `localhost`.

**Authentication → Sign In / Providers → Email**
- Pour la phase de test : décocher **Confirm email** (l'inscription ouvre
  directement la session et enchaîne sur l'onboarding par persona).
- Avant ouverture publique : réactiver, une fois le SMTP ci-dessous en place.

**Authentication → Emails → SMTP Settings** (indispensable en production —
le SMTP par défaut de Supabase est fortement limité et non destiné à la prod)
- Host `smtp.resend.com` · Port `465` · Username `resend`
- Password : **clé API Resend** (copiée depuis Resend)
- Sender : `noreply@sanza.africa` **après** avoir vérifié le domaine dans
  Resend (Domains → Add Domain → poser les DNS SPF/DKIM chez Namecheap).

**Authentication → Rate Limits** : relever la limite d'emails une fois le
SMTP personnalisé actif.

---

## 3. Créer l'app Fly

```bash
cd <racine du repo>
flyctl launch --no-deploy      # détecte fly.toml ; ne pas laisser créer de Postgres
```

---

## 4. Poser les secrets runtime

```bash
flyctl secrets set \
  SUPABASE_SERVICE_ROLE_KEY='...' \
  RESEND_API_KEY='...' \
  EMAIL_FROM='Sanza <noreply@sanza.africa>'
```

`SUPABASE_SERVICE_ROLE_KEY` est **serveur uniquement** : jamais de préfixe
`NEXT_PUBLIC_`, jamais exposé au navigateur.

---

## 5. Déployer

Les variables `NEXT_PUBLIC_*` sont **inlinées dans le bundle au build** : elles
doivent être fournies en `--build-arg` (elles ne sont pas secrètes, l'URL et la
clé publishable sont de toute façon visibles côté navigateur).

```bash
flyctl deploy \
  --build-arg NEXT_PUBLIC_SUPABASE_URL='https://<projet>.supabase.co' \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY='<clé publishable>'
```

Le premier build est long (~5-10 min) : l'image installe LibreOffice.

---

## 6. Brancher le domaine

```bash
flyctl certs add sanza.africa
flyctl ips list          # note les IP v4 / v6
```

Chez **Namecheap** (Domain List → Manage → Advanced DNS) :

| Type | Host | Value |
|---|---|---|
| A | `@` | IPv4 renvoyée par `flyctl ips list` |
| AAAA | `@` | IPv6 renvoyée par `flyctl ips list` |

Puis `flyctl certs show sanza.africa` jusqu'à obtenir le certificat (HTTPS
automatique). Propagation DNS : quelques minutes à quelques heures.

---

## 7. Vérifications après déploiement

- [ ] `https://sanza.africa` répond, HTTPS valide
- [ ] Connexion avec un compte existant
- [ ] Inscription : le choix Investisseur/Fondateur route vers le bon onboarding
- [ ] Data room : dépôt d'un fichier, puis lecture dans la visionneuse
- [ ] **Conversion Office** : ouvrir un `.xlsx`/`.pptx` — doit s'afficher
      converti et filigrané (c'est ce que le conteneur apporte)
- [ ] Invitation : l'email part et le lien pointe vers `https://sanza.africa/...`
- [ ] Journal d'audit : la chaîne est intègre

```bash
flyctl logs          # en cas de souci
flyctl status
```

---

## Notes d'exploitation

- **Scale-to-zero** : la machine s'arrête sans trafic et se rallume à la
  première requête (démarrage à froid plus long à cause de LibreOffice).
  Pour supprimer les cold starts : `min_machines_running = 1` dans `fly.toml`.
- **Swap 512 Mo** : filet contre l'OOM pendant une conversion LibreOffice.
- **Rollback** : `flyctl releases` puis `flyctl deploy --image <release>`.
