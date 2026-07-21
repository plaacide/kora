import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { getCurrentDeal } from "@/lib/current-deal";
import { isViewable, isSheet } from "@/lib/doc-types";
import { Card, CardBody } from "@/components/ui/Card";
import { Viewer } from "@/components/viewer/Viewer";
import { SheetView } from "@/components/viewer/SheetView";

export default async function VisionneusePage({
  searchParams,
}: {
  searchParams: Promise<{ doc?: string }>;
}) {
  const t = await getTranslations("viewer");
  const tt = await getTranslations("tips");
  const supabase = await createClient();
  const params = await searchParams;
  const { deal } = await getCurrentDeal(supabase);

  // Sous RLS : on ne voit que les documents auxquels on a accès.
  const cols = "id, name, index_path, current_version_id";
  let doc: {
    id: string;
    name: string;
    index_path: string;
    current_version_id: string | null;
  } | undefined;

  if (params.doc) {
    const { data } = await supabase
      .from("documents")
      .select(cols)
      .eq("id", params.doc)
      .limit(1);
    doc = data?.[0];
  } else if (deal) {
    // Aucun document ciblé : on ouvre le premier document prévisualisable du
    // deal courant (PDF ou bureautique), pas un document d'un autre deal.
    const { data } = await supabase
      .from("documents")
      .select(cols)
      .eq("deal_id", deal.id)
      .not("current_version_id", "is", null)
      .order("index_path");
    doc = (data ?? []).find((d) => isViewable(d.name, null));
  }

  if (!doc?.current_version_id) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">
            {t("title")}{" "}<InfoTooltip text={tt("viewer")} />
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
        <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">
          {t("title")}{" "}<InfoTooltip text={tt("viewer")} />
        </h1>
        <p className="text-[12.5px] text-ink-secondary mt-0.5">
          {t("subtitle")}
        </p>
      </div>
      {/* Un tableur se lit en grille, pas en pages rendues : une image d'un
          modèle financier est illisible. Voir src/lib/doc-types.ts. */}
      {/* `key` sur la version : changer de document remonte la visionneuse
          avec un état neuf, plutôt que de la réinitialiser à la main dans un
          effet — ce qui provoquait des rendus en cascade. */}
      {isSheet(doc.name, null) ? (
        <SheetView
          key={doc.current_version_id}
          versionId={doc.current_version_id}
          docName={doc.name}
          docIndex={doc.index_path}
        />
      ) : (
        <Viewer
          key={doc.current_version_id}
          versionId={doc.current_version_id}
          docName={doc.name}
          docIndex={doc.index_path}
        />
      )}
    </div>
  );
}
