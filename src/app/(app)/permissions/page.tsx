import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/access";
import { getCurrentDeal } from "@/lib/current-deal";
import { Card, CardBody } from "@/components/ui/Card";
import {
  PermissionMatrix,
  type PermUser,
  type PermFolder,
} from "@/components/permissions/PermissionMatrix";
import type { Level } from "@/lib/permissions";

export default async function PermissionsPage() {
  const t = await getTranslations("permissions");
  const supabase = await createClient();
  await requireInternal(supabase);

  const { deal } = await getCurrentDeal(supabase);

  if (!deal) {
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

  const [{ data: folders }, { data: members }, { data: perms }] =
    await Promise.all([
      supabase
        .from("folders")
        .select("id, name, index_path")
        .eq("deal_id", deal.id)
        .is("parent_id", null)
        .order("index_path"),
      supabase
        .from("memberships")
        .select("role, profiles!inner(id, email, full_name)")
        .order("created_at"),
      supabase
        .from("permissions")
        .select("user_id, folder_id, level")
        .eq("deal_id", deal.id),
    ]);

  const users: PermUser[] = (members ?? []).map((m) => {
    const p = m.profiles as unknown as {
      id: string;
      email: string;
      full_name: string;
    };
    return {
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      role: m.role as string,
    };
  });

  const initial: Record<string, Level> = {};
  for (const p of perms ?? []) {
    initial[`${p.user_id}:${p.folder_id}`] = p.level as Level;
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

      <PermissionMatrix
        key={deal.id}
        dealId={deal.id}
        users={users}
        folders={(folders ?? []) as PermFolder[]}
        initial={initial}
      />
    </div>
  );
}
