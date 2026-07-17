"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { signup } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError, FieldError } from "./FormError";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);
  const t = useTranslations("auth.signup");
  const tc = useTranslations("common");
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          {t("title")}
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-secondary">
          {t("haveAccount")}{" "}
          <Link href="/connexion" className="font-medium">
            {t("loginLink")}
          </Link>
        </p>
      </div>

      <form action={action} className="flex flex-col gap-4">
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
