"use client";

import { useActionState } from "react";
import { joinWaitlist } from "@/app/actions/waitlist";

const TICKETS = [
  "< 50 k$",
  "50 – 250 k$",
  "250 k$ – 1 M$",
  "> 1 M$",
];

/**
 * Liste d'attente investisseurs.
 *
 * Trois champs, dont deux facultatifs : chaque champ supplémentaire coûte des
 * inscriptions, et à ce stade seule l'adresse est indispensable pour
 * recontacter.
 */
export function WaitlistForm() {
  const [state, action, pending] = useActionState(joinWaitlist, undefined);

  if (state?.ok) {
    return (
      <div className="rounded-[12px] border border-line bg-surface p-5 text-center">
        <p className="text-[14px] font-[650] text-ink">
          C&apos;est noté — votre place est réservée.
        </p>
        <p className="mt-1.5 text-[12.5px] text-ink-secondary leading-relaxed">
          Nous vous écrirons à l&apos;ouverture des accès investisseurs. Pas de
          newsletter entre-temps.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1">
        <label htmlFor="wl-email" className="sr-only">
          Email professionnel
        </label>
        <input
          id="wl-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="prenom@fonds.com"
          className="h-11 px-3 text-[13px] bg-surface text-ink rounded-[9px] border border-line focus:border-primary focus:outline-none"
        />
        {state?.fieldErrors?.email && (
          <p className="text-[11.5px] text-[oklch(0.48_0.16_25)]">
            Adresse email invalide.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label htmlFor="wl-company" className="sr-only">
            Société
          </label>
          <input
            id="wl-company"
            name="company"
            type="text"
            placeholder="Société (optionnel)"
            className="w-full h-11 px-3 text-[13px] bg-surface text-ink rounded-[9px] border border-line focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="wl-ticket" className="sr-only">
            Ticket moyen
          </label>
          <select
            id="wl-ticket"
            name="ticket"
            defaultValue=""
            className="w-full h-11 px-3 text-[13px] bg-surface text-ink rounded-[9px] border border-line focus:border-primary focus:outline-none"
          >
            <option value="">Ticket moyen (optionnel)</option>
            {TICKETS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state?.errorKey && (
        <p className="text-[11.5px] text-[oklch(0.48_0.16_25)]">
          {state.errorKey === "tooManyAttempts"
            ? "Trop de tentatives. Réessayez dans quelques minutes."
            : "Une erreur est survenue. Réessayez."}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        data-analytics="waitlist_investor_submit"
        className="sz-cta h-11 text-[13.5px] disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Rejoindre la liste d'attente"}
      </button>

      <p className="text-[11px] text-ink-muted leading-relaxed">
        Gratuit. Nous ne partageons votre adresse avec personne.
      </p>
    </form>
  );
}
