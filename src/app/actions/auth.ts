"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { cheminInterne } from "@/lib/redirect";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { LOCALE_COOKIE, isLocale } from "@/i18n/locales";
import { originFromHeaders } from "@/lib/app-origin";
import {
  signupSchema,
  loginSchema,
  orgSchema,
  resetRequestSchema,
  newPasswordSchema,
  type AuthState,
} from "@/lib/validation/auth";

/** Origine publique, pour composer le lien de retour envoyé par e-mail. */
async function appOrigin(): Promise<string> {
  return originFromHeaders(await headers());
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const isV2 = formData.get("auth_surface") === "v2";
  const parsed = signupSchema.safeParse({
    full_name: formData.get("full_name"),
    job_title: formData.get("job_title"),
    email: formData.get("email"),
    password: formData.get("password"),
    locale: formData.get("locale") ?? "fr",
    account_type: formData.get("account_type") ?? "founder",
  });

  // Ce qu'on rendra à l'écran si l'inscription échoue — sans le mot de passe,
  // qui ne doit pas revenir dans le HTML.
  const saisie = (): Record<string, string> => ({
    full_name: String(formData.get("full_name") ?? ""),
    job_title: String(formData.get("job_title") ?? ""),
    email: String(formData.get("email") ?? ""),
    locale: String(formData.get("locale") ?? "fr"),
    account_type: String(formData.get("account_type") ?? "founder"),
  });

  if (!parsed.success) {
    return { fieldErrors: flattenIssues(parsed.error), values: saisie() };
  }

  // 15 créations de compte / heure / IP. Assez large pour une phase de test
  // intensif depuis une même IP ; l'inondation d'e-mails reste bornée par le
  // plafond horaire de Supabase (côté serveur, qui fait foi).
  const ip = await clientIp();
  if (!rateLimit(`signup:${ip}`, 15, 60 * 60 * 1000).ok) {
    return { errorKey: "tooManyAttempts", values: saisie() };
  }

  const { full_name, job_title, email, password, locale, account_type } = parsed.data;

  // Où reprendre après l'inscription. Lu brut, validé par `cheminInterne` —
  // il n'entre pas dans `signupSchema` : ce n'est pas une donnée de compte.
  const dest = cheminInterne(
    formData.get("suivant") as string | null,
    "/onboarding",
  );

  // Flux implicite : le lien de confirmation doit s'ouvrir depuis n'importe
  // quel appareil, pas seulement celui qui s'est inscrit. NE PAS repasser en
  // PKCE — le jeton arriverait préfixé `pkce_` et `verifyOtp` le rejetterait
  // (cf. AGENTS.md, récidive du 2026-07-24).
  const supabase = await createClient({ flowType: "implicit" });

  // `originFromHeaders` et non `request.url` : derrière le proxy, l'origine
  // vaut http://0.0.0.0:8080 et le lien de confirmation part dans le vide.
  const origin = originFromHeaders(await headers());

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Ces attributs sont consommés par `handle_new_user` dans la même
      // transaction que la création Auth. L'inscription ne doit pas dépendre
      // du client service-role : une clé d'administration absente ne doit
      // jamais transformer un compte créé en erreur 500 côté interface.
      data: { full_name, locale, account_type, job_title: job_title ?? null },
      // C'EST ICI QUE LA DESTINATION SURVIT À LA BOÎTE MAIL. Sans ce
      // paramètre, l'invité sans compte confirmait son adresse puis
      // atterrissait sur l'onboarding, son invitation perdue en route — le
      // seul cas où le tunnel casse en silence après avoir semblé marcher.
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(dest)}`,
    },
  });

  // C'EST ICI QUE ÇA COMPTE LE PLUS : « cette adresse est déjà prise », et
  // tout le formulaire était à retaper.
  if (error) return { ...mapError(error.message), values: saisie() };

  // La langue choisie à l'inscription pilote l'UI immédiatement.
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  // Confirmation d'e-mail désactivée : la session existe déjà, on va droit à
  // la destination. Sinon elle doit voyager dans le lien de confirmation —
  // c'est `emailRedirectTo`, posé plus haut, qui s'en charge.
  if (data.session) redirect(dest);
  redirect(
    isV2
      ? `/v2/verifier-email?email=${encodeURIComponent(email)}`
      : "/verifier-email",
  );
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const isV2 = formData.get("auth_surface") === "v2";
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: flattenIssues(parsed.error),
      values: { email: String(formData.get("email") ?? "") },
    };
  }

  // 10 tentatives / 10 min / IP — anti brute-force naïf (cf. rate-limit.ts).
  // Sur un mot de passe refusé, seule la ligne fautive doit se retaper.
  const adresse = { email: String(formData.get("email") ?? "") };

  const ip = await clientIp();
  if (!rateLimit(`login:${ip}`, 10, 10 * 60 * 1000).ok) {
    return { errorKey: "tooManyAttempts", values: adresse };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { ...mapError(error.message), values: adresse };

  // Aligne l'UI sur la langue enregistrée dans le profil.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("locale")
      .eq("id", user.id)
      .maybeSingle();
    if (isLocale(profile?.locale)) {
      const store = await cookies();
      store.set(LOCALE_COOKIE, profile.locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
  }

  // Où reprendre. Lu BRUT du formulaire — `loginSchema` ne le valide pas, et
  // ne doit pas : ce n'est pas une donnée de compte mais une destination, et
  // `cheminInterne` est sa seule validation légitime.
  const dest = cheminInterne(
    formData.get("suivant") as string | null,
    "/dashboard",
  );

  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
    // La 2FA s'intercale : la destination doit lui survivre, sinon tout compte
    // protégé perd son invitation au moment précis où il prouve son identité.
    const challengePath = isV2 ? "/v2/connexion/2fa" : "/connexion/2fa";
    redirect(`${challengePath}?suivant=${encodeURIComponent(dest)}`);
  }

  redirect(dest);
}

/**
 * Demande un lien de réinitialisation.
 *
 * Renvoie TOUJOURS le même succès, que l'adresse existe ou non. Répondre
 * « compte inconnu » transformerait ce formulaire en énumérateur de clients :
 * il suffirait d'essayer des adresses pour savoir quels fonds et quelles
 * startups sont sur Sanza. C'est exactement le genre d'information qu'un
 * concurrent paierait.
 */
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const isV2 = formData.get("auth_surface") === "v2";
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: flattenIssues(parsed.error) };

  // 5 demandes / 15 min / IP : l'envoi d'e-mails est coûteux et un formulaire
  // ouvert sans compte est une cible de choix pour inonder des boîtes tierces.
  const ip = await clientIp();
  if (!rateLimit(`reset:${ip}`, 5, 15 * 60 * 1000).ok) {
    return { errorKey: "tooManyAttempts" };
  }

  // Idem : un lien de réinitialisation s'ouvre souvent depuis le téléphone,
  // alors que la demande a été faite depuis l'ordinateur. PKCE l'interdirait.
  const supabase = await createClient({ flowType: "implicit" });
  const origin = await appOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${origin}/auth/confirm?next=${
        isV2 ? "/v2/reinitialiser" : "/reinitialiser"
      }`,
    },
  );

  // Une erreur de quota doit remonter : sans ça, l'utilisateur attendrait un
  // e-mail qui ne partira jamais.
  if (error && /rate limit|too many/i.test(error.message)) {
    return { errorKey: "rateLimited" };
  }
  if (error) console.error("[auth] envoi du lien de réinitialisation", error);

  return { sent: true };
}

