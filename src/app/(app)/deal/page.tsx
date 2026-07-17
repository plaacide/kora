import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Mono } from "@/components/ui/Table";
import { DealEditor, type DealForm } from "@/components/deal/DealEditor";
import { formatAmount } from "@/lib/format";
import type { Locale } from "@/i18n/locales";

export default async function DealPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const t = await getTranslations("deal");
  const ts = await getTranslations("stages");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();
  const params = await searchParams;

  const cols = "id, name, type, currency, amount, stage, readiness_score, created_at";
  const { data: deals } = params.id
    ? await supabase.from("deals").select(cols).eq("id", params.id).limit(1)
    : await supabase
        .from("deals")
        .select(cols)
        .order("created_at", { ascending: false })
        .limit(1);

  const deal = deals?.[0];

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

  // Seuls owner/admin suppriment : la RPC le vérifie aussi côté serveur,
  // ici on évite juste d'afficher un bouton voué à l'échec.
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .limit(1)
    .maybeSingle();
  const canDelete = ["owner", "admin"].includes(membership?.role ?? "");

  const [{ count: docCount }, { data: activity }] = await Promise.all([
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("deal_id", deal.id),
    supabase
      .from("audit_log")
      .select("action, actor_email, created_at")
      .eq("deal_id", deal.id)
      .order("id", { ascending: false })
      .limit(6),
  ]);

  const form: DealForm = {
    id: deal.id,
    name: deal.name,
    type: deal.type,
    currency: deal.currency,
    amount: deal.amount ? Number(deal.amount) : null,
    stage: deal.stage,
    readiness: deal.readiness_score ?? 0,
  };

  const fmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
            {deal.name}
          </h1>
          <Chip tone="indigo">{ts(deal.stage)}</Chip>
        </div>
        <p className="text-[12.5px] text-ink-secondary mt-0.5">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <span className="text-[12px] font-[550] text-ink-secondary">
              {t("amount")}
            </span>
            <div className="font-mono text-[19px] tracking-[-0.03em] mt-1.5">
              {deal.amount
                ? formatAmount(Number(deal.amount), deal.currency, locale)
                : "—"}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <span className="text-[12px] font-[550] text-ink-secondary">
              {t("readiness")}
            </span>
            <div className="font-mono text-[19px] tracking-[-0.03em] mt-1.5">
              {deal.readiness_score ?? 0}%
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <span className="text-[12px] font-[550] text-ink-secondary">
              {t("documents")}
            </span>
            <div className="font-mono text-[19px] tracking-[-0.03em] mt-1.5">
              {docCount ?? 0}
            </div>
            <Link
              href={`/data-room?deal=${deal.id}`}
              className="text-[11.5px] font-medium text-accent"
            >
              {t("openDataRoom")} →
            </Link>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
        <Card>
          <CardHeader>{t("editCard")}</CardHeader>
          <CardBody>
            <DealEditor deal={form} canDelete={canDelete} />
          </CardBody>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>{t("timeline")}</CardHeader>
          {(activity ?? []).map((a, i) => (
            <div
              key={i}
              className="px-4 py-2.5 border-b border-separator last:border-0"
            >
              <div className="text-[12px] text-ink">
                {a.action}
                <span className="text-ink-muted">
                  {" "}
                  · {(a.actor_email ?? "").split("@")[0]}
                </span>
              </div>
              <Mono className="text-[10.5px] text-ink-muted">
                {fmt.format(new Date(a.created_at))}
              </Mono>
            </div>
          ))}
          {(activity ?? []).length === 0 && (
            <CardBody>
              <p className="text-[12px] text-ink-muted text-center py-2">
                {t("noActivity")}
              </p>
            </CardBody>
          )}
        </Card>
      </div>
    </div>
  );
}
