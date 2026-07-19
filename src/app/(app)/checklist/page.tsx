import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { requireInternal } from "@/lib/access";
import { getCurrentDeal, getDealRole, getAnyRole } from "@/lib/current-deal";
import { Card, CardBody } from "@/components/ui/Card";
import {
  Checklist,
  type ChecklistItem,
  type DocOption,
  type FolderOption,
} from "@/components/checklist/Checklist";
import { ApplyChecklistButton } from "@/components/checklist/ApplyChecklistButton";

export default async function ChecklistPage() {
  const t = await getTranslations("checklist");
  const tt = await getTranslations("tips");
  const supabase = await createClient();
  await requireInternal(supabase);

  const { deal } = await getCurrentDeal(supabase);
  const role = deal
    ? await getDealRole(supabase, deal.org_id)
    : await getAnyRole(supabase);
  const canEdit = ["owner", "admin", "member"].includes(role ?? "");

  if (!deal) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          {t("title")}{" "}<InfoTooltip text={tt("checklist")} />
        </h1>
        <Card>
          <CardBody>
            <p className="text-[12.5px] text-ink-secondary py-3">
              {t("emptyState")}
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Les preuves viennent de la table de liaison : une exigence en accepte
  // plusieurs (PV sur 3 exercices, rapport CAC général + spécial).
  const CHAMPS =
    "id, category, label, description, status, checklist_item_documents(document_id)";

  const [{ data: itemsAvecDossier, error: erreurDossier }, { data: documents }, { data: folders }] =
    await Promise.all([
      supabase
        .from("checklist_items")
        .select(`${CHAMPS}, folder_id`)
        .eq("deal_id", deal.id)
        .order("category")
        .order("position"),
      supabase
        .from("documents")
        .select("id, name, index_path, folder_id")
        .eq("deal_id", deal.id)
        .order("index_path"),
      // Où chaque pièce se dépose : c'est ce qui transforme la liste en guide.
      supabase
        .from("folders")
        .select("id, name, index_path")
        .eq("deal_id", deal.id)
        .order("index_path"),
    ]);

  // Repli si la colonne `folder_id` n'existe pas encore : la migration qui
  // l'ajoute s'applique à la main, et le code peut donc arriver en production
  // avant elle. Sans ce repli, la requête échouait et le fondateur découvrait
  // une checklist VIDE — 22 exigences et un dossier à 70 % effacés de l'écran
  // le temps d'un déploiement. Un défaut de séquencement ne doit pas ressembler
  // à une perte de données.
  const { data: items, error } = erreurDossier
    ? await supabase
        .from("checklist_items")
        .select(CHAMPS)
        .eq("deal_id", deal.id)
        .order("category")
        .order("position")
    : { data: itemsAvecDossier, error: null };

  // Même précaution pour la table de liaison, qui s'applique elle aussi à la
  // main : si elle n'existe pas encore, on relit l'ancienne colonne et on la
  // présente comme une liste à un élément. L'écran reste juste, simplement
  // limité à une preuve — au lieu de se vider.
  const { data: repli } = error
    ? await supabase
        .from("checklist_items")
        .select("id, category, label, description, status, document_id, folder_id")
        .eq("deal_id", deal.id)
        .order("category")
        .order("position")
    : { data: null };

  const brut = (repli ?? items ?? []) as unknown as (Record<string, unknown> & {
    document_id?: string | null;
    checklist_item_documents?: { document_id: string }[];
  })[];

  const list = brut.map((i) => ({
    ...i,
    documents: i.checklist_item_documents
      ? i.checklist_item_documents.map((l) => l.document_id)
      : i.document_id
        ? [i.document_id]
        : [],
  })) as unknown as ChecklistItem[];

  if (list.length === 0) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
            {t("title")}{" "}<InfoTooltip text={tt("checklist")} />
          </h1>
          <p className="text-[12.5px] text-ink-secondary mt-0.5">
            {deal.name} · {t("subtitle")}
          </p>
        </div>
        <Card>
          <CardBody>
            <div className="flex flex-col items-start gap-3 py-3">
              <p className="text-[12.5px] text-ink-secondary max-w-md leading-relaxed">
                {t("noItems")}
              </p>
              {canEdit && <ApplyChecklistButton dealId={deal.id} />}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          {t("title")}{" "}<InfoTooltip text={tt("checklist")} />
        </h1>
        <p className="text-[12.5px] text-ink-secondary mt-0.5">
          {deal.name} · {t("subtitle")}
        </p>
      </div>

      <Checklist
        key={deal.id}
        dealId={deal.id}
        items={list}
        docs={(documents ?? []) as DocOption[]}
        folders={(folders ?? []) as FolderOption[]}
        readiness={deal.readiness_score ?? 0}
        canEdit={canEdit}
      />
    </div>
  );
}
