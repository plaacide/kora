import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/access";
import { getCurrentDeal } from "@/lib/current-deal";
import { Card, CardBody } from "@/components/ui/Card";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Mono } from "@/components/ui/Table";

/**
 * Contacts — les gens autour de votre levée, comme des fiches.
 *
 * C'est la pièce que DocSend a et que Sanza n'avait pas : les personnes ne sont
 * plus dispersées entre « invitations », « permissions » et « journal », elles
 * sont réunies en un seul endroit avec ce qu'elles ont fait — invitée, a signé,
 * a consulté, combien de documents, combien de temps.
 *
 * Rien de neuf n'est collecté : on RASSEMBLE ce qui existe déjà. Les
 * invitations donnent la liste, l'audit donne l'activité, le temps de lecture
 * donne le dwell. Un contact peut n'avoir aucune activité (invité, pas encore
 * venu) : c'est aussi une information.
 */

interface Contact {
  email: string;
  nom: string;
  statut: "invited" | "accepted" | "viewed";
  documentsVus: number;
  tempsMs: number;
  derniereActivite: string | null;
}

function dureeCourte(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const min = Math.round(s / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${String(min % 60).padStart(2, "0")}`;
}

const STATUT: Record<Contact["statut"], { label: string; tone: ChipTone }> = {
  invited: { label: "Invité", tone: "amber" },
  accepted: { label: "NDA signé", tone: "indigo" },
  viewed: { label: "A consulté", tone: "success" },
};

export default async function ContactsPage() {
  const supabase = await createClient();
  await requireInternal(supabase);
  const locale = (await getLocale()) as "fr" | "en";

  const { deal } = await getCurrentDeal(supabase);
  if (!deal) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">
          Contacts
        </h1>
        <Card>
          <CardBody>
            <p className="text-[12.5px] text-ink-secondary py-3">
              Aucune levée ouverte.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const [{ data: invitations }, { data: vues }, { data: reading }] =
    await Promise.all([
      supabase
        .from("invitations")
        .select("email, status, created_at")
        .eq("deal_id", deal.id),
      supabase
        .from("audit_log")
        .select("target_id, actor_email, created_at")
        .eq("deal_id", deal.id)
        .in("action", ["document.page_viewed", "document.sheet_viewed"])
        .order("created_at", { ascending: false })
        .limit(1000),
      // Temps de lecture par (personne, document). Tolérant : si la migration
      // du dwell n'est pas appliquée, on continue sans le temps.
      supabase.rpc("deal_reading_time", { p_deal: deal.id }),
    ]);

  const contacts = new Map<string, Contact>();
  function assurer(email: string): Contact {
    const cle = email.toLowerCase();
    let c = contacts.get(cle);
    if (!c) {
      c = {
        email: cle,
        nom: cle.split("@")[0],
        statut: "invited",
        documentsVus: 0,
        tempsMs: 0,
        derniereActivite: null,
      };
      contacts.set(cle, c);
    }
    return c;
  }

  // La liste part des invitations : elles disent QUI a été convié, même sans
  // activité derrière.
  for (const i of (invitations ?? []) as {
    email: string;
    status: string;
    created_at: string;
  }[]) {
    const c = assurer(i.email);
    if (i.status === "accepted" && c.statut === "invited") c.statut = "accepted";
  }

  // L'audit ajoute l'activité — et rattrape un contact qui aurait consulté sans
  // figurer dans les invitations (cas limite, mais on ne le perd pas).
  const docsParContact = new Map<string, Set<string>>();
  for (const v of (vues ?? []) as {
    target_id: string | null;
    actor_email: string | null;
    created_at: string;
  }[]) {
    if (!v.actor_email) continue;
    const c = assurer(v.actor_email);
    c.statut = "viewed";
    const set = docsParContact.get(c.email) ?? new Set<string>();
    if (v.target_id) set.add(v.target_id);
    docsParContact.set(c.email, set);
    if (!c.derniereActivite || v.created_at > c.derniereActivite) {
      c.derniereActivite = v.created_at;
    }
  }
  for (const [email, set] of docsParContact) {
    const c = contacts.get(email);
    if (c) c.documentsVus = set.size;
  }

  for (const r of (reading ?? []) as {
    actor_email: string | null;
    total_ms: number;
  }[]) {
    if (!r.actor_email) continue;
    const c = contacts.get(r.actor_email.toLowerCase());
    if (c) c.tempsMs += r.total_ms;
  }

  // Les plus actifs d'abord — un contact qui lit passe devant un simple invité.
  const liste = [...contacts.values()].sort((a, b) => {
    if (b.tempsMs !== a.tempsMs) return b.tempsMs - a.tempsMs;
    return b.documentsVus - a.documentsVus;
  });

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

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">
          Contacts
        </h1>
        <p className="text-[12.5px] text-ink-secondary mt-0.5">
          {liste.length === 0
            ? "Personne autour de votre levée pour l’instant."
            : `${liste.length} personne${liste.length > 1 ? "s" : ""} autour de votre levée`}
        </p>
      </div>

      {liste.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-[12.5px] text-ink-secondary py-3 leading-relaxed max-w-md">
              Dès que vous invitez un investisseur, il apparaît ici — et vous
              suivez ce qu’il regarde, document par document.
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <div className="flex items-center gap-3 px-1 pb-2 text-[10px] font-[700] uppercase tracking-[0.04em] text-ink-muted border-b border-separator-soft">
              <div className="flex-[1.6] min-w-0">Contact</div>
              <div className="w-[92px] shrink-0">Statut</div>
              <div className="w-[70px] shrink-0 text-right">Documents</div>
              <div className="w-[64px] shrink-0 text-right">Temps</div>
              <div className="w-[70px] shrink-0 text-right">Vu</div>
            </div>
            {liste.map((c) => (
              <div
                key={c.email}
                className="flex items-center gap-3 py-2.5 border-b border-separator-soft last:border-0"
              >
                <div className="flex-[1.6] min-w-0 flex items-center gap-2.5">
                  <span className="grid place-items-center w-8 h-8 shrink-0 rounded-full bg-separator-soft text-[11px] font-[600] text-ink-secondary uppercase">
                    {c.nom.slice(0, 2)}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-[550] text-ink truncate">
                      {c.nom}
                    </div>
                    <div className="text-[11px] text-ink-muted truncate">
                      {c.email}
                    </div>
                  </div>
                </div>
                <div className="w-[92px] shrink-0">
                  <Chip tone={STATUT[c.statut].tone}>
                    {STATUT[c.statut].label}
                  </Chip>
                </div>
                <div className="w-[70px] shrink-0 text-right">
                  <Mono className="text-[12px] text-ink-secondary">
                    {c.documentsVus || "—"}
                  </Mono>
                </div>
                <div className="w-[64px] shrink-0 text-right text-[12px] font-[550] text-ink">
                  {c.tempsMs > 0 ? (
                    dureeCourte(c.tempsMs)
                  ) : (
                    <span className="text-ink-muted">—</span>
                  )}
                </div>
                <div className="w-[70px] shrink-0 text-right text-[11.5px] text-ink-secondary">
                  {c.derniereActivite ? (
                    relatif(c.derniereActivite)
                  ) : (
                    <span className="text-ink-muted">—</span>
                  )}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
