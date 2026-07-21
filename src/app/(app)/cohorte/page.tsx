import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import { CohorteForm, type LienCohorte } from "@/components/cohorte/CohorteForm";

/**
 * La cohorte, côté programme : qui a été invité, qui a rejoint.
 *
 * L'écran ne montre PAS l'avancement — c'est le portefeuille qui s'en charge.
 * Ici on gère la relation, là-bas on la pilote. Mélanger les deux ferait un
 * écran qui répond mal à deux questions au lieu de bien à une.
 */
export default async function CohortePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data }, { data: profil }] = await Promise.all([
    supabase
      .from("cohort_links")
      .select("id, email, status, created_at, organizations!cohort_links_startup_org_id_fkey(name)")
      .order("created_at", { ascending: false }),
    // Le palier vit sur l'organisation. On lit celle du membre — l'écran est
    // réservé au programme, il n'en a qu'une.
    supabase
      .from("memberships")
      .select("organizations(cohort_limit)")
      .eq("user_id", user?.id ?? "")
      .order("created_at")
      .limit(1)
      .maybeSingle(),
  ]);

  const liens = (data ?? []) as unknown as LienCohorte[];
  const limite =
    (profil?.organizations as unknown as { cohort_limit?: number } | null)
      ?.cohort_limit ?? 10;
  // On compte comme la base : les liens non révoqués occupent une place.
  const occupe = liens.filter((l) => l.status !== "revoked").length;

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[22px] font-[650] tracking-[-0.02em]">Ma cohorte</h1>
          <p className="text-[12.5px] text-ink-secondary mt-0.5">
            Invitez vos startups. Chacune accepte elle-même.
          </p>
        </div>
        <span className="text-[12px] text-ink-muted">
          {occupe} / {limite} places
        </span>
      </div>

      <Card>
        <CardBody>
          <CohorteForm liens={(data ?? []) as unknown as LienCohorte[]} />
        </CardBody>
      </Card>

      <p className="text-[11.5px] text-ink-muted leading-relaxed max-w-lg">
        Rejoindre votre cohorte ne vous donne accès à aucun document. Vous
        voyez le stade, le montant recherché, la préparation et les pièces
        manquantes. Pour consulter des documents, la startup doit vous inviter
        dans sa data room — c’est elle qui décide.
      </p>
    </div>
  );
}
