"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { login } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError, FieldError } from "./FormError";

export function LoginForm({ notice }: { notice?: string } = {}) {
  const [state, action, pending] = useActionState(login, undefined);
  const t = useTranslations("auth.login");

  // Message porté par l'URL après un aller-retour par e-mail. Sans lui, un
  // lien périmé ou ouvert depuis un autre appareil ramenait à un formulaire
  // de connexion muet, sans dire ce qui venait de se passer.
  const noticeText =
    notice === "lien_invalide"
      ? t("notices.invalidLink")
      : notice === "session_absente"
        ? t("notices.confirmedSignIn")
        : null;

  return (
    <div className="flex flex-col gap-6">
      {noticeText && (
        <p className="text-[12px] text-chip-amber-fg bg-chip-amber-bg rounded-[8px] px-3 py-2">
          {noticeText}
        </p>
      )}
      <div>
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          {t("title")}
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-secondary">
          {t("noAccount")}{" "}
          <Link href="/inscription" className="font-medium">
            {t("signupLink")}
          </Link>
        </p>
      </div>

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

        <div>
          <Input
            label={t("password")}
            name="password"
            type="password"
            autoComplete="current-password"
          />
          <FieldError messages={state?.fieldErrors?.password} />
          <div className="mt-1.5 text-right">
            <Link
              href="/mot-de-passe-oublie"
              className="text-[11.5px] font-medium text-link hover:text-link-hover"
            >
              {t("forgot")}
            </Link>
          </div>
        </div>

        <Button type="submit" variant="primary" loading={pending}>
          {pending ? t("submitting") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
