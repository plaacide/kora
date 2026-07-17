import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";

export default async function SecuritePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  const enabled = (data?.totp ?? []).some((f) => f.status === "verified");

  const t = await getTranslations("security");

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          {t("title")}
        </h1>
        <p className="text-[12.5px] text-ink-secondary mt-0.5">
          {t("subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>{t("twoFactor.cardTitle")}</CardHeader>
        <CardBody>
          <TwoFactorSetup initialEnabled={enabled} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>{t("password.cardTitle")}</CardHeader>
        <CardBody>
          <ul className="text-[12.5px] text-ink-secondary flex flex-col gap-1.5">
            <li>· {t("password.rule1")}</li>
            <li>· {t("password.rule2")}</li>
            <li>· {t("password.rule3")}</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
