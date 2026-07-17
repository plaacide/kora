import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { getCurrentDeal, getDealRole, getAnyRole } from "@/lib/current-deal";
import { Card, CardBody } from "@/components/ui/Card";
import { QaBoard, type QaItem } from "@/components/qa/QaBoard";
import type { Locale } from "@/i18n/locales";

export default async function QaPage() {
  const t = await getTranslations("qa");
  const tt = await getTranslations("tips");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const { deal } = await getCurrentDeal(supabase);
  const role = deal
    ? await getDealRole(supabase, deal.org_id)
    : await getAnyRole(supabase);
  const isInternal = ["owner", "admin", "member"].includes(role ?? "");

  if (!deal) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          {t("title")}{" "}<InfoTooltip text={tt("qa")} />
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

  // La fonction masque déjà les réponses non publiées aux invités.
  const { data, error } = await supabase.rpc("qa_for_deal", {
    p_deal: deal.id,
  });

  const fmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const items: QaItem[] = (error ? [] : ((data ?? []) as unknown as Array<{
    id: string;
    body: string;
    asker: string;
    answer_body: string | null;
    answer_status: QaItem["answer_status"];
    answerer: string | null;
    created_at: string;
    is_mine: boolean;
  }>)
  ).map((q) => ({
    id: q.id,
    body: q.body,
    asker: q.asker,
    answer_body: q.answer_body,
    answer_status: q.answer_status,
    answerer: q.answerer,
    created_at: fmt.format(new Date(q.created_at)),
    is_mine: q.is_mine,
  }));

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <div>
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          {t("title")}{" "}<InfoTooltip text={tt("qa")} />
        </h1>
        <p className="text-[12.5px] text-ink-secondary mt-0.5">
          {deal.name} · {isInternal ? t("subtitleInternal") : t("subtitleGuest")}
        </p>
      </div>

      <QaBoard
        key={deal.id}
        dealId={deal.id}
        dealName={deal.name}
        items={items}
        isInternal={isInternal}
      />
    </div>
  );
}
