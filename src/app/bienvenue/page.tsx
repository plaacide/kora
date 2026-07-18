import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResonanceArcs } from "@/components/brand/ResonanceArcs";
import { EchoMotif } from "@/components/brand/EchoMotif";

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
      <ResonanceArcs corner="top-left" />
      <ResonanceArcs corner="bottom-right" />

      <div className="relative z-10 w-full max-w-[480px] flex flex-col items-center text-center gap-5">
        <EchoMotif dark />

        <div>
          <h1 className="text-[26px] font-[650] tracking-[-0.02em]">
            Bienvenue sur Sanza, {firstName}
          </h1>
          <p className="text-[13px] text-white/70 mt-2 leading-relaxed">
            {isInvestor
              ? "Votre profil est prêt. Des deals correspondent déjà à votre thèse — parcourez le dealroom."
              : "Votre fiche est prête. Complétez votre data room pour rassurer les investisseurs et faire monter votre readiness."}
          </p>
        </div>

        <div className="w-full flex flex-col gap-1.5 mt-1">
          {items.map((it) => (
            <div
              key={it.label}
              className="flex items-center gap-3 bg-white/[0.06] rounded-[10px] px-4 py-2.5 text-left"
            >
              <span
                className={
                  it.done
                    ? "grid place-items-center w-4 h-4 rounded-full bg-primary text-white text-[10px]"
                    : "w-4 h-4 rounded-full border border-white/30"
                }
              >
                {it.done ? "✓" : ""}
              </span>
              <span className="text-[12.5px] flex-1">{it.label}</span>
              <span className="text-[11px] text-white/50">{it.note}</span>
            </div>
          ))}
        </div>

        <Link
          href="/dashboard"
          className="mt-3 inline-flex items-center justify-center bg-primary text-white font-semibold text-[13px] rounded-[9px] px-5 py-2.5 hover:bg-primary-strong transition-colors"
        >
          Accéder au dealroom →
        </Link>
      </div>
    </main>
  );
}
