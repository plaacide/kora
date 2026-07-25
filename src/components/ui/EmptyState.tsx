import { ResonanceArcs } from "@/components/brand/ResonanceArcs";

/**
 * État sans données — la grammaire unique de l'application (handoff §3).
 *
 * Règles de rédaction, portées ici pour qu'on ne puisse pas les contourner en
 * appelant le composant :
 *  - le `title` NOMME ce qui manque — jamais « Aucune donnée » ni « Liste vide » ;
 *  - la `description` dit À QUOI SERVIRA l'écran une fois rempli ;
 *  - `action` est unique. Quand aucune action n'a de sens (le journal se
 *    remplit tout seul), on n'en passe pas : on explique ce qui le remplira.
 *
 * Un bouton non branché est interdit : `action` prend un nœud déjà câblé
 * (Link ou composant d'action existant), pas un libellé à décorer.
 *
 * Décor : les arcs viennent de `ResonanceArcs`, aux tailles prescrites — 480
 * en ton clair sur un écran vide pleine page, 240 en ton sombre sur une carte
 * Encre. Jamais derrière une liste dense : `arcs` est donc opt-in.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  tone = "light",
  arcs = false,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  tone?: "light" | "dark";
  arcs?: boolean;
}) {
  const sombre = tone === "dark";

  return (
    <div
      className={
        "relative overflow-hidden rounded-[8px] px-6 py-10 text-center " +
        (sombre ? "bg-[#1A1B1F]" : "bg-white border border-[#E2DED4]")
      }
    >
      {arcs && (
        <ResonanceArcs
          corner="bottom-right"
          size={sombre ? 240 : 480}
          tone={sombre ? "dark" : "light"}
        />
      )}

      <div className="relative z-10 flex flex-col items-center">
        {icon && (
          <span
            className={
              "grid place-items-center w-12 h-12 rounded-[8px] mb-4 " +
              (sombre ? "bg-white/10 text-[#F08A5E]" : "bg-[#FBEDE6] text-[#C24619]")
            }
            aria-hidden
          >
            {icon}
          </span>
        )}

        <h2 className={"text-[15px] font-[700] " + (sombre ? "text-white" : "text-[#1A1B1F]")}>
          {title}
        </h2>
        <p
          className={
            "text-[12.5px] mt-1.5 max-w-md mx-auto leading-relaxed " +
            (sombre ? "text-white/65" : "text-[#6E727A]")
          }
        >
          {description}
        </p>

        {(action || secondaryAction) && (
          <div className="flex items-center justify-center gap-2.5 mt-5 flex-wrap">
            {action}
            {secondaryAction}
          </div>
        )}
      </div>
    </div>
  );
}
