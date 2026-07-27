import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import { CohorteForm, type LienCohorte } from "@/components/cohorte/CohorteForm";
import { JOURS_AVANT_EXPIRATION } from "@/lib/demandes-echeance";
import { conseilCohorte } from "@/lib/conseil-cohorte";

/**
 * Au-delà, une invitation jamais ouverte passe « À RELANCER ».
 *
 * Cinq jours, comme la maquette : deux jours c'est encore le délai normal
 * d'une boîte mail, cinq c'est un silence. Le seuil ne s'applique PAS aux
 * invitations ouvertes — celles-là gardent leur statut, parce que « a vu et
 * n'a pas fini » appelle un autre geste que « n'a rien vu ».
 */
const JOURS_AVANT_RELANCE = 5;
import { aujourdhuiIso } from "@/lib/echeance";
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
      .select("id, email, company_name, status, created_at, relaunched_at, opened_at, startup_org_id")
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
    // PAS de jointure sur `organizations` : sa politique exige d'être MEMBRE
    // de l'organisation lue, et le programme ne l'est pas — c'est le principe
    // même de la §0.1. La jointure renvoyait null et l'écran affichait « — »
    // à la place du nom. La fonction rend l'identifiant et le nom, rien d'autre.
    supabase.rpc("cohort_members_named", { p_cohort: cohorteId }),
  ]);

  const membresListe = ((membres ?? []) as unknown as Array<{
    startup_org_id: string;
    name: string | null;
    sector: string | null;
    country: string | null;
  }>).map((m) => ({
    orgId: m.startup_org_id,
    nom: m.name ?? "—",
    secteur: m.sector,
    pays: m.country,
  }));
  const nomParOrgId = new Map(membresListe.map((m) => [m.orgId, m.nom]));
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
      secteur: m.secteur,
      pays: m.pays,
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

  // « mars → décembre 2026 » : la période cadre tout le reste de l'écran. Une
  // cohorte sans dates n'en affiche pas plutôt qu'un tiret — l'absence de dates
  // est un choix du programme, pas une donnée manquante.
  const c = cohorte as { starts_on?: string | null; ends_on?: string | null } | null;
  const moisAn = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    month: "long",
    year: "numeric",
  });
  const mois = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    month: "long",
  });
  const periode = c?.starts_on
    ? c.ends_on
      ? `${mois.format(new Date(c.starts_on))} → ${moisAn.format(new Date(c.ends_on))}`
      : moisAn.format(new Date(c.starts_on))
    : null;
  const totalSalles = lignes.reduce((n, l) => n + l.salles, 0);
  const limite =
    (profil?.organizations as unknown as { cohort_limit?: number } | null)
      ?.cohort_limit ?? 10;
  // On compte comme la base : les liens non révoqués occupent une place.
  const occupe = liens.filter((l) => l.status !== "revoked").length;

  // L'âge des invitations et leur verdict, calculés ici : lire l'horloge dans
  // le rendu d'un composant client viole `react-hooks/purity`. Le décompte part
  // de la dernière RELANCE quand il y en a eu une — même définition que
  // `accept_cohort_link`, sinon l'écran et la base ne diraient pas la même
  // chose sur ce qui a expiré.
  const maintenant = aujourdhuiIso();
  const invitations: LienCohorte[] = (
    (data ?? []) as unknown as Array<{
      id: string; email: string; company_name: string | null;
      status: "pending" | "accepted" | "revoked";
      created_at: string; relaunched_at: string | null; opened_at: string | null;
      startup_org_id: string | null;
    }>
  ).map((l) => {
    const jours = Math.floor(
      (new Date(maintenant).getTime() -
        new Date(l.relaunched_at ?? l.created_at).getTime()) /
        86400000,
    );
    // TROIS STATUTS, dans l'ordre où ils comptent pour le programme :
    //  · périmée — plus rien à en tirer, il faut la relancer ;
    //  · LIEN OUVERT — elle a vu et n'a pas fini : c'est celle qu'on appelle ;
    //  · À RELANCER — envoyée, jamais ouverte, et ça traîne.
    // Une invitation ouverte reste « ouverte » quel que soit son âge : le fait
    // qu'elle ait été vue prime sur le temps écoulé.
    const statut =
      jours >= JOURS_AVANT_EXPIRATION
        ? ("expiree" as const)
        : l.opened_at
          ? ("ouverte" as const)
          : jours >= JOURS_AVANT_RELANCE
            ? ("a_relancer" as const)
            : ("envoyee" as const);
    return {
      id: l.id,
      email: l.email,
      companyName: l.company_name,
      status: l.status,
      statut,
      jours,
      // Une fois acceptée, c'est le nom RÉEL de l'organisation qui fait foi —
      // celui saisi à l'invitation n'était qu'une approximation du programme.
      orgNom: l.startup_org_id ? (nomParOrgId.get(l.startup_org_id) ?? null) : null,
    };
  });

  // Invitations parties et sans réponse — ni acceptées, ni retirées, ni
  // périmées. C'est ce qui « court » au sens de la §3.
  const enAttente = invitations.filter(
    (l) => l.status === "pending" && l.statut !== "expiree",
  ).length;

  // LE CONSEIL DU JOUR. Il NOMME quelqu'un : sans nom, c'est un bandeau ; avec,
  // c'est une consigne. Un seul, le plus urgent — trois empilés ne se lisent pas.
  const premiereOuverte = invitations.find(
    (l) => l.status === "pending" && l.statut === "ouverte",
  );
  const arriveeVide = lignes.find((l) => l.salles === 0 || !l.dossierEntame);
  const entameeSansAccord = lignes.find((l) => l.dossierEntame && !l.consent);
  const conseil = conseilCohorte({
    membres: lignes.length,
    salles: totalSalles,
    enAttente,
    envoyees: invitations.filter((l) => l.status !== "revoked").length,
    ouverteSansSuite:
      premiereOuverte?.orgNom ?? premiereOuverte?.companyName ?? premiereOuverte?.email ?? null,
    arriveeSansDossier: arriveeVide?.nom ?? null,
    entameeSansAccord: entameeSansAccord?.nom ?? null,
  });

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
            {/* §3 : « Ne jamais afficher 0 entreprise quand des invitations
                courent. » Un programme qui vient d'inviter trois entreprises
                et lit « 0 entreprises » croit que son geste s'est perdu. */}
            {/* Sous-ligne de la maquette : période, puis l'état réel. Une
                cohorte sans membre parle en INVITATIONS (« 3 envoyées ·
                0 acceptée ») ; dès qu'une entreprise est là, elle parle en
                entreprises. Ce ne sont pas les mêmes questions. */}
            <p className="text-[12.5px] text-[#6E727A] mt-1">
              {periode && <span>{periode} · </span>}
              {lignes.length === 0 && enAttente > 0 ? (
                <>
                  {t("invitesSent", { n: enAttente })} ·{" "}
                  <span>{t("invitesAccepted", { n: 0 })}</span>
                </>
              ) : (
                <>
                  {t("companies", { n: lignes.length })} ·{" "}
                  {t("rooms", { n: totalSalles })}
                  {enAttente > 0 && (
                    <span className="text-[#B4741B]">
                      {" · "}
                      {t("pendingInvites", { n: enAttente })}
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
          {/* Actions d'en-tête de la maquette. « Rapport bailleur » avait été
              retiré quand /rapports n'existait pas ; l'écran existe depuis, le
              bouton revient. « Publier le dealroom » mène là où la publication
              se pilote — il ne publie pas d'ici, ce serait un second endroit
              pour un même geste. */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[12px] text-[#8B8FA3]">
              {occupe} / {limite} places
            </span>
            <Link
              href={`/rapports?cohorte=${cohorteId}`}
              className="rounded-[5px] border border-[#E4E2DC] bg-white px-3.5 py-2 text-[12.5px] font-[550] text-[#33353B] hover:border-[#C9C6BD]"
            >
              {t("funderReport")}
            </Link>
            <Link
              href="/dealroom"
              className="rounded-[5px] bg-[#E85C2B] px-3.5 py-2 text-[12.5px] font-[600] text-white hover:bg-[#D24E1F]"
            >
              {t("publishDealroom")}
            </Link>
          </div>
        </div>
      </div>

      {conseil && (
        <p className="text-[12.5px] text-[#55585F] leading-relaxed max-w-2xl bg-white border border-[#E8E5DC] rounded-[8px] px-4 py-3">
          {t(`advice.${conseil.cle}`, conseil.params)}
        </p>
      )}

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

          {/* LE FORMULAIRE SUIT IMMÉDIATEMENT ce qui demande d'agir. Il vivait
              en bas de page, sous le panneau de questions et un paragraphe
              d'explication : l'écran disait « invitez vos premières
              entreprises » et cachait le moyen de le faire six cents pixels
              plus bas. */}
          <div className="mt-4">
            <Card>
              <CardBody>
                <CohorteForm cohorteId={cohorteId} liens={invitations} />
              </CardBody>
            </Card>
          </div>
        </div>
        <QuestionsPanel cohorteId={cohorteId} echanges={echanges} entreprises={membresListe} />
      </div>

      <p className="text-[11.5px] text-ink-muted leading-relaxed max-w-lg">
        Rejoindre votre cohorte ne vous donne accès à aucun document. Vous
        voyez le stade, le montant recherché, la préparation et les pièces
        manquantes. Pour consulter des documents, la startup doit vous inviter
        dans sa data room — c’est elle qui décide.
      </p>
    </div>
  );
}
