import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { OrgForm } from "@/components/auth/OrgForm";
import { SanzaLogo } from "@/components/ui/SanzaLogo";

/**
 * Dispatcher d'onboarding : aiguille vers le parcours du persona choisi à
 * l'inscription (investisseur / fondateur). Un utilisateur déjà rattaché à une
 * organisation est considéré comme onboardé -> dashboard.
 *
 * Tolérant : si la colonne `account_type` n'existe pas encore (migration
 * personas non appliquée), on retombe sur l'ancien écran « créer une org ».
 */
export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user.id)
    // Tri déterministe : sans lui, l'organisation retenue est arbitraire
    // dès qu'une personne en a plusieurs — ce que le rôle SAE rend courant.
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (membership) redirect("/dashboard");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle();

  if (!error) {
    const type = (profile as { account_type?: string } | null)?.account_type;
    if (type === "investor") redirect("/onboarding/investisseur");
    if (type === "founder") redirect("/onboarding/fondateur");
    if (type === "sae") redirect("/onboarding/programme");
  }

  // Fallback (pré-migration ou type absent) : création d'organisation classique.
  const t = await getTranslations("onboarding");
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <SanzaLogo size={26} />
          <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em] mt-2">
            {t("title")}
          </h1>
          <p className="text-[12.5px] text-ink-secondary">{t("subtitle")}</p>
        </div>
        <OrgForm />
      </div>
    </main>
  );
}
