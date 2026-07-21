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

  // Complétude de la FICHE, recalculée à chaque champ (miroir de `save_startup`).
  // À ne pas confondre avec le readiness du deal, qui mesure la checklist DD et
  // vaut 0 tant qu'aucune exigence n'est cochée : afficher les deux sous le même
  // nom faisait chuter le score de 90 % à 0 % entre l'onboarding et le dashboard.
  const completude = Math.min(
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
        <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">Votre startup</h1>
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
      <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">Votre levée</h1>
      <p className="text-[12.5px] text-ink-secondary mt-1">
        Ces montants figurent sur votre fiche, visible des investisseurs.
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

      {/* Pas de zone de dépôt ici : l'upload vit dans la data room, qui n'existe
          qu'une fois l'organisation créée (étape suivante). Une zone en pointillés
          qui n'accepte rien, et qui promettait « +18 pts », faisait une promesse
          que l'écran ne pouvait pas tenir. */}

      {/* Complétude de la FICHE, à ne pas confondre avec la complétude du
          DOSSIER (la checklist). Deux mesures, deux noms : renseigner son
          secteur ne rend pas un dossier présentable à un investisseur. */}
      <div className="mt-4 bg-bg border border-line rounded-[10px] p-3.5">
        <div className="flex items-center justify-between text-[12px] font-[550]">
          <span>Fiche complétée</span>
          <span className="font-mono">{completude}%</span>
        </div>
        <span className="block h-1.5 rounded-full bg-line overflow-hidden mt-2">
          <span className={cn("block h-full bg-primary transition-all")} style={{ width: `${completude}%` }} />
        </span>
        <p className="text-[11px] text-ink-muted mt-2">
          C&apos;est votre carte de visite. La complétude de votre{" "}
          <strong className="font-[650]">dossier</strong>, elle, se construit
          ensuite : elle mesure les pièces réellement fournies, et c&apos;est
          celle que les investisseurs regardent.
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
