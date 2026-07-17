import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import {
  PipelineBoard,
  STAGES,
  type PipelineDeal,
  type Stage,
} from "@/components/pipeline/PipelineBoard";
import { NewDealButton } from "@/components/dataroom/NewDealButton";
import { formatAmount } from "@/lib/format";
import type { Locale } from "@/i18n/locales";

export default async function PipelinePage() {
  const t = await getTranslations("pipeline");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("memberships")
    .select("organizations(default_currency)")
    .limit(1)
    .maybeSingle();
  const currency =
    (membership?.organizations as unknown as { default_currency?: string } | null)
      ?.default_currency ?? "XOF";

  const { data: rows } = await supabase
    .from("deals")
    .select("id, name, type, stage, amount, readiness_score")
    .order("created_at", { ascending: false });

  const deals: PipelineDeal[] = (rows ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    stage: d.stage as Stage,
    amount: d.amount ? Number(d.amount) : null,
    amountLabel: d.amount
      ? formatAmount(Number(d.amount), currency, locale)
      : "—",
    readiness: d.readiness_score ?? 0,
  }));

  // Total engagé par colonne — ce que regarde un gérant de fonds en premier.
  const totals: Record<string, string> = {};
  for (const s of STAGES) {
    const sum = deals
      .filter((d) => d.stage === s)
      .reduce((acc, d) => acc + (d.amount ?? 0), 0);
    totals[s] = sum ? formatAmount(sum, currency, locale) : "—";
  }

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

      {deals.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-[12.5px] text-ink-secondary py-3">
              {t("emptyState")}
            </p>
          </CardBody>
        </Card>
      ) : (
        <PipelineBoard deals={deals} totals={totals} />
      )}
    </div>
  );
}
