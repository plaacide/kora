"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { signup } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError, FieldError } from "./FormError";
import { cn } from "@/lib/cn";

const ROLES = [
  { key: "investor", emoji: "📊", title: "Investisseur", desc: "Je cherche des opportunités d'investissement" },
  { key: "founder", emoji: "🚀", title: "Fondateur", desc: "Je lève des fonds pour ma startup" },
  { key: "sae", emoji: "🎯", title: "Programme", desc: "J'accompagne plusieurs startups" },
] as const;

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);
  const t = useTranslations("auth.signup");
  const tc = useTranslations("common");
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
                "flex flex-col items-start gap-1 rounded-[10px] border-2 p-2.5 text-left transition-colors cursor-pointer",
                role === r.key
                  ? "border-primary bg-[rgba(232,92,43,0.06)]"
                  : "border-line hover:border-line-strong",
              )}
            >
              <span className="text-[18px]">{r.emoji}</span>
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

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="locale"
            className="text-[11.5px] font-medium text-ink-secondary"
          >
            {tc("language")}
          </label>
          <select
            id="locale"
            name="locale"
            defaultValue={locale}
            className="h-8 px-2.5 text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none"
          >
            <option value="fr">{tc("french")}</option>
            <option value="en">{tc("english")}</option>
          </select>
        </div>

        <Button type="submit" variant="primary" loading={pending}>
          {pending ? t("submitting") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
