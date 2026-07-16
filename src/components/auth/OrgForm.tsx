"use client";

import { useActionState } from "react";
import { createOrganization } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError, FieldError } from "./FormError";

const currencies = ["XOF", "XAF", "NGN", "KES", "GHS", "USD", "EUR"];

export function OrgForm() {
  const [state, action, pending] = useActionState(createOrganization, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError message={state?.error} />

      <div>
        <Input
          label="Nom de l'organisation"
          name="name"
          placeholder="Amani Capital"
          autoFocus
        />
        <FieldError messages={state?.fieldErrors?.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="currency"
          className="text-[11.5px] font-medium text-ink-secondary"
        >
          Devise principale
        </label>
        <select
          id="currency"
          name="currency"
          defaultValue="XOF"
          className="h-8 px-2.5 text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none"
        >
          {currencies.map((c) => (
            <option key={c} value={c}>
              {c === "XOF" ? "XOF — Franc CFA (UEMOA)" : c}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Création…" : "Créer l'organisation"}
      </Button>
    </form>
  );
}
