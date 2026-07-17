import { cn } from "@/lib/cn";

/**
 * Barres de tendance du prototype.
 *
 * `values` doit venir de données RÉELLES (ex. cumul hebdomadaire calculé
 * depuis created_at). On n'affiche pas de courbe décorative : une sparkline
 * inventée sur un tableau de bord de deals serait un mensonge.
 */
export function Sparkline({
  values,
  tone = "accent",
  className,
}: {
  values: number[];
  tone?: "accent" | "success" | "warm";
  className?: string;
}) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);

  const color =
    tone === "success"
      ? "bg-[oklch(0.60_0.13_155_/_0.6)]"
      : tone === "warm"
        ? "bg-[oklch(0.60_0.17_40_/_0.6)]"
        : "bg-[oklch(0.55_0.17_270_/_0.55)]";

  return (
    <div className={cn("flex items-end gap-[3px] h-6", className)} aria-hidden>
      {values.map((v, i) => (
        <span
          key={i}
          className={cn("w-[3px] rounded-[1px]", color)}
          style={{ height: `${Math.max((v / max) * 100, 8)}%` }}
        />
      ))}
    </div>
  );
}
