import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/access";
import { getCurrentDeal, getDealRole } from "@/lib/current-deal";
import { Card, CardBody } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Mono } from "@/components/ui/Table";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { EditDealButton } from "@/components/deal/EditDealButton";
import { Milestones, type MilestoneItem } from "@/components/deal/Milestones";
import { IcNotes, type IcNoteItem } from "@/components/deal/IcNotes";
import { DealHistory, type HistoryItem } from "@/components/deal/DealHistory";
import type { DealForm } from "@/components/deal/DealEditor";
import { formatAmount } from "@/lib/format";
import type { Locale } from "@/i18n/locales";

// Mêmes styles que le composant Button (variantes primary/secondary), pour
// des liens d'action harmonisés avec le reste de l'app.
const BTN_BASE =
  "inline-flex items-center justify-center gap-1.5 font-semibold cursor-pointer transition-colors rounded-btn text-[12.5px] px-3.5 py-2";
const PRIMARY_BTN = `${BTN_BASE} bg-primary text-white border border-transparent shadow-[0_1px_2px_rgba(20,20,60,0.2)] hover:bg-primary-strong`;
const SECONDARY_BTN = `${BTN_BASE} bg-surface text-ink border border-line-strong shadow-card hover:bg-[oklch(0.975_0.003_260)]`;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

/** next-intl interdit les points dans les clés. */
function actionKey(action: string): string {
  return action.replace(/\./g, "_");
}

function readinessColor(score: number): string {
  if (score < 50) return "bg-[oklch(0.60_0.17_40)]";
  if (score < 75) return "bg-[oklch(0.65_0.14_85)]";
  return "bg-[oklch(0.60_0.13_155)]";
}

const TEAM_TONE: Record<string, "neutral" | "indigo" | "outline"> = {
  owner: "indigo",
  admin: "indigo",
  member: "neutral",
  guest: "outline",
};

