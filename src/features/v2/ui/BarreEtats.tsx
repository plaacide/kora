import Link from "next/link";

/**
 * Les états d'un écran, tant que les écrans sont des maquettes.
 *
 * POURQUOI. Un écran a souvent deux états que rien ne distingue dans l'adresse
 * — la liste des cohortes vide ou remplie, les entreprises invitées ou
 * actives. Sans ce rappel, un seul des deux serait atteignable, et l'autre
 * n'existerait pas pour celui qui relit : c'est exactement l'erreur consignée
 * trois fois dans l'arbre des connexions.
 *
 * Cette barre est un échafaudage. Elle disparaît écran par écran au
 * branchement, quand l'état viendra de la donnée et non de l'adresse — d'où
 * son dessin volontairement pauvre : on ne doit pas la confondre avec le
 * produit.
 */
export function BarreEtats({
  etats,
}: {
  etats: readonly { href: string; label: string; actif?: boolean }[];
}) {
  return (
    <nav aria-label="États de cet écran" className="v2-barre-etats">
      <span>États de cet écran</span>
      {etats.map((etat) => (
        <Link data-active={etat.actif} href={etat.href} key={etat.href}>
          {etat.label}
        </Link>
      ))}
    </nav>
  );
}
