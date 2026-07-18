"use client";

import { useState } from "react";
import { WaitlistForm } from "./WaitlistForm";

/**
 * Bouton de la maquette qui laisse place au formulaire une fois cliqué.
 *
 * La maquette montre un simple bouton ; il fallait bien que la liste d'attente
 * recueille quelque chose. Plutôt que d'imposer trois champs à quelqu'un qui
 * découvre la page, on garde le bouton annoncé et on n'affiche le formulaire
 * qu'à l'intention manifestée.
 */
export function InvestorWaitlistCTA({ label }: { label: string }) {
  const [ouvert, setOuvert] = useState(false);

  if (ouvert) return <WaitlistForm />;

  return (
    <button
      type="button"
      onClick={() => setOuvert(true)}
      className="sz-cta text-[14px] px-6 py-3"
    >
      {label}
    </button>
  );
}
