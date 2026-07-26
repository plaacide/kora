"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { OnboardingShell, AsideEncre, AsideClair } from "./OnboardingShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlainError } from "@/components/auth/FormError";
import { SelectChips } from "./SelectChips";
import { saveStartup, completeOnboarding } from "@/app/actions/onboarding";
import { cn } from "@/lib/cn";
import { PAYS, SECTEURS, STADES, HORIZONS } from "@/lib/onboarding-options";

/** Longueur maximale de la phrase de présentation (handoff v2 §5). */
const PHRASE_MAX = 120;

function Select({
  label,
  value,
  onChange,
  options,
  vide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Valeur persistée + libellé affiché : les deux ne se confondent pas. */
  options: readonly { value: string; label: string }[];
  vide: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11.5px] font-medium text-ink-secondary">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 px-2.5 text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none"
      >
        <option value="">{vide}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FounderOnboarding() {
  const t = useTranslations("onboarding.founder");
  const to = useTranslations("onboarding.options");

  /** Rail de gauche : la 3ᵉ étape se fait APRÈS l'inscription (handoff §5). */
  const ETAPES_FONDATEUR = [
    { title: t("stepStartupTitle"), subtitle: t("stepStartupSub") },
    { title: t("stepRaiseTitle"), subtitle: t("stepRaiseSub") },
    { title: t("stepRoomTitle"), subtitle: t("stepRoomSub") },
  ];
  const OBJECTIFS = [
    { key: "levee", titre: t("objLevee"), sous: t("objLeveeSub") },
    { key: "diligence", titre: t("objDiligence"), sous: t("objDiligenceSub") },
  ];
  /** Libellés traduits, valeurs persistées inchangées. */
  const libelle = (o: { value: string; key: string }) => ({ value: o.value, label: to(o.key) });

  const [step, setStep] = useState(1);
  const [objectif, setObjectif] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [sector, setSector] = useState("");
  const [stage, setStage] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [amount, setAmount] = useState("");
  const [arr, setArr] = useState("");
  const [horizon, setHorizon] = useState<string[]>([]);
  // La data room n'est plus créée d'office : le fondateur décide. À « plus
  // tard », il la crée depuis son accueil, avec le nom et le modèle qu'il veut.
  const [creerSalle, setCreerSalle] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [pending, start] = useTransition();

  // La levée demande un second écran (montants) ; la diligence non.
  const totalSteps = objectif === "diligence" ? 1 : 2;

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
        objectif: objectif || undefined,
      });
      if (!res.ok) return setError(res.error);
      setError(undefined);
      // Diligence : pas d'écran « levée », on termine directement.
      if (objectif === "diligence") {
        await completeOnboarding(name.trim() || t("defaultWorkspace"), creerSalle);
        return;
      }
      setStep(2);
    });
  }

  function finish() {
    start(async () => {
      const res = await saveStartup({
        amount: amount ? Number(amount) : null,
        arr: arr ? Number(arr) : null,
        horizon: horizon[0],
      });
      if (!res.ok) return setError(res.error);
      await completeOnboarding(name.trim() || t("defaultWorkspace"), creerSalle);
    });
  }

  if (step === 1) {
    return (
      <OnboardingShell
        step={1}
        total={totalSteps}
        steps={ETAPES_FONDATEUR}
        aside={
          <AsideEncre title={t("asideTitle")}>
            {t("asideBody")}
          </AsideEncre>
        }
      >
        <h1 className="font-display text-[24px] font-[700] tracking-[-0.02em]">{t("stepStartupTitle")}</h1>
        <p className="text-[12.5px] text-ink-secondary mt-1">
          {t("startupSubtitle")}
        </p>

        <PlainError message={error} />

        {/* Objectif de la data room : pilote l'écran et les données collectées. */}
        <div className="mt-6">
          <label className="text-[11.5px] font-medium text-ink-secondary">{t("whyRoom")}</label>
          <p className="text-[11px] text-ink-muted mt-0.5">{t("objectifOptional")}</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {OBJECTIFS.map((o) => {
              const actif = objectif === o.key;
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setObjectif(o.key)}
                  className={cn(
                    "text-left rounded-[10px] border p-3 transition-colors",
                    actif ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-line bg-surface hover:border-ink-muted",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-[650] text-ink">{o.titre}</span>
                    <span className={cn("w-3.5 h-3.5 rounded-full border flex-none", actif ? "border-accent bg-accent" : "border-line")} />
                  </div>
                  <p className="text-[11px] text-ink-muted mt-1 leading-snug">{o.sous}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Input label={t("startupName")} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("startupNamePh")} />
          <Select label={t("country")} value={country} onChange={setCountry} options={PAYS.map(libelle)} vide={to("none")} />
          <Select label={t("sector")} value={sector} onChange={setSector} options={SECTEURS.map(libelle)} vide={to("none")} />
          <Select label={t("stage")} value={stage} onChange={setStage} options={STADES.map(libelle)} vide={to("none")} />
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label className="text-[11.5px] font-medium text-ink-secondary">{t("oneLiner")}</label>
            {/* Compteur de caractères (handoff §5) : il vire à l'orange dans les
                dix derniers, pour prévenir avant de buter sur la limite. */}
            <span
              style={{ fontFamily: "var(--font-plex-mono), monospace" }}
              className={
                "text-[10.5px] " +
                (oneLiner.length > PHRASE_MAX - 10 ? "text-[#C24619]" : "text-[#A9ACBB]")
              }
            >
              {oneLiner.length} / {PHRASE_MAX}
            </span>
          </div>
          <textarea
            value={oneLiner}
            onChange={(e) => setOneLiner(e.target.value.slice(0, PHRASE_MAX))}
            maxLength={PHRASE_MAX}
            rows={2}
            placeholder={t("oneLinerPh")}
            className="px-2.5 py-2 text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none resize-none"
          />
        </div>

        {/* Quand créer la data room. L'inscription la créait AUTOMATIQUEMENT,
            ce qui rendait inatteignable l'accueil « Créez votre data room » —
            l'application annonçait alors une étape déjà faite. Le fondateur
            tranche lui-même. */}
        <div className="mt-6">
          <label className="text-[11.5px] font-medium text-ink-secondary">{t("roomWhen")}</label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {[
              { v: true, titre: t("roomNow"), sous: t("roomNowSub") },
              { v: false, titre: t("roomLater"), sous: t("roomLaterSub") },
            ].map((o) => {
              const actif = creerSalle === o.v;
              return (
                <button
                  key={String(o.v)}
                  type="button"
                  onClick={() => setCreerSalle(o.v)}
                  aria-pressed={actif}
                  className={cn(
                    "text-left rounded-[10px] border p-3 transition-colors",
                    actif ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-line bg-surface hover:border-ink-muted",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-[650] text-ink">{o.titre}</span>
                    <span className={cn("w-3.5 h-3.5 rounded-full border flex-none", actif ? "border-accent bg-accent" : "border-line")} />
                  </div>
                  <p className="text-[11px] text-ink-muted mt-1 leading-snug">{o.sous}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#F0EDE4] flex justify-end">
          <Button variant="primary" onClick={next1} loading={pending} disabled={name.trim().length < 2}>
            {objectif === "diligence" ? t("finish") : `${t("continue")} \u2192`}
          </Button>
        </div>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      step={2}
      total={2}
      steps={ETAPES_FONDATEUR}
      aside={
        <AsideClair title={t("aside2Title")}>
          {t.rich("aside2Body", { b: (c) => <strong className="font-[650]">{c}</strong> })}
        </AsideClair>
      }
    >
      <h1 className="font-display text-[24px] font-[700] tracking-[-0.02em]">{t("stepRaiseTitle")}</h1>
      <p className="text-[12.5px] text-ink-secondary mt-1">
        {t("raiseSubtitle")}
      </p>
      <p className="text-[11.5px] text-ink-muted mt-1">{t("raiseOptional")}</p>

      <PlainError message={error} />

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11.5px] font-medium text-ink-secondary">{t("amount")}</label>
          <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="4200000"
            className="h-8 px-2.5 font-mono text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11.5px] font-medium text-ink-secondary">{t("arr")}</label>
          <input type="number" min="0" value={arr} onChange={(e) => setArr(e.target.value)} placeholder="850000"
            className="h-8 px-2.5 font-mono text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none" />
        </div>
      </div>

      {/* Calendrier visé (V2 §5). Un fondateur qui vise Q4 2026 et un autre qui
          vise « plus tard » ne se préparent pas au même rythme — et c'est la
          seule question de cet écran dont la réponse ne se déduit d'aucune
          autre. Choix unique : viser deux trimestres n'a pas de sens. */}
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label className="text-[11.5px] font-medium text-ink-secondary">{t("timeline")}</label>
          <span className="text-[10.5px] text-ink-muted">{t("timelineHint")}</span>
        </div>
        <SelectChips options={HORIZONS.map((h) => ({ value: h.value, label: t(h.key) }))} value={horizon} onChange={setHorizon} />
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
          <span>{t("profileDone")}</span>
          <span className="font-mono">{completude}%</span>
        </div>
        <span className="block h-1.5 rounded-full bg-line overflow-hidden mt-2">
          <span className={cn("block h-full bg-primary transition-all")} style={{ width: `${completude}%` }} />
        </span>
        <p className="text-[11px] text-ink-muted mt-2">
          {t.rich("profileNote", { b: (c) => <strong className="font-[650]">{c}</strong> })}
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-[#F0EDE4] flex items-center justify-between">
        <button type="button" onClick={() => setStep(1)} className="text-[12.5px] font-medium text-ink-secondary hover:text-ink cursor-pointer">
          {`\u2190 ${t("back")}`}
        </button>
        {/* Un seul bouton, dont le LIBELLÉ suit l'état : « Remplir plus tard »
            tant que rien n'est saisi, « Terminer » dès qu'un champ l'est. Deux
            boutons côte à côte auraient fait le même geste, et en afficher un
            conditionnellement aurait décalé l'autre au chargement. */}
        <Button variant="primary" onClick={finish} loading={pending}>
          {amount || arr || horizon.length > 0 ? t("finish") : t("fillLater")}
        </Button>
      </div>
    </OnboardingShell>
  );
}
