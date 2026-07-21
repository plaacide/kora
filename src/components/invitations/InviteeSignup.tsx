"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createInvitedAccount } from "@/app/actions/invitations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PlainError } from "@/components/auth/FormError";

/**
 * Création d'accès pour un invité sans compte, directement sur la page
 * d'invitation. Le premier contact d'un investisseur avec Sanza : il doit
 * pouvoir entrer en une étape, pas en trois.
 */
export function InviteeSignup({
  token,
  email,
  labels,
}: {
  token: string;
  email: string;
  /** Libellés déjà traduits, passés par le composant serveur. */
  labels: {
    title: string;
    body: string;
    fullName: string;
    password: string;
    passwordHint: string;
    submit: string;
    haveAccount: string;
    login: string;
    exists: string;
    weak: string;
    generic: string;
  };
}) {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [pwd, setPwd] = useState("");
  const [erreur, setErreur] = useState<string | undefined>();
  const [dejaInscrit, setDejaInscrit] = useState(false);
  const [encours, demarrer] = useTransition();

  function valider() {
    if (nom.trim().length < 2 || pwd.length < 8) return;
    setErreur(undefined);
    setDejaInscrit(false);
    demarrer(async () => {
      const res = await createInvitedAccount({
        token,
        fullName: nom.trim(),
        password: pwd,
      });
      if (res.ok) {
        // Le compte existe et la session est posée : on recharge, la page
        // trouve un utilisateur authentifié et affiche la porte NDA.
        router.refresh();
        return;
      }
      if (res.exists) {
        setDejaInscrit(true);
        return;
      }
      setErreur(res.error === "weak_password" ? labels.weak : labels.generic);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">
          {labels.title}
        </h1>
        <p className="mt-1.5 text-[12.5px] text-ink-secondary leading-relaxed">
          {labels.body}
        </p>
      </div>

      {/* L'e-mail est fixé par l'invitation : affiché, non modifiable. */}
      <Input label="Email" value={email} readOnly disabled />

      <div>
        <Input
          label={labels.fullName}
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          autoComplete="name"
          autoFocus
        />
      </div>

      <div>
        <Input
          label={labels.password}
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && valider()}
          autoComplete="new-password"
          hint={labels.passwordHint}
        />
      </div>

      {erreur && <PlainError message={erreur} />}
      {dejaInscrit && (
        <p className="text-[12px] text-ink-secondary leading-relaxed">
          {labels.exists}{" "}
          <Link
            href={`/connexion?next=/invitation/${token}`}
            className="text-link hover:text-link-hover font-medium"
          >
            {labels.login}
          </Link>
        </p>
      )}

      <Button
        variant="primary"
        onClick={valider}
        disabled={encours || nom.trim().length < 2 || pwd.length < 8}
      >
        {encours ? "…" : labels.submit}
      </Button>

      <p className="text-[11.5px] text-ink-muted">
        {labels.haveAccount}{" "}
        <Link
          href={`/connexion?next=/invitation/${token}`}
          className="text-link hover:text-link-hover"
        >
          {labels.login}
        </Link>
      </p>
    </div>
  );
}
