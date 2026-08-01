import * as z from "zod";

// Les messages sont des CLÉS de traduction (namespace `validation`),
// résolues côté client — les Server Actions ne connaissent pas la locale de rendu.
export const signupSchema = z.object({
  full_name: z.string().trim().min(2, { error: "nameMin" }),
  // La liste dépend du type de compte côté interface. Le serveur exige
  // néanmoins une valeur : un POST direct ne doit pas contourner le champ.
  job_title: z
    .string({ error: "jobTitleRequired" })
    .trim()
    .min(1, { error: "jobTitleRequired" })
    .max(60),
  email: z.email({ error: "emailInvalid" }).trim(),
  password: z
    .string()
    .min(8, { error: "passwordMin" })
    .regex(/[a-zA-Z]/, { error: "passwordLetter" })
    .regex(/[0-9]/, { error: "passwordDigit" }),
  locale: z.enum(["fr", "en"]).default("fr"),
  account_type: z.enum(["investor", "founder", "sae"]).default("founder"),
});

export const loginSchema = z.object({
  email: z.email({ error: "emailInvalid" }).trim(),
  password: z.string().min(1, { error: "passwordRequired" }),
});

export const resetRequestSchema = z.object({
  email: z.email({ error: "emailInvalid" }).trim(),
});

// Mêmes exigences qu'à l'inscription : un mot de passe réinitialisé ne doit
// pas être plus faible que celui qu'il remplace.
export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { error: "passwordMin" })
      .regex(/[a-zA-Z]/, { error: "passwordLetter" })
      .regex(/[0-9]/, { error: "passwordDigit" }),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    error: "passwordMismatch",
    path: ["confirm"],
  });

export const orgSchema = z.object({
  name: z.string().trim().min(2, { error: "orgNameRequired" }),
  currency: z
    .enum(["XOF", "XAF", "NGN", "KES", "GHS", "USD", "EUR"])
    .default("XOF"),
});

export type AuthState =
  | {
      /** Clé du namespace `auth.errors` */
      errorKey?: string;
      /** Message brut non traduisible (renvoyé tel quel par le fournisseur) */
      errorRaw?: string;
      /** Clés du namespace `validation`, par champ */
      fieldErrors?: Record<string, string[]>;
      /** Demande de réinitialisation acceptée (succès volontairement muet). */
      sent?: boolean;
      /**
       * Ce qui avait été saisi, pour le réafficher après un échec.
       *
       * React 19 RÉINITIALISE les champs non contrôlés dès qu'une action de
       * formulaire se termine. Un mot de passe refusé, une adresse déjà prise,
       * et le nom, l'adresse et la langue étaient à retaper — sur l'écran
       * d'inscription, c'est là qu'on abandonne.
       *
       * LE MOT DE PASSE N'Y FIGURE JAMAIS. Le faire voyager jusqu'au serveur
       * puis revenir dans un état de rendu le ferait exister dans le HTML
       * envoyé au navigateur, et dans le cache de qui l'intercepte.
       */
      values?: Record<string, string>;
    }
  | undefined;
