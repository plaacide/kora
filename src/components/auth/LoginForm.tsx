"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { login } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { FormError, FieldError } from "./FormError";
import { SsoButtons } from "./SsoButtons";
import { cheminInterne } from "@/lib/redirect";

/**
 * `suivant` : où reprendre après la connexion.
 *
 * Il traverse TROIS chemins qui ne se parlent pas — le formulaire e-mail, le
 * SSO, et le basculement vers l'inscription. En oublier un suffit à perdre la
 * destination, et l'utilisateur retombe sur le tableau de bord sans comprendre
 * pourquoi son invitation s'est évaporée. C'est exactement ce qui se produisait.
 */
export function LoginForm({
  notice,
  suivant,
}: { notice?: string; suivant?: string } = {}) {
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
        <h1 className="font-display text-[32px] font-[700] tracking-[-0.025em] leading-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-[13px] text-[#4A4E63]">
          {t("noAccount")}{" "}
          {/* Bascule vers l'inscription : la destination doit suivre, sinon
              l'invité qui n'a pas de compte la perd en changeant d'écran. */}
          <Link
            href={
              suivant
                ? `/inscription?suivant=${encodeURIComponent(suivant)}`
                : "/inscription"
            }
            className="font-medium"
          >
            {t("signupLink")}
          </Link>
        </p>
      </div>

      {/* SSO d'abord, puis « OU PAR EMAIL » (handoff v2 §3). */}
      <SsoButtons next={cheminInterne(suivant, "/dashboard")} />

      <form action={action} className="flex flex-col gap-4">
        {/* L'action serveur ne voit pas l'URL : la destination doit voyager
            dans le formulaire. Validée côté serveur, jamais telle quelle. */}
        <input type="hidden" name="suivant" value={suivant ?? ""} />
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
          <PasswordInput
            label={t("password")}
            name="password"
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
