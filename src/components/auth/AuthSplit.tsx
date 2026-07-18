import Link from "next/link";
import { SanzaLogo } from "@/components/ui/SanzaLogo";
import { ResonanceArcs } from "@/components/brand/ResonanceArcs";

/**
 * Gabarit auth : formulaire à GAUCHE sur fond clair, panneau Encre à DROITE.
 *
 * Cet ordre suit la convention des plateformes professionnelles (OVHcloud,
 * banques en ligne) : l'utilisateur qui revient veut son champ e-mail, pas un
 * argumentaire. Le panneau de droite parle aux nouveaux venus, qui prennent le
 * temps de lire.
 *
 * Le logo reste en haut à gauche, au-dessus du formulaire — c'est le premier
 * point de repère, il ne doit pas partir du côté décoratif.
 *
 * Largeur du panneau : ~42 % de l'écran, avec un plancher pour que le texte ne
 * s'écrase pas sur un portable, et un plafond pour qu'il ne dévore pas
 * l'écran sur un moniteur large.
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
    <div className="min-h-screen grid lg:grid-cols-[1fr_clamp(380px,42%,720px)]">
      {/* Colonne claire : logo puis formulaire */}
      <div className="flex flex-col p-6 lg:p-10">
        <Link href="/" aria-label="Sanza" className="inline-block w-fit">
          <SanzaLogo size={34} />
        </Link>

        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-[380px]">{children}</div>
        </div>
      </div>

      {/* Panneau Encre : masqué sur mobile, où il pousserait le formulaire
          sous la ligne de flottaison. */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-end p-10 bg-encre text-white">
        <ResonanceArcs corner={arcsCorner} />
        <div className="relative z-10 max-w-md">{panel}</div>
        {footer && <div className="relative z-10 mt-6">{footer}</div>}
      </div>
    </div>
  );
}
