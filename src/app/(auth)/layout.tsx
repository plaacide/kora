import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panneau de marque */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-primary to-primary-strong text-white">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid place-items-center w-8 h-8 rounded-[8px] bg-white/15 font-bold text-[15px]">
            K
          </span>
          <span className="text-[17px] font-[650] tracking-[-0.01em]">Kora</span>
        </Link>
        <div className="max-w-sm">
          <h2 className="text-[24px] font-[650] leading-tight tracking-[-0.02em]">
            La data room sécurisée des transactions africaines.
          </h2>
          <p className="mt-3 text-[13.5px] text-white/75 leading-relaxed">
            Due diligence, Q&amp;A, syndication et reporting LP — chiffré,
            filigrané, audité de bout en bout.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-white/70">
          <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.14_155)]" />
          Chiffré · SOC 2 · Hébergement UE
        </div>
      </div>

      {/* Zone formulaire */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
