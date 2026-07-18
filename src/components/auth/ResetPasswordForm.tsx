"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { updatePassword } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError, FieldError } from "./FormError";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);
  const t = useTranslations("auth.reset");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          {t("title")}
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-secondary">{t("subtitle")}</p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <FormError errorKey={state?.errorKey} errorRaw={state?.errorRaw} />

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

        <div>
          <Input
            label={t("confirm")}
            name="confirm"
            type="password"
            autoComplete="new-password"
          />
          <FieldError messages={state?.fieldErrors?.confirm} />
        </div>

        <Button type="submit" variant="primary" loading={pending}>
          {pending ? t("submitting") : t("submit")}
        </Button>
      </form>

      <Link
        href="/connexion"
        className="text-[12.5px] font-medium text-link hover:text-link-hover"
      >
        ← {t("backToLogin")}
      </Link>
    </div>
  );
}
