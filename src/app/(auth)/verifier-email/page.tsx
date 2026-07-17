import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function VerifierEmailPage() {
  const t = await getTranslations("auth.verifyEmail");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
        {t("title")}
      </h1>
      <p className="text-[13px] text-ink-secondary leading-relaxed">
        {t("body")}
      </p>
      <Link href="/connexion" className="text-[13px] font-medium">
        {t("back")}
      </Link>
    </div>
  );
}
