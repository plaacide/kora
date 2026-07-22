import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatAmount } from "@/lib/format";
import type { DealRef } from "@/lib/current-deal";

/**
 * Accueil du FONDATEUR — refonte fidèle au handoff app v5 (§2).
 *
 * Structure de la maquette : résumé de la levée en bandeau (objectif · dossier
 * prêt · investisseurs · vues), « prochaine action » en bandeau orange, visites
 * récentes + signal, documents les plus regardés + qui a regardé le plus.
 *
 * Honnêteté des données : chaque chiffre vient d'une table réelle. Ce que le
 * handoff montre mais que la base ne porte pas encore (soft-commitments, poids
 * de débloquage) n'est PAS inventé — on affiche ce qui existe.
 *
 * Le signal de lecture (couverture, temps) n'est pas déduit d'horodatages de
 * rendu mais mesuré : `page_dwell` pour le temps, pages distinctes / total pour
 * la couverture.
 */

type BadgeType = "PDF" | "XLSX" | "DOCX" | "DOC";

function badgeType(mime: string | null | undefined): BadgeType {
  const m = (mime ?? "").toLowerCase();
  if (m.includes("pdf")) return "PDF";
  if (m.includes("sheet") || m.includes("excel") || m.includes("csv")) return "XLSX";
  if (m.includes("word") || m.includes("document")) return "DOCX";
  return "DOC";
}

const BADGE: Record<BadgeType, string> = {
  PDF: "bg-[#FBEDE6] text-[#C0392B]",
  XLSX: "bg-[#E4F3EC] text-[#147A5C]",
  DOCX: "bg-[#E9F2FB] text-[#185FA5]",
  DOC: "bg-[#F1F0EC] text-[#6E727A]",
};

function Badge({ type }: { type: BadgeType }) {
  return (
    <span
      className={"shrink-0 rounded-[4px] px-1 py-0.5 text-[9px] font-[500] " + BADGE[type]}
      style={{ fontFamily: "var(--font-plex-mono), monospace" }}
    >
      {type}
    </span>
  );
}

