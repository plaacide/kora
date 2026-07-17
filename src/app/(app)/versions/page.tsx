import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentDeal, getDealRole, getAnyRole } from "@/lib/current-deal";
import { Card, CardBody } from "@/components/ui/Card";
import {
  VersionList,
  type VersionDoc,
} from "@/components/versions/VersionList";
import type { Locale } from "@/i18n/locales";

export default async function VersionsPage() {
  const t = await getTranslations("versions");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const { deal } = await getCurrentDeal(supabase);
  const orgId = deal?.org_id;
  const role = deal
    ? await getDealRole(supabase, deal.org_id)
    : await getAnyRole(supabase);
  const canEdit = ["owner", "admin", "member"].includes(role ?? "");

  if (!deal || !orgId) {
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

  const { data: documents } = await supabase
    .from("documents")
    .select(
      "id, name, index_path, current_version_id, folders!inner(name), document_versions!document_versions_document_id_fkey(id, version_no, size_bytes, created_at, profiles(full_name, email))",
    )
    .eq("deal_id", deal.id)
    .order("index_path");

  const dateFmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
  });

  const docs: VersionDoc[] = (documents ?? []).map((d) => {
    const versions = (d.document_versions as unknown as Array<{
      id: string;
      version_no: number;
      size_bytes: number | null;
      created_at: string;
      profiles: { full_name: string; email: string } | null;
    }>) ?? [];

    return {
      id: d.id,
      name: d.name,
      index_path: d.index_path,
      folder_name:
        (d.folders as unknown as { name: string } | null)?.name ?? "",
      // Plus récente en tête : c'est l'ordre dans lequel on lit un historique.
      versions: versions
        .sort((a, b) => b.version_no - a.version_no)
        .map((v) => ({
          id: v.id,
          version_no: v.version_no,
          size_bytes: v.size_bytes,
          created_at: dateFmt.format(new Date(v.created_at)),
          uploaded_by:
            v.profiles?.full_name ||
            v.profiles?.email?.split("@")[0] ||
            "—",
          is_current: v.id === d.current_version_id,
        })),
    };
  });

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

      {docs.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-[12.5px] text-ink-secondary py-3">
              {t("noDocs")}
            </p>
          </CardBody>
        </Card>
      ) : (
        <VersionList
          key={deal.id}
          docs={docs}
          orgId={orgId}
          dealId={deal.id}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}
