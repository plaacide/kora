import * as z from "zod";

export const signupSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, { error: "Le nom doit faire au moins 2 caractères." }),
  email: z.email({ error: "Entrez une adresse email valide." }).trim(),
  password: z
    .string()
    .min(8, { error: "Au moins 8 caractères." })
    .regex(/[a-zA-Z]/, { error: "Au moins une lettre." })
    .regex(/[0-9]/, { error: "Au moins un chiffre." }),
  locale: z.enum(["fr", "en"]).default("fr"),
});

export const loginSchema = z.object({
  email: z.email({ error: "Entrez une adresse email valide." }).trim(),
  password: z.string().min(1, { error: "Mot de passe requis." }),
});

export const orgSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Nom de l'organisation requis (2 caractères min)." }),
  currency: z.enum(["XOF", "XAF", "NGN", "KES", "GHS", "USD", "EUR"]).default(
    "XOF",
  ),
});

export type AuthState =
  | {
      error?: string;
      fieldErrors?: Record<string, string[]>;
    }
  | undefined;
