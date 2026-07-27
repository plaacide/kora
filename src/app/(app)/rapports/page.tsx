import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { aujourdhuiIso } from "@/lib/echeance";
import type { Locale } from "@/i18n/locales";

/**
 * `/rapports` — l'état de cohorte destiné à un bailleur (§6 des règles).
 *
 * LE REFUS EST LA FONCTIONNALITÉ. La règle demande de REFUSER de générer sous
 * le seuil plutôt que produire un document à cases vides. Ce n'est pas une
 * précaution technique : un rapport où tout est à zéro dessert la cohorte
 * auprès du bailleur bien plus que l'absence de rapport. L'écran nomme donc le
 * seuil et dit où l'on en est — refuser sans expliquer serait pire que
 * produire.
 *
 * Le programme ne lit jamais un document (§0.1) : on compte des pièces et des
 * statuts d'exigences, jamais un contenu ni même un nom de fichier.
 */

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

/** Au moins une entreprise au dossier entamé — le seuil de la règle §6. */
const SEUIL_ENTREPRISES = 1;

export default async function RapportsPage({
  searchParams,
}: {
  searchParams: Promise<{ cohorte?: string }>;
}) {
  const t = await getTranslations("reports");
  const locale = (await getLocale()) as Locale;
  const { cohorte: choisie } = await searchParams;
  const supabase = await createClient();

  const { data: cohortesData } = await supabase
    .from("cohorts")
    .select("id, name, starts_on, ends_on")
    .is("archived_at", null)
    .order("starts_on", { ascending: false, nullsFirst: false });

  const cohortes = (cohortesData ?? []) as Array<{
    id: string; name: string; starts_on: string | null; ends_on: string | null;
  }>;

  if (cohortes.length === 0) {
    return (
      <div className="max-w-2xl">
        <h1 className="font-display text-[27px] font-[700] tracking-[-0.025em] mb-4">{t("title")}</h1>
        <EmptyState title={t("noCohortTitle")} description={t("noCohortBody")} />
      </div>
    );
  }

  const cohorteId = choisie && cohortes.some((c) => c.id === choisie) ? choisie : cohortes[0].id;
  const cohorte = cohortes.find((c) => c.id === cohorteId)!;

  const { data: membres } = await supabase
    .from("cohort_members")
    .select("startup_org_id")
    .eq("cohort_id", cohorteId);
  const orgs = ((membres ?? []) as Array<{ startup_org_id: string }>).map((m) => m.startup_org_id);

  const [{ data: salles }, { data: levees }, { data: liens }] = await Promise.all([
    orgs.length
      ? supabase.from("deals").select("id, org_id").in("org_id", orgs)
      : Promise.resolve({ data: [] }),
    orgs.length
      ? supabase.from("raises").select("org_id, montant_cible, devise").in("org_id", orgs).eq("statut", "en_cours")
      : Promise.resolve({ data: [] }),
    supabase.from("cohort_links").select("status").eq("cohort_id", cohorteId),
  ]);

  const dealIds = ((salles ?? []) as Array<{ id: string }>).map((d) => d.id);

  // Exigences par catégorie, et pièces réellement déposées. Deux comptes, pas
  // un contenu.
  const [{ data: exigences }, { data: pieces }, { data: accords }] = await Promise.all([
    dealIds.length
      ? supabase.from("checklist_items").select("deal_id, category, status").in("deal_id", dealIds)
      : Promise.resolve({ data: [] }),
    dealIds.length
      ? supabase.from("documents").select("deal_id").in("deal_id", dealIds)
      : Promise.resolve({ data: [] }),
    orgs.length
      ? supabase
          .from("access_requests")
          .select("id")
          .in("startup_org_id", orgs)
          .eq("status", "granted")
      : Promise.resolve({ data: [] }),
  ]);

  const dealsAvecPiece = new Set(((pieces ?? []) as Array<{ deal_id: string }>).map((p) => p.deal_id));
  const orgParDeal = new Map(((salles ?? []) as Array<{ id: string; org_id: string }>).map((d) => [d.id, d.org_id]));
  const orgsEntamees = new Set(
    [...dealsAvecPiece].map((id) => orgParDeal.get(id)).filter(Boolean) as string[],
  );

  // ── LE SEUIL ──────────────────────────────────────────────────────────
  const assez = orgsEntamees.size >= SEUIL_ENTREPRISES;

  const parCategorie = new Map<string, { total: number; faites: number }>();
  for (const e of (exigences ?? []) as Array<{ category: string; status: string }>) {
    const cur = parCategorie.get(e.category) ?? { total: 0, faites: 0 };
    cur.total += 1;
    if (e.status === "done") cur.faites += 1;
    parCategorie.set(e.category, cur);
  }

  let devise = "XOF";
  let recherche = 0;
  for (const r of (levees ?? []) as Array<{ montant_cible: number | null; devise: string | null }>) {
    recherche += r.montant_cible ?? 0;
    if (r.devise) devise = r.devise;
  }
  const invitations = ((liens ?? []) as Array<{ status: string }>).filter((l) => l.status !== "revoked").length;

  const jour = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", { month: "short", year: "numeric" });
  const dateLongue = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", { dateStyle: "long" });
  const argent = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", { notation: "compact", maximumFractionDigits: 1 });
  const periode = cohorte.starts_on
    ? `${jour.format(new Date(cohorte.starts_on))}${cohorte.ends_on ? ` → ${jour.format(new Date(cohorte.ends_on))}` : ""}`
    : t("noPeriod");

  const categories = [
    { cle: "ohada", libelle: t("catOhada") },
    { cle: "financier", libelle: t("catFinancier") },
    { cle: "dfi", libelle: t("catDfi") },
  ];

  return (
    <div className="text-[#1A1B1F] max-w-[860px]">
      <h1 className="font-display text-[27px] font-[700] tracking-[-0.025em]">{t("title")}</h1>
      <p className="text-[13px] text-[#6E727A] mt-1">{t("subtitle")}</p>

      {/* Sélecteur de cohorte : des liens, pas un menu déroulant — l'URL porte
          le choix, donc le rapport se partage et se recharge à l'identique. */}
      {cohortes.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap mt-4">
          <span style={mono} className="text-[9px] tracking-[0.1em] text-[#A0A3AB]">
            {t("pickCohort").toUpperCase()}
          </span>
          {cohortes.map((c) => (
            <Link
              key={c.id}
              href={`/rapports?cohorte=${c.id}`}
              className={
                "rounded-full border px-3.5 min-h-[30px] inline-flex items-center text-[12.5px] font-medium " +
                (c.id === cohorteId
                  ? "border-[#E85C2B] bg-[#FDF1EA] text-[#C24619]"
                  : "border-[#E4E2DC] bg-white text-[#33353B] hover:border-[#C9C6BD]")
              }
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {!assez ? (
        // Le refus NOMME le seuil et dit ce que le rapport contiendra une
        // fois franchi. Refuser sans expliquer serait pire que produire un
        // rapport vide : l'un frustre, l'autre dessert la cohorte auprès du
        // bailleur.
        <div className="mt-5 rounded-[8px] border border-[#F0C4AE] bg-[#FEFAF7] px-5 py-4">
          <h2 className="text-[14px] font-[700] text-[#C24619]">{t("refusedTitle")}</h2>
          <p className="text-[12.5px] text-[#8A4B2C] mt-1.5 leading-relaxed">
            {t("refusedBody")}
          </p>
          <p className="text-[12px] text-[#8B8FA3] mt-2 leading-relaxed">{t("refusedWhy")}</p>
        </div>
      ) : (
        <div className="mt-5 bg-white border border-[#E2DED4] rounded-[8px] px-6 py-5">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h2 className="text-[16px] font-[700]">{cohorte.name}</h2>
            <span style={mono} className="text-[11px] text-[#8B8FA3]">{periode}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[#F0EDE4]">
            {[
              [t("companies"), String(orgs.length)],
              [t("rooms"), String(dealIds.length)],
              [t("sought"), recherche > 0 ? `${argent.format(recherche)} ${devise}` : "—"],
              [t("granted"), String(((accords ?? []) as unknown[]).length)],
            ].map(([label, valeur]) => (
              <div key={label}>
                <div style={mono} className="text-[9px] tracking-[0.08em] text-[#A0A3AB] uppercase">{label}</div>
                <div style={mono} className="text-[18px] font-[600] mt-1">{valeur}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-[#F0EDE4]">
            <div style={mono} className="text-[9px] tracking-[0.08em] text-[#A0A3AB] uppercase mb-2.5">
              {t("byCategory")}
            </div>
            <div className="flex flex-col gap-2.5">
              {categories.map((c) => {
                const d = parCategorie.get(c.cle);
                const pct = d && d.total > 0 ? Math.round((d.faites / d.total) * 100) : null;
                return (
                  <div key={c.cle} className="flex items-center gap-3">
                    <span className="text-[12.5px] text-[#55585F] w-[150px] shrink-0">{c.libelle}</span>
                    <span className="flex-1 h-1.5 rounded-full bg-[#E8E5DC] overflow-hidden">
                      <span
                        className="block h-full rounded-full bg-[#E85C2B]"
                        style={{ width: `${pct ?? 0}%` }}
                      />
                    </span>
                    <span style={mono} className="text-[11.5px] text-[#6E727A] w-[70px] text-right shrink-0">
                      {pct == null ? "—" : `${d!.faites}/${d!.total}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#F0EDE4] flex items-baseline justify-between gap-3 flex-wrap">
            <span className="text-[12.5px] text-[#6E727A]">
              {t("invitations")} <span style={mono} className="font-[600] text-[#1A1B1F]">{invitations}</span>
            </span>
            <span style={mono} className="text-[11px] text-[#A0A3AB]">
              {t("asOf", { date: dateLongue.format(new Date(aujourdhuiIso())) })}
            </span>
          </div>
        </div>
      )}

      {/* Signalé, pas simulé : la règle §6 veut un instantané mensuel pour
          donner la tendance. Il demande une tâche planifiée, absente de cette
          installation. Fabriquer une courbe depuis un seul point serait
          inventer une donnée. */}
      <div className="mt-4 rounded-[6px] border border-[#E2DED4] bg-white px-4 py-3">
        <div style={mono} className="text-[9px] tracking-[0.08em] text-[#A0A3AB] uppercase">
          {t("trendMissing")}
        </div>
        <p className="text-[12px] text-[#6E727A] mt-1.5 leading-relaxed">{t("trendMissingBody")}</p>
      </div>
    </div>
  );
}
