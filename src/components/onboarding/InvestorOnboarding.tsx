"use client";

import { useState, useTransition } from "react";
import { OnboardingShell } from "./OnboardingShell";
import { SelectChips } from "./SelectChips";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlainError } from "@/components/auth/FormError";
import {
  saveInvestorProfile,
  completeOnboarding,
} from "@/app/actions/onboarding";

const TYPES = ["Fonds VC", "Business angel", "DFI", "Family office", "Corporate"];
const SECTORS = ["Agritech", "Fintech", "Santé", "Logistique", "Énergie", "Éducation"];
const GEOS = ["Afrique de l'Ouest", "Afrique de l'Est", "Afrique du Nord", "Afrique australe"];
const STAGES = ["Pré-seed", "Seed", "Série A", "Série B+"];

export function InvestorOnboarding({ firstName }: { firstName: string }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<string[]>([]);
  const [org, setOrg] = useState("");
  const [ticket, setTicket] = useState("");
  const [sectors, setSectors] = useState<string[]>([]);
  const [geos, setGeos] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [pending, start] = useTransition();

  function next1() {
    start(async () => {
      const res = await saveInvestorProfile({
        investorType: type[0],
        organisation: org.trim() || undefined,
        ticket: ticket ? Number(ticket) : null,
      });
      if (!res.ok) return setError(res.error);
      setError(undefined);
      setStep(2);
    });
  }

  function finish() {
    start(async () => {
      const res = await saveInvestorProfile({ sectors, geographies: geos, stages });
      if (!res.ok) return setError(res.error);
      // L'espace de travail de l'investisseur = son organisation.
      await completeOnboarding(org.trim() || `${firstName} — investissement`);
    });
  }

  if (step === 1) {
    return (
      <OnboardingShell step={1} total={2}>
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          Votre profil d&apos;investisseur
        </h1>
        <p className="text-[12.5px] text-ink-secondary mt-1">
          Pour ne vous montrer que les deals pertinents.
        </p>

        <PlainError message={error} />

        <div className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-[550] text-ink-secondary">
              Type d&apos;investisseur
            </label>
            <SelectChips options={TYPES} value={type} onChange={setType} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Organisation"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="Amani Capital"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] font-medium text-ink-secondary">
                Ticket moyen (USD)
              </label>
              <input
                type="number"
                min="0"
                value={ticket}
                onChange={(e) => setTicket(e.target.value)}
                placeholder="250000"
                className="h-8 px-2.5 font-mono text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            variant="primary"
            onClick={next1}
            loading={pending}
            disabled={type.length === 0}
          >
            Continuer →
          </Button>
        </div>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell step={2} total={2}>
      <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
        Votre thèse d&apos;investissement
      </h1>
      <p className="text-[12.5px] text-ink-secondary mt-1">
        Sélectionnez tout ce qui s&apos;applique.
      </p>

      <PlainError message={error} />

      <div className="mt-6 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-[550] text-ink-secondary">Secteurs</label>
          <SelectChips options={SECTORS} value={sectors} onChange={setSectors} multi />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-[550] text-ink-secondary">Géographies</label>
          <SelectChips options={GEOS} value={geos} onChange={setGeos} multi />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-[550] text-ink-secondary">Stades</label>
          <SelectChips options={STAGES} value={stages} onChange={setStages} multi />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="text-[12.5px] font-medium text-ink-secondary hover:text-ink cursor-pointer"
        >
          ← Retour
        </button>
        <Button variant="primary" onClick={finish} loading={pending}>
          Terminer
        </Button>
      </div>
    </OnboardingShell>
  );
}
