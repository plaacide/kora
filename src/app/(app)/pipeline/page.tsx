import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { requireInternal } from "@/lib/access";
import { Card, CardBody } from "@/components/ui/Card";
import {
  PipelineBoard,
  type PipelineDeal,
} from "@/components/pipeline/PipelineBoard";
import { STAGES, type Stage } from "@/lib/stages";
import { NewDealButton } from "@/components/dataroom/NewDealButton";
import { formatAmount } from "@/lib/format";
import type { Locale } from "@/i18n/locales";

export default async function PipelinePage() {
  const t = await getTranslations("pipeline");
  const tt = await getTranslations("tips");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();
  await requireInternal(supabase);

  const { data: rows } = await supabase
    .from("deals")
    .select("id, name, type, stage, amount, currency, readiness_score")
    .order("created_at", { ascending: false });

  // Chaque deal a SA devise : un fonds mène des opérations en FCFA, USD, NGN…
  const deals: PipelineDeal[] = (rows ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    stage: d.stage as Stage,
    amount: d.amount ? Number(d.amount) : null,
    currency: d.currency,
    amountLabel: d.amount
      ? formatAmount(Number(d.amount), d.currency, locale)
      : "—",
    readiness: d.readiness_score ?? 0,
  }));

  // Total par colonne, ventilé PAR DEVISE : additionner des FCFA et des USD
  // donnerait un nombre qui ne veut rien dire.
  const totals: Record<string, string> = {};
  for (const s of STAGES) {
    const byCurrency = new Map<string, number>();
    for (const d of deals.filter((x) => x.stage === s && x.amount)) {
      byCurrency.set(
        d.currency,
        (byCurrency.get(d.currency) ?? 0) + (d.amount ?? 0),
      );
    }
    totals[s] = byCurrency.size
      ? [...byCurrency.entries()]
          .map(([cur, sum]) => formatAmount(sum, cur, locale))
          .join(" · ")
      : "—";
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          {t("title")}{" "}<InfoTooltip text={tt("pipeline")} />
        </h1>
        <p className="text-[12.5px] text-ink-secondary mt-0.5">
          {t("subtitle")}
        </p>
      </div>

      {deals.length === 0 ? (
        <Card>
          <CardBody>
            <div className="flex flex-col items-start gap-3 py-3">
              <p className="text-[12.5px] text-ink-secondary">
                {t("emptyState")}
              </p>
              <NewDealButton />
            </div>
          </CardBody>
        </Card>
      ) : (
        <PipelineBoard deals={deals} totals={totals} />
      )}
    </div>
  );
}
