"use client";

import { useState, useTransition } from "react";
import { OnboardingShell } from "./OnboardingShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlainError } from "@/components/auth/FormError";
import { completeOnboarding } from "@/app/actions/onboarding";

/**
 * Onboarding d'un PROGRAMME — incubateur, accélérateur, structure
 * d'accompagnement.
 *
 * Une seule étape, et c'est délibéré. Le fondateur remplit pays, secteur,
 * stade et montant parce que ces informations décrivent SON dossier, celui
 * qu'un investisseur consultera. Un programme n'a pas de dossier : ce qui le
 * définit, c'est sa cohorte, et elle se construit en invitant. Lui demander
 * son secteur d'activité ou son montant recherché n'aurait servi qu'à
 * remplir des colonnes que personne ne lit.
 */
export function ProgrammeOnboarding() {
  const [nom, setNom] = useState("");
  const [erreur, setErreur] = useState<string | undefined>();
  const [encours, demarrer] = useTransition();

  function valider() {
    const valeur = nom.trim();
    if (valeur.length < 2) return;
    setErreur(undefined);
    demarrer(async () => {
      const res = await completeOnboarding(valeur);
      // `completeOnboarding` redirige en cas de succès ; on n'arrive ici
      // qu'en cas d'échec.
      if (res && !res.ok) setErreur(res.error);
    });
  }

  return (
    <OnboardingShell step={1} total={1}>
      <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
        Votre programme
      </h1>
      <p className="text-[13px] text-ink-secondary leading-relaxed mt-2">
        Le nom sous lequel vos startups vous verront quand vous les inviterez à
        rejoindre votre cohorte.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <Input
          label="Nom du programme"
          name="nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && valider()}
          placeholder="Incubateur…"
          autoFocus
        />

        {erreur && <PlainError message={erreur} />}

        <div className="rounded-[10px] border border-line bg-surface-2 px-4 py-3.5">
          <p className="text-[12.5px] text-ink leading-relaxed">
            Vous verrez, pour chaque startup de votre cohorte, son stade, le
            montant recherché, sa préparation et les pièces qu’il lui reste à
            fournir — <strong className="font-[650]">jamais ses documents</strong>.
            Chaque startup accepte elle-même de vous rejoindre.
          </p>
        </div>

        <Button onClick={valider} disabled={encours || nom.trim().length < 2}>
          {encours ? "…" : "Créer mon espace"}
        </Button>
      </div>
    </OnboardingShell>
  );
}
