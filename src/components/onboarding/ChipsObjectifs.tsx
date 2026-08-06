"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import {
  MAX_OBJECTIFS,
  MAX_LONGUEUR_OBJECTIF,
  libelleObjectif,
  normaliserObjectifLibre,
  estObjectifConnu,
} from "@/lib/objectifs-cohorte";

/**
 * Les objectifs d'une cohorte : plusieurs choix, plus les siens.
 *
 * POURQUOI UN COMPOSANT À PART et non un drapeau de plus sur `SelectChips`.
 * Celui-ci est utilisé par six écrans dont l'onboarding fondateur et
 * investisseur ; y ajouter un champ de saisie libre et un plafond ferait porter
 * à tous une complexité qu'un seul réclame. Ils gardent la même apparence —
 * c'est le comportement qui diffère, pas la forme.
 *
 * L'AJOUT LIBRE EST DISCRET, et c'est voulu. Les quatre objectifs proposés
 * couvrent la plupart des cohortes ; les mettre sur le même plan qu'un champ
 * de saisie inviterait à réécrire « préparer à lever » à la main, et l'on
 * perdrait la comparabilité entre cohortes. Le champ n'apparaît qu'au clic sur
 * « + Autre objectif ».
 */
export function ChipsObjectifs({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const t = useTranslations("onboarding.sae");
  const [ouvert, setOuvert] = useState(false);
  const [saisie, setSaisie] = useState("");

  const plein = value.length >= MAX_OBJECTIFS;

  function basculer(v: string) {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else if (!plein) onChange([...value, v]);
  }

  function ajouter() {
    const v = normaliserObjectifLibre(saisie);
    // Un doublon ne produit rien plutôt qu'une erreur : l'objectif demandé est
    // déjà là, l'intention est satisfaite.
    if (v && !value.includes(v) && !plein) onChange([...value, v]);
    setSaisie("");
    setOuvert(false);
  }

  // Les objectifs libres déjà choisis, pour les rendre comme les autres.
  const libres = value.filter((v) => !estObjectifConnu(v));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const actif = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => basculer(opt.value)}
              aria-pressed={actif}
              disabled={!actif && plein}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[12.5px] font-medium border transition-colors cursor-pointer",
                actif
                  ? "border-primary bg-[rgba(232,92,43,0.08)] text-[#c64b1e]"
                  : "border-line text-ink-secondary hover:border-line-strong",
                !actif && plein && "opacity-40 cursor-not-allowed",
              )}
            >
              {opt.label}
            </button>
          );
        })}

        {libres.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => basculer(v)}
            aria-pressed
            title={t("goalRemove")}
            className="rounded-full px-3.5 py-1.5 text-[12.5px] font-medium border border-primary bg-[rgba(232,92,43,0.08)] text-[#c64b1e] cursor-pointer inline-flex items-center gap-1.5"
          >
            {libelleObjectif(v, t)}
            <span aria-hidden className="text-[13px] leading-none opacity-60">
              ×
            </span>
          </button>
        ))}

        {!ouvert && !plein && (
          <button
            type="button"
            onClick={() => setOuvert(true)}
            className="rounded-full px-3.5 py-1.5 text-[12.5px] font-medium border border-dashed border-line text-ink-muted hover:border-line-strong hover:text-ink-secondary cursor-pointer"
          >
            {t("goalAdd")}
          </button>
        )}
      </div>

      {ouvert && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            autoFocus
            value={saisie}
            maxLength={MAX_LONGUEUR_OBJECTIF}
            onChange={(e) => setSaisie(e.target.value)}
            onKeyDown={(e) => {
              // Entrée valide, Échap referme : au clavier, ce champ ne doit pas
              // devenir un piège dont on ne sort qu'à la souris.
              if (e.key === "Enter") {
                e.preventDefault();
                ajouter();
              }
              if (e.key === "Escape") {
                setSaisie("");
                setOuvert(false);
              }
            }}
            placeholder={t("goalOtherPh")}
            className="h-8 px-2.5 text-[12.5px] bg-surface text-ink rounded-field border border-line placeholder:text-ink-placeholder focus:border-accent focus:outline-none min-w-[200px]"
          />
          <button
            type="button"
            onClick={ajouter}
            disabled={normaliserObjectifLibre(saisie) === null}
            className="rounded-[5px] bg-[#FF5A1F] px-3 py-1.5 text-[12px] font-[600] text-white hover:bg-[#E74C16] disabled:bg-[#F1F0EB] disabled:text-[#A9ACBB]"
          >
            {t("goalAddConfirm")}
          </button>
        </div>
      )}

      {plein && (
        <p className="text-[11.5px] text-[#8B8FA3]">
          {t("goalMax", { n: MAX_OBJECTIFS })}
        </p>
      )}
    </div>
  );
}
