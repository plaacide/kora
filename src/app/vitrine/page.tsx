import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { VitrineClient } from "@/components/showcase/VitrineClient";
import type { FicheCarte } from "@/components/showcase/VitrineGrid";

/**
 * `/vitrine` — ce que voit un investisseur invité (§3 de la spec).
 *
 * AUCUN FILTRE D'ACCÈS N'EST ÉCRIT ICI, et c'est voulu. La policy
 * `showcase_entries_select_invite` ne laisse passer que les fiches publiées
 * des cohortes où l'utilisateur a un accès accepté et non révoqué. Une garde
 * supplémentaire dans cette page donnerait l'illusion que c'est elle qui
 * protège — et le jour où quelqu'un la déplacerait, la vraie protection
 * partirait avec.
 *
 * Une liste vide signifie donc soit « pas invité », soit « rien de publié ».
 * On ne peut pas distinguer les deux sans interroger ce qu'on n'a pas le droit
 * de voir, et c'est très bien ainsi : le message reste le même.
 */
export default async function VitrinePage() {
  const t = await getTranslations("showcase");
  const supabase = await createClient();

  const { data: entrees } = await supabase
    .from("showcase_entries")
    .select("startup_org_id, cohort_id")
    .is("unpublished_at", null);

  const orgIds = [
    ...new Set(((entrees ?? []) as Array<{ startup_org_id: string }>).map((e) => e.startup_org_id)),
  ];

  if (orgIds.length === 0) {
    return (
      <div className="max-w-2xl">
        <EmptyState title={t("noAccessTitle")} description={t("noAccessBody")} />
      </div>
    );
  }

  // Les chiffres viennent de l'ENTREPRISE : sa fiche startup et les
  // indicateurs de sa levée. Jamais du programme (§0 de la spec d'UI).
  const [{ data: startups }, { data: levees }, { data: salles }] = await Promise.all([
    supabase
      .from("startups")
      .select("org_id, name, sector, country, stage, amount_sought_usd, arr_usd")
      .in("org_id", orgIds),
    supabase
      .from("raises")
      .select("org_id, montant_cible, indicateurs")
      .in("org_id", orgIds)
      .eq("statut", "en_cours"),
    supabase.from("deals").select("org_id, readiness_score").in("org_id", orgIds),
  ]);

  const leveeParOrg = new Map(
    ((levees ?? []) as Array<{ org_id: string; montant_cible: number | null; indicateurs: unknown }>)
      .map((r) => [r.org_id, r]),
  );
  const scoreParOrg = new Map<string, number[]>();
  for (const d of (salles ?? []) as Array<{ org_id: string; readiness_score: number | null }>) {
    if (d.readiness_score == null) continue;
    scoreParOrg.set(d.org_id, [...(scoreParOrg.get(d.org_id) ?? []), d.readiness_score]);
  }

  /** Croissance : lue telle qu'elle a été SAISIE, jamais recalculée. */
  const croissanceDe = (indicateurs: unknown): string | null => {
    const parAudience = (indicateurs ?? {}) as Record<string, Array<{ l: string; v: string }>>;
    for (const liste of Object.values(parAudience)) {
      const trouve = (liste ?? []).find((i) =>
        /croissance|growth/i.test(i.l ?? ""),
      );
      if (trouve?.v) return trouve.v;
    }
    return null;
  };

  const fiches: FicheCarte[] = ((startups ?? []) as Array<{
    org_id: string; name: string; sector: string | null; country: string | null;
    stage: string | null; amount_sought_usd: number | null; arr_usd: number | null;
  }>).map((s) => {
    const scores = scoreParOrg.get(s.org_id) ?? [];
    const levee = leveeParOrg.get(s.org_id);
    return {
      orgId: s.org_id,
      nom: s.name,
      secteur: s.sector,
      // La spec dit « secteur · ville ». Aucune colonne « ville » n'existe sur
      // `startups` : on affiche le PAYS, qui existe. Signalé plutôt qu'inventé.
      pays: s.country,
      stade: s.stage,
      recherche: levee?.montant_cible ?? s.amount_sought_usd ?? null,
      arr: s.arr_usd ?? null,
      croissance: croissanceDe(levee?.indicateurs),
      preparation: scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null,
    };
  });

  return <VitrineClient fiches={fiches} />;
}
