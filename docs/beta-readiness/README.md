# Dossier de préparation à la bêta — état d'avancement

**Verdict provisoire : NO-GO**, faute de preuves — pas faute de code.

Ce dossier est en cours de constitution. Ce fichier dit honnêtement ce qui est
prouvé, ce qui ne l'est pas, et ce qui manque pour aller plus loin. Il ne
remplace pas `BETA-READINESS-REPORT.md`, qui ne sera écrit que lorsque les
preuves existeront : un rapport de décision rédigé avant ses preuves est un avis,
pas un dossier.

## Ce qui est prouvé aujourd'hui

| Preuve | Statut | Où |
|---|---|---|
| Les 7 routes privées renvoient un visiteur anonyme vers la connexion | ✅ 7/7 | `e2e/public.auth.spec.ts` |
| La page de connexion s'affiche sans erreur de console | ✅ | idem |
| Un envoi vide et une adresse mal formée sont refusés sans jargon technique | ✅ | idem |
| La page de connexion se parcourt au clavier, focus visible | ✅ | idem |
| Aucun secret (`service_role`, clé de paiement) dans le HTML servi | ✅ | idem |

**12 tests, 12 réussis.** Vidéos, traces et captures dans `evidence/`.

## Ce qui n'est pas prouvé

Tout le reste. Chaque autre parcours du brief exige une session ouverte :
onboarding, opérations, data room, préparation, partage, levée, pipeline,
équipe, sécurité, abonnement.

**La suite est écrite pour ça et prête à tourner**, mais elle ne peut pas
s'authentifier seule.

## Ce qu'il faut pour débloquer

```bash
cp .env.test.local.example .env.test.local
```

Puis renseigner les deux valeurs — un compte de recette dédié, **sans double
authentification** (la suite ne peut pas fournir de code TOTP). Le fichier est
ignoré par git et n'est lu que par Playwright.

```bash
npm run e2e
```

## Garde-fous en place

- `e2e/verifier-cible.ts` **refuse de démarrer** si `NEXT_PUBLIC_SUPABASE_URL`
  pointe sur la production (`bileqzpguyynkktndazs`) ou sur un projet inconnu.
  La suite écrit en base et enverrait de vrais e-mails d'invitation ; se fier à
  la mémoire de celui qui lance la commande ne suffit pas.
- Un seul worker : les tests partagent une organisation, et franchir une limite
  de plan en parallèle donnerait des comptes faux.
- Aucun mot de passe dans le dépôt, ni dans les traces — Playwright masque la
  saisie d'un champ `type="password"`, et `.session.json` ne porte que des
  jetons.

## Documents restant à écrire

Ils ne sont pas commencés, et ne le seront pas avant que leurs preuves existent :

```text
BETA-READINESS-REPORT.md     ← dépend de tout le reste
CRITICAL-FLOWS.md            ← dépend des tests authentifiés
FORM-VALIDATION-MATRIX.md    ← lisible depuis le code, faisable dès maintenant
ERROR-MIGRATION-STATUS.md    ← lisible depuis le code, faisable dès maintenant
COPY-AUDIT.md                ← lisible depuis le code, faisable dès maintenant
TEST-RESULTS.md              ← partiellement faisable
SECURITY-REPORT.md           ← la partie RLS demande d'exécuter le script SQL
KNOWN-ISSUES.md              ← faisable dès maintenant
```

## Un fait à connaître avant de lire quoi que ce soit d'autre

Les rapports précédents affirmaient que toutes les routes `/v2` renvoyaient 404
en local et qu'aucune vérification navigateur n'était possible. **C'était faux.**
Le préviseur était rattaché à un autre dossier racine et avait démarré le
serveur d'un second dépôt — pointant, au passage, sur la base de production.
L'application de `v2/rebuild` a toujours fonctionné.
