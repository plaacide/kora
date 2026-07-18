"use client";

import { useState, useTransition } from "react";
import { OnboardingShell } from "./OnboardingShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlainError } from "@/components/auth/FormError";
import { saveStartup, completeOnboarding } from "@/app/actions/onboarding";
import { cn } from "@/lib/cn";

const COUNTRIES = ["Côte d'Ivoire", "Sénégal", "Bénin", "Mali", "Togo", "Burkina Faso", "Cameroun", "Nigeria", "Autre"];
const SECTORS = ["Agritech", "Fintech", "Santé", "Logistique", "Énergie", "Éducation", "Autre"];
const STAGES = ["Pré-seed", "Seed", "Série A", "Série B+"];

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11.5px] font-medium text-ink-secondary">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 px-2.5 text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none"
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FounderOnboarding() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [sector, setSector] = useState("");
  const [stage, setStage] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [amount, setAmount] = useState("");
  const [arr, setArr] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, start] = useTransition();

  // Readiness indicatif, recalculé à chaque champ (miroir de la RPC).
  const readiness = Math.min(
    100,
    (name.trim() ? 15 : 0) +
      (country ? 10 : 0) +
      (sector ? 10 : 0) +
      (stage ? 10 : 0) +
      (oneLiner.trim() ? 15 : 0) +
      (amount ? 15 : 0) +
      (arr ? 15 : 0),
  );

  function next1() {
    start(async () => {
      const res = await saveStartup({
        name: name.trim(),
        country: country || undefined,
        sector: sector || undefined,
        stage: stage || undefined,
        oneLiner: oneLiner.trim() || undefined,
      });
      if (!res.ok) return setError(res.error);
      setError(undefined);
      setStep(2);
    });
  }

  function finish() {
    start(async () => {
      const res = await saveStartup({
        amount: amount ? Number(amount) : null,
        arr: arr ? Number(arr) : null,
      });
      if (!res.ok) return setError(res.error);
      await completeOnboarding(name.trim() || "Ma startup");
    });
  }

  if (step === 1) {
    return (
      <OnboardingShell step={1} total={2}>
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">Votre startup</h1>
        <p className="text-[12.5px] text-ink-secondary mt-1">
          Ces informations composent votre fiche visible par les investisseurs.
        </p>

        <PlainError message={error} />

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Input label="Nom de la startup" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kalyx Foods" />
          <Select label="Pays" value={country} onChange={setCountry} options={COUNTRIES} />
          <Select label="Secteur" value={sector} onChange={setSector} options={SECTORS} />
          <Select label="Stade" value={stage} onChange={setStage} options={STAGES} />
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          <label className="text-[11.5px] font-medium text-ink-secondary">En une phrase</label>
          <textarea
            value={oneLiner}
            onChange={(e) => setOneLiner(e.target.value)}
            rows={2}
            placeholder="Ce que fait votre startup, en une ligne."
            className="px-2.5 py-2 text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none resize-none"
          />
        </div>

        <div className="mt-8 flex justify-end">
          <Button variant="primary" onClick={next1} loading={pending} disabled={name.trim().length < 2}>
            Continuer →
          </Button>
        </div>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell step={2} total={2}>
      <h1 className="text-[22px] font-[650] tracking-[-0.02em]">Votre levée</h1>
      <p className="text-[12.5px] text-ink-secondary mt-1">
        Alimente votre score de readiness — visible des investisseurs.
      </p>

      <PlainError message={error} />

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11.5px] font-medium text-ink-secondary">Montant recherché (USD)</label>
          <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="4200000"
            className="h-8 px-2.5 font-mono text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11.5px] font-medium text-ink-secondary">Revenus annuels ARR (USD)</label>
          <input type="number" min="0" value={arr} onChange={(e) => setArr(e.target.value)} placeholder="850000"
            className="h-8 px-2.5 font-mono text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none" />
        </div>
      </div>

      {/* Zone d'upload pitch deck (visuelle — le dépôt réel se fera dans la data room). */}
      <div className="mt-4 border-[1.5px] border-dashed border-[#c9cbd6] rounded-[10px] p-5 text-center hover:border-primary transition-colors">
        <span className="inline-grid place-items-center w-8 h-8 rounded-[8px] bg-[rgba(232,92,43,0.10)] text-primary text-[15px]">↑</span>
        <p className="text-[12px] text-ink-secondary mt-2">
          Déposez votre pitch deck <span className="text-ink-muted">— ajoutera +18 pts à votre readiness</span>
        </p>
      </div>

      {/* Encart score. */}
      <div className="mt-4 bg-bg border border-line rounded-[10px] p-3.5">
        <div className="flex items-center justify-between text-[12px] font-[550]">
          <span>Readiness</span>
          <span className="font-mono">{readiness}%</span>
        </div>
        <span className="block h-1.5 rounded-full bg-line overflow-hidden mt-2">
          <span className={cn("block h-full bg-primary transition-all")} style={{ width: `${readiness}%` }} />
        </span>
        <p className="text-[11px] text-ink-muted mt-2">
          Complétez la data room après l&apos;inscription pour dépasser 80.
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button type="button" onClick={() => setStep(1)} className="text-[12.5px] font-medium text-ink-secondary hover:text-ink cursor-pointer">
          ← Retour
        </button>
        <Button variant="primary" onClick={finish} loading={pending}>
          Terminer
        </Button>
      </div>
    </OnboardingShell>
  );
}
