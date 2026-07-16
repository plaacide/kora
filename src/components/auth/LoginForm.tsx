"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError, FieldError } from "./FormError";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          Se connecter
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-secondary">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-medium">
            Créer un compte
          </Link>
        </p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <FormError message={state?.error} />

        <div>
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="prenom@fonds.com"
          />
          <FieldError messages={state?.fieldErrors?.email} />
        </div>

        <div>
          <Input
            label="Mot de passe"
            name="password"
            type="password"
            autoComplete="current-password"
          />
          <FieldError messages={state?.fieldErrors?.password} />
        </div>

        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
    </div>
  );
}