function duree(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `00:${String(s).padStart(2, "0")}`;
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
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
  function relatif(iso: string): string {
    const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 60) return rtf.format(-min, "minute");
    const h = Math.round(min / 60);
    if (h < 24) return rtf.format(-h, "hour");
    return rtf.format(-Math.round(h / 24), "day");
  }

  const [
    { data: dealRow },
    { data: exigences },
    { data: docs },
    { data: invites },
    { data: journal },
    { data: reading },
  ] = await Promise.all([
    supabase
      .from("deals")
      .select("amount, currency, stage")
      .eq("id", deal.id)
      .maybeSingle(),
    supabase
      .from("checklist_items")
      .select("label, status, folder_id")
      .eq("deal_id", deal.id)
      .order("category")
      .order("position"),
    supabase
      .from("documents")
      .select("id, name, document_versions!documents_current_version_fk(page_count, mime_type)")
      .eq("deal_id", deal.id),
    supabase
      .from("invitations")
      .select("email, status")
      .eq("deal_id", deal.id),
    supabase
      .from("audit_log")
      .select("target_id, actor_email, metadata, created_at")
      .eq("deal_id", deal.id)
      .in("action", ["document.page_viewed", "document.sheet_viewed"])
      .neq("actor_id", userId)
      .order("created_at", { ascending: false })
      .limit(600),
    supabase.rpc("deal_reading_time", { p_deal: deal.id }),
  ]);

  const montant = (dealRow as { amount?: number | null; currency?: string | null } | null)
    ?.amount;
  const devise = (dealRow as { currency?: string | null } | null)?.currency ?? "";

  const liste = (exigences ?? []) as { label: string; status: string; folder_id: string | null }[];
  const total = liste.length;
  const faites = liste.filter((i) => i.status === "done").length;
  const enCours = liste.filter((i) => i.status === "in_progress").length;
  const score = total ? Math.round(((faites + enCours * 0.5) / total) * 100) : 0;
  const manquantes = liste.filter((i) => i.status !== "done");
  const prochaine = manquantes[0] ?? null;

  const invitations = (invites ?? []) as { email: string; status: string }[];
  const acceptes = invitations.filter((i) => i.status === "accepted").length;
  const enAttente = invitations.length - acceptes;

  // Métadonnées par document.
  const meta = new Map<string, { nom: string; pages: number; type: BadgeType }>();
  for (const d of (docs ?? []) as unknown as Array<{
    id: string;
    name: string;
    document_versions:
      | { page_count: number | null; mime_type: string | null }
      | { page_count: number | null; mime_type: string | null }[]
      | null;
  }>) {
    const dv = Array.isArray(d.document_versions) ? d.document_versions[0] : d.document_versions;
    meta.set(d.id, { nom: d.name, pages: dv?.page_count ?? 0, type: badgeType(dv?.mime_type) });
  }

  const evenements = (journal ?? []) as {
    target_id: string | null;
    actor_email: string | null;
    metadata: { page?: number } | null;
    created_at: string;
  }[];

  // Temps de lecture réel par (personne, document).
  const tempsCouple = new Map<string, number>();
  for (const r of (reading ?? []) as { actor_email: string | null; document_id: string; total_ms: number }[]) {
    tempsCouple.set(`${(r.actor_email ?? "—").toLowerCase()}|${r.document_id}`, r.total_ms);
  }

  const couple = new Map<string, { qui: string; docId: string; dernier: string }>();
  const parDoc = new Map<string, number>();
  let vues7 = 0;
  let vues14 = 0;
  const semaine = 7 * 24 * 60 * 60 * 1000;
  for (const e of evenements) {
    const qui = (e.actor_email ?? "—").toLowerCase();
    const docId = e.target_id ?? "";
    const age = Date.now() - new Date(e.created_at).getTime();
    if (age < semaine) vues7++;
    else if (age < 2 * semaine) vues14++;
    parDoc.set(docId, (parDoc.get(docId) ?? 0) + 1);
    const cle = `${qui}|${docId}`;
    const c = couple.get(cle) ?? { qui, docId, dernier: e.created_at };
    if (e.created_at > c.dernier) c.dernier = e.created_at;
    couple.set(cle, c);
  }

  // Visites récentes : une par (personne, document), la plus récente d'abord.
  const visites = [...couple.values()]
    .sort((a, b) => +new Date(b.dernier) - +new Date(a.dernier))
    .slice(0, 5)
    .map((c) => {
      const m = meta.get(c.docId);
      return {
        qui: c.qui.split("@")[0],
        doc: m?.nom ?? c.docId,
        type: m?.type ?? ("DOC" as BadgeType),
        quand: relatif(c.dernier),
        ms: tempsCouple.get(`${c.qui}|${c.docId}`) ?? 0,
      };
    });

  // Documents les plus regardés.
  const topDocs = [...parDoc.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([docId, vues]) => ({ nom: meta.get(docId)?.nom ?? docId, type: meta.get(docId)?.type ?? ("DOC" as BadgeType), vues }));
  const maxVues = topDocs[0]?.vues ?? 1;

  // Qui a regardé le plus : temps total et nombre de documents par personne.
  const parPersonne = new Map<string, { ms: number; docs: Set<string> }>();
  for (const r of (reading ?? []) as { actor_email: string | null; document_id: string; total_ms: number }[]) {
    const qui = (r.actor_email ?? "—").toLowerCase();
    const p = parPersonne.get(qui) ?? { ms: 0, docs: new Set<string>() };
    p.ms += r.total_ms;
    p.docs.add(r.document_id);
    parPersonne.set(qui, p);
  }
  const topLecteurs = [...parPersonne.entries()]
    .sort((a, b) => b[1].ms - a[1].ms)
    .slice(0, 4)
    .map(([email, p]) => ({ qui: email.split("@")[0], docs: p.docs.size, ms: p.ms }));

  const objectifTxt =
    typeof montant === "number" && montant > 0
      ? formatAmount(montant, devise || "XOF", locale)
      : null;

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div>
        <h1 className="font-display text-[27px] font-[700] tracking-[-0.02em] text-[#1A1B1F]">
          {t("hello", { name: prenom })}
        </h1>
        <p className="text-[13.5px] text-[#6E727A] mt-1">{t("subtitleV5")}</p>
      </div>

      {/* Résumé de la levée */}
      <div className="border border-[#E4E2DC] rounded-[6px] bg-white">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F0EC]">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] font-[600] uppercase tracking-[0.08em] text-[#9DA0A8]">
              {t("currentRaise")}
            </span>
            <span className="text-[13.5px] font-[650] text-[#1A1B1F]">{deal.name}</span>
            <span className="text-[9.5px] font-[700] uppercase tracking-[0.05em] text-[#147A5C] bg-[#E4F3EC] rounded-[4px] px-1.5 py-0.5">
              {t("active")}
            </span>
          </div>
          <Link href="/deal" className="text-[12.5px] font-[600] text-[#C24619] hover:text-[#1A1B1F]">
            {t("openRaise")} →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#F1F0EC]">
          <Tuile label={t("objective")} valeur={objectifTxt ?? "—"} sub={objectifTxt ? undefined : t("objectiveEmpty")} />
          <Tuile
            label={t("readyTitle")}
            valeur={`${score}%`}
            barre={score}
            sub={t("readyMissing", { n: total - faites })}
            href="/checklist"
          />
          <Tuile
            label={t("investors")}
            valeur={`${acceptes}/${invitations.length || acceptes}`}
            sub={enAttente > 0 ? t("investorsPending", { n: enAttente }) : undefined}
          />
          <Tuile
            label={t("views7")}
            valeur={String(vues7)}
            sub={vues7 > vues14 ? t("viewsDeltaUp", { n: vues7 - vues14 }) : undefined}
            tone="green"
          />
        </div>
      </div>

      {/* Prochaine action */}
      {prochaine && (
        <Link
          href={prochaine.folder_id ? `/data-room?dossier=${prochaine.folder_id}` : "/checklist"}
          className="flex items-center gap-4 rounded-[6px] border border-[#F3D9CC] bg-[#FEF8F4] px-5 py-3.5 hover:border-[#E85C2B] transition-colors group"
        >
          <span className="font-mono text-[9.5px] font-[700] uppercase tracking-[0.08em] text-[#C24619] shrink-0">
            {t("nextAction")}
          </span>
          <span className="flex-1 text-[13.5px] font-[550] text-[#1A1B1F]">
            {t("depositPiece", { piece: prochaine.label })}
          </span>
          <span className="text-[12.5px] font-[600] text-[#C24619] shrink-0">
            {t("deposit")} →
          </span>
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] items-start">
        {/* Visites récentes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[15px] font-[700] text-[#1A1B1F]">{t("recentVisits")}</h2>
            <Link href="/contacts" className="text-[12px] font-[600] text-[#C24619] hover:text-[#1A1B1F]">
              {t("allVisits")} →
            </Link>
          </div>
          {visites.length === 0 ? (
            <p className="text-[12.5px] text-[#9DA0A8] py-3">{t("viewsEmpty")}</p>
          ) : (
            <div className="border-t border-[#ECEBE6]">
              <div className="flex items-center gap-3 py-2 font-mono text-[9px] font-[600] uppercase tracking-[0.05em] text-[#9DA0A8] border-b border-[#ECEBE6]">
                <div className="flex-[1.2] min-w-0">{t("colWho")}</div>
                <div className="flex-[1.6] min-w-0">{t("colDoc")}</div>
                <div className="w-[64px] shrink-0">{t("colWhen")}</div>
                <div className="w-[54px] shrink-0 text-right">{t("colDuration")}</div>
              </div>
              {visites.map((v, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#F1F0EC] hover:bg-[#FAFAF8]">
                  <div className="flex-[1.2] min-w-0 flex items-center gap-2.5">
                    <span className="grid place-items-center w-7 h-7 shrink-0 rounded-[6px] bg-[#F1F0EC] text-[10px] font-[700] text-[#6E727A] uppercase">
                      {v.qui.slice(0, 2)}
                    </span>
                    <span className="text-[12.5px] font-[550] text-[#1A1B1F] truncate">{v.qui}</span>
                  </div>
                  <div className="flex-[1.6] min-w-0 flex items-center gap-2">
                    <Badge type={v.type} />
                    <span className="text-[12.5px] text-[#33353B] truncate">{v.doc}</span>
                  </div>
                  <div className="w-[64px] shrink-0 text-[11.5px] text-[#6E727A]">{v.quand}</div>
                  <div className="w-[54px] shrink-0 text-right font-mono text-[11.5px] text-[#1A1B1F]">
                    {v.ms > 0 ? duree(v.ms) : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {topLecteurs[0] && topLecteurs[0].docs >= 2 && (
            <div className="mt-3 rounded-[6px] bg-[#FEF8F4] border border-[#F3D9CC] px-4 py-3 text-[12.5px] text-[#33353B] leading-relaxed">
              <span className="font-mono text-[9.5px] font-[700] uppercase tracking-[0.06em] text-[#C24619]">
                {t("signal")}
              </span>{" "}
              {t("signalBody", {
                who: topLecteurs[0].qui,
                docs: topLecteurs[0].docs,
                time: duree(topLecteurs[0].ms),
              })}
            </div>
          )}
        </div>

        {/* Colonne droite : documents + qui a regardé le plus */}
        <div className="flex flex-col gap-6">
          {topDocs.length > 0 && (
            <div>
              <h2 className="text-[15px] font-[700] text-[#1A1B1F] mb-2">{t("topDocs")}</h2>
              <div className="flex flex-col gap-2.5">
                {topDocs.map((d, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Badge type={d.type} />
                    <span className="flex-1 min-w-0 text-[12px] text-[#33353B] truncate">{d.nom}</span>
                    <span className="w-[80px] h-[6px] rounded-[3px] bg-[#F1F0EC] overflow-hidden">
                      <span className="block h-full bg-[#E85C2B]" style={{ width: `${Math.round((d.vues / maxVues) * 100)}%` }} />
                    </span>
                    <span className="w-5 text-right font-mono text-[11px] text-[#6E727A]">{d.vues}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {topLecteurs.length > 0 && (
            <div>
              <h2 className="text-[15px] font-[700] text-[#1A1B1F] mb-2">{t("topReaders")}</h2>
              <div className="flex flex-col gap-2">
                {topLecteurs.map((r, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="grid place-items-center w-7 h-7 shrink-0 rounded-[6px] bg-[#F1F0EC] text-[10px] font-[700] text-[#6E727A] uppercase">
                      {r.qui.slice(0, 2)}
                    </span>
                    <span className="flex-1 text-[12.5px] font-[550] text-[#1A1B1F] truncate">{r.qui}</span>
                    <span className="font-mono text-[11px] text-[#6E727A]">
                      {t("docsCountShort", { n: r.docs })} · {duree(r.ms)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Tuile du bandeau de résumé. */
function Tuile({
  label,
  valeur,
  sub,
  barre,
  href,
  tone,
}: {
  label: string;
  valeur: string;
  sub?: string;
  barre?: number;
  href?: string;
  tone?: "green";
}) {
  const inner = (
    <div className="px-5 py-4">
      <div className="text-[11px] font-[600] text-[#6E727A]">{label}</div>
      <div className="font-mono text-[22px] text-[#1A1B1F] tracking-[-0.02em] mt-1">{valeur}</div>
      {typeof barre === "number" && (
        <span className="block h-[5px] rounded-[2px] bg-[#ECEBE6] overflow-hidden mt-2">
          <span className="block h-full bg-[#E85C2B]" style={{ width: `${barre}%` }} />
        </span>
      )}
      {sub && (
        <div className={"text-[11px] mt-1.5 " + (tone === "green" ? "text-[#147A5C]" : "text-[#8B8E96]")}>
          {sub}
        </div>
      )}
    </div>
  );
  return href ? (
    <Link href={href} className="hover:bg-[#FAFAF8] transition-colors">
      {inner}
    </Link>
  ) : (
    inner
  );
}
