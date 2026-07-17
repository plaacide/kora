"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { LOCALE_COOKIE, isLocale } from "@/i18n/locales";
import {
  signupSchema,
  loginSchema,
  orgSchema,
  type AuthState,
} from "@/lib/validation/auth";

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    locale: formData.get("locale") ?? "fr",
  });

  if (!parsed.success) return { fieldErrors: flattenIssues(parsed.error) };

  // 5 créations de compte / heure / IP.
  const ip = await clientIp();
  if (!rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000).ok) {
    return { errorKey: "tooManyAttempts" };
  }

  const { full_name, email, password, locale } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, locale } },
  });

  if (error) return mapError(error.message);

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
  // Limites appliquées par Supabase Auth (la protection qui fait foi).
  if (m.includes("rate limit") || m.includes("too many"))
    return { errorKey: "rateLimited" };
  return { errorRaw: message };
}
