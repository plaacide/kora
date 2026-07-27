import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Mono } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Le portefeuille d'un programme.
 *
 * Tout vient de `sae_portfolio()`, une FONCTION et non une politique RLS : les
 * colonnes y sont énumérées, donc ce qui n'y figure pas ne peut pas fuiter ici
 * par inadvertance. Aucun nom de document n'en sort — c'est structurel, pas
 * une précaution d'affichage.
 *
 * AUCUN INDICATEUR À ZÉRO. Quand la cohorte est vide, les quatre cartes ne
 * s'affichent pas du tout — on ne montre pas « 0 startup · 0 % · 0 FCFA ». Un
 * tableau de bord entièrement à zéro se lit comme un produit cassé, pas comme
 * un produit qui attend. L'état vide dit ce qui les remplira.
 *
 * LE SEUIL « PRÊTE » EST UNE CONSTANTE. Il vivait en double — dans le filtre et
 * dans le libellé « Prêtes (≥ 75 %) ». Deux 75 côte à côte, c'est un jour où
 * l'un des deux bouge seul.
 *
 * Les pièces manquantes sont affichées NOMMÉES. Un directeur de programme qui
 * lit « 40 % » ne sait pas quoi faire de sa journée ; « il manque le RCCM et
 * les états financiers » se relance dans la minute. C'est toute la différence
 * entre un tableau de bord et un cockpit.
 */

interface Ligne {
  startup_org: string;
  startup_name: string;
  deal_id: string;
  deal_name: string;
  stage: string | null;
  amount: number | null;
  currency: string | null;
  readiness: number | null;
  items_total: number;
  items_done: number;
  missing: string[] | null;
}

/** Préparation à partir de laquelle une entreprise peut se présenter. */
const SEUIL_PRETE = 75;

function montant(
  v: number | null,
  devise: string | null,
  nf: Intl.NumberFormat,
): string {
  if (v === null) return "—";
  return `${nf.format(v)} ${devise ?? ""}`.trim();
}

export default async function PortefeuillePage() {
  const t = await getTranslations("portfolio");
  const locale = await getLocale();
  // Les nombres suivaient « fr-FR » quelle que soit la langue : un lecteur
  // anglophone lisait des séparateurs français.
  const nf = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sae_portfolio");
  const lignes = (error ? [] : ((data ?? []) as Ligne[])).sort(
    (a, b) => (a.readiness ?? 0) - (b.readiness ?? 0),
  );

  const moyenne = lignes.length
    ? Math.round(
        lignes.reduce((s, l) => s + (l.readiness ?? 0), 0) / lignes.length,
      )
    : 0;

  // Volume recherché cumulé, mais UNIQUEMENT si toute la cohorte est dans la
  // même devise : additionner des FCFA et des NGN donnerait un total qui ne
  // veut rien dire. À défaut, on ne l'affiche pas plutôt que de mentir.
  const devises = new Set(
    lignes.filter((l) => l.amount !== null).map((l) => l.currency),
  );
  const volume =
    devises.size === 1
      ? lignes.reduce((s, l) => s + (l.amount ?? 0), 0)
      : null;
  const devise = devises.size === 1 ? [...devises][0] : null;

  // Le seuil qui intéresse un bailleur : combien de sa cohorte peut se
  // présenter à un investisseur aujourd'hui.
  const pretes = lignes.filter((l) => (l.readiness ?? 0) >= SEUIL_PRETE).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">
            {t("title")}
          </h1>
          {/* Pas de sous-titre quand c'est vide : l'état vide ci-dessous dit
              déjà, et mieux, qu'il n'y a personne. */}
          {lignes.length > 0 && (
            <p className="text-[12.5px] text-ink-secondary mt-0.5">
              {t("subtitle", { n: lignes.length, moyenne })}
            </p>
          )}
        </div>
        {lignes.length > 0 && (
          <a
            href="/api/portefeuille/export"
            className="inline-flex items-center gap-2 rounded-[9px] border border-line bg-surface px-4 py-2 text-[13px] font-[550] text-ink-secondary hover:text-ink hover:border-line-strong transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3v12" />
              <path d="M7 10l5 5 5-5" />
              <path d="M4 21h16" />
            </svg>
            {t("export")}
          </a>
        )}
      </div>

      {lignes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: t("kpiCompanies"), valeur: String(lignes.length) },
            {
              label: t("kpiReady", { seuil: SEUIL_PRETE }),
              valeur: `${pretes}/${lignes.length}`,
            },
            { label: t("kpiAverage"), valeur: `${moyenne} %` },
            {
              label: t("kpiVolume"),
              valeur: volume !== null ? montant(volume, devise, nf) : "—",
              indice: volume === null ? t("kpiVolumeMixed") : undefined,
            },
          ].map((k) => (
            <Card key={k.label}>
              <CardBody>
                <div className="text-[11px] font-[550] text-ink-secondary">
                  {k.label}
                </div>
                <Mono className="text-[22px] tracking-[-0.03em] mt-1 block">
                  {k.valeur}
                </Mono>
                {k.indice && (
                  <div className="text-[10.5px] text-ink-muted mt-0.5">
                    {k.indice}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {lignes.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyBody")}
          foot={t("emptyFoot")}
          action={
            <Link href="/cohortes" className="sz-cta text-[13px] px-4 py-2">
              {t("emptyCta")}
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Trié du moins préparé au plus préparé : ceux qui ont besoin d'un
              coup de main viennent en premier. Un tri alphabétique ferait
              chercher, alors que c'est la liste des urgences qui est utile. */}
          {lignes.map((l) => (
            <Card key={l.deal_id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[14px] font-[650] truncate">
                      {l.startup_name}
                    </div>
                    <div className="text-[11.5px] text-ink-muted mt-0.5">
                      {montant(l.amount, l.currency, nf)}
                      {l.stage ? ` · ${l.stage}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-none">
                    <Mono className="text-[20px] tracking-[-0.03em]">
                      {l.readiness ?? 0}%
                    </Mono>
                    <Chip
                      tone={
                        (l.readiness ?? 0) < 40
                          ? "amber"
                          : (l.readiness ?? 0) < SEUIL_PRETE
                            ? "indigo"
                            : "success"
                      }
                    >
                      {l.items_done}/{l.items_total}
                    </Chip>
                  </div>
                </div>

                {l.missing && l.missing.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-separator-soft">
                    <div className="text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted mb-1.5">
                      {t("missing")}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {l.missing.map((m) => (
                        <span
                          key={m}
                          className="rounded-[6px] border border-line bg-surface-2 px-1.5 py-0.5 text-[11px] text-ink-secondary"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
