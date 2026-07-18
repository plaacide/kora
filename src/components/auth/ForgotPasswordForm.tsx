"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { requestPasswordReset } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError, FieldError } from "./FormError";

export function ForgotPasswordForm({ expired }: { expired?: boolean }) {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    undefined,
  );
  const t = useTranslations("auth.forgot");

  // Confirmation volontairement identique que l'adresse existe ou non : dire
  // « compte inconnu » permettrait d'énumérer les clients de Sanza.
  if (state?.sent) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          {t("sentTitle")}
        </h1>
        <p className="text-[12.5px] text-ink-secondary leading-relaxed">
          {t("sentBody")}
        </p>
        <p className="text-[11.5px] text-ink-muted leading-relaxed">
          {t("sentHint")}
        </p>
        <Link
          href="/connexion"
          className="text-[12.5px] font-medium text-link hover:text-link-hover"
        >
          ← {t("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          {t("title")}
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-secondary">{t("subtitle")}</p>
      </div>

      {expired && (
        <p className="text-[12px] text-chip-amber-fg bg-chip-amber-bg rounded-[8px] px-3 py-2">
          {t("linkExpired")}
        </p>
      )}

      <form action={action} className="flex flex-col gap-4">
        <FormError errorKey={state?.errorKey} errorRaw={state?.errorRaw} />

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
