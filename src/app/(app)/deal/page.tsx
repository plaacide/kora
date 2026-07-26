import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/access";
import { getCurrentDeal } from "@/lib/current-deal";
import { isoDans } from "@/lib/echeance";
import { MaLevee } from "@/components/deal/MaLevee";
import { MesLeveesBar, type LeveeChip } from "@/components/deal/MesLeveesBar";
import { NewDataRoomButton } from "@/components/dataroom/RoomsList";
import { ResonanceArcs } from "@/components/brand/ResonanceArcs";
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
const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

export default async function DealPage() {
  const t = await getTranslations("deal.raise");
  const supabase = await createClient();
  await requireInternal(supabase);

  const { deal, deals } = await getCurrentDeal(supabase);
  const dataRooms = deals.map((d) => ({ id: d.id, name: d.name }));
  if (!deal) {
    return (
      // Levée sans data room — première connexion (handoff §4.2).
      //
      // On garde le titre, le message et l'action de l'écran existant, et on
      // remplace le seul cadre pointillé par ce qui manquait : le PARCOURS (on
      // ne peut pas ouvrir une levée avant d'avoir la salle) et un aperçu de
      // l'écran d'arrivée, chiffré comme la maquette. La règle « jamais de
      // données inventées » vise ce qui se fait passer POUR celles de
      // l'utilisateur : un exemple nommément marqué n'en relève pas, et le
      // panneau de connexion en montre déjà un.
      <div className="flex flex-col gap-5 text-[#1A1B1F]">
        <h1 className="font-display text-[27px] font-[700] tracking-[-0.025em]">{t("myRaise")}</h1>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="relative overflow-hidden h-full flex flex-col bg-white border border-[#E2DED4] rounded-[8px] px-6 py-7">
            {/* 320 et non 480 : à 480 les arcs débordaient au MILIEU de la
                carte et se lisaient comme une tache, au lieu de se loger dans
                le coin. La taille se règle sur le conteneur, pas sur l'écran. */}
            <ResonanceArcs corner="bottom-right" size={220} tone="light" subtle />
            <div className="relative z-10 flex flex-col flex-1">
              <h2 className="text-[15px] font-[700]">{t("noDataRoom")}</h2>
              <p className="text-[12.5px] text-[#6E727A] mt-1.5 leading-relaxed max-w-md">{t("noRoomBody")}</p>

              <ol className="flex flex-col gap-3.5 mt-6 flex-1">
                {[
                  { n: 1, actif: true, titre: t("pathStep1"), corps: t("pathStep1Body") },
                  { n: 2, actif: false, titre: t("pathStep2"), corps: t("pathStep2Body") },
                ].map((e) => (
                  <li key={e.n} className="flex gap-3" style={e.actif ? undefined : { opacity: 0.6 }}>
                    <span
                      style={mono}
                      className={
                        "grid place-items-center w-6 h-6 shrink-0 rounded-full text-[10.5px] font-[600] " +
                        (e.actif ? "bg-[#171A2C] text-white" : "bg-[#F1F0EB] text-[#8B8FA3]")
                      }
                    >
                      {e.n}
                    </span>
                    <span>
                      <span className="block text-[13px] font-[600]">{e.titre}</span>
                      <span className="block text-[12px] text-[#6E727A] mt-0.5 leading-relaxed">{e.corps}</span>
                    </span>
                  </li>
                ))}
              </ol>

              <div className="mt-6">
                <NewDataRoomButton label={t("createDataRoom")} />
              </div>
            </div>
          </div>

          {/* Aperçu illustratif, avec de vrais chiffres — comme la maquette, et
              comme la carte d'exemple du panneau de connexion. Il porte la même
              entreprise fictive (Kalyx Foods) que celle-ci : un seul exemple
              dans tout le produit se reconnaît, deux sèment le doute.
              L'étiquette et la mention disent explicitement que rien ici n'est
              à l'utilisateur — c'est cette marque, et non l'absence de
              chiffres, qui empêche de confondre l'exemple avec ses données. */}
          <div className="relative overflow-hidden h-full flex flex-col rounded-[8px] bg-[#171A2C] px-6 py-6">
            <ResonanceArcs corner="top-right" size={240} tone="dark" subtle />
            <div className="relative z-10 flex flex-col flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-[700] text-white">{t("previewTitle")}</span>
                <span style={mono} className="text-[8.5px] font-[600] tracking-[0.12em] text-[#F08A5E] border border-[#F08A5E]/35 rounded-[3px] px-1.5 py-[3px] whitespace-nowrap">
                  {t("previewTag")}
                </span>
              </div>

              <div className="mt-5 rounded-[6px] bg-white/[0.06] px-4 py-4 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[13.5px] font-[650] text-white truncate">{t("previewCompany")}</span>
                  <span style={mono} className="shrink-0 text-[9px] font-[600] uppercase tracking-[0.06em] text-[#F08A5E] bg-[#E85C2B]/15 rounded-[4px] px-2 py-[3px]">
                    {t("previewStage")}
                  </span>
                </div>

                <div className="text-[10.5px] text-white/45 mt-3">{t("amountSought")}</div>
                <div style={mono} className="text-[22px] font-[600] tracking-[-0.03em] text-white mt-0.5">
                  {t("previewAmount")}
                </div>
                <span className="block h-1.5 rounded-full bg-white/10 overflow-hidden mt-2.5">
                  <span className="block h-full w-[38%] rounded-full bg-[#E85C2B]" />
                </span>
                <div className="text-[11px] text-white/55 mt-1.5">{t("previewCommitted")}</div>

                <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-white/10">
                  {[
                    { l: t("previewKpiArr"), v: t("previewKpiArrValue") },
                    { l: t("previewKpiGrowth"), v: t("previewKpiGrowthValue") },
                    { l: t("previewKpiClients"), v: t("previewKpiClientsValue") },
                  ].map((k) => (
                    <div key={k.l}>
                      <div className="text-[9.5px] text-white/40 uppercase tracking-[0.06em]">{k.l}</div>
                      <div style={mono} className="text-[14px] font-[600] text-white mt-1">{k.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-white/40 mt-3.5 leading-relaxed">{t("previewNote")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [{ data: exigences }, raisesRes, investorsRes, { data: membres }, { data: docs }, { data: vues }, ndaRes, permsRes, derniereVueRes, lectureRes] =
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
          "id, name, montant_cible, montant_engage, devise, type_tour, stade, valorisation_pre, date_cloture, audience, description, statut, indicateurs",
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
        .select("role, profiles!inner(full_name, email, job_title)")
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
      // §2.5 « Accès actifs » — source vérifiée : un droit NON nul et NON expiré
      // sur la salle. Compter les invitations donnerait les envois, pas les accès.
      supabase
        .from("permissions")
        .select("user_id, level, expires_at")
        .eq("deal_id", deal.id)
        .neq("level", "none")
        // Filtre d'expiration côté base : lire l'horloge pendant le rendu est
        // signalé par le compilateur React (cf. echeance.ts).
        .or(`expires_at.is.null,expires_at.gt.${isoDans(0)}`),
      // §2.5 « Dernière consultation » — dernier événement de lecture réel.
      supabase
        .from("audit_log")
        .select("actor_email, target_id, created_at")
        .eq("deal_id", deal.id)
        .in("action", ["document.page_viewed", "document.sheet_viewed"])
        .order("created_at", { ascending: false })
        .limit(1),
      // Durée mesurée, pas estimée (table page_dwell).
      supabase.rpc("deal_reading_time", { p_deal: deal.id }),
    ]);

  const ndaDefault = !!(ndaRes.data as { nda_required?: boolean } | null)?.nda_required;

  // §2.5 — accès actifs : personnes distinctes ayant un droit valide (les
  // droits expirés sont déjà écartés par la requête).
  const accesActifs = new Set(
    ((permsRes.data ?? []) as { user_id: string }[]).map((p) => p.user_id),
  ).size;

  const liste = (exigences ?? []) as { label: string; status: string; folder_id: string | null }[];
  const missing = liste
    .filter((i) => i.status !== "done")
    .map((i) => ({ label: i.label, folderId: i.folder_id }));

  // Le « socle » du bandeau de mise en route : les premières exigences de la
  // checklist, dans l'ordre du modèle (category, position) — donc celles que
  // le modèle lui-même juge prioritaires. C'est un ENSEMBLE identifié, pas un
  // plafond : on compte celles qui sont réellement fournies.
  //
  // Le total n'est pas figé à 5. Une data room créée sans modèle n'a aucune
  // exigence : annoncer « 0 sur 5 » y serait un chiffre inventé.
  const socle = liste.slice(0, 5);
  const socleTotal = socle.length;
  const socleFaits = socle.filter((i) => i.status === "done").length;

  const raises = (raisesRes.data ?? []) as Raise[];
  const enCours = raises.find((r) => r.statut === "en_cours") ?? null;
  const cloturees = raises.filter((r) => r.statut === "cloturee");
  const investisseurs = (investorsRes.data ?? []) as RaiseInvestor[];

  // Équipe : normalise l'embed (PostgREST renvoie un tableau pour le to-one).
  type Prof = { full_name: string; email: string; job_title?: string | null };
  const team = ((membres ?? []) as unknown as Array<{ role: string; profiles: Prof | Prof[] }>)
    .map((m) => {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return {
        name: p?.full_name || (p?.email ?? "").split("@")[0] || "—",
        role: m.role,
        // Poste dans l'entreprise (CEO, CFO…), saisi à l'inscription.
        title: p?.job_title ?? null,
      };
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

  // §2.5 — dernière consultation : qui, quel document, quand, et la durée
  // MESURÉE (page_dwell). Rien n'est approché : sans événement, on n'affiche pas.
  const ev = ((derniereVueRes.data ?? []) as { actor_email: string | null; target_id: string | null; created_at: string }[])[0];
  const nomDoc = new Map(tousDocs.map((d) => [d.id, d.name]));
  const dureeCouple = new Map(
    ((lectureRes.data ?? []) as { actor_email: string | null; document_id: string; total_ms: number }[])
      .map((r) => [`${(r.actor_email ?? "").toLowerCase()}|${r.document_id}`, r.total_ms]),
  );
  const derniereVue = ev
    ? {
        qui: (ev.actor_email ?? "").split("@")[0],
        doc: nomDoc.get(ev.target_id ?? "") ?? null,
        quand: ev.created_at,
        ms: dureeCouple.get(`${(ev.actor_email ?? "").toLowerCase()}|${ev.target_id ?? ""}`) ?? null,
      }
    : null;

  // « Mes levées » : toutes les levées actives (une par data room). Sert la
  // barre de bascule + « + Nouvelle levée » (data rooms sans levée).
  const { data: activeRaises } = await supabase
    .from("raises")
    .select("id, name, deal_id")
    .eq("statut", "en_cours")
    .in("deal_id", deals.map((d) => d.id));
  const nomDeal = new Map(deals.map((d) => [d.id, d.name]));
  const avecLevee = new Set<string>();
  const levees: LeveeChip[] = ((activeRaises ?? []) as { id: string; name: string | null; deal_id: string }[]).map((r) => {
    avecLevee.add(r.deal_id);
    return { id: r.id, name: r.name || nomDeal.get(r.deal_id) || t("myRaise"), dealId: r.deal_id, dealName: nomDeal.get(r.deal_id) ?? "" };
  });
  const roomsSansLevee = deals.filter((d) => !avecLevee.has(d.id)).map((d) => ({ id: d.id, name: d.name }));

  return (
    <>
      <MesLeveesBar levees={levees} currentDealId={deal.id} roomsSansLevee={roomsSansLevee} />
      <MaLevee
      dealName={deal.name}
      dealId={deal.id}
      readiness={deal.readiness_score ?? 0}
      missing={missing}
      socleTotal={socleTotal}
      socleFaits={socleFaits}
      objectif={deal.objectif}
      raise={enCours}
      closedRaises={cloturees}
      investors={investisseurs}
      team={team}
      keyDocs={keyDocs}
      ndaDefault={ndaDefault}
      dataRooms={dataRooms}
      roomsSansLevee={roomsSansLevee}
      accesActifs={accesActifs}
      derniereVue={derniereVue}
      />
    </>
  );
}
