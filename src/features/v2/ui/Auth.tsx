"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  login,
  requestPasswordReset,
  signup,
  updatePassword,
} from "@/app/actions/auth";
import type { AuthState } from "@/lib/validation/auth";
import { createClient } from "@/lib/supabase/client";
import { cheminInterne } from "@/lib/redirect";
import { messageDErreur } from "@/features/v2/domain/erreurs";
import { Icon } from "./Icon";
import { SanzaWordmark } from "./Logo";

const ERROR_MESSAGES: Record<string, string> = {
  invalidCredentials: "Adresse e-mail ou mot de passe incorrect.",
  alreadyRegistered: "Un compte existe déjà avec cette adresse.",
  emailNotConfirmed: "Confirmez votre adresse e-mail avant de vous connecter.",
  tooManyAttempts: "Trop de tentatives. Réessayez dans quelques minutes.",
  rateLimited: "Trop de demandes. Réessayez dans quelques minutes.",
  passwordTooWeak: "Choisissez un mot de passe plus robuste.",
  resetLinkExpired:
    "Ce lien n’est plus valide. Demandez un nouveau lien de réinitialisation.",
  // Ces deux clés existaient côté serveur sans texte ici : elles tombaient donc
  // dans le repli générique, qui ne disait pas ce qu'il fallait corriger.
  notAuthenticated: "Votre session a expiré. Connectez-vous de nouveau.",
  passwordSameAsOld:
    "Ce mot de passe est identique au précédent. Choisissez-en un autre.",
};

/**
 * Ce qu'on dit quand un lien d'e-mail n'a pas abouti.
 *
 * Ces avis ne viennent PAS d'une action : ils sont posés dans l'URL par
 * `/auth/confirm`, qui a déjà tenté l'échange du jeton et échoué. Ils ne sont
 * donc pas des erreurs de saisie, et ne s'affichent pas en rouge.
 */
const AVIS_DE_LIEN: Record<string, string> = {
  lien_invalide:
    "Ce lien est incomplet. Ouvrez-le depuis votre boîte mail plutôt que de le recopier, ou demandez-en un nouveau.",
  lien_expire:
    "Ce lien a expiré ou a déjà servi. Demandez-en un nouveau ci-dessous.",
  session_absente:
    "Votre adresse est confirmée. Connectez-vous pour continuer.",
};

const FIELD_MESSAGES: Record<string, string> = {
  nameMin: "Indiquez votre nom complet.",
  jobTitleRequired: "Sélectionnez votre poste.",
  emailInvalid: "Saisissez une adresse e-mail valide.",
  passwordMin: "Le mot de passe est trop court.",
  passwordLetter: "Ajoutez au moins une lettre.",
  passwordDigit: "Ajoutez au moins un chiffre.",
  passwordRequired: "Saisissez votre mot de passe.",
  passwordMismatch: "Les deux mots de passe ne correspondent pas.",
};

type AccountType = "founder" | "investor" | "sae";

const JOB_TITLES_BY_ROLE: Record<AccountType, string[]> = {
  founder: [
    "Fondateur·rice / CEO",
    "Cofondateur·rice",
    "Directeur·rice général·e",
    "Directeur·rice financier·ère / CFO",
    "Responsable finance",
    "Responsable juridique ou conformité",
    "Responsable opérations",
    "Responsable de la levée de fonds",
    "Autre fonction",
  ],
  investor: [
    "Associé·e / Partner",
    "Directeur·rice d’investissement",
    "Investment Manager / Principal",
    "Chargé·e d’investissement",
    "Analyste",
    "Responsable portefeuille",
    "Responsable risque ou crédit",
    "Responsable impact / ESG",
    "Autre fonction",
  ],
  sae: [
    "Directeur·rice de programme",
    "Responsable de programme",
    "Responsable accélération ou incubation",
    "Responsable investissement",
    "Responsable suivi-évaluation",
    "Responsable partenariats",
    "Responsable opérations",
    "Autre fonction",
  ],
};

