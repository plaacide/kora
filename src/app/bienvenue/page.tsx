import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResonanceArcs } from "@/components/brand/ResonanceArcs";
import { SanzaLogo } from "@/components/ui/SanzaLogo";

export default async function BienvenuePage() {
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

  const items = isInvestor
    ? [
        { done: true, label: "Profil investisseur", note: "Complet" },
        { done: true, label: "Thèse d'investissement", note: "Complète" },
        { done: false, label: "Inviter votre équipe", note: "Optionnel" },
      ]
    : [
        { done: true, label: "Fiche startup", note: "Complète" },
        { done: true, label: "Votre levée", note: "Renseignée" },
        { done: false, label: "Compléter la data room", note: "Recommandé" },
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
            Bienvenue sur Sanza, {firstName}
          </h1>
          <p className="text-[14px] text-white/70 mt-3 leading-relaxed max-w-[520px] mx-auto">
            {isInvestor
              ? "Votre profil est prêt. Des deals correspondent déjà à votre thèse — parcourez le dealroom."
              : "Votre fiche est prête. Complétez maintenant votre dossier : chaque pièce fournie fait monter sa complétude, et c'est elle que les investisseurs regardent."}
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
            Accéder au dealroom →
          </Link>
          {!isInvestor && (
            <Link
              href="/data-room"
              className="inline-flex items-center justify-center border border-white/15 bg-white/[0.055] text-white font-[600] text-[13.5px] rounded-[10px] px-5 py-3 hover:bg-white/[0.09] transition-colors"
            >
              Déposer mes documents
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
