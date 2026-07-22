import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/access";
import { getCurrentDeal } from "@/lib/current-deal";
import { Card, CardBody } from "@/components/ui/Card";
import { ShareButton } from "@/components/dataroom/ShareButton";
import { RevokeButton } from "@/components/permissions/RevokeButton";
import { RightsEditor } from "@/components/permissions/RightsEditor";
import type { Locale } from "@/i18n/locales";

/**
 * Autorisations — onglet de la data room (handoff §3b), style maquette.
 *
 * Une ligne par invité : ses DROITS, les DOSSIERS auxquels il accède, sa
 * DERNIÈRE VISITE, et Révoquer. Données réelles — droits et dossiers viennent
 * des permissions, la dernière visite du journal d'audit.
 */

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase() || "?";
}

export default async function PermissionsPage() {
  const t = await getTranslations("permissions");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();
  await requireInternal(supabase);

  const { deal } = await getCurrentDeal(supabase);
  if (!deal) {
    return (
      <div className="max-w-2xl">
        <Card><CardBody><p className="text-[12.5px] text-ink-secondary py-3">{t("emptyState")}</p></CardBody></Card>
      </div>
    );
  }

  const [{ data: folders }, { data: members }, { data: perms }, { data: vues }] =
    await Promise.all([
      supabase.from("folders").select("id, name").eq("deal_id", deal.id).is("parent_id", null).order("index_path"),
      supabase.from("memberships").select("role, profiles!inner(id, email, full_name)"),
      supabase.from("permissions").select("user_id, folder_id, level").eq("deal_id", deal.id),
      supabase
        .from("audit_log")
        .select("actor_email, created_at")
        .eq("deal_id", deal.id)
        .in("action", ["document.page_viewed", "document.sheet_viewed"])
        .order("created_at", { ascending: false })
        .limit(300),
    ]);

  const nbFolders = (folders ?? []).length;
  const folderName = new Map((folders ?? []).map((f) => [f.id, f.name]));

  // Dernière visite par personne (e-mail).
  const derniereVue = new Map<string, string>();
  for (const v of (vues ?? []) as { actor_email: string | null; created_at: string }[]) {
    const e = (v.actor_email ?? "").toLowerCase();
    if (e && !derniereVue.has(e)) derniereVue.set(e, v.created_at);
  }

  // Permissions par personne.
  const permsParUser = new Map<string, { level: string; folderId: string }[]>();
  for (const p of (perms ?? []) as { user_id: string; folder_id: string; level: string }[]) {
    if (p.level === "none") continue;
    const arr = permsParUser.get(p.user_id) ?? [];
    arr.push({ level: p.level, folderId: p.folder_id });
    permsParUser.set(p.user_id, arr);
  }

  // Les INVITÉS (rôle guest) avec au moins un accès.
  type Prof = { id: string; email: string; full_name: string };
  const invites = ((members ?? []) as unknown as Array<{ role: string; profiles: Prof | Prof[] }>)
    .map((m) => ({ role: m.role, p: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles }))
    .filter((m) => m.role === "guest" && m.p && permsParUser.has(m.p.id))
    .map(({ p }) => {
      const droits = permsParUser.get(p.id) ?? [];
      const niveau = droits[0]?.level ?? "watermark";
      const dossiers = droits.map((d) => folderName.get(d.folderId)).filter(Boolean) as string[];
      const tousLes = dossiers.length >= nbFolders && nbFolders > 0;
      return {
        id: p.id,
        nom: p.full_name || p.email.split("@")[0],
        email: p.email,
        niveau,
        dossiers: tousLes ? `Tous (${nbFolders})` : dossiers.slice(0, 3).join(", ") || "—",
        folderIds: droits.map((d) => d.folderId),
        vue: derniereVue.get(p.email.toLowerCase()) ?? null,
      };
    });

  const rtf = new Intl.RelativeTimeFormat(locale === "fr" ? "fr-FR" : "en-US", { numeric: "auto", style: "short" });
  function relatif(iso: string): string {
    const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 60) return rtf.format(-min, "minute");
    const h = Math.round(min / 60);
    if (h < 24) return rtf.format(-h, "hour");
    return rtf.format(-Math.round(h / 24), "day");
  }

  return (
    <div className="text-[#1A1B1F]">
      <div className="flex items-center justify-between mb-3.5">
        <p className="text-[12.5px] text-[#6E727A]">{t("accessNote")}</p>
        <ShareButton dealId={deal.id} label={t("invite")} className="rounded-[5px] bg-[#E85C2B] px-3.5 py-2 text-[12.5px] font-[600] text-white hover:bg-[#D24E1F] whitespace-nowrap" />
      </div>

      <div style={mono} className="grid grid-cols-[2fr_1.1fr_1fr_1fr_80px] gap-3 px-2 pb-2 border-b border-[#ECEBE6] text-[9px] tracking-[0.08em] text-[#A0A3AB]">
        <span>{t("colPerson")}</span><span>{t("colRights")}</span><span>{t("colFolders")}</span><span>{t("colLastVisit")}</span><span></span>
      </div>

      {invites.length === 0 ? (
        <p className="text-[12px] text-[#9DA0A8] text-center py-8">{t("noGuests")}</p>
      ) : (
        invites.map((i) => (
          <div key={i.id} className="grid grid-cols-[2fr_1.1fr_1fr_1fr_80px] gap-3 items-center px-2 py-3.5 border-b border-[#F1F0EC] hover:bg-[#FAFAF8]">
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="grid place-items-center w-8 h-8 rounded-[6px] bg-[#1A1B1F] text-white text-[11px] font-[700] shrink-0">{initials(i.nom)}</span>
              <span className="min-w-0">
                <span className="block text-[13px] font-[600] truncate">{i.nom}</span>
                <span className="block text-[11px] text-[#9DA0A8] truncate">{i.email}</span>
              </span>
            </span>
            <RightsEditor dealId={deal.id} userId={i.id} folderIds={i.folderIds} current={i.niveau} />
            <span className="text-[12px] text-[#55585F] truncate">{i.dossiers}</span>
            <span className="text-[12px] text-[#55585F]">{i.vue ? relatif(i.vue) : "—"}</span>
            <RevokeButton dealId={deal.id} userId={i.id} folderIds={i.folderIds} label={t("revoke")} confirmLabel={t("revokeConfirm", { name: i.nom })} />
          </div>
        ))
      )}
    </div>
  );
}
