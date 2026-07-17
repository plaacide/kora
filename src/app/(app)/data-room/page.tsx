import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import { DataRoom, type DocRow } from "@/components/dataroom/DataRoom";
import { NewDealButton } from "@/components/dataroom/NewDealButton";

export default async function DataRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ deal?: string }>;
}) {
  const t = await getTranslations("dataroom");
  const supabase = await createClient();
  const params = await searchParams;

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id")
    .limit(1)
    .maybeSingle();

  const orgId = membership?.org_id as string | undefined;

  const { data: deals } = await supabase
    .from("deals")
    .select("id, name")
    .order("created_at", { ascending: false });

  const deal = params.deal
    ? deals?.find((d) => d.id === params.deal)
    : deals?.[0];

  // Aucun deal : état vide + création.
  if (!deal || !orgId) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
            {t("title")}
          </h1>
          <p className="text-[12.5px] text-ink-secondary mt-0.5">
            {t("subtitle")}
          </p>
        </div>
        <Card>
          <CardBody>
            <div className="flex flex-col items-start gap-3 py-4">
              <p className="text-[12.5px] text-ink-secondary max-w-md leading-relaxed">
                {t("emptyState")}
              </p>
              <NewDealButton />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const [{ data: folders }, { data: documents }] = await Promise.all([
    supabase
      .from("folders")
      .select("id, parent_id, name, index_path")
      .eq("deal_id", deal.id)
      .order("index_path"),
    supabase
      .from("documents")
      .select(
        "id, folder_id, name, index_path, status, document_versions!documents_current_version_fk(version_no, size_bytes)",
      )
      .eq("deal_id", deal.id)
      .order("index_path"),
  ]);

  const docs: DocRow[] = (documents ?? []).map((d) => {
    const v = d.document_versions as unknown as {
      version_no: number;
      size_bytes: number | null;
    } | null;
    return {
      id: d.id,
      folder_id: d.folder_id,
      name: d.name,
      index_path: d.index_path,
      status: d.status,
      version_no: v?.version_no ?? 1,
      size_bytes: v?.size_bytes ?? null,
    };
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
            {t("title")}
          </h1>
          <p className="text-[12.5px] text-ink-secondary mt-0.5">
            {t("subtitle")}
          </p>
        </div>
        <NewDealButton />
      </div>

      <DataRoom
        orgId={orgId}
        dealId={deal.id}
        dealName={deal.name}
        folders={folders ?? []}
        documents={docs}
      />
    </div>
  );
}
