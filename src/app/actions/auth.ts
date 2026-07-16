"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  if (!parsed.success) {
    return { fieldErrors: z_flatten(parsed.error) };
  }

  const { full_name, email, password, locale } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, locale } },
  });

  if (error) return { error: traduireErreur(error.message) };

  // Confirmation email désactivée → session immédiate → onboarding.
  // Confirmation activée → pas de session → page de vérification.
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

  if (!parsed.success) {
    return { fieldErrors: z_flatten(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { error: traduireErreur(error.message) };

  // Si un facteur 2FA est vérifié, la session est en aal1 et doit passer aal2.
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

  if (!parsed.success) {
    return { fieldErrors: z_flatten(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { error } = await supabase.rpc("create_organization", {
    p_name: parsed.data.name,
    p_currency: parsed.data.currency,
  });

  if (error) return { error: traduireErreur(error.message) };

  redirect("/dashboard");
}

// --- helpers ---------------------------------------------------------------

function z_flatten(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function traduireErreur(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Email ou mot de passe incorrect.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Un compte existe déjà avec cet email.";
  if (m.includes("email not confirmed"))
    return "Email non confirmé. Vérifiez votre boîte mail.";
  return message;
}
