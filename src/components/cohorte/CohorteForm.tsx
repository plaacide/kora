"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  inviteToCohort,
  revokeCohortLink,
  relancerInvitation,
  relancerToutes,
} from "@/app/actions/cohorte";
import { PlainError } from "@/components/auth/FormError";

/**
 * Les invitations d'une cohorte — écran 09 de la maquette.
 *
 * TROIS STATUTS, PAS DEUX. « ENVOYÉE », « LIEN OUVERT », « À RELANCER ». La
 * distinction n'est pas décorative : une invitation ouverte sans suite se
 * relance par téléphone, une invitation jamais ouverte se relance par e-mail.
 * Ce ne sont pas les mêmes gestes, et c'est tout ce que le programme vient
 * chercher ici.
 *
 * ON INVITE UN NOM. La maquette affiche « Kalyx Foods / contact@kalyxfoods.ci »
 * avec son avatar dès l'invitation — donc avant toute acceptation, quand
 * l'entreprise n'a pas encore d'organisation. Le nom est saisi par le
 * programme ; l'organisation réelle prend le relais une fois l'invitation
 * acceptée.
 *
 * `cohorteId` n'est pas facultatif : sans lui, l'invitation part rattachée à
 * aucune cohorte et n'apparaît nulle part.
 */

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

export type StatutInvitation = "envoyee" | "ouverte" | "a_relancer" | "expiree";

export interface LienCohorte {
  id: string;
  email: string;
  companyName: string | null;
  status: "pending" | "accepted" | "revoked";
  /** Calculé par le serveur : lire l'horloge au rendu viole `react-hooks/purity`. */
  statut: StatutInvitation;
  jours: number;
  orgNom: string | null;
}

function initiales(v: string): string {
  return (
    v
      .trim()
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((m) => m[0] ?? "")
      .join("")
      .toUpperCase() || "?"
  );
}

const BADGE: Record<StatutInvitation, { libelle: string; cls: string }> = {
  envoyee: { libelle: "ENVOYÉE", cls: "text-[#6E727A] bg-[#F1F0EB]" },
  // Ouvert sans suite : le cas le plus prometteur de la liste, celui qu'on
  // appelle. Il se distingue donc visuellement, sans crier à l'alerte.
  ouverte: { libelle: "LIEN OUVERT", cls: "text-[#1B6B8F] bg-[#E3F0F6]" },
  a_relancer: { libelle: "À RELANCER", cls: "text-[#B4741B] bg-[#FBF1DF]" },
  expiree: { libelle: "EXPIRÉE", cls: "text-[#C0392B] bg-[#FBE6E0]" },
};

export function CohorteForm({
  cohorteId,
  liens,
}: {
  cohorteId: string;
  liens: LienCohorte[];
}) {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState<string | undefined>();
  const [note, setNote] = useState<string | undefined>();
  // Le lien est proposé à la copie quand l'e-mail n'est pas parti : le
  // rattachement existe en base, il serait absurde de le perdre pour autant.
  const [lienManuel, setLienManuel] = useState<string | undefined>();
  const [envoi, demarrer] = useTransition();

  const actifs = liens.filter((l) => l.status !== "revoked");
  const enAttente = actifs.filter((l) => l.status === "pending");

  function inviter() {
    const adresse = email.trim();
    if (!adresse.includes("@")) return;
    setErreur(undefined);
    setNote(undefined);
    setLienManuel(undefined);
    demarrer(async () => {
      const res = await inviteToCohort(adresse, cohorteId, nom);
      if (!res.ok) return setErreur(res.error);
      setEmail("");
      setNom("");
      if (res.emailSkipped || res.emailError) setLienManuel(res.link);
      router.refresh();
    });
  }

  function relancer(id: string) {
    setErreur(undefined);
    setNote(undefined);
    demarrer(async () => {
      const res = await relancerInvitation(id);
      if (!res.ok) setErreur(res.error);
      else if (res.emailSkipped || res.emailError) setLienManuel(res.link);
      router.refresh();
    });
  }

  function toutRelancer() {
    setErreur(undefined);
    setLienManuel(undefined);
    demarrer(async () => {
      const res = await relancerToutes(cohorteId);
      if (!res.ok) return setErreur(res.error);
      setNote(
        res.n === 1
          ? "1 invitation relancée."
          : `${res.n ?? 0} invitations relancées.`,
      );
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

  return (
    <div className="flex flex-col gap-4">
      {/* NOM PUIS ADRESSE. Le nom reste facultatif — on n'empêche pas d'inviter
          quelqu'un dont on n'a que l'adresse — mais il est demandé en premier
          parce que c'est lui qu'on lira dans la liste. */}
      <div className="flex flex-wrap gap-2">
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && inviter()}
          placeholder="Nom de l’entreprise"
          className="w-[220px] h-[38px] px-3 text-[13px] bg-surface border border-line rounded-[9px] focus:outline-none focus:border-line-strong"
        />
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
      {note && <p className="text-[12px] text-[#147A5C]">{note}</p>}

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
          Aucune entreprise invitée pour l’instant.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <span
              style={mono}
              className="text-[9px] tracking-[0.08em] text-[#A0A3AB] uppercase"
            >
              Invitations en attente
            </span>
            {/* Relance groupée — seulement au-delà d'une invitation en attente,
                sinon le bouton fait doublon avec le « Relancer » de la ligne. */}
            {enAttente.length > 1 && (
              <button
                onClick={toutRelancer}
                disabled={envoi}
                className="text-[11.5px] font-[550] text-ink-secondary underline underline-offset-2 hover:text-ink disabled:no-underline"
              >
                Relancer tout le monde
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            {actifs.map((l) => {
              const titre = l.orgNom ?? l.companyName ?? l.email;
              const badge = BADGE[l.statut];
              return (
                <div
                  key={l.id}
                  className="flex items-center gap-3 rounded-[9px] border border-line bg-surface px-3.5 py-2.5"
                >
                  <span className="grid place-items-center w-8 h-8 rounded-[7px] bg-[#F1F0EB] text-[11px] font-[700] text-[#4A4E63] shrink-0">
                    {initiales(titre)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-[550] text-ink truncate">
                      {titre}
                    </div>
                    {titre !== l.email && (
                      <div className="text-[11px] text-ink-muted truncate">
                        {l.email}
                      </div>
                    )}
                  </div>

                  {l.status === "accepted" ? (
                    <span
                      style={mono}
                      className="shrink-0 text-[8.5px] font-[700] tracking-[0.06em] rounded-[4px] px-2 py-[3px] text-[#147A5C] bg-[#E4F3EC]"
                    >
                      A REJOINT
                    </span>
                  ) : (
                    <>
                      <span
                        style={mono}
                        className={
                          "shrink-0 text-[8.5px] font-[700] tracking-[0.06em] rounded-[4px] px-2 py-[3px] " +
                          badge.cls
                        }
                      >
                        {badge.libelle}
                      </span>
                      <span
                        style={mono}
                        className="shrink-0 w-[74px] text-right text-[10.5px] text-ink-muted"
                      >
                        {l.jours === 0 ? "aujourd’hui" : `il y a ${l.jours} j`}
                      </span>
                      <button
                        onClick={() => relancer(l.id)}
                        disabled={envoi}
                        className="shrink-0 text-[11.5px] text-ink-secondary underline underline-offset-2 hover:text-ink disabled:no-underline"
                      >
                        Relancer
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => rompre(l.id)}
                    className="shrink-0 text-[11.5px] text-ink-muted hover:text-[oklch(0.55_0.17_25)]"
                  >
                    Retirer
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
