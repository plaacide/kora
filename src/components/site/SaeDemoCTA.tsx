"use client";

import { useActionState, useState } from "react";
import { requestSaeDemo } from "@/app/actions/sae";
import { cn } from "@/lib/cn";

const TAILLES = ["Moins de 10", "10 – 25", "25 – 50", "Plus de 50"];

/**
 * « Demander une démo » — vente assistée, pas self-service.
 *
 * Bouton d'abord, formulaire à l'intention manifestée : trois champs affichés
 * d'emblée feraient fuir un directeur de programme qui ne fait que repérer.
 *
 * `dark` : la section SAE vit sur fond Encre, le formulaire doit s'y lire.
 */
export function SaeDemoCTA({ dark = false }: { dark?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const [state, action, pending] = useActionState(requestSaeDemo, undefined);

  if (state?.ok) {
    return (
      <div
        className={cn(
          "rounded-[12px] border p-5",
          dark
            ? "border-white/15 bg-white/5 text-white"
            : "border-line bg-surface",
        )}
      >
        <p className="text-[14px] font-[650]">
          Bien reçu — nous revenons vers vous sous 48 h.
        </p>
        <p
          className={cn(
            "mt-1.5 text-[12.5px] leading-relaxed",
            dark ? "text-white/65" : "text-ink-secondary",
          )}
        >
          La démo se fait en visio, sur vos cas réels : venez avec une cohorte
          en tête.
        </p>
      </div>
    );
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="sz-cta text-[14.5px] px-7 py-3"
      >
        Demander une démo
      </button>
    );
  }

  const champ = cn(
    "h-11 px-3 text-[13px] rounded-[9px] border focus:outline-none w-full",
    dark
      ? "bg-white/8 border-white/20 text-white placeholder:text-white/40 focus:border-vibration-soft"
      : "bg-surface border-line text-ink focus:border-primary",
  );

  return (
    <form action={action} className="flex flex-col gap-2.5 max-w-[440px]">
      <div>
        <label htmlFor="sae-email" className="sr-only">
          Email professionnel
        </label>
        <input
          id="sae-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="prenom@structure.org"
          className={champ}
        />
        {state?.fieldErrors?.email && (
          <p className="mt-1 text-[11.5px] text-[#f2b8a8]">
            Adresse email invalide.
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label htmlFor="sae-org" className="sr-only">
            Structure
          </label>
          <input
            id="sae-org"
            name="org"
            type="text"
            placeholder="Votre structure"
            className={champ}
          />
        </div>
        <div>
          <label htmlFor="sae-size" className="sr-only">
            Taille de cohorte
          </label>
          <select id="sae-size" name="size" defaultValue="" className={champ}>
            <option value="">Startups accompagnées</option>
            {TAILLES.map((t) => (
              <option key={t} value={t} className="text-ink">
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      {state?.errorKey && (
        <p className="text-[11.5px] text-[#f2b8a8]">
          {state.errorKey === "tooManyAttempts"
            ? "Trop de tentatives. Réessayez dans quelques minutes."
            : "Une erreur est survenue. Réessayez."}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="sz-cta h-11 text-[13.5px] disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Planifier la démo"}
      </button>
    </form>
  );
}
