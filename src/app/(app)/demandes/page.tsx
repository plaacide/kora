import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { DemandeCarte, type Demande } from "@/components/demandes/DemandeCarte";
import { joursRestants } from "@/lib/echeance";
import { etatDemande, joursAvantPeremption } from "@/lib/demandes-echeance";

/**
 * `/demandes` — le point de rencontre (§5).
 *
 * Le programme FILTRE, l'entreprise TRANCHE. L'en-tête le dit avant la
 * première demande, parce que c'est la seule chose qu'un programme doit
 * comprendre en arrivant ici : ses boutons ne donnent pas d'accès, ils
 * éclairent une décision qui ne lui appartient pas — sauf mandat.
 *
 * La RLS montre les demandes des trois parties concernées. Pour un programme,
 * ce sont celles de ses cohortes ; il ne voit pas celles des autres.
 */
export default async function DemandesPage() {
  const t = await getTranslations("requests");
  const supabase = await createClient();

  const { data: brutes } = await supabase
    .from("access_requests")
    .select(
      "id, investor_user, startup_org_id, deal_id, instrument, status, created_at, relaunched_at, program_org_id",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const lignes = (brutes ?? []) as Array<{
    id: string; investor_user: string; startup_org_id: string; deal_id: string;
    instrument: "equity" | "dette" | "mezzanine" | null; status: string;
    created_at: string; relaunched_at: string | null; program_org_id: string;
  }>;

  const users = [...new Set(lignes.map((l) => l.investor_user))];
  const orgs = [...new Set(lignes.map((l) => l.startup_org_id))];
  const deals = [...new Set(lignes.map((l) => l.deal_id))];

  const [{ data: profils }, { data: organisations }, { data: salles }, { data: mandats }] =
    await Promise.all([
      users.length
        ? supabase.from("profiles").select("id, full_name, email").in("id", users)
        : Promise.resolve({ data: [] }),
      // Même raison qu'ailleurs : la politique de `organizations` réserve la
      // lecture à ses membres, et le programme n'en est pas un.
      orgs.length
        ? supabase.rpc("related_org_names", { p_ids: orgs })
        : Promise.resolve({ data: [] }),
      // Le NOM de la salle, jamais son contenu — la règle §0.1 tient aussi ici.
      deals.length
        ? supabase.from("deals").select("id, name").in("id", deals)
        : Promise.resolve({ data: [] }),
      orgs.length
        ? supabase
            .from("mandates")
            .select("startup_org_id, deal_id")
            .in("startup_org_id", orgs)
            .is("revoked_at", null)
        : Promise.resolve({ data: [] }),
    ]);

  const nomUser = new Map(
    ((profils ?? []) as Array<{ id: string; full_name: string | null; email: string }>).map((p) => [
      p.id,
      p.full_name || p.email.split("@")[0],
    ]),
  );
  const nomOrg = new Map(((organisations ?? []) as Array<{ id: string; name: string }>).map((o) => [o.id, o.name]));
  const nomSalle = new Map(((salles ?? []) as Array<{ id: string; name: string }>).map((d) => [d.id, d.name]));
  // Un mandat vaut pour UNE salle précise : le badge se décide par couple
  // entreprise+salle, jamais par entreprise seule.
  const sousMandat = new Set(
    ((mandats ?? []) as Array<{ startup_org_id: string; deal_id: string }>).map(
      (m) => `${m.startup_org_id}:${m.deal_id}`,
    ),
  );

  const demandes: Demande[] = lignes.map((l) => ({
    id: l.id,
    investisseur: nomUser.get(l.investor_user) ?? "—",
    organisation: null,
    entreprise: nomOrg.get(l.startup_org_id) ?? "—",
    salle: nomSalle.get(l.deal_id) ?? "—",
    instrument: l.instrument,
    // `joursRestants` isole `Date.now()` hors du rendu (règle de pureté du
    // dépôt). Une date passée renvoie un négatif : l'ancienneté est son opposé.
    jours: Math.max(0, -(joursRestants(l.created_at) ?? 0)),
    statut: l.status,
    // L'état RÉEL : le statut seul ment, une demande de trois mois est
    // toujours `pending` en base. Calculé ici une fois, pas dans chaque
    // composant — c'est ce qui garantit que la carte, le compteur et la base
    // disent la même chose.
    etat: etatDemande(l.status, l.created_at, l.relaunched_at),
    joursRestants: joursAvantPeremption(l.created_at, l.relaunched_at),
    sousMandat: sousMandat.has(`${l.startup_org_id}:${l.deal_id}`),
  }));

  // Le compteur de l'en-tête ne compte QUE ce sur quoi le programme peut
  // encore agir. Y inclure les périmées gonflerait une file qu'on ne peut pas
  // vider — le contraire de ce qu'une pastille est censée provoquer.
  const enAttente = demandes.filter(
    (d) => d.etat === "enAttente" || d.etat === "bientot",
  ).length;

  return (
    <div className="text-[#1A1B1F] max-w-[860px]">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-[27px] font-[700] tracking-[-0.025em]">{t("title")}</h1>
          <p className="text-[13px] text-[#6E727A] mt-1 max-w-xl leading-relaxed">{t("intro")}</p>
        </div>
        {enAttente > 0 && (
          <span
            style={{ fontFamily: "var(--font-plex-mono), monospace" }}
            className="shrink-0 text-[9px] font-[700] tracking-[0.08em] text-[#C24619] bg-[#FBEDE6] rounded-[4px] px-2.5 py-[5px]"
          >
            {t("pending", { n: enAttente })}
          </span>
        )}
      </div>

      {demandes.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyBody")} foot={t("emptyFoot")} />
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {demandes.map((d) => (
              <DemandeCarte key={d.id} d={d} />
            ))}
          </div>
          <p className="text-[11.5px] text-[#8B8FA3] mt-4 leading-relaxed">{t("footer")}</p>
        </>
      )}
    </div>
  );
}
