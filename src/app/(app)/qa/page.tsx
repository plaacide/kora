import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import { QaBoard, type QaItem } from "@/components/qa/QaBoard";
import type { Locale } from "@/i18n/locales";

export default async function QaPage({
  searchParams,
}: {
  searchParams: Promise<{ deal?: string }>;
}) {
  const t = await getTranslations("qa");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();
  const params = await searchParams;

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .limit(1)
    .maybeSingle();
  const isInternal = ["owner", "admin", "member"].includes(
    membership?.role ?? "",
  );

  const { data: deals } = await supabase
    .from("deals")
    .select("id, name")
    .order("created_at", { ascending: false });
  const deal = params.deal ? deals?.find((d) => d.id === params.deal) : deals?.[0];

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
          {t("title")}
        </h1>
        <p className="text-[12.5px] text-ink-secondary mt-0.5">
          {deal.name} · {isInternal ? t("subtitleInternal") : t("subtitleGuest")}
        </p>
      </div>

      <QaBoard
        dealId={deal.id}
        dealName={deal.name}
        items={items}
        isInternal={isInternal}
      />
    </div>
  );
}