/**
 * Pose le nouveau mot de passe. Suppose une session de récupération ouverte
 * par /auth/confirm — sans elle, Supabase refuse la mise à jour.
 */
export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const isV2 = formData.get("auth_surface") === "v2";
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { fieldErrors: flattenIssues(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { errorKey: "resetLinkExpired" };

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return mapError(error.message);

  redirect(isV2 ? "/v2" : "/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}

export async function createOrganization(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = orgSchema.safeParse({
    name: formData.get("name"),
    currency: formData.get("currency") ?? "XOF",
  });

  if (!parsed.success) return { fieldErrors: flattenIssues(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { error } = await supabase.rpc("create_organization", {
    p_name: parsed.data.name,
    p_currency: parsed.data.currency,
  });

  if (error) return mapError(error.message);

  redirect("/dashboard");
}

/** Change la langue de l'UI et la persiste sur le profil si connecté. */
export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").update({ locale }).eq("id", user.id);
  }
}

// --- helpers ---------------------------------------------------------------

function flattenIssues(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function mapError(message: string): AuthState {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return { errorKey: "invalidCredentials" };
  if (m.includes("already registered") || m.includes("already been registered"))
    return { errorKey: "alreadyRegistered" };
  if (m.includes("email not confirmed"))
    return { errorKey: "emailNotConfirmed" };
  if (m.includes("non authentifié")) return { errorKey: "notAuthenticated" };
  // Supabase refuse un mot de passe identique au précédent. Sans cette
  // correspondance, le message remonterait en anglais, brut, à un utilisateur
  // francophone — constaté en testant la réinitialisation.
  if (m.includes("should be different"))
    return { errorKey: "passwordSameAsOld" };
  if (m.includes("weak password") || m.includes("password should be at least"))
    return { errorKey: "passwordTooWeak" };
  // Limites appliquées par Supabase Auth (la protection qui fait foi).
  if (m.includes("rate limit") || m.includes("too many"))
    return { errorKey: "rateLimited" };
  return { errorRaw: message };
}
