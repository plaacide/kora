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
 * Largeur du panneau : 42 % de l'écran, comme OVHcloud — une PROPORTION, sans
 * plafond en pixels. Un plafond faisait rétrécir le panneau à 37,5 % sur un
 * écran de 1920 alors qu'il tenait ses 42 % sur un 1440 : la page ne se
 * ressemblait plus d'un poste à l'autre.
 *
 * Pas de plancher non plus : en dessous de `lg` (1024 px) le panneau est
 * masqué, et 42 % de 1024 laisse déjà 430 px, largement de quoi respirer.
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
    <div className="min-h-screen grid lg:grid-cols-[1fr_42%]">
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
          sous la ligne de flottaison.

          Contenu CENTRÉ verticalement, à la hauteur du formulaire d'en face.
          Collé en bas, il se lisait comme un pied de page décoratif au lieu de
          répondre au regard qui vient de quitter le champ mot de passe. */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-center p-10 lg:p-14 bg-encre text-white">
        <ResonanceArcs corner={arcsCorner} />
        <div className="relative z-10 max-w-md">{panel}</div>
        {footer && <div className="relative z-10 mt-6">{footer}</div>}
      </div>
    </div>
  );
}
