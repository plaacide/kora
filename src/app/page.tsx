import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { SanzaLogo } from "@/components/ui/SanzaLogo";
import { EncryptionBadge } from "@/components/ui/EncryptionBadge";

export default async function Home() {
  const t = await getTranslations("home");

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <SanzaLogo size={40} />
        <div className="flex flex-col gap-2">
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
