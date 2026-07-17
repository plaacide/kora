import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import {
  Checklist,
  type ChecklistItem,
  type DocOption,
} from "@/components/checklist/Checklist";
import { ApplyChecklistButton } from "@/components/checklist/ApplyChecklistButton";

export default async function ChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ deal?: string }>;
}) {
  const t = await getTranslations("checklist");
  const supabase = await createClient();
  const params = await searchParams;

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .limit(1)
    .maybeSingle();
  const canEdit = ["owner", "admin", "member"].includes(membership?.role ?? "");

  const { data: deals } = await supabase
    .from("deals")
    .select("id, name, readiness_score")
    .order("created_at", { ascending: false });
  const deal = params.deal ? deals?.find((d) => d.id === params.deal) : deals?.[0];

  if (!deal) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          {t("title")}
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

  const [{ data: items, error }, { data: documents }] = await Promise.all([
    supabase
      .from("checklist_items")
      .select("id, category, label, description, status, document_id")
      .eq("deal_id", deal.id)
      .order("category")
      .order("position"),
    supabase
      .from("documents")
      .select("id, name, index_path")
      .eq("deal_id", deal.id)
      .order("index_path"),
  ]);

  // Tolérant tant que la migration n'est pas appliquée.
  const list = (error ? [] : (items ?? [])) as unknown as ChecklistItem[];

  if (list.length === 0) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
            {t("title")}
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
          {t("title")}
        </h1>
        <p className="text-[12.5px] text-ink-secondary mt-0.5">
          {deal.name} · {t("subtitle")}
        </p>
      </div>

      <Checklist
        items={list}
        docs={(documents ?? []) as DocOption[]}
        readiness={deal.readiness_score ?? 0}
        canEdit={canEdit}
      />
    </div>
  );
}
