import { getTranslations, getLocale } from "next-intl/server";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/locales";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const locale = (await getLocale()) as Locale;

  const kpis = [
    { label: t("kpi.volume"), value: "42,6 M$", delta: "+18 %" },
    { label: t("kpi.activeDeals"), value: "8", delta: "+2" },
    { label: t("kpi.avgReadiness"), value: "71 %", delta: "+6 pts" },
    { label: t("kpi.openQa"), value: "12", delta: "3" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
            {t("greeting", { name: "Aminata" })}
          </h1>
          <p className="text-[12.5px] text-ink-secondary mt-0.5">
            {t("meta", {
              date: formatDate(new Date(), locale),
              deals: 8,
              actions: 3,
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">{t("inviteInvestor")}</Button>
          <Button variant="primary">{t("newDeal")}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardBody>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-[550] text-ink-secondary">
                  {k.label}
                </span>
                <Chip tone="success">{k.delta}</Chip>
              </div>
              <div className="mt-2 font-mono text-[24px] tracking-[-0.03em]">
                {k.value}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>{t("socleTitle")}</CardHeader>
        <CardBody>
          <p className="text-[12.5px] text-ink-secondary leading-relaxed">
            {t("socleBody")}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
