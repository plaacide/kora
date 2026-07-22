import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/access";
import { getCurrentDeal } from "@/lib/current-deal";
import { MaLevee } from "@/components/deal/MaLevee";
import { NewDataRoomButton } from "@/components/dataroom/RoomsList";
import type { Raise, RaiseInvestor } from "@/lib/raise";

/**
 * « Ma levée » — refonte handoff app v5 (§4).
 *
 * Désormais RÉELLE : montant, type, valorisation, clôture, audience, montant
 * engagé (donc soft-commitments) viennent de la table `raises`, éditables via
 * le modal « Modifier la levée ». Le pipeline investisseur détaillé (tickets
 * par personne) et la vitrine d'indicateurs restent à venir ; on affiche à la
 * place les invitations réelles.
 */
export default async function DealPage() {
  const supabase = await createClient();
  await requireInternal(supabase);

  const { deal } = await getCurrentDeal(supabase);
  if (!deal) {
    return (
      <div className="flex flex-col gap-5 max-w-2xl text-[#1A1B1F]">
        <h1 className="font-display text-[27px] font-[700] tracking-[-0.025em]">Ma levée</h1>
        <div className="border border-dashed border-[#D5D2CA] rounded-[8px] px-6 py-12 text-center">
          <span className="mx-auto grid place-items-center w-12 h-12 rounded-[8px] bg-[#FBEDE6] text-[#C24619] mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>
          </span>
          <h2 className="text-[15px] font-[700]">Vous n&apos;avez pas encore de levée</h2>
          <p className="text-[12.5px] text-[#6E727A] mt-1.5 mb-5 max-w-md mx-auto leading-relaxed">
            Créez votre levée pour renseigner votre montant recherché, votre audience et votre pipeline d&apos;investisseurs. Ses documents vivront dans sa data room.
          </p>
          <div className="flex justify-center">
            <NewDataRoomButton label="Créer ma levée" fixedObjectif="levee" />
          </div>
        </div>
      </div>
    );
  }

  const [{ data: exigences }, raisesRes, investorsRes, { data: membres }, { data: docs }, { data: vues }, ndaRes] =
    await Promise.all([
      supabase
        .from("checklist_items")
        .select("label, status, folder_id")
        .eq("deal_id", deal.id)
        .order("category")
        .order("position"),
      // Tolérant : renvoie une erreur tant que la migration `raises` n'est pas
      // appliquée → on retombe sur « aucune levée renseignée ».
      supabase
        .from("raises")
        .select(
          "id, montant_cible, montant_engage, devise, type_tour, stade, valorisation_pre, date_cloture, audience, description, statut, indicateurs",
        )
        .eq("deal_id", deal.id)
        .order("created_at", { ascending: false }),
      // Pipeline curé (tolérant tant que la migration pipeline n'est pas passée).
      supabase
        .from("raise_investors")
        .select("id, nom, organisation, email, ticket, statut")
        .eq("deal_id", deal.id)
        .order("created_at", { ascending: true }),
      // Équipe sur la levée = membres INTERNES de l'org (pas les invités).
      supabase
        .from("memberships")
        .select("role, profiles!inner(full_name, email)")
        .eq("org_id", deal.org_id)
        .in("role", ["owner", "admin", "member"]),
      // Documents clés = documents réels du deal (les plus regardés d'abord).
      supabase
        .from("documents")
        .select("id, name, is_key, document_versions!documents_current_version_fk(mime_type)")
        .eq("deal_id", deal.id),
      supabase
        .from("audit_log")
        .select("target_id")
        .eq("deal_id", deal.id)
        .in("action", ["document.page_viewed", "document.sheet_viewed"]),
      // Réglage NDA de la data room (tolérant si la colonne n'existe pas encore).
      supabase.from("deals").select("nda_required").eq("id", deal.id).maybeSingle(),
    ]);

  const ndaDefault = !!(ndaRes.data as { nda_required?: boolean } | null)?.nda_required;

  const liste = (exigences ?? []) as { label: string; status: string; folder_id: string | null }[];
  const missing = liste
    .filter((i) => i.status !== "done")
    .map((i) => ({ label: i.label, folderId: i.folder_id }));

  const raises = (raisesRes.data ?? []) as Raise[];
  const enCours = raises.find((r) => r.statut === "en_cours") ?? null;
  const cloturees = raises.filter((r) => r.statut === "cloturee");
  const investisseurs = (investorsRes.data ?? []) as RaiseInvestor[];

  // Équipe : normalise l'embed (PostgREST renvoie un tableau pour le to-one).
  type Prof = { full_name: string; email: string };
  const team = ((membres ?? []) as unknown as Array<{ role: string; profiles: Prof | Prof[] }>)
    .map((m) => {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return { name: p?.full_name || (p?.email ?? "").split("@")[0] || "—", role: m.role };
    })
    .filter((m) => m.name !== "—");

  // Documents clés : compte de vues réel par document, tri décroissant, top 5.
  const vuesParDoc = new Map<string, number>();
  for (const v of (vues ?? []) as { target_id: string | null }[]) {
    const id = v.target_id ?? "";
    if (id) vuesParDoc.set(id, (vuesParDoc.get(id) ?? 0) + 1);
  }
  function typeCourt(mime: string | null | undefined): string {
    const m = (mime ?? "").toLowerCase();
    if (m.includes("pdf")) return "PDF";
    if (m.includes("sheet") || m.includes("excel") || m.includes("csv")) return "CSV";
    if (m.includes("word") || m.includes("document")) return "DOC";
    return "FILE";
  }
  const tousDocs = ((docs ?? []) as unknown as Array<{
    id: string;
    name: string;
    is_key?: boolean;
    document_versions: { mime_type: string | null } | { mime_type: string | null }[] | null;
  }>).map((d) => {
    const dv = Array.isArray(d.document_versions) ? d.document_versions[0] : d.document_versions;
    return { id: d.id, name: d.name, type: typeCourt(dv?.mime_type), vues: vuesParDoc.get(d.id) ?? 0, is_key: !!d.is_key };
  });
  // Documents clés = ceux marqués d'une étoile ; à défaut, les plus regardés.
  const etoiles = tousDocs.filter((d) => d.is_key);
  const keyDocs = (etoiles.length > 0 ? etoiles : [...tousDocs].sort((a, b) => b.vues - a.vues)).slice(0, 5);

  return (
    <MaLevee
      dealName={deal.name}
      dealId={deal.id}
      readiness={deal.readiness_score ?? 0}
      missing={missing}
      objectif={deal.objectif}
      raise={enCours}
      closedRaises={cloturees}
      investors={investisseurs}
      team={team}
      keyDocs={keyDocs}
      ndaDefault={ndaDefault}
    />
  );
}
