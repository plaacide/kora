"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createOrganization } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError, FieldError } from "./FormError";

const currencies = ["XOF", "XAF", "NGN", "KES", "GHS", "USD", "EUR"];

export function OrgForm() {
  const [state, action, pending] = useActionState(createOrganization, undefined);
  const t = useTranslations("onboarding");

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError errorKey={state?.errorKey} errorRaw={state?.errorRaw} />

      <div>
        <Input
          label={t("orgName")}
          name="name"
          placeholder={t("orgNamePlaceholder")}
          autoFocus
        />
        <FieldError messages={state?.fieldErrors?.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="currency"
          className="text-[11.5px] font-medium text-ink-secondary"
        >
          {t("currency")}
        </label>
        <select
          id="currency"
          name="currency"
          defaultValue="XOF"
          className="h-8 px-2.5 text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none"
        >
          {currencies.map((c) => (
            <option key={c} value={c}>
              {c === "XOF" ? t("currencyXof") : c}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
