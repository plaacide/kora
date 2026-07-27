import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import { CohorteForm, type LienCohorte } from "@/components/cohorte/CohorteForm";
import { CohorteTable, type LigneEntreprise } from "@/components/cohorte/CohorteTable";
import { QuestionsPanel, type Echange } from "@/components/cohorte/QuestionsPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Locale } from "@/i18n/locales";

/**
 * La cohorte, côté programme : qui a été invité, qui a rejoint.
 *
 * L'écran ne montre PAS l'avancement — c'est le portefeuille qui s'en charge.
 * Ici on gère la relation, là-bas on la pilote. Mélanger les deux ferait un
 * écran qui répond mal à deux questions au lieu de bien à une.
 */
export default async function CohortePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // L'écran `/cohorte` devient le DÉTAIL d'une cohorte (règles §1). Il listait
  // tous les liens de l'organisation ; il ne montre plus que ceux de la
  // cohorte demandée — sans quoi un programme à trois cohortes verrait les
  // trois mélangées sur chacune.
  const { id: cohorteId } = await params;
  const t = await getTranslations("cohorts");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data }, { data: profil }] = await Promise.all([
    supabase
      .from("cohort_links")
      .select("id, email, status, created_at, organizations!cohort_links_startup_org_id_fkey(name)")
      // Sans ce filtre, un programme à trois cohortes verrait les trois
      // mélangées sur chacune — l'écran mentirait sur ce qu'il montre.
      .eq("cohort_id", cohorteId)
      .order("created_at", { ascending: false }),
    // Le palier vit sur l'organisation. On lit celle du membre — l'écran est
    // réservé au programme, il n'en a qu'une.
    supabase
      .from("memberships")
      .select("organizations(cohort_limit)")
      .eq("user_id", user?.id ?? "")
      .order("created_at")
      .limit(1)
      .maybeSingle(),
  ]);

  const liens = (data ?? []) as unknown as LienCohorte[];

  // La cohorte elle-même, puis ses membres et tout ce qui les décrit. Aucune
  // de ces requêtes ne touche un DOCUMENT : la règle §0.1 veut que le
  // programme voie des ÉTATS, jamais un contenu.
  const [{ data: cohorte }, { data: membres }] = await Promise.all([
    supabase.from("cohorts").select("id, name, starts_on, ends_on").eq("id", cohorteId).maybeSingle(),
    supabase
      .from("cohort_members")
      .select("startup_org_id, organizations!cohort_members_startup_org_id_fkey(name)")
      .eq("cohort_id", cohorteId),
  ]);

  const membresListe = ((membres ?? []) as unknown as Array<{
    startup_org_id: string;
    organizations: { name: string } | { name: string }[];
  }>).map((m) => ({
    orgId: m.startup_org_id,
    nom: (Array.isArray(m.organizations) ? m.organizations[0] : m.organizations)?.name ?? "—",
  }));
  const orgIds = membresListe.map((m) => m.orgId);

  const [{ data: consentements }, { data: vitrine }, { data: sallesData }, { data: leveesData }, { data: fils }] =
    await Promise.all([
      orgIds.length
        ? supabase
            .from("listing_consents")
            .select("startup_org_id, deal_id, revoked_at")
            .eq("cohort_id", cohorteId)
            .in("startup_org_id", orgIds)
        : Promise.resolve({ data: [] }),
      orgIds.length
        ? supabase
            .from("showcase_entries")
            .select("startup_org_id")
            .eq("cohort_id", cohorteId)
            .is("unpublished_at", null)
        : Promise.resolve({ data: [] }),
      // Salles et scores : des AGRÉGATS, pas des pièces.
      orgIds.length
        ? supabase.from("deals").select("id, org_id, readiness_score").in("org_id", orgIds)
        : Promise.resolve({ data: [] }),
      orgIds.length
        ? supabase.from("raises").select("org_id, montant_cible, devise").in("org_id", orgIds).eq("statut", "en_cours")
        : Promise.resolve({ data: [] }),
      orgIds.length
        ? supabase
            .from("program_threads")
            .select("id, type, status, body, startup_org_id, created_at")
            .in("startup_org_id", orgIds)
            .order("created_at", { ascending: false })
            .limit(30)
        : Promise.resolve({ data: [] }),
    ]);

  // « Dossier entamé » se mesure sur le nombre de pièces, jamais sur leur
  // contenu : c'est un compte, et il conditionne la publication.
  const dealIds = ((sallesData ?? []) as Array<{ id: string }>).map((d) => d.id);
  const { data: piecesData } = dealIds.length
    ? await supabase.from("documents").select("deal_id").in("deal_id", dealIds)
    : { data: [] };
  const dealsAvecPiece = new Set(((piecesData ?? []) as Array<{ deal_id: string }>).map((d) => d.deal_id));

  const consentParOrg = new Map(
    ((consentements ?? []) as Array<{ startup_org_id: string; deal_id: string | null; revoked_at: string | null }>)
      .filter((c) => !c.revoked_at)
      .map((c) => [c.startup_org_id, c.deal_id]),
  );
  const listees = new Set(((vitrine ?? []) as Array<{ startup_org_id: string }>).map((v) => v.startup_org_id));

  const sallesParOrg = new Map<string, { ids: string[]; scores: number[] }>();
  for (const d of (sallesData ?? []) as Array<{ id: string; org_id: string; readiness_score: number | null }>) {
    const cur = sallesParOrg.get(d.org_id) ?? { ids: [], scores: [] };
    cur.ids.push(d.id);
    if (d.readiness_score != null) cur.scores.push(d.readiness_score);
    sallesParOrg.set(d.org_id, cur);
  }
  const montantParOrg = new Map<string, number>();
  let devise = "XOF";
  for (const r of (leveesData ?? []) as Array<{ org_id: string; montant_cible: number | null; devise: string | null }>) {
    montantParOrg.set(r.org_id, (montantParOrg.get(r.org_id) ?? 0) + (r.montant_cible ?? 0));
    if (r.devise) devise = r.devise;
  }

  const lignes: LigneEntreprise[] = membresListe.map((m) => {
    const salles = sallesParOrg.get(m.orgId) ?? { ids: [], scores: [] };
    const dealDesigne = consentParOrg.get(m.orgId);
    return {
      orgId: m.orgId,
      nom: m.nom,
      salles: salles.ids.length,
      recherche: montantParOrg.get(m.orgId) ?? 0,
      preparation: salles.scores.length
        ? Math.round(salles.scores.reduce((s, n) => s + n, 0) / salles.scores.length)
        : null,
      // Listable seulement si le consentement vit ET désigne une salle.
      consent: consentParOrg.has(m.orgId) && !!dealDesigne,
      consentPartiel: consentParOrg.has(m.orgId) && !dealDesigne,
      listee: listees.has(m.orgId),
      dossierEntame: salles.ids.some((id) => dealsAvecPiece.has(id)),
    };
  });

  const nomParOrg = new Map(membresListe.map((m) => [m.orgId, m.nom]));
  const dateCourte = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
  });
  const echanges: Echange[] = ((fils ?? []) as Array<{
    id: string; type: "question" | "suggestion"; status: "open" | "answered" | "read";
    body: string; startup_org_id: string; created_at: string;
  }>).map((f) => ({
    id: f.id,
    type: f.type,
    status: f.status,
    body: f.body,
    entreprise: nomParOrg.get(f.startup_org_id) ?? "—",
    date: dateCourte.format(new Date(f.created_at)),
  }));

  const nomCohorte = (cohorte as { name?: string } | null)?.name ?? "";
  const totalSalles = lignes.reduce((n, l) => n + l.salles, 0);
  const limite =
    (profil?.organizations as unknown as { cohort_limit?: number } | null)
      ?.cohort_limit ?? 10;
  // On compte comme la base : les liens non révoqués occupent une place.
  const occupe = liens.filter((l) => l.status !== "revoked").length;

  return (
    <div className="flex flex-col gap-5 text-[#1A1B1F]">
      {/* Fil d'Ariane : sans lui, on ne sait plus de quelle cohorte on parle
          dès qu'un programme en a plusieurs. */}
      <div>
        <div className="flex items-center gap-1.5 text-[12.5px] mb-1.5">
          <Link href="/cohortes" className="text-[#9DA0A8] hover:text-[#1A1B1F]">
            {t("breadcrumb")}
          </Link>
          <span className="text-[#D5D2CA]">/</span>
          <span className="font-[600]">{nomCohorte}</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[24px] font-[700] tracking-[-0.02em]">{nomCohorte}</h1>
            <p className="text-[12.5px] text-[#6E727A] mt-1">
              {t("companies", { n: lignes.length })} · {t("rooms", { n: totalSalles })}
            </p>
          </div>
          <span className="text-[12px] text-[#8B8FA3]">
            {occupe} / {limite} places
          </span>
        </div>
        {/* « Rapport bailleur » attend son écran (/rapports, §6 des règles) :
            absent plutôt qu'inerte, comme la règle produit l'exige. */}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 min-w-0">
          {lignes.length === 0 ? (
            <EmptyState
              title={t("membersEmptyTitle")}
              description={t("membersEmptyBody")}
              foot={t("membersEmptyFoot")}
            />
          ) : (
            <CohorteTable cohorteId={cohorteId} lignes={lignes} devise={devise} />
          )}
        </div>
        <QuestionsPanel cohorteId={cohorteId} echanges={echanges} entreprises={membresListe} />
      </div>

      <Card>
        <CardBody>
          <CohorteForm liens={(data ?? []) as unknown as LienCohorte[]} />
        </CardBody>
      </Card>

      <p className="text-[11.5px] text-ink-muted leading-relaxed max-w-lg">
        Rejoindre votre cohorte ne vous donne accès à aucun document. Vous
        voyez le stade, le montant recherché, la préparation et les pièces
        manquantes. Pour consulter des documents, la startup doit vous inviter
        dans sa data room — c’est elle qui décide.
      </p>
    </div>
  );
}
