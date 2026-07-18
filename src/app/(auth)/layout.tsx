import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SanzaLogo } from "@/components/ui/SanzaLogo";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("auth");
  const tc = await getTranslations("common");

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-encre text-white">
        <Link href="/" aria-label={tc("appName")}>
          <SanzaLogo size={26} dark animate />
        </Link>
        <div className="max-w-sm">
          <h2 className="text-[24px] font-[650] leading-tight tracking-[-0.02em]">
            {tc("tagline")}
          </h2>
          <p className="mt-3 text-[13.5px] text-white/75 leading-relaxed">
            {t("brandPitch")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-white/70">
          <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.14_155)]" />
          {tc("encryptedHosting")}
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
