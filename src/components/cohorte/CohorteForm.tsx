"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteToCohort, revokeCohortLink } from "@/app/actions/cohorte";
import { PlainError } from "@/components/auth/FormError";
import { Chip } from "@/components/ui/Chip";

export interface LienCohorte {
  id: string;
  email: string;
  status: "pending" | "accepted" | "revoked";
  created_at: string;
  organizations: { name: string } | null;
}

export function CohorteForm({ liens }: { liens: LienCohorte[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState<string | undefined>();
  // Le lien est proposé à la copie quand l'e-mail n'est pas parti : le
  // rattachement existe en base, il serait absurde de le perdre pour autant.
  const [lienManuel, setLienManuel] = useState<string | undefined>();
  const [envoi, demarrer] = useTransition();

  function inviter() {
    const valeur = email.trim();
    if (!valeur.includes("@")) return;
    setErreur(undefined);
    setLienManuel(undefined);
    demarrer(async () => {
      const res = await inviteToCohort(valeur);
      if (!res.ok) {
        setErreur(res.error);
        return;
      }
      setEmail("");
      if (res.emailSkipped || res.emailError) setLienManuel(res.link);
      router.refresh();
    });
  }

  function rompre(id: string) {
    demarrer(async () => {
      const res = await revokeCohortLink(id);
      if (!res.ok) setErreur(res.error);
      else router.refresh();
    });
  }

  const actifs = liens.filter((l) => l.status !== "revoked");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && inviter()}
          placeholder="fondateur@startup.com"
          className="flex-1 min-w-[220px] h-[38px] px-3 text-[13px] bg-surface border border-line rounded-[9px] focus:outline-none focus:border-line-strong"
        />
        <button
          onClick={inviter}
          disabled={envoi || !email.includes("@")}
          className="sz-cta text-[13px] px-4 py-2 disabled:opacity-50"
        >
          {envoi ? "Envoi…" : "Inviter"}
        </button>
      </div>

      {erreur && <PlainError message={erreur} />}

      {lienManuel && (
        <div className="rounded-[10px] border border-line bg-surface-2 px-3.5 py-3">
          <p className="text-[12px] text-ink-secondary leading-relaxed">
            L’e-mail n’est pas parti, mais l’invitation existe. Transmettez ce
            lien à la fondatrice ou au fondateur :
          </p>
          <code className="block mt-2 text-[11.5px] text-ink break-all">
            {lienManuel}
          </code>
        </div>
      )}

      {actifs.length === 0 ? (
        <p className="text-[12px] text-ink-muted">
          Aucune startup invitée pour l’instant.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {actifs.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between gap-3 rounded-[9px] border border-line bg-surface px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <div className="text-[12.5px] text-ink truncate">
                  {l.organizations?.name ?? l.email}
                </div>
                {l.organizations && (
                  <div className="text-[11px] text-ink-muted truncate">
                    {l.email}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-none">
                <Chip tone={l.status === "accepted" ? "success" : "amber"}>
                  {l.status === "accepted" ? "A rejoint" : "En attente"}
                </Chip>
                <button
                  onClick={() => rompre(l.id)}
                  className="text-[11.5px] text-ink-muted hover:text-[oklch(0.55_0.17_25)]"
                >
                  Retirer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
