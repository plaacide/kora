"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { OnboardingShell, AsideEncre, AsideClair } from "./OnboardingShell";
import { SelectChips } from "./SelectChips";
import { ChipsObjectifs } from "./ChipsObjectifs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlainError } from "@/components/auth/FormError";
import {
  saveProgramme,
  createFirstCohort,
  finishProgrammeOnboarding,
} from "@/app/actions/onboarding";
import { inviteToCohort } from "@/app/actions/cohorte";

/** Pays d'implantation — données, pas de la copie d'interface. */
const PAYS = [
  "Côte d'Ivoire", "Sénégal", "Bénin", "Mali", "Togo", "Burkina Faso",
  "Cameroun", "Nigeria", "Ghana", "Kenya", "Autre",
] as const;

/**
 * Onboarding du persona PROGRAMME (accélérateur, incubateur, studio, bailleur).
 *
 * Trois étapes qui ENREGISTRENT à la validation (spec §0.4) : structure →
 * première cohorte → invitations. L'organisation naît à l'étape 03 ; un abandon
 * ne perd rien et le rechargement reprend à l'étape atteinte, via `initialStep`
 * calculé côté serveur (page wrapper).
 */
export function ProgrammeOnboarding({
  initialStep = 1,
  initialName = "",
  defaultSeats = 10,
}: {
  initialStep?: number;
  initialName?: string;
  defaultSeats?: number;
}) {
  const t = useTranslations("onboarding.sae");
  const [step, setStep] = useState(initialStep);
  const [erreur, setErreur] = useState<string | undefined>();
  const [encours, demarrer] = useTransition();

  // Étape 03 — structure
  const [type, setType] = useState<string[]>([]);
  const [nom, setNom] = useState(initialName);
  const [pays, setPays] = useState("");
  const [site, setSite] = useState("");
  const [volume, setVolume] = useState("");

  // Étape 04 — cohorte
  const [cohorte, setCohorte] = useState("");
  const [places, setPlaces] = useState(String(defaultSeats));
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [objectif, setObjectif] = useState<string[]>([]);
  const [cohortId, setCohortId] = useState<string | undefined>();

  // Étape 05 — invitations
  const [emails, setEmails] = useState("");

  // CE QUI MANQUE, NOMMÉ. Un bouton grisé sans explication laisse chercher :
  // on relit ses champs, on croit avoir tout rempli, on conclut que l'écran est
  // cassé. La phrase vit sous le bouton et non en info-bulle — une info-bulle
  // ne s'ouvre pas au doigt.
  const manqueStructure = nom.trim().length < 2 ? t("needName") : null;
  const manqueCohorte = cohorte.trim().length < 2 ? t("needCohortName") : null;

  const ETAPES = [
    { title: t("step1Title"), subtitle: t("step1Sub") },
    { title: t("step2Title"), subtitle: t("step2Sub") },
    { title: t("step3Title"), subtitle: t("step3Sub") },
  ];

  const TYPES = [
    { value: "accelerateur", label: t("typeAccelerator") },
    { value: "incubateur", label: t("typeIncubator") },
    { value: "studio", label: t("typeStudio") },
    { value: "public", label: t("typePublic") },
  ];
  const OBJECTIFS = [
    { value: "leve", label: t("goalRaise") },
    { value: "dette", label: t("goalDebt") },
    { value: "conformite", label: t("goalCompliance") },
    { value: "croissance", label: t("goalGrowth") },
  ];

  // --- Étape 03 ---
  function validerStructure() {
    if (nom.trim().length < 2) return;
    setErreur(undefined);
    demarrer(async () => {
      const res = await saveProgramme({
        name: nom.trim(),
        type: type[0],
        country: pays || undefined,
        website: site.trim() || undefined,
        volume: volume ? Number(volume) : null,
      });
      if (!res.ok) return setErreur(res.error);
      setStep(2);
    });
  }

  // --- Étape 04 ---
  function validerCohorte() {
    if (cohorte.trim().length < 2) return;
    setErreur(undefined);
    demarrer(async () => {
      const res = await createFirstCohort({
        name: cohorte.trim(),
        seats: places ? Number(places) : null,
        startsOn: debut || null,
        endsOn: fin || null,
        goals: objectif,
      });
      if (!res.ok) return setErreur(res.error);
      setCohortId(res.cohortId);
      setStep(3);
    });
  }

  // --- Étape 05 ---
  function terminer(avecInvitations: boolean) {
    setErreur(undefined);
    demarrer(async () => {
      if (avecInvitations) {
        const liste = emails
          .split(/[\s,;]+/)
          .map((e) => e.trim())
          .filter((e) => e.includes("@"));
        for (const email of liste) {
          await inviteToCohort(email, cohortId);
        }
      }
      // `finishProgrammeOnboarding` redirige vers /bienvenue en cas de succès.
      const res = await finishProgrammeOnboarding();
      if (res && !res.ok) setErreur(res.error);
    });
  }

  // ---------------------------------------------------------------- rendu
  if (step === 1) {
    return (
      <OnboardingShell
        step={1}
        total={3}
        steps={ETAPES}
        aside={<AsideEncre title={t("asideNeverTitle")}>{t("asideNeverBody")}</AsideEncre>}
      >
        <Heading title={t("step1Title")} subtitle={t("step1Lead")} />

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[12.5px] font-[600] text-[#4A4E63]">{t("typeLabel")}</label>
            <SelectChips options={TYPES} value={type} onChange={setType} />
          </div>

          <Input label={t("nameLabel")} name="nom" value={nom}
            onChange={(e) => setNom(e.target.value)} placeholder={t("namePh")} autoFocus />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pays" className="text-[12.5px] font-[600] text-[#4A4E63]">{t("countryLabel")}</label>
              <select id="pays" value={pays} onChange={(e) => setPays(e.target.value)}
                className="h-9 px-2.5 text-[13px] bg-white text-ink rounded-[8px] border border-line focus:border-primary focus:outline-none">
                <option value="">—</option>
                {PAYS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <Input label={t("websiteLabel")} name="site" value={site}
              onChange={(e) => setSite(e.target.value)} placeholder="https://" />
          </div>

          <Input label={t("volumeLabel")} name="volume" type="number" min="0" value={volume}
            onChange={(e) => setVolume(e.target.value)} placeholder={t("volumePh")} />

          {erreur && <PlainError message={erreur} />}

          <div className="flex flex-col gap-1.5">
            <Button onClick={validerStructure} disabled={encours || !!manqueStructure}>
              {encours ? t("saving") : t("continue")}
            </Button>
            {manqueStructure && (
              <p className="text-[11.5px] text-[#8B8FA3]">{manqueStructure}</p>
            )}
          </div>
        </div>
      </OnboardingShell>
    );
  }

  if (step === 2) {
    return (
      <OnboardingShell
        step={2}
        total={3}
        steps={ETAPES}
        aside={<AsideClair title={t("asideTwoTitle")}>{t("asideTwoBody")}</AsideClair>}
      >
        <Heading title={t("step2Title")} subtitle={t("step2Lead")} />

        <div className="mt-6 flex flex-col gap-4">
          <Input label={t("cohortNameLabel")} name="cohorte" value={cohorte}
            onChange={(e) => setCohorte(e.target.value)} placeholder={t("cohortNamePh")} autoFocus />

          <div className="grid grid-cols-3 gap-3">
            <Input label={t("seatsLabel")} name="places" type="number" min="1" value={places}
              onChange={(e) => setPlaces(e.target.value)} />
            <Input label={t("startLabel")} name="debut" type="date" value={debut}
              onChange={(e) => setDebut(e.target.value)} />
            <Input label={t("endLabel")} name="fin" type="date" value={fin}
              onChange={(e) => setFin(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12.5px] font-[600] text-[#4A4E63]">{t("goalLabel")}</label>
            <ChipsObjectifs options={OBJECTIFS} value={objectif} onChange={setObjectif} />
          </div>

          {erreur && <PlainError message={erreur} />}

          <div className="flex items-center justify-between mt-2">
            <button type="button" onClick={() => setStep(1)}
              className="text-[12.5px] font-[600] text-[#8B8FA3] hover:text-[#4A4E63]">
              {t("back")}
            </button>
            <div className="flex flex-col items-end gap-1.5">
              <Button onClick={validerCohorte} disabled={encours || !!manqueCohorte}>
                {encours ? t("saving") : t("continue")}
              </Button>
              {manqueCohorte && (
                <p className="text-[11.5px] text-[#8B8FA3]">{manqueCohorte}</p>
              )}
            </div>
          </div>
        </div>
      </OnboardingShell>
    );
  }

  // Étape 05 — invitations (sautable)
  return (
    <OnboardingShell
      step={3}
      total={3}
      steps={ETAPES}
      aside={<AsideClair title={t("asideInviteTitle")}>{t("asideInviteBody")}</AsideClair>}
    >
      <Heading title={t("step3Title")} subtitle={t("step3Lead")} />

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="emails" className="text-[12.5px] font-[600] text-[#4A4E63]">{t("emailsLabel")}</label>
          <textarea id="emails" value={emails} onChange={(e) => setEmails(e.target.value)} rows={4}
            placeholder={t("emailsPh")}
            className="px-3 py-2.5 text-[13px] bg-white text-ink rounded-[8px] border border-line focus:border-primary focus:outline-none resize-none" />
        </div>

        <div className="rounded-[10px] border border-line bg-surface-2 px-4 py-3.5">
          <p className="text-[12.5px] text-ink leading-relaxed">
            {t.rich("inviteNote", { b: (c) => <strong className="font-[650]">{c}</strong> })}
          </p>
        </div>

        {erreur && <PlainError message={erreur} />}

        <div className="flex items-center justify-between mt-2">
          <button type="button" onClick={() => terminer(false)} disabled={encours}
            className="text-[12.5px] font-[600] text-[#8B8FA3] hover:text-[#4A4E63] disabled:opacity-50">
            {t("skip")}
          </button>
          <Button onClick={() => terminer(true)} disabled={encours}>
            {encours ? t("saving") : t("finish")}
          </Button>
        </div>
      </div>
    </OnboardingShell>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">{title}</h1>
      <p className="text-[13px] text-ink-secondary leading-relaxed mt-2">{subtitle}</p>
    </>
  );
}
