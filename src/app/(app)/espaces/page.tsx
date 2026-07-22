import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/access";
import { getCurrentDeal } from "@/lib/current-deal";
import { RoomsList, type Room } from "@/components/dataroom/RoomsList";

/**
 * Liste des data rooms (handoff §3a), titre « Data room ».
 *
 * RÉEL et multi-salles : une data room = un deal (chacun son objectif, ses
 * dossiers, ses accès). On liste TOUTES les salles de l'org avec leurs
 * compteurs réels ; la création, le changement de salle, le partage, le
 * renommage et la suppression sont branchés (`RoomsList`).
 */
export default async function EspacesPage() {
  const supabase = await createClient();
  await requireInternal(supabase);
  const { deal, deals } = await getCurrentDeal(supabase);

  const ids = deals.map((d) => d.id);
  const [{ data: docs }, { data: invs }, raisesRes] = ids.length
    ? await Promise.all([
        supabase.from("documents").select("deal_id").in("deal_id", ids),
        supabase.from("invitations").select("deal_id").in("deal_id", ids),
        // Salles reliées à une levée (tolérant si la table n'existe pas encore).
        supabase.from("raises").select("deal_id").in("deal_id", ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const nbDocs = new Map<string, number>();
  for (const d of (docs ?? []) as { deal_id: string }[]) nbDocs.set(d.deal_id, (nbDocs.get(d.deal_id) ?? 0) + 1);
  const nbInv = new Map<string, number>();
  for (const i of (invs ?? []) as { deal_id: string }[]) nbInv.set(i.deal_id, (nbInv.get(i.deal_id) ?? 0) + 1);
  const avecLevee = new Set(((raisesRes.data ?? []) as { deal_id: string }[]).map((r) => r.deal_id));

  const rooms: Room[] = deals.map((d) => ({
    id: d.id,
    name: d.name,
    objectif: d.objectif,
    docs: nbDocs.get(d.id) ?? 0,
    invites: nbInv.get(d.id) ?? 0,
    archived: !!d.archived_at,
    hasRaise: avecLevee.has(d.id),
  }));

  return <RoomsList rooms={rooms} currentId={deal?.id ?? null} />;
}
