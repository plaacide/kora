import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/access";
import { ExportButton, type AuditCsvRow } from "@/components/audit/ExportButton";
import type { Locale } from "@/i18n/locales";

/**
 * Journal d'audit — onglet de la data room (handoff §3b), style maquette.
 *
 * L'en-tête et les onglets viennent de RoomTabs. Ici : le bandeau « chaîne
 * intègre · N entrées » (recalculé à chaque affichage), l'export, puis la table
 * Quand · Action · Par · Empreinte. Données 100 % réelles — chaque entrée est
 * chaînée par empreinte.
 */

function actionKey(action: string): string {
  return action.replace(/\./g, "_");
}

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

/** Couleur de la pastille par action, comme la maquette. */
const PILL: Record<string, string> = {
  "document.page_viewed": "text-[#147A5C] bg-[#E4F3EC]",
  "document.sheet_viewed": "text-[#147A5C] bg-[#E4F3EC]",
  "document.thumbnail_viewed": "text-[#147A5C] bg-[#E4F3EC]",
  "nda.signed": "text-[#185FA5] bg-[#E9F2FB]",
  "invitation.accepted": "text-[#C24619] bg-[#FBEDE6]",
  "invitation.created": "text-[#185FA5] bg-[#E9F2FB]",
  "checklist.document_linked": "text-[#C24619] bg-[#FBEDE6]",
  "document.downloaded": "text-[#B4741B] bg-[#FBF1DF]",
};
const PILL_DEFAULT = "text-[#6E727A] bg-[#F1F0EB]";

export default async function AuditPage() {
  const t = await getTranslations("audit");
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
    .order("created_at")
    .limit(1)
    .maybeSingle();
  const orgId = membership?.org_id as string | undefined;

  const [{ data: entries }, chain] = await Promise.all([
    supabase
      .from("audit_log")
      .select("id, action, actor_email, metadata, entry_hash, created_at")
      .order("id", { ascending: false })
      .limit(100),
    orgId
      ? supabase.rpc("verify_audit_chain", { p_org: orgId })
      : Promise.resolve({ data: null }),
  ]);

  const verdict = (chain.data as unknown as
    | Array<{ ok: boolean; broken_at: number | null; total: number }>
    | null)?.[0];

  const heure = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const jour = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
  });
  const aujourdhui = new Date().toDateString();
  function quand(iso: string): string {
    const d = new Date(iso);
    return d.toDateString() === aujourdhui ? heure.format(d) : jour.format(d);
  }

  // Lignes d'export : date complète, code d'action brut (précision d'audit),
  // détail, acteur, empreinte complète.
  const dateComplete = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    dateStyle: "short",
    timeStyle: "short",
  });
  const csvRows: AuditCsvRow[] = (entries ?? []).map((e) => {
    const meta = (e.metadata ?? {}) as Record<string, unknown>;
    const detail =
      ((meta.name as string) ?? (meta.email as string) ?? (meta.document_name as string) ?? (meta.label as string) ?? "") +
      (meta.page ? ` · p.${meta.page}` : "");
    return {
      when: dateComplete.format(new Date(e.created_at)),
      action: e.action,
      detail,
      who: e.actor_email ?? "",
      hash: e.entry_hash,
    };
  });

  return (
    <div className="text-[#1A1B1F]">
      <div className="flex items-center justify-between mb-4">
        <span
          style={mono}
          className={
            "text-[9.5px] font-[600] rounded-[4px] px-[11px] py-[5px] " +
            (verdict?.ok === false
              ? "text-[#A32D2D] bg-[#FCEBEB]"
              : "text-[#147A5C] bg-[#E4F3EC]")
          }
        >
          {verdict?.ok === false
            ? `● ${t("chainBroken").toUpperCase()}`
            : `● ${t("chainValid").toUpperCase()} · ${verdict?.total ?? entries?.length ?? 0} ${t("entries").toUpperCase()}`}
        </span>
        <ExportButton rows={csvRows} label={t("export")} />
      </div>

      <div style={mono} className="grid grid-cols-[104px_1.9fr_1.3fr_120px] gap-3 px-2 pb-2 border-b border-[#ECEBE6] text-[9px] tracking-[0.08em] text-[#A0A3AB]">
        <span>{t("colWhen")}</span><span>{t("colWhat")}</span><span>{t("colWho")}</span><span>{t("colHash")}</span>
      </div>

      {(entries ?? []).map((e) => {
        const meta = (e.metadata ?? {}) as Record<string, unknown>;
        const detail =
          (meta.name as string) ??
          (meta.email as string) ??
          (meta.document_name as string) ??
          (meta.label as string) ??
          "";
        const label = t.has(`actions.${actionKey(e.action)}`)
          ? t(`actions.${actionKey(e.action)}`)
          : e.action;
        return (
          <div key={e.id} className="grid grid-cols-[104px_1.9fr_1.3fr_120px] gap-3 items-center px-2 py-3 border-b border-[#F1F0EC] text-[12.5px]">
            <span style={mono} className="text-[11px] text-[#55585F]">{quand(e.created_at)}</span>
            <span className="min-w-0 flex items-center gap-2.5">
              <span style={mono} className={"text-[9px] font-[600] rounded-[4px] px-2 py-0.5 whitespace-nowrap uppercase " + (PILL[e.action] ?? PILL_DEFAULT)}>
                {label}
              </span>
              {detail && (
                <span className="text-[#55585F] truncate">
                  {detail}{meta.page ? ` · p.${meta.page}` : ""}
                </span>
              )}
            </span>
            <span className="text-[#55585F] truncate">{e.actor_email ?? "—"}</span>
            <span style={mono} className="text-[10px] text-[#A0A3AB] truncate">{e.entry_hash.slice(0, 10)}…</span>
          </div>
        );
      })}

      {(entries ?? []).length === 0 && (
        <p className="text-[12px] text-[#9DA0A8] text-center py-8">{t("empty")}</p>
      )}
    </div>
  );
}