function AuthError({ state }: { state: AuthState }) {
  if (!state?.errorKey && !state?.errorRaw) return null;

  // `errorRaw` porte le message de Supabase Auth, en anglais — « Email link is
  // invalid or has expired ». Il était affiché tel quel. Il part au journal, et
  // l'écran dit ce qu'on sait dire.
  if (state.errorRaw) console.error("[v2 auth] échec non traduit :", state.errorRaw);

  const message = state.errorKey
    ? ERROR_MESSAGES[state.errorKey]
    : undefined;

  return (
    <p className="v2-auth-error" role="alert">
      {message ?? messageDErreur("inattendu")}
    </p>
  );
}

function FieldError({
  state,
  name,
}: {
  state: AuthState;
  name: string;
}) {
  const message = state?.fieldErrors?.[name]?.[0];
  if (!message) return null;
  return (
    <span className="v2-auth-field-error">
      {FIELD_MESSAGES[message] ?? message}
    </span>
  );
}

function AuthHeader() {
  return (
    <header className="v2-auth-header">
      <Link aria-label="Sanza" className="v2-brand" href="/v2">
        <SanzaWordmark height={24} />
      </Link>
      <span className="v2-auth-language">Français</span>
    </header>
  );
}

/**
 * Feuilles de dossier fantômes, derrière les pages centrées (écrans 00 à 07).
 *
 * Purement décoratif : hors du flux de tabulation et masqué aux lecteurs
 * d'écran. Le voile radial rouvre le centre pour que le formulaire reste
 * parfaitement lisible.
 */
const GHOST_SHEETS: React.CSSProperties[] = [
  { width: 190, height: 250, left: "9%", top: 110, transform: "rotate(-7deg)", opacity: 0.55 },
  { width: 170, height: 225, left: "16%", top: 170, transform: "rotate(4deg)", opacity: 0.75 },
  { width: 185, height: 240, right: "9%", top: 130, transform: "rotate(6deg)", opacity: 0.55 },
  { width: 165, height: 215, right: "15%", top: 190, transform: "rotate(-4deg)", opacity: 0.75 },
];

const SHEET_LINES: number[][] = [
  [100, 100, 70, 100, 100, 55],
  [100, 100, 64, 100, 78],
  [100, 100, 72, 100],
  [100, 100, 60, 80],
];

export function DocumentsBackdrop() {
  return (
    <div aria-hidden="true" className="v2-bg-docs">
      {GHOST_SHEETS.map((style, index) => (
        <div className="v2-sheet" key={index} style={style}>
          {/* Une seule barre de titre est teintée — la dernière feuille. */}
          <b data-tinted={index === GHOST_SHEETS.length - 1} />
          {SHEET_LINES[index].map((width, line) => (
            <i key={line} style={{ width: `${width}%` }} />
          ))}
        </div>
      ))}
      <div className="v2-veil" />
    </div>
  );
}

/**
 * Rangée sociale et séparateur, partagés par la connexion et l'inscription.
 *
 * Les logos Google et LinkedIn sont la seule exception à la règle « un seul
 * accent » : ce sont des marques officielles, leurs couleurs sont imposées.
 */
export function SocialAuth() {
  return (
    <>
      <div className="v2-social-row">
        <button className="v2-btn-social" type="button">
          <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18">
            <path d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z" fill="#4285F4" />
            <path d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A11.99 11.99 0 0 0 12 24z" fill="#34A853" />
            <path d="M5.29 14.29a7.21 7.21 0 0 1 0-4.58v-3.1H1.29a12 12 0 0 0 0 10.78l4-3.1z" fill="#FBBC05" />
            <path d="M12 4.76c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.23 0 12 0A11.99 11.99 0 0 0 1.29 6.61l4 3.1C6.23 6.87 8.88 4.76 12 4.76z" fill="#EA4335" />
          </svg>
          Continuer avec Google
        </button>
        <button className="v2-btn-social" type="button">
          <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18">
            <rect fill="#0A66C2" height="24" rx="3" width="24" />
            <path d="M6.94 8.5H4.06V19.5h2.88V8.5zM5.5 7.19a1.69 1.69 0 1 0 0-3.38 1.69 1.69 0 0 0 0 3.38zM19.94 13.47c0-3.06-1.63-4.48-3.81-4.48-1.76 0-2.55.97-2.99 1.65V8.5H10.3c.04.86 0 11 0 11h2.84v-6.14c0-.33.02-.66.12-.9.27-.65.86-1.33 1.86-1.33 1.31 0 1.98.97 1.98 2.4v5.97h2.84v-6.03z" fill="#fff" />
          </svg>
          Continuer avec LinkedIn
        </button>
      </div>
      <div className="v2-or">
        <span />
        ou par e-mail
        <span />
      </div>
    </>
  );
}

