import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { requireInternal } from "@/lib/access";
import { Card, CardBody } from "@/components/ui/Card";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Mono } from "@/components/ui/Table";
import type { Locale } from "@/i18n/locales";

/**
 * next-intl interdit les points dans les clés (ils expriment l'imbrication).
 * Les actions viennent de la base sous la forme `document.page_viewed`.
 */
function actionKey(action: string): string {
  return action.replace(/\./g, "_");
}

/** Ton par famille d'action : lecture = neutre, écriture = indigo, sécurité = ambre. */
const TONE: Record<string, ChipTone> = {
  "document.page_viewed": "neutral",
  "document.downloaded": "amber",
  "document.uploaded": "indigo",
  "folder.created": "indigo",
  "deal.created": "indigo",
  "org.created": "indigo",
  "permission.set": "amber",
  "invitation.created": "indigo",
  "invitation.accepted": "success",
  "nda.signed": "success",
};

export default async function AuditPage() {
  const t = await getTranslations("audit");
  const tt = await getTranslations("tips");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();
  await requireInternal(supabase);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user?.id ?? "")
    .limit(1)
    .maybeSingle();
  const orgId = membership?.org_id as string | undefined;

  const [{ data: entries }, chain] = await Promise.all([
    supabase
      .from("audit_log")
      .select("id, action, actor_email, target_type, metadata, entry_hash, created_at")
      .order("id", { ascending: false })
      .limit(100),
    orgId
      ? supabase.rpc("verify_audit_chain", { p_org: orgId })
      : Promise.resolve({ data: null }),
  ]);

  const verdict = (chain.data as unknown as
    | Array<{ ok: boolean; broken_at: number | null; total: number }>
    | null)?.[0];

  const fmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
            {t("title")}{" "}<InfoTooltip text={tt("audit")} />
          </h1>
          <p className="text-[12.5px] text-ink-secondary mt-0.5">
            {t("subtitle")}
          </p>
        </div>

        {/* L'intégrité est recalculée à chaque affichage, pas mise en cache. */}
        {verdict && (
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-card border ${
              verdict.ok
                ? "border-[oklch(0.85_0.06_155)] bg-chip-success-bg"
                : "border-[oklch(0.80_0.10_25)] bg-chip-error-bg"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                verdict.ok ? "bg-success" : "bg-error"
              }`}
            />
            <div className="flex flex-col">
              <span
                className={`text-[11.5px] font-[650] flex items-center gap-1 ${
                  verdict.ok ? "text-chip-success-fg" : "text-chip-error-fg"
                }`}
              >
                {verdict.ok ? t("chainValid") : t("chainBroken")}
                <InfoTooltip text={tt("auditChain")} />
              </span>
              <Mono className="text-[10px] text-ink-muted">
                {verdict.ok
                  ? t("chainEntries", { n: verdict.total })
                  : t("chainBrokenAt", { id: verdict.broken_at ?? 0 })}
              </Mono>
            </div>
          </div>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[120px_1fr_150px_120px] gap-2.5 px-4 py-2 text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted bg-bg border-b border-separator-soft">
          <span>{t("colWhen")}</span>
          <span>{t("colWhat")}</span>
          <span>{t("colWho")}</span>
          <span>{t("colHash")}</span>
        </div>

        {(entries ?? []).map((e) => {
          const meta = (e.metadata ?? {}) as Record<string, unknown>;
          const detail =
            (meta.name as string) ??
            (meta.email as string) ??
            (meta.signer as string) ??
            (meta.level as string) ??
            "";
          return (
            <div
              key={e.id}
              className="grid grid-cols-[120px_1fr_150px_120px] gap-2.5 items-center px-4 py-2.5 border-b border-separator last:border-0 hover:bg-[oklch(0.985_0.002_260)]"
            >
              <Mono className="text-[11px]">
                {fmt.format(new Date(e.created_at))}
              </Mono>
              <div className="flex items-center gap-2 min-w-0">
                <Chip tone={TONE[e.action] ?? "neutral"}>
                  {t.has(`actions.${actionKey(e.action)}`)
                    ? t(`actions.${actionKey(e.action)}`)
                    : e.action}
                </Chip>
                {detail && (
                  <span className="text-[11.5px] text-ink-secondary truncate">
                    {detail}
                    {meta.page ? ` · p.${meta.page}` : ""}
                  </span>
                )}
              </div>
              <span className="text-[11.5px] text-ink-secondary truncate">
                {e.actor_email ?? "—"}
              </span>
              {/* Empreinte tronquée : la preuve complète reste en base. */}
              <Mono className="text-[10px] text-ink-muted truncate">
                {e.entry_hash.slice(0, 12)}…
              </Mono>
            </div>
          );
        })}

        {(entries ?? []).length === 0 && (
          <CardBody>
            <p className="text-[12px] text-ink-muted text-center py-4">
              {t("empty")}
            </p>
          </CardBody>
        )}
      </Card>

      <p className="text-[11.5px] text-ink-muted leading-relaxed max-w-2xl">
        {t("explainer")}
      </p>
    </div>
  );
}
