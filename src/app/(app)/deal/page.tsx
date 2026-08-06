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
      <div className="flex flex-col gap-4 text-[#1A1B1F]">
        <div>
          <h1 className="font-display text-[27px] font-[700] tracking-[-0.025em]">{t("myRaise")}</h1>
          <p className="text-[13.5px] text-[#6E727A] mt-1">{t("emptySubtitle")}</p>
        </div>

        {/* Les deux panneaux sont JOINTS, pas deux cartes séparées : la
            maquette en fait un seul objet, le clair et l'Encre partageant la
            même bordure. Un espace entre eux les aurait fait lire comme deux
            informations sans rapport. */}
        <div className="grid lg:grid-cols-2 rounded-[10px] overflow-hidden border border-[#E2DED4]">
          <div className="bg-white px-8 py-9 flex flex-col">
            <span style={mono} className="text-[10px] font-[600] tracking-[0.12em] text-[#A0A3AB]">
              {t("noRaiseOver")}
            </span>
            <h2 className="font-display text-[21px] font-[700] tracking-[-0.02em] mt-3">
              {t("firstRaiseTitle")}
            </h2>
            <p className="text-[13px] text-[#6E727A] mt-2.5 leading-relaxed">{t("firstRaiseBody")}</p>

            <ol className="relative flex flex-col gap-5 mt-7">
              {[
                { n: 1, actif: true, titre: t("pathStep1"), corps: t("pathStep1Body") },
                { n: 2, actif: false, titre: t("pathStep2"), corps: t("pathStep2Body") },
              ].map((e, i, tab) => (
                <li key={e.n} className="relative flex gap-3.5">
                  {/* Trait vertical reliant les deux pastilles : il dit que
                      c'est UNE séquence, pas deux options au choix. */}
                  {i < tab.length - 1 && (
                    <span className="absolute left-[13px] top-7 bottom-[-20px] w-0.5 bg-[#E2DED4]" aria-hidden />
                  )}
                  <span
                    style={mono}
                    className={
                      "grid place-items-center w-7 h-7 shrink-0 rounded-full text-[11px] font-[700] " +
                      (e.actif
                        ? "bg-[#FF5A1F] text-white"
                        : "border-[1.5px] border-[#D9D5CB] bg-white text-[#A0A3AB]")
                    }
                  >
                    {e.n}
                  </span>
                  <span className="pt-0.5">
                    <span className={"block text-[13.5px] font-[650] " + (e.actif ? "text-[#1A1B1F]" : "text-[#8B8FA3]")}>
                      {e.titre}
                    </span>
                    <span className="block text-[12.5px] text-[#8B8FA3] mt-0.5 leading-snug">{e.corps}</span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="flex items-center gap-4 mt-8 flex-wrap">
              <NewDataRoomButton
                label={t("createDataRoom")}
                className="rounded-[6px] bg-[#FF5A1F] px-5 py-3 text-[13.5px] font-[600] text-white hover:bg-[#E74C16] whitespace-nowrap"
              />
              <span className="text-[12.5px] text-[#8B8FA3]">{t("createRoomNote")}</span>
            </div>
          </div>

          {/* Aperçu illustratif chiffré, comme la maquette. La règle « jamais
              de données inventées » vise ce qui se fait passer POUR celles de
              l'utilisateur ; un exemple nommément marqué n'en relève pas. */}
          <div className="relative overflow-hidden bg-[#1A1B1F] px-8 py-9 flex flex-col">
            <ResonanceArcs corner="bottom-right" size={300} tone="dark" subtle />
            <div className="relative z-10 flex flex-col flex-1">
              <span style={mono} className="text-[10px] font-[600] tracking-[0.12em] text-[#F08A5E]">
                {t("previewOver")}
              </span>

              <div className="mt-5 rounded-[10px] bg-white/[0.055] border border-white/10 px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[15px] font-[700] text-white truncate">{t("previewRound")}</span>
                  <span style={mono} className="shrink-0 text-[9px] font-[700] tracking-[0.08em] text-[#5FD3A6] bg-[#5FD3A6]/15 rounded-[4px] px-2 py-[4px]">
                    {t("previewBadge")}
                  </span>
                </div>
                <div style={mono} className="text-[12px] text-white/45 mt-1">{t("previewClosing")}</div>

                <div style={mono} className="text-[30px] font-[600] tracking-[-0.03em] text-white mt-4">
                  {t("previewAmount")}
                </div>
                <span className="block h-1.5 rounded-full bg-white/10 overflow-hidden mt-3">
                  <span className="block h-full w-[62%] rounded-full bg-[#FF5A1F]" />
                </span>
                <div className="text-[12.5px] text-white/55 mt-2">{t("previewCommitted")}</div>

                <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/10">
                  {[
                    { v: t("previewKpiInvestorsValue"), l: t("previewKpiInvestors") },
                    { v: t("previewKpiReadyValue"), l: t("previewKpiReady") },
                    { v: t("previewKpiAccessValue"), l: t("previewKpiAccess") },
                  ].map((k) => (
                    <div key={k.l}>
                      <div className="text-[17px] font-[700] text-white">{k.v}</div>
                      <div className="text-[11.5px] text-white/45 mt-0.5 leading-snug">{k.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[12px] text-white/45 mt-4 leading-relaxed">{t("previewNote")}</p>
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
      nbDocuments={tousDocs.length}
      ndaDefault={ndaDefault}
      dataRooms={dataRooms}
      roomsSansLevee={roomsSansLevee}
      accesActifs={accesActifs}
      derniereVue={derniereVue}
      />
    </>
  );
}
