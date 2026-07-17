import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentDeal } from "@/lib/current-deal";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Mono } from "@/components/ui/Table";
import { cn } from "@/lib/cn";

type Cat = "ohada" | "financier" | "dfi";
const CATEGORIES: Cat[] = ["ohada", "financier", "dfi"];

function barColor(pct: number): string {
  if (pct < 50) return "bg-[oklch(0.60_0.17_40)]";
  if (pct < 75) return "bg-[oklch(0.65_0.14_85)]";
  return "bg-[oklch(0.60_0.13_155)]";
}

export default async function ReadinessPage() {
  const t = await getTranslations("readiness");
  const tc = await getTranslations("checklist");
  const supabase = await createClient();

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

  const { data: items, error } = await supabase
    .from("checklist_items")
    .select("category, label, status")
    .eq("deal_id", deal.id)
    .order("position");

  const list = (error ? [] : (items ?? [])) as Array<{
    category: Cat;
    label: string;
    status: "todo" | "in_progress" | "done";
  }>;

  if (list.length === 0) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          {t("title")}
        </h1>
        <Card>
          <CardBody>
            <p className="text-[12.5px] text-ink-secondary py-3">
              {t("noChecklist")}{" "}
              <Link href="/checklist" className="font-medium text-accent">
                {t("goChecklist")} →
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const score = deal.readiness_score ?? 0;
  // Ce qui manque, priorisé : les 'à faire' d'abord, puis les 'en cours'.
  const missing = [
    ...list.filter((i) => i.status === "todo"),
    ...list.filter((i) => i.status === "in_progress"),
  ];

  // Jauge conique du prototype.
  const gauge = `conic-gradient(oklch(0.55 0.17 270) ${score * 3.6}deg, oklch(0.93 0.004 260) 0deg)`;

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

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5 items-start">
        <Card>
          <CardBody>
            <div className="flex flex-col items-center gap-3 py-2">
              <div
                className="grid place-items-center w-[124px] h-[124px] rounded-full"
                style={{ background: gauge }}
                role="img"
                aria-label={t("gaugeLabel", { score })}
              >
                <div className="grid place-items-center w-[96px] h-[96px] rounded-full bg-surface">
                  <Mono className="text-[26px] text-ink tracking-[-0.03em]">
                    {score}%
                  </Mono>
                </div>
              </div>
              <p className="text-[11.5px] text-ink-muted text-center leading-relaxed">
                {score >= 75
                  ? t("verdictReady")
                  : score >= 50
                    ? t("verdictAlmost")
                    : t("verdictEarly")}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>{t("byCategory")}</CardHeader>
          <CardBody>
            <div className="flex flex-col gap-3.5">
              {CATEGORIES.map((cat) => {
                const sub = list.filter((i) => i.category === cat);
                if (!sub.length) return null;
                const done = sub.filter((i) => i.status === "done").length;
                const pct = Math.round((done / sub.length) * 100);
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-semibold">
                        {tc(`categories.${cat}`)}
                      </span>
                      <Mono className="text-[11.5px] text-ink-secondary">
                        {done}/{sub.length} · {pct}%
                      </Mono>
                    </div>
                    <span className="block h-1 rounded-[2px] bg-separator-soft overflow-hidden mt-1.5">
                      <span
                        className={cn("block h-full", barColor(pct))}
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* La valeur réelle : dire ce qui manque, nommément. */}
      <Card>
        <CardHeader>
          {missing.length > 0 ? t("todoTitle", { n: missing.length }) : t("allDone")}
        </CardHeader>
        {missing.slice(0, 12).map((i, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 px-4 py-2.5 border-b border-separator last:border-0"
          >
            <Chip tone={i.status === "in_progress" ? "amber" : "outline"}>
              {tc(`status.${i.status}`)}
            </Chip>
            <span className="text-[12.5px] flex-1 min-w-0 truncate">
              {i.label}
            </span>
            <span className="text-[11px] text-ink-muted flex-none">
              {tc(`categories.${i.category}`)}
            </span>
          </div>
        ))}
        {missing.length === 0 && (
          <CardBody>
            <p className="text-[12.5px] text-ink-secondary py-2">
              {t("allDoneBody")}
            </p>
          </CardBody>
        )}
        <div className="px-4 py-2.5 bg-bg border-t border-separator-soft">
          <Link href="/checklist" className="text-[11.5px] font-medium text-accent">
            {t("openChecklist")} →
          </Link>
        </div>
      </Card>
    </div>
  );
}
