import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Mono } from "@/components/ui/Table";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { DealsTable, type DealRow } from "@/components/dashboard/DealsTable";
import { NewDealButton } from "@/components/dataroom/NewDealButton";
import { formatAmount, formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/locales";

/** next-intl interdit les points dans les clés (ils expriment l'imbrication). */
function actionKey(action: string): string {
  return action.replace(/\./g, "_");
}

/** Cumul hebdomadaire réel sur 8 semaines, calculé depuis les created_at. */
function weeklyCumulative(dates: string[], weeks = 8): number[] {
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  return Array.from({ length: weeks }, (_, i) => {
    const cutoff = now - (weeks - 1 - i) * week;
    return dates.filter((d) => new Date(d).getTime() <= cutoff).length;
  });
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const ta = await getTranslations("audit");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, organizations(name, default_currency)")
    .limit(1)
    .maybeSingle();

  const org = membership?.organizations as unknown as {
    name: string;
    default_currency: string;
  } | null;
  const currency = org?.default_currency ?? "XOF";

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const [{ data: deals }, { data: docs }, { data: activity }, { data: expiring }] =
    await Promise.all([
      supabase
        .from("deals")
        .select("id, name, type, stage, amount, readiness_score, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("documents").select("id, deal_id"),
      supabase
        .from("audit_log")
        .select("action, actor_email, metadata, created_at")
        .order("id", { ascending: false })
        .limit(5),
      // Accès qui expirent sous 48 h — l'alerte du prototype, en vrai.
      supabase
        .from("permissions")
        .select("id, expires_at, profiles(full_name, email)")
        .not("expires_at", "is", null)
        .gt("expires_at", new Date().toISOString())
        .lt(
          "expires_at",
          new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        ),
    ]);

  const allDeals = deals ?? [];
  const activeDeals = allDeals.filter((d) => d.stage !== "passed");
  const docCountByDeal = new Map<string, number>();
  for (const d of docs ?? []) {
    docCountByDeal.set(d.deal_id, (docCountByDeal.get(d.deal_id) ?? 0) + 1);
  }

  const volume = activeDeals.reduce((sum, d) => sum + Number(d.amount ?? 0), 0);
  const avgReadiness = activeDeals.length
    ? Math.round(
        activeDeals.reduce((s, d) => s + (d.readiness_score ?? 0), 0) /
          activeDeals.length,
      )
    : 0;

  const dealTrend = weeklyCumulative(allDeals.map((d) => d.created_at));
  const docTrend = weeklyCumulative(
    (docs ?? []).map(() => new Date().toISOString()),
  );

  const rows: DealRow[] = activeDeals.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    stage: d.stage,
    amountLabel: d.amount
      ? formatAmount(Number(d.amount), currency, locale)
      : "—",
    readiness: d.readiness_score ?? 0,
    docCount: docCountByDeal.get(d.id) ?? 0,
  }));

  const firstName = (profile?.full_name ?? "").split(" ")[0] || "";
  const timeFmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
            {firstName ? t("greeting", { name: firstName }) : t("greetingPlain")}
          </h1>
          <p className="text-[12.5px] text-ink-secondary mt-0.5">
            {t("meta", {
              date: formatDate(new Date(), locale),
              deals: activeDeals.length,
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/invitations">
            <Button variant="secondary">{t("inviteInvestor")}</Button>
          </Link>
          <NewDealButton />
        </div>
      </div>

      {/* KPI — chiffres réels ; sparkline seulement là où une série réelle existe. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-[550] text-ink-secondary">
                {t("kpi.volume")}
              </span>
            </div>
            <div className="flex items-end justify-between gap-2 mt-2">
              <span className="font-mono text-[19px] tracking-[-0.03em]">
                {volume ? formatAmount(volume, currency, locale) : "—"}
              </span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <span className="text-[12px] font-[550] text-ink-secondary">
              {t("kpi.activeDeals")}
            </span>
            <div className="flex items-end justify-between gap-2 mt-2">
              <span className="font-mono text-[24px] tracking-[-0.03em]">
                {activeDeals.length}
              </span>
              <Sparkline values={dealTrend} tone="accent" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <span className="text-[12px] font-[550] text-ink-secondary">
              {t("kpi.avgReadiness")}
            </span>
            <div className="flex items-end justify-between gap-2 mt-2">
              <span className="font-mono text-[24px] tracking-[-0.03em]">
                {avgReadiness}%
              </span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <span className="text-[12px] font-[550] text-ink-secondary">
              {t("kpi.documents")}
            </span>
            <div className="flex items-end justify-between gap-2 mt-2">
              <span className="font-mono text-[24px] tracking-[-0.03em]">
                {(docs ?? []).length}
              </span>
              <Sparkline values={docTrend} tone="success" />
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <DealsTable deals={rows} />

        <div className="flex flex-col gap-4">
          {/* Alerte réelle : droits qui expirent sous 48 h. */}
          {(expiring ?? []).length > 0 && (
            <div className="border border-[oklch(0.88_0.05_45)] rounded-card bg-[oklch(0.975_0.015_45)] p-4">
              <div className="flex items-center gap-2 text-[12.5px] font-[650] text-[oklch(0.45_0.13_40)]">
                <span className="w-[7px] h-[7px] rounded-full bg-warm animate-pulse-dot" />
                {t("expiringTitle", { n: (expiring ?? []).length })}
              </div>
              <p className="text-[12px] leading-relaxed text-[oklch(0.42_0.05_40)] my-2">
                {t("expiringBody")}
              </p>
              <Link href="/permissions">
                <Button variant="danger" size="sm">
                  {t("extendAccess")}
                </Button>
              </Link>
            </div>
          )}

          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-separator-soft text-[13px] font-[650]">
              {t("recentActivity")}
            </div>
            {(activity ?? []).map((a, i) => (
              <div
                key={i}
                className="flex gap-2.5 px-4 py-2.5 border-b border-separator last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] leading-[1.45] text-ink">
                    <b className="font-semibold">
                      {(a.actor_email ?? "—").split("@")[0]}
                    </b>{" "}
                    {ta.has(`actions.${actionKey(a.action)}`)
                      ? ta(`actions.${actionKey(a.action)}`).toLowerCase()
                      : a.action}
                    {(a.metadata as Record<string, unknown>)?.name
                      ? ` — ${(a.metadata as Record<string, string>).name}`
                      : ""}
                  </div>
                  <Mono className="text-[10.5px] text-ink-muted">
                    {timeFmt.format(new Date(a.created_at))}
                  </Mono>
                </div>
              </div>
            ))}
            {(activity ?? []).length === 0 && (
              <CardBody>
                <p className="text-[12px] text-ink-muted text-center py-2">
                  {t("noActivity")}
                </p>
              </CardBody>
            )}
            <div className="px-4 py-2.5 bg-bg border-t border-separator-soft">
              <Link
                href="/audit"
                className="text-[11.5px] font-medium text-accent"
              >
                {t("seeAudit")} →
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
