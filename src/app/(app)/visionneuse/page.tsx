import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import { Viewer } from "@/components/viewer/Viewer";

export default async function VisionneusePage({
  searchParams,
}: {
  searchParams: Promise<{ doc?: string }>;
}) {
  const t = await getTranslations("viewer");
  const supabase = await createClient();
  const params = await searchParams;

  // Sous RLS : on ne voit que les documents de son organisation.
  // Par défaut on ouvre un PDF : c'est le seul type que la visionneuse rend
  // aujourd'hui (les autres formats viendront avec la conversion en amont).
  const cols = "id, name, index_path, current_version_id";
  const { data: docs } = params.doc
    ? await supabase.from("documents").select(cols).eq("id", params.doc).limit(1)
    : await supabase
        .from("documents")
        .select(cols)
        .not("current_version_id", "is", null)
        .ilike("name", "%.pdf")
        .order("index_path")
        .limit(1);

  const doc = docs?.[0];

  if (!doc?.current_version_id) {
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
            <p className="text-[12.5px] text-ink-secondary py-3">
              {t("emptyState")}
            </p>
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
          {t("subtitle")}
        </p>
      </div>
      <Viewer
        versionId={doc.current_version_id}
        docName={doc.name}
        docIndex={doc.index_path}
      />
    </div>
  );
}
