import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { EncryptionBadge } from "@/components/ui/EncryptionBadge";

export default async function Home() {
  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <span className="grid place-items-center w-12 h-12 rounded-[12px] bg-gradient-to-br from-primary to-primary-strong text-white font-bold text-[22px]">
          K
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-[26px] font-[650] tracking-[-0.02em]">
            {tc("appName")} — Dealroom
          </h1>
          <p className="text-[13px] text-ink-secondary">{t("subtitle")}</p>
        </div>
        <EncryptionBadge />
        <div className="flex gap-2">
          <Link href="/connexion">
            <Button variant="primary">{t("login")}</Button>
          </Link>
          <Link href="/inscription">
            <Button variant="secondary">{t("signup")}</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
