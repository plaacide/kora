import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Locale } from "@/i18n/locales";

/**
 * `/cohortes` — la liste (§1 de DEALROOM-VITRINE-DEMANDES).
 *
 * Une cohorte se juge sur cinq chiffres, et ils viennent tous de la réalité :
 * combien d'entreprises, combien de salles, combien recherché, où en est la
 * préparation, combien attendent une relance. Aucun n'est saisi par le
 * programme — la règle §0 de la spec d'UI l'interdit explicitement.
 *
 * Le programme ne lit JAMAIS un document (§0.1 des règles). Cet écran ne
 * touche donc ni `documents`, ni `document_versions` : il compte des salles et
 * lit des scores, jamais un contenu.
 */

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

/** Vert au-delà de 70 % — le seuil de la spec, nommé plutôt qu'écrit en dur. */
const PREPARATION_VERTE = 70;
/** Rouge au-delà de deux relances en attente : trois, c'est une cohorte qui décroche. */
const RELANCES_ROUGE = 2;

export default async function CohortesPage() {
  const t = await getTranslations("cohorts");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  // La RLS restreint déjà aux cohortes du programme : pas de filtre d'org ici,
  // il ferait doublon avec la seule garde qui compte.
  const { data: cohortesData } = await supabase
    .from("cohorts")
    .select("id, name, starts_on, ends_on, seats")
    .is("archived_at", null)
    .order("starts_on", { ascending: false, nullsFirst: false });

  const cohortes = (cohortesData ?? []) as Array<{
    id: string;
    name: string;
    starts_on: string | null;
    ends_on: string | null;
    seats: number;
  }>;
  const ids = cohortes.map((c) => c.id);

  const [{ data: membres }, { data: vitrine }, { data: liens }] = await Promise.all([
    ids.length
      ? supabase.from("cohort_members").select("cohort_id, startup_org_id").in("cohort_id", ids)
      : Promise.resolve({ data: [] }),
    ids.length
      ? supabase
          .from("showcase_entries")
          .select("cohort_id, startup_org_id")
          .in("cohort_id", ids)
          .is("unpublished_at", null)
      : Promise.resolve({ data: [] }),
    // « À relancer » : une invitation partie et jamais acceptée. C'est un fait
    // observable, pas une estimation.
    ids.length
      ? supabase.from("cohort_links").select("cohort_id, status").in("cohort_id", ids)
      : Promise.resolve({ data: [] }),
  ]);

  const parCohorte = new Map<string, string[]>();
  for (const m of (membres ?? []) as Array<{ cohort_id: string; startup_org_id: string }>) {
    parCohorte.set(m.cohort_id, [...(parCohorte.get(m.cohort_id) ?? []), m.startup_org_id]);
  }
  const orgs = [...new Set([...parCohorte.values()].flat())];

  // Les salles et les levées des entreprises membres. On lit des AGRÉGATS —
  // montant recherché, score de préparation — jamais une pièce.
  const [{ data: salles }, { data: levees }] = await Promise.all([
    orgs.length
      ? supabase.from("deals").select("id, org_id, readiness_score").in("org_id", orgs)
      : Promise.resolve({ data: [] }),
    orgs.length
      ? supabase
          .from("raises")
          .select("org_id, montant_cible")
          .in("org_id", orgs)
          .eq("statut", "en_cours")
      : Promise.resolve({ data: [] }),
  ]);

  const sallesParOrg = new Map<string, { n: number; readiness: number[] }>();
  for (const d of (salles ?? []) as Array<{ org_id: string; readiness_score: number | null }>) {
    const cur = sallesParOrg.get(d.org_id) ?? { n: 0, readiness: [] };
    cur.n += 1;
    if (d.readiness_score != null) cur.readiness.push(d.readiness_score);
    sallesParOrg.set(d.org_id, cur);
  }
  const montantParOrg = new Map<string, number>();
  for (const r of (levees ?? []) as Array<{ org_id: string; montant_cible: number | null }>) {
    montantParOrg.set(r.org_id, (montantParOrg.get(r.org_id) ?? 0) + (r.montant_cible ?? 0));
  }

  const relancesParCohorte = new Map<string, number>();
  for (const l of (liens ?? []) as Array<{ cohort_id: string | null; status: string }>) {
    if (!l.cohort_id || l.status === "accepted" || l.status === "revoked") continue;
    relancesParCohorte.set(l.cohort_id, (relancesParCohorte.get(l.cohort_id) ?? 0) + 1);
  }
  const vitrineParCohorte = new Map<string, number>();
  for (const s of (vitrine ?? []) as Array<{ cohort_id: string }>) {
    vitrineParCohorte.set(s.cohort_id, (vitrineParCohorte.get(s.cohort_id) ?? 0) + 1);
  }

  const lignes = cohortes.map((c) => {
    const membresOrgs = parCohorte.get(c.id) ?? [];
    const nSalles = membresOrgs.reduce((n, o) => n + (sallesParOrg.get(o)?.n ?? 0), 0);
    const scores = membresOrgs.flatMap((o) => sallesParOrg.get(o)?.readiness ?? []);
    return {
      ...c,
      entreprises: membresOrgs.length,
      salles: nSalles,
      recherche: membresOrgs.reduce((s, o) => s + (montantParOrg.get(o) ?? 0), 0),
      // Moyenne sur les salles QUI ONT un score. Compter les autres pour zéro
      // ferait chuter la moyenne d'une cohorte qui vient de démarrer, et dirait
      // le contraire de la vérité.
      preparation: scores.length
        ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length)
        : null,
      relances: relancesParCohorte.get(c.id) ?? 0,
      listees: vitrineParCohorte.get(c.id) ?? 0,
    };
  });

  const totalEntreprises = lignes.reduce((s, l) => s + l.entreprises, 0);
  const totalSalles = lignes.reduce((s, l) => s + l.salles, 0);

  const jour = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    month: "short",
    year: "numeric",
  });
  const argent = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const periode = (c: { starts_on: string | null; ends_on: string | null }) =>
    c.starts_on
      ? `${jour.format(new Date(c.starts_on))}${c.ends_on ? ` → ${jour.format(new Date(c.ends_on))}` : ""}`
      : t("noDates");

  return (
    <div className="text-[#1A1B1F]">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-[27px] font-[700] tracking-[-0.025em]">{t("title")}</h1>
          <p className="text-[13px] text-[#6E727A] mt-1">
            {t("summary", {
              cohortes: lignes.length,
              entreprises: totalEntreprises,
              salles: totalSalles,
            })}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* « Archives » et « Nouvelle cohorte » attendent leurs écrans : voir
              le rapport. Un bouton qui n'ouvre rien vaut moins que pas de
              bouton — la règle produit du dépôt l'interdit. */}
        </div>
      </div>

      {lignes.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyBody")} />
      ) : (
        <div className="flex flex-col gap-2.5">
          {lignes.map((c) => (
            <Link
              key={c.id}
              href={`/cohortes/${c.id}`}
              className="bg-white border border-[#E2DED4] rounded-[8px] px-5 py-4 grid gap-4 items-center hover:border-[#C9C6BD] md:grid-cols-[1.6fr_150px_200px_150px_130px]"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2.5">
                  <span className="text-[14.5px] font-[700] truncate">{c.name}</span>
                  <span
                    style={mono}
                    className={
                      "shrink-0 text-[8.5px] font-[700] tracking-[0.08em] rounded-[4px] px-2 py-[3px] " +
                      (c.entreprises > 0
                        ? "text-[#147A5C] bg-[#E4F3EC]"
                        : "text-[#B4741B] bg-[#FBF1DF]")
                    }
                  >
                    {c.entreprises > 0 ? t("running") : t("starting")}
                  </span>
                </span>
                <span className="block text-[11.5px] text-[#8B8FA3] mt-1">
                  {periode(c)} · {t("companies", { n: c.entreprises })} · {t("rooms", { n: c.salles })}
                </span>
              </span>

              <span>
                <span className="block text-[9px] tracking-[0.08em] text-[#A0A3AB] uppercase" style={mono}>
                  {t("colSought")}
                </span>
                <span style={mono} className="block text-[14px] font-[600] mt-0.5">
                  {c.recherche > 0 ? argent.format(c.recherche) : "—"}
                </span>
              </span>

              <span>
                <span className="block text-[9px] tracking-[0.08em] text-[#A0A3AB] uppercase" style={mono}>
                  {t("colReadiness")}
                </span>
                {c.preparation == null ? (
                  <span className="block text-[13px] text-[#9DA0A8] mt-1">—</span>
                ) : (
                  <>
                    <span style={mono} className="block text-[14px] font-[600] mt-0.5">
                      {c.preparation} %
                    </span>
                    <span className="block h-1.5 rounded-full bg-[#E8E5DC] overflow-hidden mt-1">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${c.preparation}%`,
                          background: c.preparation >= PREPARATION_VERTE ? "#1D9E75" : "#E85C2B",
                        }}
                      />
                    </span>
                  </>
                )}
              </span>

              <span>
                <span className="block text-[9px] tracking-[0.08em] text-[#A0A3AB] uppercase" style={mono}>
                  {t("colFollowUp")}
                </span>
                <span
                  style={mono}
                  className={
                    "block text-[14px] font-[600] mt-0.5 " +
                    (c.relances > RELANCES_ROUGE ? "text-[#C0392B]" : "text-[#1A1B1F]")
                  }
                >
                  {c.relances}
                </span>
              </span>

              <span>
                <span className="block text-[9px] tracking-[0.08em] text-[#A0A3AB] uppercase" style={mono}>
                  {t("colShowcase")}
                </span>
                <span style={mono} className="block text-[14px] font-[600] mt-0.5">
                  {t("listed", { n: c.listees, total: c.entreprises })}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
