import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Card, CardBody } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Mono } from "@/components/ui/Table";
import type { DealRef } from "@/lib/current-deal";

/**
 * Accueil du FONDATEUR.
 *
 * L'écran d'origine agrège un portefeuille : volume en cours, deals actifs,
 * readiness moyen, filtres « En DD » et « IC ce mois ». Ce sont les questions
 * d'un fonds. Un fondateur n'a qu'une opération — la sienne — et quatre
 * questions bien à lui :
 *
 *   1. où j'en suis      → complétude et pièces manquantes, cliquables
 *   2. qui regarde       → le journal d'audit, retourné en signal d'intérêt
 *   3. qui a accès       → et depuis quand
 *   4. quoi faire ensuite
 *
 * Rien n'est inventé : chaque chiffre vient d'une table réelle. Si la donnée
 * n'existe pas, le bloc ne s'affiche pas.
 */

interface Consultation {
  qui: string;
  quoi: string;
  quand: string;
}

export async function AccueilFondateur({
  supabase,
  deal,
  prenom,
  userId,
}: {
  supabase: SupabaseClient;
  deal: DealRef;
  prenom: string;
  userId: string;
}) {
  const t = await getTranslations("founderHome");

  const [{ data: exigences }, { data: docs }, { data: acces }, { data: journal }] =
    await Promise.all([
      supabase
        .from("checklist_items")
        .select("label, status, folder_id")
        .eq("deal_id", deal.id)
        .order("category")
        .order("position"),
      supabase.from("documents").select("id").eq("deal_id", deal.id),
      // Qui, hors de l'équipe, peut ouvrir le dossier.
      supabase.rpc("deal_folder_access", { p_deal: deal.id }),
      // Consultations RÉCENTES. On exclut l'auteur : voir sa propre activité
      // remontée comme « activité récente » n'apprend rien et noie le seul
      // signal qui compte — qu'un tiers a ouvert le dossier.
      supabase
        .from("audit_log")
        .select("action, actor_email, metadata, created_at")
        .eq("deal_id", deal.id)
        .in("action", ["document.page_viewed", "document.sheet_viewed"])
        .neq("actor_id", userId)
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

  const liste = (exigences ?? []) as {
    label: string;
    status: string;
    folder_id: string | null;
  }[];
  const total = liste.length;
  const faites = liste.filter((i) => i.status === "done").length;
  const enCours = liste.filter((i) => i.status === "in_progress").length;
  const score = total
    ? Math.round(((faites + enCours * 0.5) / total) * 100)
    : 0;
  const manquantes = liste.filter((i) => i.status !== "done").slice(0, 5);

  // Une consultation par personne et par document : dix pages lues du même
  // fichier, c'est UN intérêt, pas dix.
  const vues = new Map<string, Consultation>();
  for (const e of (journal ?? []) as {
    actor_email: string | null;
    metadata: { name?: string } | null;
    created_at: string;
  }[]) {
    const qui = e.actor_email ?? "—";
    const quoi = e.metadata?.name ?? "—";
    const cle = `${qui}|${quoi}`;
    if (!vues.has(cle)) vues.set(cle, { qui, quoi, quand: e.created_at });
  }
  const consultations = [...vues.values()].slice(0, 6);

  const invites = ((acces ?? []) as { full_name: string; role: string; level: string }[])
    .filter((a) => a.role === "guest" && a.level !== "none");
  // Un même invité a une ligne par dossier : on ne le compte qu'une fois.
  const invitesUniques = [...new Map(invites.map((i) => [i.full_name, i])).values()];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">
            {t("hello", { name: prenom })}
          </h1>
          <p className="text-[12.5px] text-ink-secondary mt-0.5">
            {t("subtitle", { deal: deal.name })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/checklist" className="sz-cta text-[13px] px-4 py-2">
            {t("completeCta")}
          </Link>
          <Link
            href="/invitations"
            className="inline-flex items-center justify-center rounded-[9px] border border-line bg-surface px-4 py-2 text-[13px] font-[550] text-ink-secondary hover:text-ink hover:border-line-strong transition-colors min-h-[38px]"
          >
            {t("inviteCta")}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr] items-start">
        {/* ---------- Où j'en suis ---------- */}
        <Card>
          <CardBody>
            <div className="flex items-baseline justify-between">
              <span className="text-[12.5px] font-[550] text-ink-secondary">
                {t("readyTitle")}
              </span>
              <Mono className="text-[26px] text-ink tracking-[-0.03em]">
                {score}%
              </Mono>
            </div>
            <span className="block h-2 rounded-[3px] bg-separator-soft overflow-hidden mt-2">
              <span
                className={
                  "block h-full transition-all " +
                  (score < 40
                    ? "bg-[oklch(0.60_0.17_40)]"
                    : score < 75
                      ? "bg-[oklch(0.65_0.14_85)]"
                      : "bg-[oklch(0.60_0.13_155)]")
                }
                style={{ width: `${score}%` }}
              />
            </span>
            <p className="text-[12px] text-ink-secondary mt-2.5">
              {t("readyHint", { done: faites, total, missing: total - faites })}
            </p>

            {manquantes.length > 0 && (
              <div className="mt-4 flex flex-col gap-1.5">
                <div className="text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted">
                  {t("missingTitle")}
                </div>
                {manquantes.map((m) => (
                  <Link
                    key={m.label}
                    href={
                      m.folder_id ? `/data-room?dossier=${m.folder_id}` : "/checklist"
                    }
                    className="flex items-center gap-2 text-[12.5px] text-ink hover:text-primary transition-colors"
                  >
                    <span className="text-ink-muted">·</span>
                    <span className="truncate">{m.label}</span>
                  </Link>
                ))}
                {total - faites > manquantes.length && (
                  <Link
                    href="/checklist"
                    className="text-[11.5px] text-link hover:text-link-hover mt-0.5"
                  >
                    {t("missingMore", {
                      n: total - faites - manquantes.length,
                    })}
                  </Link>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* ---------- Qui regarde ---------- */}
        <Card>
          <CardBody>
            <div className="text-[12.5px] font-[550] text-ink-secondary">
              {t("viewsTitle")}
            </div>

            {consultations.length === 0 ? (
              <p className="text-[12px] text-ink-muted mt-2 leading-relaxed">
                {t("viewsEmpty")}
              </p>
            ) : (
              <div className="flex flex-col gap-2.5 mt-3">
                {consultations.map((c) => (
                  <div key={`${c.qui}-${c.quoi}`} className="flex flex-col">
                    <span className="text-[12.5px] text-ink">
                      {t("viewedBy", { who: c.qui.split("@")[0] })}
                    </span>
                    <span className="text-[11.5px] text-ink-muted truncate">
                      {c.quoi}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-separator-soft">
              <div className="text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted mb-2">
                {t("accessTitle")}
              </div>
              {invitesUniques.length === 0 ? (
                <p className="text-[12px] text-ink-muted leading-relaxed">
                  {t("accessEmpty")}
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {invitesUniques.map((i) => (
                    <div
                      key={i.full_name}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-[12.5px] text-ink truncate">
                        {i.full_name}
                      </span>
                      <Chip tone={i.level === "watermark" ? "amber" : "indigo"}>
                        {i.level}
                      </Chip>
                    </div>
                  ))}
                  <Link
                    href="/permissions"
                    className="text-[11.5px] text-link hover:text-link-hover mt-1"
                  >
                    {t("accessManage")}
                  </Link>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <p className="text-[11.5px] text-ink-muted">
        {t("docsCount", { n: (docs ?? []).length })} ·{" "}
        <Link href="/data-room" className="text-link hover:text-link-hover">
          {t("docsLink")}
        </Link>
      </p>
    </div>
  );
}
