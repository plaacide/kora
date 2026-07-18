# Mise en production — Sanza (Coolify, auto-hébergé)

Cible : image Docker unique (Next.js + LibreOffice) déployée par **Coolify**
sur un **VPS que vous possédez**, domaine **sanza.africa**, base **Supabase**.

Le `Dockerfile` est portable : le même fichier fonctionne sur Coolify, Fly,
Railway ou Cloud Run. Changer d'hébergeur plus tard ne demande aucune
réécriture — c'est tout l'intérêt d'avoir conteneurisé.

> ⚠️ Aucun secret ne doit transiter par un chat, un ticket ou un commit.
> Les clés se copient **depuis leur source vers le champ**, rien d'autre.

> ⚠️ En auto-hébergé, **le serveur est votre responsabilité** : mises à jour de
> sécurité, sauvegardes, disponibilité. C'est le prix du zéro lock-in.

---

## 0. Le VPS

**Dimensionnement.** LibreOffice est gourmand pendant une conversion. Viser
**4 Go de RAM / 2 vCPU** minimum (2 Go passe, mais sans marge).

| Hébergeur | Modèle indicatif | Note |
|---|---|---|
| Hetzner | CX22 (4 Go / 2 vCPU) | le moins cher, DC allemands (UE) |
| Scaleway | DEV1-M | français, cohérent avec l'argument souveraineté |
| OVHcloud | VPS Value | français |

Système : **Ubuntu 24.04 LTS**.

### Durcissement minimal (à faire avant tout le reste)

```bash
# 1. Connexion par clé SSH uniquement (jamais par mot de passe)
ssh-copy-id root@<IP_DU_VPS>
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# 2. Pare-feu : n'ouvrir que SSH, HTTP, HTTPS
sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443
sudo ufw enable

# 3. Correctifs de sécurité automatiques
sudo apt update && sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 1. Installer Coolify

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

Puis ouvrir `http://<IP_DU_VPS>:8000` et **créer le compte admin
immédiatement** (la première inscription devient administrateur — ne pas
laisser l'instance ouverte sans compte).

Dans Coolify → *Settings*, renseigner un domaine pour l'interface et activer
les mises à jour automatiques.

---

## 2. Appliquer les migrations en attente

Dans Supabase → **SQL Editor**, dans cet ordre :

1. `supabase/migrations/20260719160000_checklist_custom.sql` — DD personnalisable
2. `supabase/migrations/20260719180000_personas.sql` — onboarding investisseur/fondateur

Vérification :

```sql
select column_name from information_schema.columns
where table_name = 'profiles' and column_name = 'account_type';   -- 1 ligne
select proname from pg_proc where proname = 'add_checklist_item'; -- 1 ligne
```

---

## 3. Configurer Supabase pour la production

**Authentication → URL Configuration**
- *Site URL* : `https://sanza.africa`
- *Redirect URLs* : ajouter `https://sanza.africa/**`

Sans ça, les liens de confirmation et d'invitation pointent vers `localhost`.

**Authentication → Sign In / Providers → Email**
- Phase de test : décocher **Confirm email** (l'inscription ouvre la session
  et enchaîne directement sur l'onboarding par persona).
- Avant ouverture publique : réactiver, une fois le SMTP ci-dessous en place.

**Authentication → Emails → SMTP Settings** (le SMTP par défaut de Supabase
est fortement limité et non destiné à la production)
- Host `smtp.resend.com` · Port `465` · Username `resend`
- Password : **clé API Resend**
- Sender : `noreply@sanza.africa`, **après** vérification du domaine dans
  Resend (Domains → Add Domain → poser les DNS SPF/DKIM chez Namecheap)

**Authentication → Rate Limits** : relever la limite d'emails une fois le
SMTP personnalisé actif.

---

## 4. Créer l'application dans Coolify

1. *+ New* → **Application** → source **Git** (dépôt privé : ajouter la clé de
   déploiement que Coolify propose) ou **Dockerfile**.
2. **Build Pack : `Dockerfile`** (ne pas laisser Nixpacks : l'image doit être
   la nôtre, avec LibreOffice).
3. **Port exposé : `8080`** (cf. `EXPOSE`/`PORT` du Dockerfile).

### Variables — le point à ne pas rater

Dans *Environment Variables*, Coolify distingue les variables de **build** et
de **runtime**. Next **inline les `NEXT_PUBLIC_*` dans le bundle au moment du
build** : elles doivent donc être cochées **« Build Variable »**, sinon
l'application se construira sans savoir joindre Supabase.

| Variable | Type | Remarque |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Build** ✅ | non secrète |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Build** ✅ | non secrète (visible côté navigateur) |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime | **serveur uniquement — jamais de préfixe `NEXT_PUBLIC_`** |
| `RESEND_API_KEY` | Runtime | secret |
| `EMAIL_FROM` | Runtime | `Sanza <noreply@sanza.africa>` |

Puis **Deploy**. Le premier build est long (~5-10 min) : l'image installe
LibreOffice.

---

## 5. Brancher le domaine

Chez **Namecheap** (Domain List → Manage → Advanced DNS) :

| Type | Host | Value |
|---|---|---|
| A | `@` | IP du VPS |
| A | `www` | IP du VPS |

Dans Coolify → application → *Domains* : saisir `https://sanza.africa`.
Coolify (Traefik) obtient et renouvelle le certificat **Let's Encrypt**
automatiquement. Propagation DNS : quelques minutes à quelques heures.

---

## 6. Vérifications après déploiement

- [ ] `https://sanza.africa` répond, HTTPS valide
- [ ] Connexion avec un compte existant
- [ ] Inscription : le choix Investisseur/Fondateur route vers le bon onboarding
- [ ] Data room : dépôt d'un fichier, puis lecture dans la visionneuse
- [ ] **Conversion Office** : ouvrir un `.xlsx`/`.pptx` — doit s'afficher
      converti et filigrané. *C'est le test qui prouve l'intérêt du conteneur :
      cette conversion ne peut pas fonctionner en local.*
- [ ] Invitation : l'email part, le lien pointe vers `https://sanza.africa/...`
- [ ] Journal d'audit : chaîne intègre

---

## Exploitation (votre charge, désormais)

- **Sauvegardes.** Les documents et la base vivent chez **Supabase** — activer
  les backups côté Supabase (plan Pro). Le VPS lui-même est *stateless* :
  s'il brûle, on le recrée et on redéploie. Ne rien stocker de précieux dessus.
- **Mises à jour.** `unattended-upgrades` couvre l'OS ; Coolify se met à jour
  depuis son interface. À vérifier une fois par mois.
- **Supervision.** Coolify affiche logs et état des conteneurs. Pour être
  prévenu d'une panne, brancher un moniteur externe gratuit (UptimeRobot,
  BetterStack) sur `https://sanza.africa`.
- **Rollback.** Coolify garde l'historique des déploiements : *Deployments* →
  redéployer une version antérieure.
- **Redémarrage.** Pas de scale-to-zero ici : le conteneur tourne en continu,
  donc pas de démarrage à froid (avantage réel face à Fly pour la visionneuse).
