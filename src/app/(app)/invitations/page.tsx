import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/access";
import { getCurrentDeal } from "@/lib/current-deal";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Mono } from "@/components/ui/Table";
import { InviteForm } from "@/components/invitations/InviteForm";

const STATUS_TONE: Record<string, ChipTone> = {
  sent: "neutral",
  nda_pending: "amber",
  accepted: "success",
  revoked: "outline",
};

export default async function InvitationsPage() {
  const t = await getTranslations("invitations");
  const tp = await getTranslations("permissions");
  const supabase = await createClient();
  await requireInternal(supabase);

  const { deal } = await getCurrentDeal(supabase);

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

  // RLS : seuls owner/admin voient les invitations (le jeton reste côté serveur).
  const { data: invites } = await supabase
    .from("invitations")
    .select("id, email, status, level, nda_required, expires_at, created_at")
    .eq("deal_id", deal.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <div>
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          {t("title")}
        </h1>
        <p className="text-[12.5px] text-ink-secondary mt-0.5">
          {deal.name} · {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 items-start">
        <Card>
          <CardHeader>{t("inviteCard")}</CardHeader>
          <CardBody>
            <InviteForm dealId={deal.id} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>{t("pipelineCard")}</CardHeader>
          <div className="grid grid-cols-[1fr_110px_100px] gap-2.5 px-4 py-2 text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted bg-bg border-b border-separator-soft">
            <span>{t("colInvitee")}</span>
            <span>{t("colStatus")}</span>
            <span>{t("colLevel")}</span>
          </div>

          {(invites ?? []).map((i) => (
            <div
              key={i.id}
              className="grid grid-cols-[1fr_110px_100px] gap-2.5 items-center px-4 py-2.5 border-b border-separator last:border-0"
            >
              <div className="min-w-0">
                <div className="text-[12.5px] font-semibold truncate">
                  {i.email}
                </div>
                <Mono className="text-[10.5px] text-ink-muted">
                  {i.nda_required ? t("ndaOn") : t("ndaOff")}
                  {i.expires_at
                    ? ` · ${t("expires")} ${new Date(i.expires_at).toLocaleDateString()}`
                    : ""}
                </Mono>
              </div>
              <span>
                <Chip tone={STATUS_TONE[i.status] ?? "neutral"}>
                  {t(`status.${i.status}`)}
                </Chip>
              </span>
              <span>
                <Chip tone="indigo">{tp(`levels.${i.level}`)}</Chip>
              </span>
            </div>
          ))}

          {(invites ?? []).length === 0 && (
            <div className="px-4 py-6 text-center text-[12px] text-ink-muted">
              {t("noInvites")}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