export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="v2 v2-auth-page">
      <DocumentsBackdrop />
      <AuthHeader />
      <div className="v2-auth-body">{children}</div>
    </main>
  );
}

function PasswordField({
  autoComplete,
  state,
}: {
  autoComplete: "new-password" | "current-password";
  state: AuthState;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="v2-auth-field">
      <span>Mot de passe</span>
      <span className="v2-auth-control">
        <Icon name="lock" />
        <input
          aria-invalid={Boolean(state?.fieldErrors?.password)}
          autoComplete={autoComplete}
          minLength={autoComplete === "new-password" ? 12 : undefined}
          name="password"
          pattern={
            autoComplete === "new-password"
              ? "(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,}"
              : undefined
          }
          required
          title={
            autoComplete === "new-password"
              ? "12 caractères minimum, avec un chiffre et un symbole."
              : undefined
          }
          type={visible ? "text" : "password"}
        />
        <button
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          onClick={() => setVisible((value) => !value)}
          type="button"
        >
          <Icon name="eye" />
        </button>
      </span>
      {autoComplete === "new-password" && (
        <small>12 caractères minimum, avec un chiffre et un symbole.</small>
      )}
      <FieldError name="password" state={state} />
    </label>
  );
}

export function SignupForm({
  email,
  suivant = "/v2/onboarding",
}: {
  email?: string;
  suivant?: string;
}) {
  const [state, action, pending] = useActionState(signup, undefined);
  const [role, setRole] = useState<AccountType>("founder");
  const [jobTitle, setJobTitle] = useState("");

  const roles: { value: AccountType; label: string }[] = [
    { value: "founder", label: "Une entreprise qui se finance" },
    { value: "investor", label: "Un investisseur" },
    { value: "sae", label: "Un programme" },
  ];

  return (
    <>
      <div className="v2-auth-title">
        <h1>Créez votre compte</h1>
        <p>Préparez votre financement dans un espace privé et sécurisé.</p>
      </div>

      <SocialAuth />

      <form action={action} className="v2-auth-form" noValidate>
        <input name="auth_surface" type="hidden" value="v2" />
        <input name="suivant" type="hidden" value={suivant} />
        <input name="account_type" type="hidden" value={role} />

        <fieldset className="v2-auth-roles">
          <legend>Que représentez-vous ?</legend>
          <div>
            {roles.map((item) => (
              <button
                aria-pressed={role === item.value}
                data-selected={role === item.value}
                key={item.value}
                onClick={() => {
                  setRole(item.value);
                  setJobTitle("");
                }}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <AuthError state={state} />

        <label className="v2-auth-field">
          <span>Nom complet</span>
          <span className="v2-auth-control">
            <input
              aria-invalid={Boolean(state?.fieldErrors?.full_name)}
              autoComplete="name"
              name="full_name"
              required
            />
          </span>
          <FieldError name="full_name" state={state} />
        </label>

        <label className="v2-auth-field">
          <span>Poste</span>
          <span className="v2-auth-control">
            <select
              aria-invalid={Boolean(state?.fieldErrors?.job_title)}
              autoComplete="organization-title"
              name="job_title"
              onChange={(event) => setJobTitle(event.target.value)}
              required
              value={jobTitle}
            >
              <option disabled value="">Sélectionnez votre poste</option>
              {JOB_TITLES_BY_ROLE[role].map((title) => (
                <option key={title} value={title}>{title}</option>
              ))}
            </select>
            <Icon name="chevron" />
          </span>
          <FieldError name="job_title" state={state} />
        </label>

        <label className="v2-auth-field">
          <span>E-mail professionnel</span>
          <span className="v2-auth-control">
            <Icon name="mail" />
            <input
              aria-invalid={Boolean(state?.fieldErrors?.email)}
              autoComplete="email"
              defaultValue={email}
              name="email"
              required
              type="email"
            />
          </span>
          <FieldError name="email" state={state} />
        </label>

        <PasswordField autoComplete="new-password" state={state} />

        <label className="v2-auth-field">
          <span>Langue</span>
          <span className="v2-auth-control">
            <select defaultValue="fr" name="locale">
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
            <Icon name="chevron" />
          </span>
        </label>

        <button className="v2-auth-submit" disabled={pending} type="submit">
          {pending ? "Création du compte…" : "Créer mon compte"}
        </button>
      </form>

      <p className="v2-auth-legal">
        En créant un compte, vous acceptez les{" "}
        <span>Conditions</span> et la <span>Politique de confidentialité</span>.
        <br />
        Vos documents restent privés : personne n&apos;y accède sans votre action.
      </p>

      <div className="v2-auth-separator" />
      <p className="v2-auth-switch">
        Vous avez déjà un compte ?{" "}
        <Link href={`/v2/connexion?suivant=${encodeURIComponent(suivant)}`}>
          Se connecter
        </Link>
      </p>
    </>
  );
}

export function LoginForm({
  email,
  erreur,
  suivant = "/v2",
}: {
  email?: string;
  /** Ce qui vient de se passer AILLEURS — un lien d'e-mail qui n'a pas abouti. */
  erreur?: string;
  suivant?: string;
}) {
  const [state, action, pending] = useActionState(login, undefined);

  // Sans cet avis, un lien périmé ramenait à un formulaire de connexion muet :
  // rien n'expliquait pourquoi on se retrouvait là, et la seule sortie — en
  // redemander un — n'était pas proposée.
  const avis = AVIS_DE_LIEN[erreur ?? ""];

  return (
    <>
      <div className="v2-auth-title">
        <h1>Connectez-vous</h1>
        <p>Retrouvez vos opérations, vos documents et vos accès.</p>
      </div>

      {avis && (
        <p className="v2-auth-notice" role="status">
          {avis}
        </p>
      )}

      <SocialAuth />

      <form action={action} className="v2-auth-form">
        <input name="auth_surface" type="hidden" value="v2" />
        <input name="suivant" type="hidden" value={suivant} />
        <AuthError state={state} />

        <label className="v2-auth-field">
          <span>E-mail professionnel</span>
          <span className="v2-auth-control">
            <Icon name="mail" />
            <input
              autoComplete="email"
              defaultValue={email}
              name="email"
              required
              type="email"
            />
          </span>
          <FieldError name="email" state={state} />
        </label>

        <PasswordField autoComplete="current-password" state={state} />

        <div className="v2-auth-row">
          <label className="v2-remember">
            <input defaultChecked name="remember" type="checkbox" />
            <span className="v2-remember-box">
              <Icon name="check" />
            </span>
            Rester connecté
          </label>
          <Link className="v2-auth-forgot" href="/v2/mot-de-passe-oublie">
            Mot de passe oublié ?
          </Link>
        </div>

        <button className="v2-auth-submit" disabled={pending} type="submit">
          {pending ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p className="v2-auth-secure">
        Connexion protégée — la vérification en deux étapes s&apos;applique si
        elle est activée.
      </p>

      <div className="v2-auth-separator" />
      <p className="v2-auth-switch">
        Pas encore de compte ?{" "}
        <Link href={`/v2/inscription?suivant=${encodeURIComponent(suivant)}`}>
          Créer un compte
        </Link>
      </p>
    </>
  );
}

export function TwoFactorForm({ suivant }: { suivant?: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function verify() {
    setError(undefined);
    setBusy(true);
    const supabase = createClient();
    const factors = await supabase.auth.mfa.listFactors();
    const factor = factors.data?.totp?.[0];
    if (factors.error || !factor) {
      setBusy(false);
      setError("Aucun dispositif d’authentification n’est disponible.");
      return;
    }
    const challenge = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challenge.error) {
      setBusy(false);
      // Le SDK répond en anglais — « MFA challenge failed ». Il part au journal.
      console.error("[v2 auth] défi MFA échoué :", challenge.error);
      setError(messageDErreur("mfa.activation_impossible"));
      return;
    }
    const result = await supabase.auth.mfa.verify({
      challengeId: challenge.data.id,
      code: code.trim(),
      factorId: factor.id,
    });
    setBusy(false);
    if (result.error) {
      setError("Ce code est incorrect ou a expiré.");
      return;
    }
    router.push(cheminInterne(suivant, "/v2"));
    router.refresh();
  }

  return (
    <>
      <div className="v2-auth-title">
        <h1>Vérification en deux étapes</h1>
        <p>Saisissez le code à six chiffres de votre application d’authentification.</p>
      </div>
      <div className="v2-auth-form">
        {error && <p className="v2-auth-error">{error}</p>}
        <label className="v2-auth-field">
          <span>Code de sécurité</span>
          <span className="v2-auth-control">
            <Icon name="shield-check" />
            <input
              autoComplete="one-time-code"
              autoFocus
              className="v2-auth-code"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" && code.length === 6) void verify();
              }}
              value={code}
            />
          </span>
        </label>
        <button
          className="v2-auth-submit"
          disabled={busy || code.length !== 6}
          onClick={() => void verify()}
          type="button"
        >
          {busy ? "Vérification…" : "Continuer"}
        </button>
      </div>
    </>
  );
}

export function ForgotPasswordForm({ erreur }: { erreur?: string } = {}) {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    undefined,
  );

  // `/auth/confirm` renvoie ici avec `lien_expire` : sans cet avis, on
  // atterrissait sur un formulaire vierge sans savoir pourquoi.
  const avis = AVIS_DE_LIEN[erreur ?? ""];

  if (state?.sent) {
    return (
      <section className="v2-auth-confirmation">
        <span className="v2-auth-confirmation-icon">
          <Icon name="mail" />
        </span>
        <div className="v2-auth-title">
          <h1>Consultez votre boîte de réception</h1>
          <p>
            Si un compte correspond à cette adresse, vous recevrez un lien pour
            choisir un nouveau mot de passe.
          </p>
        </div>
        <Link className="v2-auth-submit" href="/v2/connexion">
          Revenir à la connexion
        </Link>
      </section>
    );
  }

  return (
    <>
      <div className="v2-auth-title">
        <h1>Réinitialisez votre mot de passe</h1>
        <p>Nous vous enverrons un lien sécurisé par e-mail.</p>
      </div>

      {avis && (
        <p className="v2-auth-notice" role="status">
          {avis}
        </p>
      )}

      <form action={action} className="v2-auth-form">
        <input name="auth_surface" type="hidden" value="v2" />
        <AuthError state={state} />
        <label className="v2-auth-field">
          <span>E-mail professionnel</span>
          <span className="v2-auth-control">
            <Icon name="mail" />
            <input autoComplete="email" name="email" required type="email" />
          </span>
          <FieldError name="email" state={state} />
        </label>
        <button className="v2-auth-submit" disabled={pending} type="submit">
          {pending ? "Envoi du lien…" : "Envoyer le lien"}
        </button>
      </form>
      <p className="v2-auth-switch">
        <Link href="/v2/connexion">Revenir à la connexion</Link>
      </p>
    </>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);
  const [visible, setVisible] = useState(false);

  return (
    <>
      <div className="v2-auth-title">
        <h1>Choisissez un nouveau mot de passe</h1>
        <p>Utilisez un mot de passe unique et difficile à deviner.</p>
      </div>
      <form action={action} className="v2-auth-form">
        <input name="auth_surface" type="hidden" value="v2" />
        <AuthError state={state} />
        {(["password", "confirm"] as const).map((name) => (
          <label className="v2-auth-field" key={name}>
            <span>
              {name === "password"
                ? "Nouveau mot de passe"
                : "Confirmez le mot de passe"}
            </span>
            <span className="v2-auth-control">
              <Icon name="lock" />
              <input
                autoComplete="new-password"
                minLength={12}
                name={name}
                pattern="(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,}"
                required
                title="12 caractères minimum, avec un chiffre et un symbole."
                type={visible ? "text" : "password"}
              />
              <button
                aria-label={
                  visible ? "Masquer les mots de passe" : "Afficher les mots de passe"
                }
                onClick={() => setVisible((value) => !value)}
                type="button"
              >
                <Icon name="eye" />
              </button>
            </span>
            {name === "password" && (
              <small>12 caractères minimum, avec un chiffre et un symbole.</small>
            )}
            <FieldError name={name} state={state} />
          </label>
        ))}
        <button className="v2-auth-submit" disabled={pending} type="submit">
          {pending ? "Enregistrement…" : "Enregistrer le mot de passe"}
        </button>
      </form>
    </>
  );
}
