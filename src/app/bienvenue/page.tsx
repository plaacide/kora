import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { ResonanceArcs } from "@/components/brand/ResonanceArcs";
import { SanzaLogo } from "@/components/ui/SanzaLogo";

export default async function BienvenuePage() {
  const t = await getTranslations("welcome");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, account_type")
    .eq("id", user.id)
    .maybeSingle();

  const firstName = (profile?.full_name ?? "").split(" ")[0] || "";
  const isInvestor =
    (profile as { account_type?: string } | null)?.account_type === "investor";

  // ÉTAT RÉEL, pas une liste figée. Cet écran annonçait « Fiche complète » et
  // « Levée renseignée » quoi qu'il arrive — or ces deux étapes sont devenues
  // facultatives, et la data room est devenue un choix. Il affirmait donc des
  // choses fausses, et proposait « Déposer mes documents » à un fondateur qui
  // n'a pas de salle.
  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  const orgId = (membership as { org_id?: string } | null)?.org_id;

  const [{ data: startup }, { data: salles }, { data: profilInv }] = await Promise.all([
    supabase
      .from("startups")
      .select("readiness, objectif, amount_sought_usd")
      .eq("owner_id", user.id)
      .maybeSingle(),
    orgId
      ? supabase.from("deals").select("id").eq("org_id", orgId).limit(1)
      : Promise.resolve({ data: [] }),
    supabase
      .from("investor_profiles")
      .select("investor_type, sectors")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const aUneSalle = ((salles ?? []) as { id: string }[]).length > 0;
  const fiche = (startup as { readiness?: number } | null)?.readiness ?? 0;
  const ficheComplete = fiche >= 100;
  const objectif = (startup as { objectif?: string } | null)?.objectif ?? "levee";
  const leveeRenseignee =
    (startup as { amount_sought_usd?: number | null } | null)?.amount_sought_usd != null;

  const inv = profilInv as { investor_type?: string | null; sectors?: string[] | null } | null;

  const items = isInvestor
    ? [
        { done: !!inv?.investor_type, label: t("investorProfile"),
          note: inv?.investor_type ? t("investorProfileNote") : t("investorProfileNoteTodo") },
        { done: (inv?.sectors?.length ?? 0) > 0, label: t("investorThesis"),
          note: (inv?.sectors?.length ?? 0) > 0 ? t("investorThesisNote") : t("investorThesisNoteTodo") },
        { done: false, label: t("inviteTeam"), note: t("inviteTeamNote") },
      ]
    : [
        { done: ficheComplete, label: t("startupProfile"),
          note: ficheComplete ? t("startupProfileNoteDone") : `${fiche} %` },
        // La levée ne concerne pas un dossier de diligence : on ne l'affiche
        // pas plutôt que d'annoncer une étape qui n'existe pas pour lui.
        ...(objectif === "diligence"
          ? []
          : [{ done: leveeRenseignee, label: t("raise"),
               note: leveeRenseignee ? t("raiseNoteDone") : t("raiseNoteTodo") }]),
        { done: aUneSalle, label: t("roomTitle"),
          note: aUneSalle ? t("roomNoteDone") : t("roomNoteTodo") },
      ];

  return (
    <main className="relative min-h-screen bg-encre text-white overflow-hidden grid place-items-center px-6">
      {/* Deux jeux d'arcs en coins opposés, 640 / 680 (handoff v2 §6). */}
      <ResonanceArcs corner="top-left" size={640} />
      <ResonanceArcs corner="bottom-right" size={680} />

      <div className="relative z-10 w-full max-w-[660px] flex flex-col items-center text-center gap-6">
        <SanzaLogo size={46} dark />

        <div>
          <h1 className="text-[38px] font-[700] tracking-[-0.025em] leading-tight">
            {t("title", { name: firstName })}
          </h1>
          <p className="text-[14px] text-white/70 mt-3 leading-relaxed max-w-[520px] mx-auto">
            {isInvestor ? t("bodyInvestor") : aUneSalle ? t("bodyFounder") : t("bodyFounderNoRoom")}
          </p>
        </div>

        {/* Checklist en UNE SEULE carte de verre, lignes séparées (handoff §6). */}
        <div className="w-full rounded-[16px] border border-white/10 bg-white/[0.055] text-left">
          {items.map((it, i) => (
            <div
              key={it.label}
              className={
                "flex items-center gap-3 px-5 py-3.5 " +
                (i > 0 ? "border-t border-white/[0.07]" : "")
              }
            >
              <span
                className={
                  it.done
                    ? "grid place-items-center w-[18px] h-[18px] rounded-full bg-[#E85C2B] text-white shrink-0"
                    : "w-[18px] h-[18px] rounded-full border border-white/25 shrink-0"
                }
              >
                {it.done && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </span>
              <span className="text-[13px] flex-1">{it.label}</span>
              <span className="text-[11.5px] text-white/50">{it.note}</span>
            </div>
          ))}
        </div>

        {/* Deux CTA côte à côte : orange puis verre (handoff §6). */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center bg-[#E85C2B] text-white font-[600] text-[13.5px] rounded-[10px] px-5 py-3 hover:bg-[#D24E1F] transition-colors"
          >
            {`${t("ctaDealroom")} \u2192`}
          </Link>
          {/* Sans data room, /data-room n'a rien à montrer : on renvoie à
              l'accueil, d'où la salle se crée — la règle produit interdit un
              lien vers un écran qui ne peut rien afficher. */}
          {!isInvestor && (
            <Link
              href={aUneSalle ? "/data-room" : "/dashboard"}
              className="inline-flex items-center justify-center border border-white/15 bg-white/[0.055] text-white font-[600] text-[13.5px] rounded-[10px] px-5 py-3 hover:bg-white/[0.09] transition-colors"
            >
              {aUneSalle ? t("ctaUpload") : t("ctaCreateRoom")}
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
