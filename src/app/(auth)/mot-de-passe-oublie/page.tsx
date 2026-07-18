import { getTranslations } from "next-intl/server";
import { AuthSplit } from "@/components/auth/AuthSplit";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default async function MotDePasseOubliePage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const t = await getTranslations("auth.forgot");
  const { erreur } = await searchParams;

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
      <ForgotPasswordForm expired={erreur === "lien_expire"} />
    </AuthSplit>
  );
}
