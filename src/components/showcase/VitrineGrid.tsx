"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * La grille de la vitrine et ses filtres (§3 de la spec).
 *
 * UN POINT À CONNAÎTRE SUR « INSTRUMENT ». La spec le range parmi les filtres,
 * à côté de stade et secteur. Mais aucune entreprise ne DÉCLARE d'instrument :
 * ni `startups`, ni `raises` ne portent cette notion. Filtrer dessus reviendrait
 * à masquer des dossiers sur un critère inexistant.
 *
 * Il choisit donc la LECTURE — equity ou dette — qu'ouvrira la fiche, et
 * l'instrument que portera la demande d'accès. C'est ce que le §4 attend
 * vraiment de lui : « demander l'accès depuis une fiche filtrée Dette porte
 * instrument=dette ». Il n'est pas compté comme un filtre actif, puisqu'il
 * n'écarte personne.
 */

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

export interface FicheCarte {
  orgId: string;
  nom: string;
  secteur: string | null;
  pays: string | null;
  stade: string | null;
  recherche: number | null;
  arr: number | null;
  croissance: string | null;
  preparation: number | null;
}

export type Instrument = "equity" | "dette" | "mezzanine";

export function VitrineGrid({
  fiches,
  instrument,
  onInstrument,
}: {
  fiches: FicheCarte[];
  instrument: Instrument;
  onInstrument: (i: Instrument) => void;
}) {
  const t = useTranslations("showcase");
  const [stade, setStade] = useState<string | null>(null);
  const [secteur, setSecteur] = useState<string | null>(null);
  const [pays, setPays] = useState<string | null>(null);
  const [revMin, setRevMin] = useState(0);

  // Les valeurs proposées viennent des fiches RÉELLES, pas d'une liste figée :
  // proposer « Agritech » quand aucune agritech n'est listée ferait chercher
  // dans le vide.
  const valeurs = (cle: keyof FicheCarte) =>
    [...new Set(fiches.map((f) => f[cle]).filter(Boolean) as string[])].sort();

  const revMax = useMemo(
    () => Math.max(0, ...fiches.map((f) => f.arr ?? 0)),
    [fiches],
  );

  const visibles = fiches.filter(
    (f) =>
      (!stade || f.stade === stade) &&
      (!secteur || f.secteur === secteur) &&
      (!pays || f.pays === pays) &&
      (revMin === 0 || (f.arr ?? 0) >= revMin),
  );
  const nFiltres = [stade, secteur, pays].filter(Boolean).length + (revMin > 0 ? 1 : 0);

  const argent = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });
  const total = visibles.reduce((s, f) => s + (f.recherche ?? 0), 0);
  const sigle = (n: string) =>
    n.trim().split(/\s+/).slice(0, 2).map((m) => m[0] ?? "").join("").toUpperCase() || "?";

  const chip = (actif: boolean) =>
    "rounded-full border px-3 min-h-[30px] text-[12px] font-medium " +
    (actif
      ? "border-[#FF5A1F] bg-[#FDF1EA] text-[#C44518]"
      : "border-[#E4E2DC] bg-white text-[#33353B] hover:border-[#C9C6BD]");

  const ligneChips = (
    titre: string,
    options: string[],
    valeur: string | null,
    poser: (v: string | null) => void,
  ) =>
    options.length > 0 && (
      <div className="flex items-center gap-2 flex-wrap">
        <span style={mono} className="text-[9px] tracking-[0.1em] text-[#A0A3AB] w-[74px] shrink-0">
          {titre}
        </span>
        <button onClick={() => poser(null)} className={chip(valeur === null)}>{t("any")}</button>
        {options.map((o) => (
          <button key={o} onClick={() => poser(valeur === o ? null : o)} className={chip(valeur === o)}>
            {o}
          </button>
        ))}
      </div>
    );

  return (
    <div>
      <div className="bg-white border border-[#E2DED4] rounded-[8px] px-5 py-4 mb-5 flex flex-col gap-3">
        {revMax > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <span style={mono} className="text-[9px] tracking-[0.1em] text-[#A0A3AB] w-[74px] shrink-0">
              {t("revenue")}
            </span>
            <input
              type="range"
              min={0}
              max={revMax}
              step={Math.max(1, Math.round(revMax / 50))}
              value={revMin}
              onChange={(e) => setRevMin(Number(e.target.value))}
              className="flex-1 max-w-[280px] accent-[#FF5A1F]"
              aria-label={t("revenue")}
            />
            <span style={mono} className="text-[12px] font-[600] text-[#C44518]">
              ≥ {argent.format(revMin)}
            </span>
          </div>
        )}

        {/* L'instrument choisit la LECTURE, il n'écarte personne — d'où sa
            place ici sans compter dans les filtres actifs. */}
        <div className="flex items-center gap-2 flex-wrap">
          <span style={mono} className="text-[9px] tracking-[0.1em] text-[#A0A3AB] w-[74px] shrink-0">
            {t("instrument")}
          </span>
          {(["equity", "dette", "mezzanine"] as const).map((i) => (
            <button key={i} onClick={() => onInstrument(i)} className={chip(instrument === i)}>
              {t(i)}
            </button>
          ))}
        </div>

        {ligneChips(t("stage"), valeurs("stade"), stade, setStade)}
        {ligneChips(t("sector"), valeurs("secteur"), secteur, setSecteur)}
        {ligneChips(t("country"), valeurs("pays"), pays, setPays)}

        <div className="flex items-center justify-between gap-3 pt-1 border-t border-[#F0EDE4]">
          <span style={mono} className="text-[11px] text-[#8B8FA3]">
            {t("filters", { n: nFiltres, r: visibles.length })}
          </span>
          {total > 0 && (
            <span className="text-[12px] text-[#6E727A]">
              {t("totalSought")}{" "}
              <span style={mono} className="font-[600] text-[#1A1B1F]">{argent.format(total)}</span>
            </span>
          )}
        </div>
      </div>

      {visibles.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyBody")} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibles.map((f) => (
            <Link
              key={f.orgId}
              href={`/vitrine/${f.orgId}?lecture=${instrument === "dette" ? "dette" : "equity"}`}
              className="bg-white border border-[#E2DED4] rounded-[8px] p-4 hover:border-[#C9C6BD] flex flex-col"
            >
              <span className="grid place-items-center w-9 h-9 rounded-[8px] bg-[#F1F0EB] text-[11px] font-[700] text-[#4A4E63]">
                {sigle(f.nom)}
              </span>
              <span className="block text-[14px] font-[700] mt-2.5 truncate">{f.nom}</span>
              <span className="block text-[11.5px] text-[#8B8FA3] truncate">
                {[f.secteur, f.pays].filter(Boolean).join(" · ") || "—"}
              </span>

              <span className="flex flex-col gap-1 mt-3">
                {[
                  [t("sought"), f.recherche != null ? argent.format(f.recherche) : null],
                  [t("arr"), f.arr != null ? argent.format(f.arr) : null],
                  [t("growth"), f.croissance],
                ].map(([label, valeur]) => (
                  <span key={label as string} className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] text-[#9DA0A8]">{label}</span>
                    {valeur ? (
                      <span style={mono} className="text-[12px] font-[600]">{valeur}</span>
                    ) : (
                      // Jamais zéro à la place d'une absence : un chiffre est
                      // une affirmation, l'absence n'en est pas une.
                      <span className="text-[11px] italic text-[#A9ACBB]">{t("notCommunicated")}</span>
                    )}
                  </span>
                ))}
              </span>

              <span className="block border-t border-[#F0EDE4] mt-3 pt-3">
                <span className="text-[11px] text-[#6E727A]">
                  {t("ready", { n: f.preparation ?? 0 })}
                </span>
                <span className="block h-1.5 rounded-full bg-[#E8E5DC] overflow-hidden mt-1.5">
                  <span
                    className="block h-full rounded-full bg-[#FF5A1F]"
                    style={{ width: `${f.preparation ?? 0}%` }}
                  />
                </span>
              </span>

              {f.stade && (
                <span style={mono} className="inline-block w-fit mt-3 text-[8.5px] font-[700] tracking-[0.06em] text-[#4A4E63] bg-[#F1F0EB] rounded-[4px] px-2 py-[3px]">
                  {f.stade}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
