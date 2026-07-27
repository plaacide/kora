import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FicheEntreprise } from "@/components/showcase/FicheEntreprise";
import { JOURS_AVANT_BANDEAU, type Lecture, type IndicateurSaisi } from "@/lib/vitrine-indicateurs";
import { joursRestants } from "@/lib/echeance";
import type { Locale } from "@/i18n/locales";

/**
 * La fiche d'une entreprise listée (§4).
 *
 * La RLS décide seule de ce qui est visible : une entreprise non publiée, ou
 * publiée dans une cohorte où l'on n'est pas invité, ne remonte pas — et
 * l'écran répond « introuvable » plutôt que « accès refusé ». Un « accès
 * refusé » confirmerait l'existence de la fiche à quelqu'un qui n'a pas à le
 * savoir.
 */
export default async function FichePage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ lecture?: string }>;
}) {
  const { org } = await params;
  const { lecture } = await searchParams;
  const t = await getTranslations("showcase");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  // Point d'entrée obligatoire : si aucune entrée de vitrine visible ne
  // correspond, on s'arrête là. Interroger `startups` d'abord aurait laissé
  // fuiter l'existence d'une entreprise non listée.
  const { data: entree } = await supabase
    .from("showcase_entries")
    .select("startup_org_id")
    .eq("startup_org_id", org)
    .is("unpublished_at", null)
    .limit(1)
    .maybeSingle();
  if (!entree) notFound();

  // La demande DÉJÀ FAITE par ce visiteur sur cette entreprise. Sans elle, un
  // rechargement remettait le bouton « Demander l'accès » et l'investisseur
  // redemandait, croyant que la première fois n'avait pas marché. La RLS ne
  // lui montre que les siennes.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: demandeData } = user
    ? await supabase
        .from("access_requests")
        .select("id, status, created_at, relaunched_at")
        .eq("startup_org_id", org)
        .eq("investor_user", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const d = demandeData as {
    id: string; status: string; created_at: string; relaunched_at: string | null;
  } | null;
  const demande = d
    ? { id: d.id, statut: d.status, creeLe: d.created_at, relanceeLe: d.relaunched_at }
    : null;

  const [{ data: startup }, { data: levee }, { data: salles }] = await Promise.all([
    supabase
      .from("startups")
      .select("name, sector, country, stage, amount_sought_usd, updated_at")
      .eq("org_id", org)
      .maybeSingle(),
    supabase
      .from("raises")
      .select("montant_cible, devise, indicateurs")
      .eq("org_id", org)
      .eq("statut", "en_cours")
      .limit(1)
      .maybeSingle(),
    supabase.from("deals").select("readiness_score").eq("org_id", org),
  ]);
  if (!startup) notFound();

  const s = startup as {
    name: string; sector: string | null; country: string | null; stage: string | null;
    amount_sought_usd: number | null; updated_at: string | null;
  };
  const r = levee as { montant_cible: number | null; devise: string | null; indicateurs: unknown } | null;

  // Les indicateurs de TOUTES les audiences sont mis à plat : un fondateur a pu
  // ranger son ARR sous « vc » et sa couverture de dette sous « banque ». La
  // fiche cherche des VALEURS, pas une audience.
  const parAudience = (r?.indicateurs ?? {}) as Record<string, IndicateurSaisi[]>;
  const indicateurs: IndicateurSaisi[] = Object.values(parAudience).flat().filter(Boolean);

  const scores = ((salles ?? []) as Array<{ readiness_score: number | null }>)
    .map((d) => d.readiness_score)
    .filter((n): n is number => n != null);

  const argent = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const montant = r?.montant_cible ?? s.amount_sought_usd;

  const dateFmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", { dateStyle: "long" });
  const maj = s.updated_at ? new Date(s.updated_at) : null;
  // `joursRestants` isole `Date.now()` hors du rendu : l'appeler ici
  // directement viole `react-hooks/purity`, que ce dépôt applique. Une date
  // passée renvoie un nombre négatif — d'où le seuil en négatif.
  const anciennete = joursRestants(s.updated_at);
  const perime = anciennete != null && anciennete < -JOURS_AVANT_BANDEAU;

  return (
    <>
      {/* Bandeau au-delà de trois mois : des chiffres vieux présentés sans date
          se lisent comme des chiffres d'aujourd'hui. */}
      {perime && (
        <div className="max-w-[760px] mb-4 rounded-[6px] border border-[#F0C4AE] bg-[#FEFAF7] px-4 py-2.5 text-[12.5px] text-[#C24619]">
          {t("stale")}
        </div>
      )}
      <FicheEntreprise
        orgId={org}
        nom={s.name}
        secteur={s.sector}
        pays={s.country}
        stade={s.stage}
        recherche={montant != null ? `${argent.format(montant)} ${r?.devise ?? ""}`.trim() : null}
        preparation={
          scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
        }
        indicateurs={indicateurs}
        majDate={maj ? dateFmt.format(maj) : null}
        lectureInitiale={(lecture === "dette" ? "dette" : "equity") as Lecture}
        demande={demande}
      />
    </>
  );
}
