import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AuthSplit } from "@/components/auth/AuthSplit";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default async function ReinitialiserPage() {
  // On n'arrive ici qu'avec une session de récupération ouverte par
  // /auth/confirm. Sans elle, la mise à jour échouerait de toute façon côté
  // Supabase : autant renvoyer tout de suite vers une nouvelle demande plutôt
  // que d'afficher un formulaire condamné à échouer.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/mot-de-passe-oublie?erreur=lien_expire");

  const t = await getTranslations("auth.reset");

  return (
    <AuthSplit
      arcsCorner="bottom-right"
      panel={
        <div>
          <h2 className="text-[24px] font-[650] leading-tight tracking-[-0.02em]">
            {t("panelTitle")}
          </h2>
          <p className="mt-3 text-[13px] text-white/70 leading-relaxed">
            {t("panelBody")}
          </p>
        </div>
      }
    >
      <ResetPasswordForm />
    </AuthSplit>
  );
}
