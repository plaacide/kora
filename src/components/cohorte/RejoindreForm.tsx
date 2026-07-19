"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptCohortLink } from "@/app/actions/cohorte";
import { PlainError } from "@/components/auth/FormError";

export function RejoindreForm({
  token,
  programme,
}: {
  token: string;
  programme: string;
}) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | undefined>();
  const [encours, demarrer] = useTransition();

  function accepter() {
    setErreur(undefined);
    demarrer(async () => {
      const res = await acceptCohortLink(token);
      if (!res.ok) {
        setErreur(res.error);
        return;
      }
      router.push("/dashboard");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {erreur && <PlainError message={erreur} />}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={accepter}
          disabled={encours}
          className="sz-cta text-[13px] px-4 py-2 disabled:opacity-50"
        >
          {encours ? "…" : `Rejoindre ${programme}`}
        </button>
        {/* Refuser, c'est simplement ne rien faire — aucun bouton « Refuser »
            n'est nécessaire, et en proposer un donnerait à croire qu'une
            réponse est due. Le lien reste valable si le fondateur veut y
            revenir. */}
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center justify-center rounded-[9px] border border-line bg-surface px-4 py-2 text-[13px] font-[550] text-ink-secondary hover:text-ink hover:border-line-strong transition-colors min-h-[38px]"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
