import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { FichePubliee } from "@/components/dealroom/FichePubliee";
import {
  AudiencePanneau,
  type AccesVitrine,
} from "@/components/dealroom/AudiencePanneau";

/**
 * `/dealroom` — la vitrine vue par le programme (§4 des règles).
 *
 * CE QU'ELLE N'EST PAS : la vitrine elle-même. Celle-là vit sur `/vitrine`,
 * hors de l'application, et s'adresse à l'investisseur. Ici on ne PARCOURT pas
 * les fiches, on les administre : qui est publié, qui a le droit de regarder.
 *
 * LA PUBLICATION SE FAIT AILLEURS, dans le détail d'une cohorte, parce que
 * c'est là qu'on voit le consentement et la préparation de chaque entreprise —
 * les deux conditions. Cet écran affiche donc le RÉSULTAT et permet de le
 * défaire, mais renvoie vers la cohorte pour le composer. Dupliquer ici la
 * table de sélection ferait deux endroits pour un même geste.
 *
 * Le programme ne lit jamais un document (§0.1) : on manipule des noms
 * d'organisations et des adresses e-mail, rien d'autre.
 */
export default async function DealroomPage() {
  const t = await getTranslations("dealroom");
  const supabase = await createClient();

  const { data: cohortesData } = await supabase
    .from("cohorts")
    .select("id, name")
    .is("archived_at", null)
    .order("starts_on", { ascending: false, nullsFirst: false });

  const cohortes = (cohortesData ?? []) as Array<{ id: string; name: string }>;

  if (cohortes.length === 0) {
    return (
      <div className="max-w-2xl">
        <h1 className="font-display text-[27px] font-[700] tracking-[-0.025em] mb-4">
          {t("title")}
        </h1>
        <EmptyState
          title={t("noCohortTitle")}
          description={t("noCohortBody")}
          action={
            <Link href="/cohortes" className="sz-cta text-[13px] px-4 py-2">
              {t("goToCohorts")}
            </Link>
          }
        />
      </div>
    );
  }

  const ids = cohortes.map((c) => c.id);

  const [{ data: entrees }, { data: accesData }] = await Promise.all([
    supabase
      .from("showcase_entries")
      .select("cohort_id, startup_org_id, published_at")
      .in("cohort_id", ids)
      .is("unpublished_at", null),
    supabase
      .from("showcase_access")
      .select("id, cohort_id, email, invited_at, accepted_at")
      .in("cohort_id", ids)
      .is("revoked_at", null)
      .order("invited_at", { ascending: false }),
  ]);

  const lignesEntrees = (entrees ?? []) as Array<{
    cohort_id: string;
    startup_org_id: string;
    published_at: string;
  }>;

  // Les noms d'entreprises en une requête, pas une par fiche.
  const orgs = [...new Set(lignesEntrees.map((e) => e.startup_org_id))];
  // PAS de lecture directe : la politique de `organizations` exige d'être
  // membre de l'organisation lue, et le programme ne l'est pas. Elle renverrait
  // zéro ligne et l'écran afficherait « — » à la place de chaque nom.
  const { data: organisations } = orgs.length
    ? await supabase.rpc("related_org_names", { p_ids: orgs })
    : { data: [] };
  const nomOrg = new Map(
    ((organisations ?? []) as Array<{ id: string; name: string }>).map((o) => [
      o.id,
      o.name,
    ]),
  );

  const accesParCohorte = new Map<string, AccesVitrine[]>();
  for (const a of (accesData ?? []) as Array<{
    id: string;
    cohort_id: string;
    email: string;
    invited_at: string;
    accepted_at: string | null;
  }>) {
    const liste = accesParCohorte.get(a.cohort_id) ?? [];
    liste.push({
      id: a.id,
      email: a.email,
      invitedAt: a.invited_at,
      acceptedAt: a.accepted_at,
    });
    accesParCohorte.set(a.cohort_id, liste);
  }

  const total = lignesEntrees.length;

  return (
    <div className="text-[#1A1B1F] max-w-[860px]">
      <h1 className="font-display text-[27px] font-[700] tracking-[-0.025em]">
        {t("title")}
      </h1>
      <p className="text-[13px] text-[#6E727A] mt-1 max-w-xl leading-relaxed">
        {t("intro")}
      </p>

      {total === 0 ? (
        <div className="mt-5">
          {/* Rien de publié : on ne montre PAS le formulaire d'invitation.
              Inviter un investisseur dans une vitrine vide, c'est brûler la
              seule occasion de le faire venir. */}
          <EmptyState
            title={t("emptyPublishedTitle")}
            description={t("emptyPublishedBody")}
            foot={t("emptyPublishedFoot")}
            action={
              <Link href="/cohortes" className="sz-cta text-[13px] px-4 py-2">
                {t("goToCohorts")}
              </Link>
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4 mt-5">
          {cohortes.map((c) => {
            const fiches = lignesEntrees.filter((e) => e.cohort_id === c.id);
            const acces = accesParCohorte.get(c.id) ?? [];
            // Une cohorte sans fiche publiée n'a pas d'audience à gérer : on
            // ne l'affiche pas plutôt que d'aligner des sections vides.
            if (fiches.length === 0) return null;

            return (
              <section
                key={c.id}
                className="bg-white border border-[#E2DED4] rounded-[8px] px-5 py-4"
              >
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <h2 className="text-[15px] font-[700]">{c.name}</h2>
                  <span
                    style={{ fontFamily: "var(--font-plex-mono), monospace" }}
                    className="text-[10px] tracking-[0.06em] text-[#A0A3AB] uppercase"
                  >
                    {t("publishedCount", { n: fiches.length })}
                  </span>
                </div>

                <div className="mt-3">
                  <div
                    style={{ fontFamily: "var(--font-plex-mono), monospace" }}
                    className="text-[9px] tracking-[0.08em] text-[#A0A3AB] uppercase"
                  >
                    {t("publishedTitle")}
                  </div>
                  <div className="flex flex-col mt-1">
                    {fiches.map((e) => (
                      <FichePubliee
                        key={e.startup_org_id}
                        cohorteId={c.id}
                        orgId={e.startup_org_id}
                        nom={nomOrg.get(e.startup_org_id) ?? "—"}
                        publieeLe={e.published_at}
                      />
                    ))}
                  </div>
                  <p className="text-[11.5px] text-[#8B8FA3] mt-2.5 leading-relaxed">
                    {t("unpublishHint")}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#F0EDE4]">
                  <div
                    style={{ fontFamily: "var(--font-plex-mono), monospace" }}
                    className="text-[9px] tracking-[0.08em] text-[#A0A3AB] uppercase"
                  >
                    {t("audienceTitle")}
                  </div>
                  <p className="text-[12px] text-[#6E727A] mt-1.5 mb-3 leading-relaxed">
                    {t("audienceIntro")}
                  </p>
                  <AudiencePanneau cohorteId={c.id} acces={acces} />
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
