"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { LOCALE_COOKIE, isLocale } from "@/i18n/locales";
import { headers } from "next/headers";
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
  const parsed = signupSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    locale: formData.get("locale") ?? "fr",
    account_type: formData.get("account_type") ?? "founder",
  });

  if (!parsed.success) return { fieldErrors: flattenIssues(parsed.error) };

  // 5 créations de compte / heure / IP.
  const ip = await clientIp();
  if (!rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000).ok) {
    return { errorKey: "tooManyAttempts" };
  }

  const { full_name, email, password, locale, account_type } = parsed.data;
  // Flux implicite : le lien de confirmation doit s'ouvrir depuis n'importe
  // quel appareil, pas seulement celui qui s'est inscrit.
  const supabase = await createClient({ flowType: "implicit" });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, locale, account_type } },
  });

  if (error) return mapError(error.message);

  // Le type de compte (investisseur/fondateur) pilote l'onboarding. On le pose
  // sur le profil via la clé privilégiée : le trigger a déjà créé le profil,
  // et l'utilisateur n'a pas forcément de session (email à confirmer).
  if (data.user) {
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({ account_type })
      .eq("id", data.user.id);
  }

  // La langue choisie à l'inscription pilote l'UI immédiatement.
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  if (data.session) redirect("/onboarding");
  redirect("/verifier-email");
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { fieldErrors: flattenIssues(parsed.error) };

  // 10 tentatives / 10 min / IP — anti brute-force naïf (cf. rate-limit.ts).
  const ip = await clientIp();
  if (!rateLimit(`login:${ip}`, 10, 10 * 60 * 1000).ok) {
    return { errorKey: "tooManyAttempts" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return mapError(error.message);

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

  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
    redirect("/connexion/2fa");
  }

  redirect("/dashboard");
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
    { redirectTo: `${origin}/auth/confirm?next=/reinitialiser` },
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

  redirect("/dashboard");
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
