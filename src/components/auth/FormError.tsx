"use client";

import { useTranslations } from "next-intl";

export function FormError({
  errorKey,
  errorRaw,
}: {
  errorKey?: string;
  errorRaw?: string;
}) {
  const t = useTranslations("auth.errors");
  if (!errorKey && !errorRaw) return null;

  // errorRaw = message fournisseur non traduisible, affiché tel quel.
  const message = errorKey ? t(errorKey) : errorRaw;

  return (
    <p
      role="alert"
      className="text-[11.5px] text-[oklch(0.48_0.16_25)] bg-chip-error-bg rounded-chip px-2.5 py-2"
    >
      {message}
    </p>
  );
}

export function FieldError({ messages }: { messages?: string[] }) {
  const t = useTranslations("validation");
  if (!messages?.length) return null;

  return (
    <p className="text-[11px] text-[oklch(0.48_0.16_25)] mt-0.5">
      {t(messages[0])}
    </p>
  );
}

/** Message local déjà traduit (composants 2FA). */
export function PlainError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="text-[11.5px] text-[oklch(0.48_0.16_25)] bg-chip-error-bg rounded-chip px-2.5 py-2"
    >
      {message}
    </p>
  );
}
