# Problèmes connus

Gravités : **S1** perte de données, sécurité ou paiement · **S2** parcours
critique bloqué · **S3** important, contournable · **S4** finition.

| ID | Problème | Gravité | Parcours | Conséquence | Contournement | Bloquant bêta |
|---|---|---|---|---|---|---|
| B-01 | Le **Send Email Hook n'est pas branché sur la recette** | **S2** | Inscription, mot de passe oublié | Supabase envoie ses gabarits par défaut, en anglais, depuis `noreply@mail.app.supabase.io`. Leur lien passe par `/verify`, qui consomme le jeton et redirige **sans** `token_hash` — l'application annonçait alors « Ce lien n'est plus valide » à quelqu'un qui venait d'être confirmé et connecté. | Le code tolère désormais ce cas (voir ci-dessous), mais les e-mails restent en anglais et non signés Sanza. | **OUI** |
| B-02 | Trois écrans hors périmètre restent atteignables par URL | S3 | Cohortes, import de liste | `CohortJoin`, le panneau cohorte des invitations et `ImportList` affichent des données fictives (« Nimba Solar », « Banque Atlantique »). Un paramètre d'URL deviné suffit à les ouvrir. | Aucun lien de l'interface n'y mène. | Non, si la bêta est fermée |
| B-03 | `aria-describedby` absent de toute la V2 (0 occurrence) | S3 | Tous les formulaires | Un lecteur d'écran annonce le champ invalide mais pas le message qui dit quoi corriger. `aria-invalid` n'existe que sur la connexion. | Aucun. | Non pour une bêta voyante |
| B-04 | Aucun formulaire ne met le focus sur le premier champ fautif | S3 | Levée surtout | Sur un écran d'une douzaine de champs, il faut chercher lequel corriger. L'action rend pourtant `res.champ`. | Les messages nomment le champ en toutes lettres. | Non |
| B-05 | L'onboarding crée une opération alors que le brief demande l'inverse | S3 | Onboarding | `complete_onboarding(p_create_room: true)`. Divergence signalée, **non corrigée** faute d'arbitrage. | — | À trancher |
| B-06 | Le sort des fichiers Storage à la suppression n'est pas tranché | S3 | Data room, opérations | `delete_document` retire la ligne ; le fichier survit dans le bucket. | La suppression définitive d'opération reste indisponible. | Non — car non exposé |
| B-07 | Deuxième mécanisme d'erreur non testé | S4 | Onboarding, nouvelle opération | Ces cinq actions passent par `?erreur=clé` et non par le catalogue. Aucune fuite, mais deux endroits mettent des mots sur des erreurs. | — | Non |

## B-01 en détail — le seul bloquant

### Ce qui a été observé

Journaux d'authentification de la recette, 1er août :

```
{"event":"mail.send",
 "mail_from":"noreply@mail.app.supabase.io",
 "mail_to":"…+agroinnova@gmail.com",
 "mail_type":"confirmation"}
```

Supabase a expédié l'e-mail **lui-même**. Si le Send Email Hook était branché,
il appellerait `/api/auth/email-hook` et cette ligne n'existerait pas.

Puis, au clic :

```
14:25:04  GET /verify  →  303   referer: localhost:3001/auth/confirm?next=%2Fv2
14:25:57  GET /verify  →  403 « One-time token not found »
15:34:24  GET /verify  →  403 « One-time token not found »
```

Et en base :

```
email_confirmed_at  →  renseigné
last_sign_in_at     →  2026-08-01 14:25:04
```

**L'adresse a bien été confirmée et la session ouverte à 14:25:04** — à la
seconde même où l'écran affichait « Ce lien n'est plus valide ». Les deux clics
suivants ont échoué parce que le jeton à usage unique était déjà consommé.

### Pourquoi

`{{ .ConfirmationURL }}`, la variable des gabarits Supabase, pointe vers **son**
point d'entrée `/verify`. Celui-ci vérifie le jeton, ouvre la session, puis
redirige vers `redirect_to` — sans jamais transmettre `token_hash`.
`/auth/confirm` ne trouvait donc aucun jeton et concluait à un lien mort.

Le code documentait déjà ce piège : *« ses gabarits imposent
`{{ .ConfirmationURL }}`, qui ne produit pas le `token_hash` attendu par
`/auth/confirm` — le défaut qui a cassé la réinitialisation de mot de passe en
production. »* Il s'est reproduit sur la recette, faute de configuration.

### Ce qui a été corrigé dans le code

`/auth/confirm` regarde s'il existe une session avant de conclure à l'échec, et
sur les deux branches — jeton absent, et jeton refusé. Un client mail qui
préaffiche les liens brûle le jeton avant même le clic ; renvoyer la personne
demander un nouveau lien alors qu'elle est déjà connectée n'a aucun sens.

Les chemins d'échec suivent en outre la version d'origine du lien : un
utilisateur V2 ne retombe plus sur les écrans V1.

### Ce qui reste à faire, et que le code ne peut pas faire

**Brancher le Send Email Hook sur la recette**, dans le tableau de bord Supabase :

```text
Authentication → Hooks → Send Email Hook
URI   : https://<domaine-de-recette>/api/auth/email-hook
Secret: la valeur de SEND_EMAIL_HOOK_SECRET
```

Sans cela les e-mails restent en anglais, expédiés depuis
`mail.app.supabase.io`, et non signés Sanza — ce qui, pour une plateforme de
data rooms, se lit comme du hameçonnage.

**La production est hors périmètre** — décision du fondateur le 1er août :
« oublie la production parce qu'on utilisera ce que tu as avec la V2 ». Le
projet `bileqzpguyynkktndazs` ne recevra ni ce crochet ni les migrations de la
V2 ; `jourzsgjnutktsrgxkoo` est la base qui sera lancée.
