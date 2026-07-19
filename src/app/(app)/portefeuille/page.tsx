import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Mono } from "@/components/ui/Table";

/**
 * Le portefeuille d'un programme.
 *
 * Tout vient de `sae_portfolio()`, une FONCTION et non une politique RLS : les
 * colonnes y sont énumérées, donc ce qui n'y figure pas ne peut pas fuiter ici
 * par inadvertance. Aucun nom de document n'en sort — c'est structurel, pas
 * une précaution d'affichage.
 *
 * Les pièces manquantes sont affichées NOMMÉES. Un directeur de programme qui
 * lit « 40 % » ne sait pas quoi faire de sa journée ; « il manque le RCCM et
 * les états financiers » se relance dans la minute. C'est toute la différence
 * entre un tableau de bord et un cockpit.
 */

interface Ligne {
  startup_org: string;
  startup_name: string;
  deal_id: string;
  deal_name: string;
  stage: string | null;
  amount: number | null;
  currency: string | null;
  readiness: number | null;
  items_total: number;
  items_done: number;
  missing: string[] | null;
}

function montant(v: number | null, devise: string | null): string {
  if (v === null) return "—";
  return `${new Intl.NumberFormat("fr-FR").format(v)} ${devise ?? ""}`.trim();
}

export default async function PortefeuillePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sae_portfolio");
  const lignes = (error ? [] : ((data ?? []) as Ligne[])).sort(
    (a, b) => (a.readiness ?? 0) - (b.readiness ?? 0),
  );

  const moyenne = lignes.length
    ? Math.round(
        lignes.reduce((s, l) => s + (l.readiness ?? 0), 0) / lignes.length,
      )
    : 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          Portefeuille
        </h1>
        <p className="text-[12.5px] text-ink-secondary mt-0.5">
          {lignes.length === 0
            ? "Aucune startup dans votre cohorte pour l’instant."
            : `${lignes.length} startup${lignes.length > 1 ? "s" : ""} · préparation moyenne ${moyenne} %`}
        </p>
      </div>

      {lignes.length === 0 ? (
        <Card>
          <CardBody>
            <div className="flex flex-col items-start gap-3 py-3">
              <p className="text-[12.5px] text-ink-secondary max-w-md leading-relaxed">
                Invitez vos startups à rejoindre votre cohorte. Chacune accepte
                elle-même : vous verrez alors sa préparation, jamais ses
                documents.
              </p>
              <Link href="/cohorte" className="sz-cta text-[13px] px-4 py-2">
                Inviter une startup
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Trié du moins préparé au plus préparé : ceux qui ont besoin d'un
              coup de main viennent en premier. Un tri alphabétique ferait
              chercher, alors que c'est la liste des urgences qui est utile. */}
          {lignes.map((l) => (
            <Card key={l.deal_id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[14px] font-[650] truncate">
                      {l.startup_name}
                    </div>
                    <div className="text-[11.5px] text-ink-muted mt-0.5">
                      {montant(l.amount, l.currency)}
                      {l.stage ? ` · ${l.stage}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-none">
                    <Mono className="text-[20px] tracking-[-0.03em]">
                      {l.readiness ?? 0}%
                    </Mono>
                    <Chip
                      tone={
                        (l.readiness ?? 0) < 40
                          ? "amber"
                          : (l.readiness ?? 0) < 75
                            ? "indigo"
                            : "success"
                      }
                    >
                      {l.items_done}/{l.items_total}
                    </Chip>
                  </div>
                </div>

                {l.missing && l.missing.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-separator-soft">
                    <div className="text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted mb-1.5">
                      Il lui reste à fournir
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {l.missing.map((m) => (
                        <span
                          key={m}
                          className="rounded-[6px] border border-line bg-surface-2 px-1.5 py-0.5 text-[11px] text-ink-secondary"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
