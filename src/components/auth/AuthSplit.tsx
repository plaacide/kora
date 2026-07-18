import Link from "next/link";
import { SanzaLogo } from "@/components/ui/SanzaLogo";
import { ResonanceArcs } from "@/components/brand/ResonanceArcs";

/**
 * Gabarit auth : panneau gauche 400px Encre (logo + contenu + arcs de
 * résonance), reste blanc avec le formulaire centré.
 */
export function AuthSplit({
  arcsCorner = "bottom-right",
  panel,
  footer,
  children,
}: {
  arcsCorner?: "bottom-right" | "top-left";
  panel: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[400px_1fr]">
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-between p-10 bg-encre text-white">
        <ResonanceArcs corner={arcsCorner} />
        <div className="relative z-10">
          <Link href="/" aria-label="Sanza">
            <SanzaLogo size={34} dark />
          </Link>
        </div>
        <div className="relative z-10 max-w-sm">{panel}</div>
        <div className="relative z-10">{footer}</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-[380px]">{children}</div>
      </div>
    </div>
  );
}
