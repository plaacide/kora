"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError, FieldError } from "./FormError";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          Créer un compte
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-secondary">
          Déjà inscrit ?{" "}
          <Link href="/connexion" className="font-medium">
            Se connecter
          </Link>
        </p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <FormError message={state?.error} />

        <div>
          <Input label="Nom complet" name="full_name" autoComplete="name" />
          <FieldError messages={state?.fieldErrors?.full_name} />
        </div>

        <div>
          <Input
            label="Email professionnel"
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
            autoComplete="new-password"
            hint="8 caractères min, avec une lettre et un chiffre."
          />
          <FieldError messages={state?.fieldErrors?.password} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="locale"
            className="text-[11.5px] font-medium text-ink-secondary"
          >
            Langue
          </label>
          <select
            id="locale"
            name="locale"
            defaultValue="fr"
            className="h-8 px-2.5 text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>

        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Création…" : "Créer mon compte"}
        </Button>
      </form>
    </div>
  );
}