export default async function DealPage() {
  const t = await getTranslations("deal");
  const ts = await getTranslations("stages");
  const tp = await getTranslations("permissions");
  const ta = await getTranslations("audit");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();
  await requireInternal(supabase);

  // La fiche suit le sélecteur de deal.
  const { deal: current } = await getCurrentDeal(supabase);
  const { data: deals } = current
    ? await supabase
        .from("deals")
        .select(
          "id, name, org_id, type, currency, amount, stage, readiness_score, created_at",
        )
        .eq("id", current.id)
        .limit(1)
    : { data: null };

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

  const role = await getDealRole(supabase, deal.org_id);
  const canEdit = ["owner", "admin", "member"].includes(role ?? "");
  const canDelete = ["owner", "admin"].includes(role ?? "");

  const dateFmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
  });
  const timeFmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const [
    { count: docCount },
    { data: activity },
    { data: rawMilestones },
    { data: rawNotes },
    { data: rawTeam },
    { data: keyDocs },
  ] = await Promise.all([
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("deal_id", deal.id),
    supabase
      .from("audit_log")
      .select("action, actor_email, metadata, created_at")
      .eq("deal_id", deal.id)
      .order("id", { ascending: false })
      .limit(50),
    supabase
      .from("milestones")
      .select("id, label, due_date, status")
      .eq("deal_id", deal.id)
      .order("status")
      .order("due_date", { nullsFirst: false }),
    supabase
      .from("ic_notes")
      .select("id, body, created_at, author_id, profiles(full_name, email)")
      .eq("deal_id", deal.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("memberships")
      .select("role, profiles!inner(id, full_name, email)")
      .eq("org_id", deal.org_id)
      .order("created_at"),
    supabase
      .from("documents")
      .select("id, name, index_path")
      .eq("deal_id", deal.id)
      .not("current_version_id", "is", null)
      .order("index_path")
      .limit(6),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const todayIso = new Date().toISOString().slice(0, 10);
  const milestones: MilestoneItem[] = (rawMilestones ?? []).map((m) => ({
    id: m.id,
    label: m.label,
    due: m.due_date,
    dueLabel: m.due_date ? dateFmt.format(new Date(m.due_date)) : null,
    status: m.status,
    overdue: Boolean(m.due_date && m.due_date < todayIso),
  }));
  const nextMilestone = milestones.find((m) => m.status === "pending");

  const notes: IcNoteItem[] = (rawNotes ?? []).map((n) => {
    const p = n.profiles as unknown as {
      full_name: string;
      email: string;
    } | null;
    return {
      id: n.id,
      body: n.body,
      author: p?.full_name || p?.email?.split("@")[0] || "—",
      when: timeFmt.format(new Date(n.created_at)),
      mine: n.author_id === user?.id,
    };
  });

  const history: HistoryItem[] = (activity ?? []).map((a) => {
    const meta = a.metadata as Record<string, unknown>;
    return {
      label: ta.has(`actions.${actionKey(a.action)}`)
        ? ta(`actions.${actionKey(a.action)}`)
        : a.action,
      actor: (a.actor_email ?? "—").split("@")[0],
      detail: typeof meta?.name === "string" ? meta.name : null,
      when: timeFmt.format(new Date(a.created_at)),
    };
  });

  const team = (rawTeam ?? []).map((m) => {
    const p = m.profiles as unknown as {
      id: string;
      full_name: string;
      email: string;
    };
    return {
      id: p.id,
      name: p.full_name || p.email.split("@")[0],
      role: m.role as string,
    };
  });

  const form: DealForm = {
    id: deal.id,
    name: deal.name,
    type: deal.type,
    currency: deal.currency,
    amount: deal.amount ? Number(deal.amount) : null,
    stage: deal.stage,
    readiness: deal.readiness_score ?? 0,
  };

  const readiness = deal.readiness_score ?? 0;

  return (
    <div className="flex flex-col gap-5">
      {/* En-tête : identité + actions. */}
      <div className="flex items-center gap-3.5 flex-wrap">
        <span className="grid place-items-center w-11 h-11 rounded-[11px] bg-[oklch(0.93_0.03_45)] text-[oklch(0.50_0.13_40)] text-[15px] font-bold flex-none">
          {initials(deal.name)}
        </span>
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2">
            <h1 className="text-[19px] font-[650] tracking-[-0.02em]">
              {deal.name}
            </h1>
            <Chip tone="indigo">{ts.has(deal.stage) ? ts(deal.stage) : deal.stage}</Chip>
          </div>
          <p className="text-[12.5px] text-ink-secondary mt-0.5">{deal.type}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/roadmap" className={SECONDARY_BTN}>
            {t("syndicate")}
          </Link>
          {canEdit && <EditDealButton deal={form} canDelete={canDelete} />}
          <Link href="/data-room" className={PRIMARY_BTN}>
            {t("openDataRoom")}
          </Link>
        </div>
      </div>

      {/* 4 cartes stat — uniquement des chiffres réels. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardBody>
            <span className="text-[11.5px] text-ink-secondary">
              {t("amountSought")}
            </span>
            <div className="font-mono text-[18px] tracking-[-0.02em] mt-1">
              {deal.amount
                ? formatAmount(Number(deal.amount), deal.currency, locale)
                : "—"}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <span className="text-[11.5px] text-ink-secondary flex items-center gap-1">
              {t("readiness")}
              <InfoTooltip text={t("tipReadiness")} />
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Mono className="text-[18px]">{readiness}%</Mono>
              <span className="flex-1 h-1 rounded-[2px] bg-separator-soft overflow-hidden">
                <span
                  className={`block h-full ${readinessColor(readiness)}`}
                  style={{ width: `${readiness}%` }}
                />
              </span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <span className="text-[11.5px] text-ink-secondary flex items-center gap-1">
              {t("nextMilestone")}
              <InfoTooltip text={t("tipNextMilestone")} />
            </span>
            {nextMilestone ? (
              <>
                <div className="text-[13.5px] font-[650] mt-1 truncate">
                  {nextMilestone.label}
                </div>
                <Mono className="text-[10.5px] text-ink-muted">
                  {nextMilestone.dueLabel ?? "—"}
                </Mono>
              </>
            ) : (
              <div className="text-[13px] text-ink-muted mt-1">
                {t("noNextMilestone")}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <span className="text-[11.5px] text-ink-secondary">
              {t("documents")}
            </span>
            <div className="font-mono text-[18px] mt-1">{docCount ?? 0}</div>
            <Link
              href="/data-room"
              className="text-[11px] font-medium text-accent"
            >
              {t("openDataRoom")} →
            </Link>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start">
        {/* Colonne gauche : historique + notes d'IC */}
        <div className="flex flex-col gap-3">
          <Card className="overflow-hidden">
            <DealHistory items={history} tip={t("tipHistory")} />
          </Card>

          <Card className="overflow-hidden">
            <IcNotes dealId={deal.id} notes={notes} canEdit={canEdit} />
          </Card>
        </div>

        {/* Colonne droite : équipe + documents clés + jalons */}
        <div className="flex flex-col gap-3">
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-separator-soft text-[13px] font-[650] flex items-center gap-1.5">
              {t("team")}
              <InfoTooltip text={t("tipTeam")} />
            </div>
            {team.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2.5 px-4 py-2.5 border-b border-separator last:border-0"
              >
                <span className="grid place-items-center w-[26px] h-[26px] rounded-full bg-chip-indigo-bg text-chip-indigo-fg text-[10px] font-bold flex-none">
                  {initials(p.name)}
                </span>
                <span className="text-[12.5px] font-[550] flex-1 min-w-0 truncate">
                  {p.name}
                </span>
                <Chip tone={TEAM_TONE[p.role] ?? "neutral"}>
                  {tp.has(`roles.${p.role}`) ? tp(`roles.${p.role}`) : p.role}
                </Chip>
              </div>
            ))}
            {team.length === 0 && (
              <CardBody>
                <p className="text-[12px] text-ink-muted py-2">{t("noTeam")}</p>
              </CardBody>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-separator-soft text-[13px] font-[650]">
              {t("keyDocuments")}
            </div>
            {(keyDocs ?? []).map((d) => (
              <Link
                key={d.id}
                href={`/visionneuse?doc=${d.id}`}
                className="flex items-center gap-2.5 px-4 py-2.5 border-b border-separator last:border-0 hover:bg-[oklch(0.985_0.002_260)]"
              >
                <span className="grid place-items-center w-7 h-7 rounded-[6px] bg-chip-neutral-bg text-chip-neutral-fg text-[9px] font-bold flex-none">
                  {(d.name.split(".").pop() ?? "").toUpperCase().slice(0, 4)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-[550] truncate">
                    {d.name}
                  </div>
                  <Mono className="text-[10px] text-ink-muted">
                    {d.index_path}
                  </Mono>
                </div>
              </Link>
            ))}
            {(keyDocs ?? []).length === 0 && (
              <CardBody>
                <p className="text-[12px] text-ink-muted py-2">
                  {t("noKeyDocuments")}
                </p>
              </CardBody>
            )}
          </Card>

          <Card>
            <div className="px-4 py-3 border-b border-separator-soft text-[13px] font-[650] flex items-center gap-1.5">
              {t("milestones")}
              <InfoTooltip text={t("tipNextMilestone")} />
            </div>
            <div className="px-4 py-3">
              <Milestones
                dealId={deal.id}
                items={milestones}
                canEdit={canEdit}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
