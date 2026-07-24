"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { signup } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError, FieldError } from "./FormError";
import { cn } from "@/lib/cn";

/**
 * Icônes de rôle en TRAIT (handoff v2 §2 : zéro emoji). 19 px, stroke 2,
 * `currentColor` — donc grises par défaut, orange quand la carte est active.
 */
function RoleIcon({ name }: { name: "investor" | "founder" | "sae" }) {
  const common = {
    width: 19,
    height: 19,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (name === "investor") {
    // Histogramme : l'investisseur évalue des chiffres.
    return (
      <svg {...common}>
        <path d="M5 20V10" /><path d="M12 20V4" /><path d="M19 20v-6" />
      </svg>
    );
  }
  if (name === "founder") {
    // Pousse qui lève : la startup qui décolle, sans la fusée d'emoji.
    return (
      <svg {...common}>
        <path d="M12 21V9" /><path d="M12 9a5 5 0 0 1 5-5h2v2a5 5 0 0 1-5 5h-2z" />
        <path d="M12 13H10a5 5 0 0 1-5-5V6h2a5 5 0 0 1 5 5z" />
      </svg>
    );
  }
  // Cible : le programme accompagne un portefeuille.
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" />
    </svg>
  );
}

const ROLES = [
  { key: "investor", title: "Investisseur", desc: "Je cherche des opportunités d'investissement" },
  { key: "founder", title: "Fondateur", desc: "Je lève des fonds pour ma startup" },
  { key: "sae", title: "Programme", desc: "J'accompagne plusieurs startups" },
] as const;

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);
  const t = useTranslations("auth.signup");
  const locale = useLocale();
  const [role, setRole] = useState<"investor" | "founder" | "sae">("investor");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">
          {t("title")}
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-secondary">
          {t("haveAccount")}{" "}
          <Link href="/connexion" className="font-medium">
            {t("loginLink")}
          </Link>
        </p>
      </div>

      {/* Sélecteur de persona : aiguille l'onboarding. */}
      <div className="flex flex-col gap-2">
        <span className="text-[12px] font-[550] text-ink-secondary">
          Vous êtes…
        </span>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRole(r.key)}
              aria-pressed={role === r.key}
              className={cn(
                "flex flex-col items-start gap-1.5 rounded-[10px] p-2.5 text-left transition-colors cursor-pointer",
                // Carte active : bordure 1.5px orange + fond #FDF1EA (handoff §3).
                role === r.key
                  ? "border-[1.5px] border-[#E85C2B] bg-[#FDF1EA]"
                  : "border-[1.5px] border-[#E2DED4] hover:border-[#C9C6BD]",
              )}
            >
              <span className={role === r.key ? "text-[#E85C2B]" : "text-[#8B8FA3]"}>
                <RoleIcon name={r.key} />
              </span>
              <span className="text-[12.5px] font-[650]">{r.title}</span>
              <span className="text-[10.5px] text-ink-muted leading-tight">
                {r.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="account_type" value={role} />
        <FormError errorKey={state?.errorKey} errorRaw={state?.errorRaw} />

        <div>
          <Input label={t("fullName")} name="full_name" autoComplete="name" />
          <FieldError messages={state?.fieldErrors?.full_name} />
        </div>

        <div>
          <Input
            label={t("jobTitle")}
            name="job_title"
            autoComplete="organization-title"
            placeholder={t("jobTitlePlaceholder")}
          />
          <FieldError messages={state?.fieldErrors?.job_title} />
        </div>

        <div>
          <Input
            label={t("email")}
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
          />
          <FieldError messages={state?.fieldErrors?.email} />
        </div>

        <div>
          <Input
            label={t("password")}
            name="password"
            type="password"
            autoComplete="new-password"
            hint={t("passwordHint")}
          />
          <FieldError messages={state?.fieldErrors?.password} />
        </div>

        {/* La langue n'est plus un champ du formulaire (handoff v2 §2) : elle se
            choisit en pied de page. On transmet celle en cours pour que le
            compte, et donc les e-mails, soient dans la bonne langue. */}
        <input type="hidden" name="locale" value={locale} />

        <Button type="submit" variant="primary" loading={pending}>
          {pending ? t("submitting") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
