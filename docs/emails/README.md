# Maquettes d'e-mails Sanza

13 maquettes livrées par le designer. **Ce sont des références visuelles, pas des
fichiers utilisés à l'exécution** — ne pas les coller dans le tableau de bord
Supabase, il ne sert plus à composer les e-mails (cf. AGENTS.md).

## Les 6 e-mails d'authentification — EN PRODUCTION

Portés dans `src/lib/email/auth-templates.ts`, envoyés par
`src/app/api/auth/email-hook/route.ts` (Send Email Hook). Bilingues FR/EN selon
`profiles.locale`. Les maquettes restent ici comme référence de design ; toute
modification se fait dans le code, pas dans ces fichiers.

| maquette | rendu par |
|---|---|
| `auth-01-confirm-signup.html` | `authEmail({ kind: "signup" })` |
| `auth-02-invite-user.html` | `authEmail({ kind: "invite" })` |
| `auth-03-magic-link.html` | `authEmail({ kind: "magiclink" })` |
| `auth-04-change-email.html` | `authEmail({ kind: "email_change" })` |
| `auth-05-reset-password.html` | `authEmail({ kind: "recovery" })` |
| `auth-06-reauthentication.html` | `authEmail({ kind: "reauthentication" })` |

Différence à connaître : les maquettes utilisent `{{ .ConfirmationURL }}`, la
variable des gabarits Supabase. Le code construit à la place un lien
`token_hash` vers `/auth/confirm`, seul format que nos routes savent vérifier
côté serveur. Ne pas réintroduire `ConfirmationURL` en recopiant une maquette.

## Les 7 notifications de sécurité — EN RÉSERVE

Non branchées, décision assumée : 4 d'entre elles concernent des fonctions que
Sanza n'a pas, et annoncer une alerte pour un événement impossible serait une
promesse creuse.

| maquette | à brancher quand |
|---|---|
| `security-01-password-changed.html` | **prêt** — actions de `/reinitialiser` et `/securite` |
| `security-06-mfa-added.html` | **prêt** — enrôlement TOTP (`/securite`) |
| `security-07-mfa-removed.html` | **prêt** — désactivation TOTP (`/securite`) |
| `security-02-email-changed.html` | si le changement d'adresse est ouvert |
| `security-03-phone-changed.html` | si l'authentification par SMS existe un jour |
| `security-04/05-signin-method-*.html` | si OAuth ou passkeys sont ajoutés |

Ces trois-là ont une vraie valeur défensive : sur une plateforme de data rooms,
la prise de contrôle d'un compte commence souvent par la désactivation de la
double authentification, et l'alerte est ce qui prévient le propriétaire
légitime pendant qu'il peut encore agir.

Le jour venu, elles se branchent sur la coquille existante d'`auth-templates.ts`
(en-tête encre, bandeau « un doute ? », pied de page) — aucun redesign à faire,
et le bandeau ambre « Ce n'était pas vous ? » à reprendre des maquettes.
