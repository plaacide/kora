import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Card, CardBody } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Mono } from "@/components/ui/Table";
import type { DealRef } from "@/lib/current-deal";

/**
 * Accueil du FONDATEUR.
 *
 * Quatre questions bien à lui — où j'en suis, qui regarde, qui a accès, quoi
 * ensuite — plus, depuis le bloc « signal », ce qui fait la force de DocSend :
 * QUELLE attention porte chaque investisseur à CHAQUE document.
 *
 * Honnêteté sur ce signal : l'audit enregistre les vues au RENDU de chaque
 * page, pas le temps passé dessus. On ne prétend donc PAS mesurer une durée —
 * on mesure la COUVERTURE : combien de pages, sur le total, un lecteur a
 * ouvertes. C'est incontestable (`page_count` existe, la page vue est dans les
 * métadonnées). Le temps réel viendra d'un suivi dédié, pas d'un calcul sur des
 * horodatages de rendu qui le fausseraient.
 *
 * Rien n'est inventé : chaque chiffre vient d'une table réelle.
 */

type BadgeType = "PDF" | "XLSX" | "DOCX" | "DOC";

/** Type de fichier depuis le MIME, pour le badge de la colonne Document. */
function badgeType(mime: string | null | undefined): BadgeType {
  const m = (mime ?? "").toLowerCase();
  if (m.includes("pdf")) return "PDF";
  if (m.includes("sheet") || m.includes("excel") || m.includes("csv"))
    return "XLSX";
  if (m.includes("word") || m.includes("document")) return "DOCX";
  return "DOC";
}

const BADGE_STYLE: Record<BadgeType, string> = {
  PDF: "bg-[#FAECE7] text-[#c0392b]",
  XLSX: "bg-[#E1F5EE] text-[#0F6E56]",
  DOCX: "bg-[#E6F1FB] text-[#185FA5]",
  DOC: "bg-separator-soft text-ink-secondary",
};

/** Anneau de couverture. `null` quand le total de pages est inconnu. */
function Ring({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-[11.5px] text-ink-muted">—</span>;
  }
  const r = 11;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - pct / 100);
  const couleur =
    pct >= 66 ? "#1D9E75" : pct >= 33 ? "#e8a13a" : "#e0663a";
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-label={`${pct}%`}>
      <circle cx="15" cy="15" r={r} fill="none" stroke="#f1efe8" strokeWidth="3.5" />
      <circle
        cx="15"
        cy="15"
        r={r}
        fill="none"
        stroke={couleur}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={circ.toFixed(1)}
        strokeDashoffset={off.toFixed(1)}
        transform="rotate(-90 15 15)"
      />
      <text
        x="15"
        y="18.5"
        textAnchor="middle"
        fontSize="8.5"
        fontFamily="var(--font-plex-mono), monospace"
        fill="#171a2c"
      >
        {pct}
      </text>
    </svg>
  );
}

function Badge({ type }: { type: BadgeType }) {
  return (
    <span
      className={
        "shrink-0 rounded-[4px] px-1 py-0.5 text-[9px] font-[550] tracking-[0.02em] " +
        BADGE_STYLE[type]
      }
      style={{ fontFamily: "var(--font-plex-mono), monospace" }}
    >
      {type}
    </span>
  );
}

interface Regard {
  qui: string;
  doc: string;
  type: BadgeType;
  quand: string;
  couverture: number | null;
}

