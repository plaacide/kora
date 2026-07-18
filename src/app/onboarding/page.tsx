import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { OrgForm } from "@/components/auth/OrgForm";
import { SanzaLogo } from "@/components/ui/SanzaLogo";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id")
    .limit(1)
    .maybeSingle();

  if (membership) redirect("/dashboard");

  const t = await getTranslations("onboarding");

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <SanzaLogo size={26} />
          <h1 className="text-[22px] font-[650] tracking-[-0.02em] mt-2">
            {t("title")}
          </h1>
          <p className="text-[12.5px] text-ink-secondary">{t("subtitle")}</p>
        </div>
        <OrgForm />
      </div>
    </main>
  );
}
