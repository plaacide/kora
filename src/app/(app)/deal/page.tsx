import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/access";
import { getCurrentDeal } from "@/lib/current-deal";
import { Card, CardBody } from "@/components/ui/Card";
import { MaLevee } from "@/components/deal/MaLevee";

/**
 * « Ma levée » — refonte handoff app v5 (§4).
 *
 * Le nom de la levée, la préparation et les pièces manquantes sont réels ;
 * l'audience, les indicateurs, l'historique et les investisseurs sont de la
 * donnée d'attente dans `MaLevee`, autorisée le temps d'implémenter le modèle
 * multi-levées.
 */
export default async function DealPage() {
  const supabase = await createClient();
  await requireInternal(supabase);

  const { deal } = await getCurrentDeal(supabase);
  if (!deal) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">Ma levée</h1>
        <Card>
          <CardBody>
            <p className="text-[12.5px] text-ink-secondary py-3">Aucune levée ouverte.</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const { data: exigences } = await supabase
    .from("checklist_items")
    .select("label, status, folder_id")
    .eq("deal_id", deal.id)
    .order("category")
    .order("position");

  const liste = (exigences ?? []) as { label: string; status: string; folder_id: string | null }[];
  const missing = liste
    .filter((i) => i.status !== "done")
    .map((i) => ({ label: i.label, folderId: i.folder_id }));

  return (
    <MaLevee
      dealName={deal.name}
      dealId={deal.id}
      readiness={deal.readiness_score ?? 0}
      missing={missing}
    />
  );
}
