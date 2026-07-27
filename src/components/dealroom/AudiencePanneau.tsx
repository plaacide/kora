"use client";

import { useState, useTransition } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { useRouter } from "next/navigation";
import { inviterVitrine, revoquerAccesVitrine } from "@/app/actions/dealroom";
import { EmptyState } from "@/components/ui/EmptyState";

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

export interface AccesVitrine {
  id: string;
  email: string;
  invitedAt: string;
  acceptedAt: string | null;
}

/**
 * Qui a accès à la vitrine d'une cohorte, et le formulaire pour en ajouter.
 *
 * DEUX ÉTATS SEULEMENT — envoyée, acceptée. Pas de « lien ouvert » comme pour
 * les invitations de startup : la vitrine n'a pas de page de consentement où
 * l'on pourrait s'arrêter, l'acceptation est immédiate à l'ouverture. Inventer
 * un troisième état afficherait une nuance que la base ne connaît pas.
 *
 * L'ÉCHEC D'ENVOI N'EST PAS UN ÉCHEC D'INVITATION. L'accès existe en base dès
 * le retour de la RPC. Quand l'e-mail ne part pas — clé absente, domaine
 * refusé — on montre le lien à copier plutôt qu'une erreur rouge : le geste du
 * programme a abouti, c'est le facteur qui manque.
 */
export function AudiencePanneau({
  cohorteId,
  acces,
}: {
  cohorteId: string;
  acces: AccesVitrine[];
}) {
  const t = useTranslations("dealroom");
  const f = useFormatter();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [lien, setLien] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);
  const [encours, demarrer] = useTransition();

  function inviter(e: React.FormEvent) {
    e.preventDefault();
    const adresse = email.trim();
    if (!adresse) return;
    setErreur(null);
    setLien(null);
    demarrer(async () => {
      const r = await inviterVitrine(cohorteId, adresse);
      if (!r.ok) {
        setErreur(r.error ?? "—");
        return;
      }
      setEmail("");
      // Le lien ne s'affiche QUE si l'e-mail n'est pas parti. L'afficher
      // systématiquement inviterait à le transférer à la main, alors qu'il est
      // nominatif et ne servirait à personne d'autre.
      if (r.emailSkipped || r.emailError) setLien(r.link ?? null);
      router.refresh();
    });
  }

  function retirer(id: string) {
    demarrer(async () => {
      const r = await revoquerAccesVitrine(id);
      if (!r.ok) setErreur(r.error ?? "—");
      router.refresh();
    });
  }

  return (
    <div>
      <form onSubmit={inviter} className="flex flex-wrap items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("invitePlaceholder")}
          className="flex-1 min-w-[200px] rounded-[6px] border border-[#E2DED4] bg-white px-3 py-2 text-[13px] text-[#1A1B1F] placeholder:text-[#A0A3AB] focus:border-[#E85C2B] focus:outline-none"
        />
        <button
          type="submit"
          disabled={encours || email.trim() === ""}
          className="rounded-[6px] bg-[#E85C2B] px-4 py-2 text-[12.5px] font-[600] text-white hover:bg-[#D24E1F] disabled:bg-[#F1F0EB] disabled:text-[#A9ACBB]"
        >
          {encours ? t("inviting") : t("invite")}
        </button>
      </form>

      {erreur && (
        <p className="text-[12px] text-[#C0392B] mt-2 leading-relaxed">{erreur}</p>
      )}

      {lien && (
        <div className="mt-2.5 rounded-[6px] border border-[#F0C4AE] bg-[#FEFAF7] px-3.5 py-3">
          <p className="text-[12px] text-[#8A4B2C] leading-relaxed">
            {t("emailNotSent")}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <code
              style={mono}
              className="flex-1 min-w-0 truncate text-[11px] text-[#6E727A]"
            >
              {lien}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(lien);
                setCopie(true);
              }}
              className="shrink-0 text-[11.5px] font-[550] text-[#C24619] underline underline-offset-2"
            >
              {copie ? t("linkCopied") : t("copyLink")}
            </button>
          </div>
        </div>
      )}

      {acces.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            inset
            title={t("emptyAudienceTitle")}
            description={t("emptyAudienceBody")}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col mt-3">
            {acces.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 border-t border-[#F0EDE4]"
              >
                <span className="text-[12.5px] text-[#1A1B1F] min-w-0 truncate">
                  {a.email}
                </span>
                <span
                  style={mono}
                  className={
                    "shrink-0 text-[8.5px] font-[700] tracking-[0.06em] rounded-[4px] px-2 py-[3px] " +
                    (a.acceptedAt
                      ? "text-[#147A5C] bg-[#E4F3EC]"
                      : "text-[#B4741B] bg-[#FBF1DF]")
                  }
                >
                  {a.acceptedAt ? t("statusAccepted") : t("statusSent")}
                </span>
                <span className="text-[11.5px] text-[#A0A3AB]">
                  {t("invitedOn", {
                    date: f.dateTime(new Date(a.invitedAt), {
                      day: "numeric",
                      month: "short",
                    }),
                  })}
                </span>
                <button
                  onClick={() => retirer(a.id)}
                  disabled={encours}
                  className="ml-auto shrink-0 text-[11.5px] text-[#9DA0A8] underline underline-offset-2 hover:text-[#C0392B] disabled:no-underline"
                >
                  {t("revoke")}
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11.5px] text-[#8B8FA3] mt-3 leading-relaxed">
            {t("revokeHint")}
          </p>
        </>
      )}
    </div>
  );
}