interface DocSignal {
  nom: string;
  type: BadgeType;
  vues: number;
  couvertureMoy: number | null;
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
  const locale = (await getLocale()) as "fr" | "en";
  const rtf = new Intl.RelativeTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    numeric: "auto",
    style: "short",
  });
  /** « il y a 8 min », « il y a 2 h »… depuis un horodatage. */
  function relatif(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.round(diff / 60000);
    if (min < 60) return rtf.format(-min, "minute");
    const h = Math.round(min / 60);
    if (h < 24) return rtf.format(-h, "hour");
    return rtf.format(-Math.round(h / 24), "day");
  }

  const [
    { data: exigences },
    { data: docs },
    { data: acces },
    { data: journal },
  ] = await Promise.all([
    supabase
      .from("checklist_items")
      .select("label, status, folder_id")
      .eq("deal_id", deal.id)
      .order("category")
      .order("position"),
    // Nom + version courante : le nombre de pages (dénominateur de la
    // couverture) et le MIME (badge de type) vivent sur la version.
    supabase
      .from("documents")
      .select(
        "id, name, document_versions!documents_current_version_fk(page_count, mime_type)",
      )
      .eq("deal_id", deal.id),
    supabase.rpc("deal_folder_access", { p_deal: deal.id }),
    // On exclut l'auteur : sa propre activité n'est pas un signal d'intérêt.
    // 600 événements : de quoi couvrir plusieurs documents lus page à page.
    supabase
      .from("audit_log")
      .select("target_id, actor_email, metadata, created_at")
      .eq("deal_id", deal.id)
      .in("action", ["document.page_viewed", "document.sheet_viewed"])
      .neq("actor_id", userId)
      .order("created_at", { ascending: false })
      .limit(600),
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

  // Métadonnées par document : nom, pages, type.
  const meta = new Map<string, { nom: string; pages: number; type: BadgeType }>();
  for (const d of (docs ?? []) as unknown as Array<{
    id: string;
    name: string;
    // PostgREST rend la relation comme un tableau, même pour un lien to-one.
    document_versions:
      | { page_count: number | null; mime_type: string | null }
      | { page_count: number | null; mime_type: string | null }[]
      | null;
  }>) {
    const dv = Array.isArray(d.document_versions)
      ? d.document_versions[0]
      : d.document_versions;
    meta.set(d.id, {
      nom: d.name,
      pages: dv?.page_count ?? 0,
      type: badgeType(dv?.mime_type),
    });
  }

  const evenements = (journal ?? []) as {
    target_id: string | null;
    actor_email: string | null;
    metadata: { name?: string; page?: number } | null;
    created_at: string;
  }[];

  // Par (personne, document) : pages DISTINCTES ouvertes (la couverture), la
  // vue la plus récente, le compte de vues.
  const parCouple = new Map<
    string,
    { qui: string; docId: string; pages: Set<number>; dernier: string; vues: number }
  >();
  // Par document : total de vues et couverture moyenne entre lecteurs.
  const parDoc = new Map<string, { vues: number; lecteurs: Set<string> }>();

  let vues7 = 0;
  let vues14 = 0;
  const now = Date.now();
  for (const e of evenements) {
    const qui = e.actor_email ?? "—";
    const docId = e.target_id ?? "";
    const age = now - new Date(e.created_at).getTime();
    const semaine = 7 * 24 * 60 * 60 * 1000;
    if (age < semaine) vues7++;
    else if (age < 2 * semaine) vues14++;

    const cle = `${qui}|${docId}`;
    const c =
      parCouple.get(cle) ??
      { qui, docId, pages: new Set<number>(), dernier: e.created_at, vues: 0 };
    if (typeof e.metadata?.page === "number") c.pages.add(e.metadata.page);
    c.vues++;
    // La liste est triée du plus récent au plus ancien : le premier vu gagne.
    if (new Date(e.created_at) > new Date(c.dernier)) c.dernier = e.created_at;
    parCouple.set(cle, c);

    const pd = parDoc.get(docId) ?? { vues: 0, lecteurs: new Set<string>() };
    pd.vues++;
    pd.lecteurs.add(qui);
    parDoc.set(docId, pd);
  }

  function couverture(pagesVues: number, pagesTotal: number): number | null {
    if (pagesTotal <= 0 || pagesVues <= 0) return null;
    return Math.min(100, Math.round((pagesVues / pagesTotal) * 100));
  }

  const regards: Regard[] = [...parCouple.values()]
    .sort((a, b) => +new Date(b.dernier) - +new Date(a.dernier))
    .slice(0, 6)
    .map((c) => {
      const m = meta.get(c.docId);
      return {
        qui: c.qui.split("@")[0],
        doc: m?.nom ?? c.docId,
        type: m?.type ?? "DOC",
        quand: relatif(c.dernier),
        couverture: couverture(c.pages.size, m?.pages ?? 0),
      };
    });

  // Couverture moyenne par document : moyenne des couvertures de chaque
  // lecteur. On repart des couples pour ne compter chaque lecteur qu'une fois.
  const couvParDoc = new Map<string, number[]>();
  for (const c of parCouple.values()) {
    const m = meta.get(c.docId);
    const cov = couverture(c.pages.size, m?.pages ?? 0);
    if (cov === null) continue;
    const arr = couvParDoc.get(c.docId) ?? [];
    arr.push(cov);
    couvParDoc.set(c.docId, arr);
  }
  const docsSignal: DocSignal[] = [...parDoc.entries()]
    .sort((a, b) => b[1].vues - a[1].vues)
    .slice(0, 5)
    .map(([docId, d]) => {
      const m = meta.get(docId);
      const covs = couvParDoc.get(docId) ?? [];
      return {
        nom: m?.nom ?? docId,
        type: m?.type ?? "DOC",
        vues: d.vues,
        couvertureMoy: covs.length
          ? Math.round(covs.reduce((s, x) => s + x, 0) / covs.length)
          : null,
      };
    });

  const invites = ((acces ?? []) as { full_name: string; role: string; level: string }[])
    .filter((a) => a.role === "guest" && a.level !== "none");
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

      {/* ---------- Chiffres clés ---------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardBody>
            <div className="text-[11px] font-[550] text-ink-secondary">
              {t("metricPrep")}
            </div>
            <Mono className="text-[24px] text-ink tracking-[-0.03em] mt-1 block">
              {score}%
            </Mono>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-[11px] font-[550] text-ink-secondary">
              {t("metricPieces")}
            </div>
            <Mono className="text-[24px] text-ink tracking-[-0.03em] mt-1 block">
              {faites}/{total}
            </Mono>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-[11px] font-[550] text-ink-secondary">
              {t("metricInvites")}
            </div>
            <Mono className="text-[24px] text-ink tracking-[-0.03em] mt-1 block">
              {invitesUniques.length}
            </Mono>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-[11px] font-[550] text-ink-secondary">
              {t("metricViews")}
            </div>
            <Mono className="text-[24px] text-ink tracking-[-0.03em] mt-1 block">
              {vues7}
            </Mono>
            {vues7 > 0 && (
              <div className="text-[10.5px] text-ink-muted mt-0.5">
                {vues7 > vues14
                  ? t("viewsDeltaUp", { n: vues7 - vues14 })
                  : t("viewsDeltaFlat")}
              </div>
            )}
          </CardBody>
        </Card>
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
                    {t("missingMore", { n: total - faites - manquantes.length })}
                  </Link>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* ---------- Qui a accès ---------- */}
        <Card>
          <CardBody>
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
          </CardBody>
        </Card>
      </div>

      {/* ---------- Qui regarde (par personne) ---------- */}
      <Card>
        <CardBody>
          <div className="text-[13.5px] font-[650] text-ink">
            {t("viewsTitle")}
          </div>
          {regards.length === 0 ? (
            <p className="text-[12px] text-ink-muted mt-2 leading-relaxed">
              {t("viewsEmpty")}
            </p>
          ) : (
            <>
              <div className="text-[11px] text-ink-muted mt-0.5 mb-2">
                {t("coverageHint")}
              </div>
              <div className="flex items-center gap-3 px-1 pb-1.5 text-[10px] font-[700] uppercase tracking-[0.04em] text-ink-muted border-b border-separator-soft">
                <div className="flex-[1.3] min-w-0">{t("whoPerson")}</div>
                <div className="flex-[1.6] min-w-0">{t("whoDoc")}</div>
                <div className="w-[64px] shrink-0">{t("whoWhen")}</div>
                <div className="w-[34px] shrink-0 text-right">{t("whoCoverage")}</div>
              </div>
              {regards.map((r, i) => (
                <div
                  key={`${r.qui}-${r.doc}-${i}`}
                  className="flex items-center gap-3 py-2.5 border-b border-separator-soft last:border-0"
                >
                  <div className="flex-[1.3] min-w-0 flex items-center gap-2.5">
                    <span className="grid place-items-center w-7 h-7 shrink-0 rounded-full bg-separator-soft text-[11px] font-[600] text-ink-secondary uppercase">
                      {r.qui.slice(0, 2)}
                    </span>
                    <span className="text-[12.5px] font-[550] text-ink truncate">
                      {r.qui}
                    </span>
                  </div>
                  <div className="flex-[1.6] min-w-0 flex items-center gap-2">
                    <Badge type={r.type} />
                    <span className="text-[12.5px] text-ink truncate">{r.doc}</span>
                  </div>
                  <div className="w-[64px] shrink-0 text-[11.5px] text-ink-secondary">
                    {r.quand}
                  </div>
                  <div className="w-[34px] shrink-0 flex justify-end">
                    <Ring pct={r.couverture} />
                  </div>
                </div>
              ))}
            </>
          )}
        </CardBody>
      </Card>

      {/* ---------- Documents les plus regardés ---------- */}
      {docsSignal.length > 0 && (
        <Card>
          <CardBody>
            <div className="text-[13.5px] font-[650] text-ink">
              {t("docsTitle")}
            </div>
            <div className="text-[11px] text-ink-muted mt-0.5 mb-2">
              {t("docsHint")}
            </div>
            {docsSignal.map((d, i) => (
              <div
                key={`${d.nom}-${i}`}
                className="py-2.5 border-b border-separator-soft last:border-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge type={d.type} />
                    <span className="text-[12.5px] font-[550] text-ink truncate">
                      {d.nom}
                    </span>
                  </div>
                  <Mono className="shrink-0 text-[11.5px] text-ink-secondary">
                    {t("docViews", { n: d.vues })}
                  </Mono>
                </div>
                {d.couvertureMoy !== null && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="flex-1 h-[5px] rounded-[3px] bg-separator-soft overflow-hidden">
                      <span
                        className="block h-full bg-primary"
                        style={{ width: `${d.couvertureMoy}%` }}
                      />
                    </span>
                    <Mono className="text-[10.5px] text-ink-muted">
                      {d.couvertureMoy}%
                    </Mono>
                  </div>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      <p className="text-[11.5px] text-ink-muted">
        {t("docsCount", { n: (docs ?? []).length })} ·{" "}
        <Link href="/data-room" className="text-link hover:text-link-hover">
          {t("docsLink")}
        </Link>
      </p>
    </div>
  );
}
