# Reprise — état au 2026-07-31

Document de passation. Lire `AGENTS.md` **avant** d'écrire une ligne de code :
il contient les pièges du dépôt, dont plusieurs coûtent une demi-journée chacun.

---

## 1. Ce qu'il faut savoir en premier

### Les deux documents qui font foi

| Source | Rôle |
|---|---|
| `sanza_handoff/PROGRAMME-COHORTES-DEALROOM.md` | **les règles**. En cas de conflit avec un autre document, elles gagnent. |
| `Sanza Onboarding Programme (1).html` (Téléchargements du fondateur) | **la maquette**, 17 écrans. |

**La maquette n'est pas indicative — elle est la spécification.** L'erreur la
plus coûteuse de la session précédente a été d'inventer des libellés et des
comportements que la maquette tranchait déjà (« PAS COMMENCÉ » au lieu de
« NOUVELLE », abandon du statut « LIEN OUVERT » jugé à tort non mesurable).

### Comment lire la maquette

Le fichier est un bundle avec scripts inline. Le servir depuis l'application
échoue (notre CSP bloque l'inline sans nonce). Le servir à plat fonctionne :

```bash
cp "Sanza Onboarding Programme (1).html" /tmp/maq/index.html && cd /tmp/maq && python3 -m http.server 8899
```

Puis, dans le navigateur, extraire les 17 écrans :

```js
[...document.querySelectorAll('[data-screen-label]')].map(e => ({
  ecran: e.getAttribute('data-screen-label'), texte: e.innerText
}))
```

⚠️ Une extraction par expression régulière sur le fichier brut ne rend que les
blocs `vide({…})` — **8 écrans sur 17**. C'est le piège dans lequel la session
précédente est tombée en croyant avoir tout lu.

---

## 2. État du dépôt

- Branche `main`, synchronisée avec `origin`. Arbre propre (seuls les
  `sanza_handoff/*.md` sont non suivis — documents du fondateur).
- Dernier commit : `e52eed5`.
- Déploiement **automatique à chaque push** (Coolify), ~100 s.
- Production : https://app.sanza.africa

### Contrôles avant tout commit

```bash
node node_modules/typescript/bin/tsc --noEmit     # doit être vide
npx eslint src                                    # RÉFÉRENCE : 11 problèmes (5 erreurs, 6 avertissements)
npx next build                                    # doit compiler
```

La référence de 11 n'est pas un objectif à améliorer : c'est le repère qui
permet de voir qu'on n'a **rien ajouté**. Toute valeur supérieure = régression
introduite par le commit en cours.

Parité des catalogues (aucun écart toléré) :

```bash
python3 -c "
import json
def plat(o,p=''):
    s=set()
    for k,v in o.items():
        c=f'{p}{k}'; s |= plat(v,c+'.') if isinstance(v,dict) else {c}
    return s
fr=plat(json.load(open('src/messages/fr.json'))); en=plat(json.load(open('src/messages/en.json')))
print(sorted(fr^en) or 'aucun écart')"
```

---

## 3. ⚠️ Migrations — état à vérifier avant toute chose

Le fondateur applique les migrations **à la main** dans l'éditeur SQL Supabase.
Elles ne sont pas jouées automatiquement.

**Une migration est probablement non appliquée** :

```
supabase/migrations/20260731190000_membres_secteur_pays.sql
```

Impossible à confirmer depuis l'extérieur (la fonction est `security definer`
et filtre sur `is_org_member`, donc invisible en clé de service). Vérification
fiable, dans l'éditeur SQL :

```sql
select proname, pg_get_function_result(oid)
from pg_proc where proname = 'cohort_members_named';
```

Si le résultat ne contient pas `sector` et `country`, la migration reste à
appliquer — sans elle, `/cohortes/[id]` plante ou affiche des colonnes vides.

