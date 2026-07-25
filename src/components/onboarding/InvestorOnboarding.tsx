"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { OnboardingShell } from "./OnboardingShell";
import { SelectChips } from "./SelectChips";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlainError } from "@/components/auth/FormError";
import {
  saveInvestorProfile,
  completeOnboarding,
} from "@/app/actions/onboarding";
import { TYPES_INVESTISSEUR, SECTEURS_THESE, GEOGRAPHIES, STADES } from "@/lib/onboarding-options";

export function InvestorOnboarding({ firstName }: { firstName: string }) {
  const t = useTranslations("onboarding.investor");
  const to = useTranslations("onboarding.options");

  /** Rail des étapes (handoff v2 §5). */
  const ETAPES = [
    { title: t("stepProfileTitle"), subtitle: t("stepProfileSub") },
    { title: t("stepThesisTitle"), subtitle: t("stepThesisSub") },
    { title: t("stepDealsTitle"), subtitle: t("stepDealsSub") },
  ];
  /** Libellés traduits, valeurs persistées inchangées. */
  const libelle = (o: { value: string; key: string }) => ({ value: o.value, label: to(o.key) });

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
      await completeOnboarding(org.trim() || `${firstName} \u2014 ${t("workspaceSuffix")}`);
    });
  }

  if (step === 1) {
    return (
      <OnboardingShell step={1} total={2} steps={ETAPES}>
        <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">
          {t("profileTitle")}
        </h1>
        <p className="text-[12.5px] text-ink-secondary mt-1">
          {t("profileSubtitle")}
        </p>

        <PlainError message={error} />

        <div className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-[550] text-ink-secondary">
              {t("investorType")}
            </label>
            <SelectChips options={TYPES_INVESTISSEUR.map(libelle)} value={type} onChange={setType} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("organisation")}
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder={t("organisationPh")}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] font-medium text-ink-secondary">
                {t("avgTicket")}
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
            {`${t("continue")} \u2192`}
          </Button>
        </div>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell step={2} total={2} steps={ETAPES}>
      <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">
        {t("thesisTitle")}
      </h1>
      <p className="text-[12.5px] text-ink-secondary mt-1">
        {t("thesisSubtitle")}
      </p>

      <PlainError message={error} />

      <div className="mt-6 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-[550] text-ink-secondary">{t("sectors")}</label>
          <SelectChips options={SECTEURS_THESE.map(libelle)} value={sectors} onChange={setSectors} multi />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-[550] text-ink-secondary">{t("geographies")}</label>
          <SelectChips options={GEOGRAPHIES.map(libelle)} value={geos} onChange={setGeos} multi />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-[550] text-ink-secondary">{t("stages")}</label>
          <SelectChips options={STADES.map(libelle)} value={stages} onChange={setStages} multi />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="text-[12.5px] font-medium text-ink-secondary hover:text-ink cursor-pointer"
        >
          {`\u2190 ${t("back")}`}
        </button>
        <Button variant="primary" onClick={finish} loading={pending}>
          {t("finish")}
        </Button>
      </div>
    </OnboardingShell>
  );
}
