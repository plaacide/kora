import Link from "next/link";
import { SanzaLogo } from "@/components/ui/SanzaLogo";
import { ResonanceArcs } from "@/components/brand/ResonanceArcs";
import { LocaleLinks } from "@/components/auth/LocaleLinks";

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
 * Largeur du panneau : 48 % de l'écran — une PROPORTION, sans plafond en
 * pixels. Un plafond faisait rétrécir le panneau sur un écran de 1920 alors
 * qu'il tenait sa proportion sur un 1440 : la page ne se ressemblait plus d'un
 * poste à l'autre. (Le commentaire disait 42 % : c'était la valeur d'une
 * version antérieure, la grille est en 52/48 depuis.)
 *
 * Pas de plancher non plus : en dessous de `lg` (1024 px) le panneau est
 * masqué, et 42 % de 1024 laisse déjà 430 px, largement de quoi respirer.
 */
/** Coin diamétralement opposé — les panneaux Encre portent 2 jeux d'arcs. */
const OPPOSE = {
  "bottom-right": "top-left",
  "top-left": "bottom-right",
} as const;

export function AuthSplit({
  arcsCorner = "bottom-right",
  formWidth = 392,
  panel,
  footer,
  children,
}: {
  arcsCorner?: "bottom-right" | "top-left";
  /** 392 pour la connexion, 452 pour l'inscription (handoff v2 §3). */
  formWidth?: number;
  panel: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[52%_48%]">
      {/* Colonne claire : logo en haut, formulaire centré, pied de page. */}
      <div className="flex flex-col bg-[#FAF8F4] p-6 lg:px-16 lg:py-13">
        <Link href="/" aria-label="Sanza" className="inline-block w-fit">
          <SanzaLogo size={25} />
        </Link>

        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full" style={{ maxWidth: formWidth }}>{children}</div>
        </div>

        {/* Pied de page (handoff v2 §2 et §3) : mention de copyright et choix
            de langue, sorti du formulaire. Les liens Confidentialité / CGU /
            Aide viendront quand ces pages existeront — on ne pointe pas vers
            une page inexistante. */}
        <div className="flex items-center justify-between gap-4 text-[12px] text-[#9B9EAE]">
          <span>© 2026 Sanza</span>
          <LocaleLinks />
        </div>
      </div>

      {/* Panneau Encre : masqué sur mobile, où il pousserait le formulaire
          sous la ligne de flottaison.

          Contenu CENTRÉ verticalement, à la hauteur du formulaire d'en face.
          Collé en bas, il se lisait comme un pied de page décoratif au lieu de
          répondre au regard qui vient de quitter le champ mot de passe. */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-center p-10 lg:p-14 bg-encre text-white">
        {/* Panneau Encre : 2 jeux d'arcs en coins opposés (handoff v2 §4). */}
        <ResonanceArcs corner={arcsCorner} size={620} />
        <ResonanceArcs corner={OPPOSE[arcsCorner]} size={520} />
        <div className="relative z-10 max-w-md">{panel}</div>
        {footer && <div className="relative z-10 mt-6">{footer}</div>}
      </div>
    </div>
  );
}
