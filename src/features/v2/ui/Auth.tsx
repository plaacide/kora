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
import { Icon } from "./Icon";

const ERROR_MESSAGES: Record<string, string> = {
  invalidCredentials: "Adresse e-mail ou mot de passe incorrect.",
  alreadyRegistered: "Un compte existe déjà avec cette adresse.",
  emailNotConfirmed: "Confirmez votre adresse e-mail avant de vous connecter.",
  tooManyAttempts: "Trop de tentatives. Réessayez dans quelques minutes.",
  rateLimited: "Trop de demandes. Réessayez dans quelques minutes.",
  passwordTooWeak: "Choisissez un mot de passe plus robuste.",
  resetLinkExpired:
    "Ce lien n’est plus valide. Demandez un nouveau lien de réinitialisation.",
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
  return (
    <p className="v2-auth-error" role="alert">
      {state.errorKey
        ? (ERROR_MESSAGES[state.errorKey] ?? "Une erreur est survenue.")
        : state.errorRaw}
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
      <Link className="v2-brand" href="/v2">
        <span>S</span>
        Sanza
      </Link>
      <span className="v2-auth-language">Français</span>
    </header>
  );
}

export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="v2 v2-auth-page">
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
  suivant = "/v2",
}: {
  email?: string;
  suivant?: string;
}) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <>
      <div className="v2-auth-title">
        <h1>Bon retour</h1>
        <p>Retrouvez vos opérations, vos documents et vos investisseurs.</p>
      </div>

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

        <Link className="v2-auth-forgot" href="/v2/mot-de-passe-oublie">
          Mot de passe oublié ?
        </Link>

        <button className="v2-auth-submit" disabled={pending} type="submit">
          {pending ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <div className="v2-auth-separator" />
      <p className="v2-auth-switch">
        Vous n&apos;avez pas encore de compte ?{" "}
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
      setError(challenge.error.message);
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

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    undefined,
  );

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
