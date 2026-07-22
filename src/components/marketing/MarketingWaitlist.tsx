"use client";

import { useActionState } from "react";
import { joinWaitlist } from "@/app/actions/waitlist";

const TICKETS = ["< 50 k$", "50 – 250 k$", "250 k$ – 1 M$", "> 1 M$"];

/**
 * Liste d'attente investisseurs, au système visuel de la refonte (fond sombre,
 * hairlines, rayons courts). Réutilise l'action `joinWaitlist` déjà branchée —
 * même backend, nouvelle peau.
 *
 * Une seule adresse est requise : chaque champ supplémentaire coûte des
 * inscriptions, société et ticket restent facultatifs.
 */
export function MarketingWaitlist() {
  const [state, action, pending] = useActionState(joinWaitlist, undefined);

  const field =
    "h-11 px-3 text-[13px] bg-white/5 text-white placeholder:text-white/40 rounded-[7px] border border-white/12 focus:border-[#F08A5E] focus:outline-none";

  if (state?.ok) {
    return (
      <div className="rounded-[8px] border border-white/12 bg-white/[0.04] p-6 text-center">
        <p className="text-[14px] font-[650] text-white">
          C&apos;est noté — votre place est réservée.
        </p>
        <p className="mt-1.5 text-[12.5px] text-white/65 leading-relaxed">
          Nous vous écrirons à l&apos;ouverture des accès investisseurs. Pas de
          newsletter entre-temps.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2.5">
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
        className={field}
      />
      {state?.fieldErrors?.email && (
        <p className="text-[11.5px] text-[#F08A5E]">Adresse email invalide.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <input
          name="company"
          type="text"
          placeholder="Société (optionnel)"
          aria-label="Société"
          className={field}
        />
        <select
          name="ticket"
          defaultValue=""
          aria-label="Ticket moyen"
          className={field}
        >
          <option value="" className="text-[#1A1B1F]">
            Ticket moyen (optionnel)
          </option>
          {TICKETS.map((t) => (
            <option key={t} value={t} className="text-[#1A1B1F]">
              {t}
            </option>
          ))}
        </select>
      </div>

      {state?.errorKey && (
        <p className="text-[11.5px] text-[#F08A5E]">
          {state.errorKey === "tooManyAttempts"
            ? "Trop de tentatives. Réessayez dans quelques minutes."
            : "Une erreur est survenue. Réessayez."}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        data-analytics="waitlist_investor_submit"
        className="inline-flex items-center justify-center h-11 rounded-[7px] bg-[#E85C2B] text-white text-[14px] font-[650] hover:bg-[#D24E1F] transition-colors disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Rejoindre la liste d'attente"}
      </button>

      <p className="text-[11px] text-white/45 leading-relaxed">
        Gratuit. Nous ne partageons votre adresse avec personne.
      </p>
    </form>
  );
}