Toutes les migrations antérieures (jusqu'à `20260731170000` incluse) sont
appliquées et sondées.

### Sonder l'état réel de la base

```bash
set -a; source .env.local; set +a
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/<fonction>" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" -d '{"p_x":"..."}'
```

⚠️ PostgREST renvoie **404 quand les NOMS d'arguments ne correspondent pas**,
pas seulement quand la fonction est absente. Sonder avec les bons noms, sinon
on conclut à tort qu'une fonction manque.

---

## 4. LE piège du projet — à lire absolument

**Cinq fois** pendant la session précédente, le même défaut :

> Une table protégée par RLS, lue avec la session de quelqu'un que la RLS
> exclut. La requête renvoie **zéro ligne, sans erreur**. L'écran affiche
> « — », « aucun », ou un état vide — c'est-à-dire *« la donnée n'existe pas »*
> là où la vérité est *« la lecture vous est refusée »*.

Ni TypeScript, ni `next build`, ni la relecture ne le voient.

Occurrences corrigées, et ce qu'elles cassaient :

| Table | Lue par | Symptôme |
|---|---|---|
| `listing_consents` | — (jamais écrite) | toute la chaîne dealroom morte |
| `cohort_links` | l'invité | « Cette invitation n'est plus valable » sur un jeton valide |
| `organizations` | le programme | nom d'entreprise affiché « — » |
| `startups` | le programme | secteur/pays vides |
| `cohort_links` | l'invité (ses propres invitations) | aucun rappel possible |

**Remède systématique** : une fonction `security definer` qui ÉNUMÈRE ses
colonnes et réinstalle la garde dans son corps (`is_org_member(...)`). Voir
`cohort_members_named`, `related_org_names`, `invitation_apercu`,
`mes_invitations`.

**Réflexe à prendre** : avant d'écrire `.from("X")` dans un écran, vérifier la
politique de X et se demander *« l'utilisateur de cet écran la satisfait-il ? »*

Balayage des tables jamais écrites depuis le code :

```bash
for t in $(grep -rhoE "create table (if not exists )?public\.[a-z_]+" supabase/migrations/*.sql | sed 's/.*public\.//' | sort -u); do
  grep -rq "\"$t\"" src/ || echo "orphelin possible : $t"
done
```

---

## 5. Ce qui reste à faire — écart avec la maquette

Vérifié écran par écran sur les 17. Par ordre de valeur décroissante.

### Écran 05 — Onboarding 3/3
- [ ] **« Importer une liste »** de fondateurs (le collage séparé par virgules
      existe, l'import de fichier non).

### Écrans 03/04/05 — Onboarding
- [ ] **« Enregistrer et quitter »** en haut à droite.
- [ ] **« Compléter plus tard »** à l'étape 1 (à côté de « Continuer »).

### Écran 08 — Cohorte sans entreprise
- [ ] Boutons **« Modifier la cohorte »** et **« Inviter une entreprise »** en
      en-tête (« Rapport bailleur » et « Publier le dealroom » sont faits).
- [ ] État vide avec deux actions : **« Inviter par email »** /
      **« Importer une liste »**.

### Écran 16 — Sécurité
- [ ] **Sessions actives** (« 1 appareil · Abidjan, aujourd'hui » + « Voir »).
- [ ] **Journal de sécurité**, avec sa phrase d'état vide : *« Un journal de
      sécurité vide est une bonne nouvelle, pas un manque. »*
- [ ] Ligne **Mot de passe** (« Défini il y a quelques minutes » + « Modifier »).
- [ ] Le conseil contextuel en haut, qui existe déjà en texte dans la maquette.

### Écran 17 — Roadmap
- [ ] Trois colonnes **EN COURS / ENSUITE / À L'ÉTUDE** avec leur contenu.
- [ ] État vide **« Vous n'avez encore rien demandé »** + bouton
      **« Proposer une amélioration »**.

### Écran 07 — Cohortes vide
- [ ] Bouton secondaire **« Comment ça marche »**.

### Divergence assumée, à ne pas « corriger » sans le fondateur
La maquette dit **« Objectif principal »** (singulier). Le fondateur a demandé
explicitement le **multiple + saisie libre**, livré en `d1b3077`. Ce n'est pas
un écart à réparer.

### Personnalisation des e-mails — proposé, non décidé
Le sujet « X souhaite suivre votre préparation » est jugé trop générique par le
fondateur. Proposition faite, non validée : piloter sujet et accroche par
l'objectif de la cohorte (`cohorts.goals`), et ajouter nom + période de la
cohorte dans le corps. Les deux paragraphes « ce que le programme verra / ne
verra pas » ne doivent PAS être dilués — c'est le cœur du consentement.

---

## 6. Vérifications qui ne passent par aucun test automatique

### Le test RLS §0.1 — à rejouer après toute migration touchant les politiques

```
supabase/tests/rls_programme_0_1.sql
```

À coller entier dans l'éditeur SQL. Transaction annulée, aucune écriture
durable, 8 contrôles. Dernier passage : **8/8 OK**.

La règle §0.1 : *« un programme voit l'ÉTAT d'une startup de sa cohorte, jamais
ses documents ni ses deals. Toute PR qui l'entame est refusée d'office. »*

### Les liens d'e-mail — le build ne les voit pas

Deux défauts sont déjà passés en production sans qu'aucun outil ne les
signale. Après toute modification touchant l'authentification ou les e-mails,
relire un envoi RÉEL :

```bash
set -a; source .env.local; set +a
curl -s "https://api.resend.com/emails" -H "Authorization: Bearer $RESEND_API_KEY"   # lister
curl -s "https://api.resend.com/emails/$ID" -H "Authorization: Bearer $RESEND_API_KEY"
```

Contrôler dans l'URL du lien :
- `token_hash=` **sans** préfixe `pkce_` (le flux doit rester `implicit`) ;
- `next=` porte bien la destination attendue.

Dernier contrôle : **conforme** sur une inscription partie d'une invitation.

---

## 7. Le parcours de bout en bout (recette)

Trois adresses distinctes (alias Gmail `+prog@`, `+startup@`, `+investisseur@`),
trois fenêtres privées.

1. Inscription rôle **Programme** → structure → cohorte → invitations → bienvenue.
2. `/cohortes/[id]` → inviter une entreprise (**nom + email**).
3. L'entreprise ouvre le lien → inscription pré-remplie → confirme → accepte.
4. L'entreprise crée une salle et **dépose un document** (2ᵉ condition de
   publication).
5. L'entreprise : `/permissions` → **« Être listé »** pour la cohorte.
6. Le programme : la case de listage devient active → publier → `/dealroom`.
7. Le programme invite un investisseur à la vitrine.
8. L'investisseur ouvre la fiche → demande l'accès.
9. Le programme : `/demandes` → recommande. L'entreprise accorde.
10. L'entreprise : `/permissions` → **donner mandat** → le programme peut
    accorder directement.

État actuel du test : les étapes 1 à 3 fonctionnent et ont été vérifiées en
production. Les étapes 4 à 10 n'ont jamais été parcourues en réel.

---

## 8. Conventions

- **Un commit par section**, message en **français**, sujet à **l'impératif**.
- Le message dit *pourquoi*, pas *quoi* — le diff dit déjà quoi.
- **Aucune écriture directe depuis le client** : tout passe par des RPC
  `security definer` qui vérifient les droits ET auditent dans la même
  transaction.
- **Aucun lien de navigation vers une page inexistante** (`src/components/shell/nav.ts`).
  ⚠️ `ECRANS_PROGRAMME` **filtre** `navGroups`, elle n'y ajoute rien : une
  entrée listée là mais absente de `navGroups` n'apparaît nulle part.
- **Jamais de données inventées** (KPI, courbe). Si la donnée réelle n'existe
  pas, ne pas afficher l'élément.
- **Ne pas trancher une divergence** entre spec et code à la place du
  fondateur : signaler et attendre.
- Modules de constantes partagées : **neutres**, ni `"use client"` ni
  `"use server"` (cf. AGENTS.md).

---

## 9. Fichiers-clés

| Chemin | Rôle |
|---|---|
| `AGENTS.md` | pièges du dépôt — à lire en premier |
| `src/components/shell/nav.ts` | navigation par persona |
| `src/lib/conseil-cohorte.ts` | le conseil contextuel (module neutre) |
| `src/lib/demandes-echeance.ts` | échéances calculées, pas balayées |
| `src/lib/redirect.ts` | `cheminInterne()` — validation des redirections |
| `src/lib/objectifs-cohorte.ts` | objectifs connus + libres |
| `src/lib/vitrine-indicateurs.ts` | les 8+8 lignes de la fiche vitrine |
| `supabase/tests/rls_programme_0_1.sql` | test exécutable de la règle §0.1 |

Aucune tâche planifiée n'existe sur cette installation. Deux mécanismes le
contournent volontairement : l'expiration des demandes et invitations est
**calculée** à la lecture, et le relevé mensuel du rapport se déclenche à la
première ouverture de `/rapports` chaque mois.
