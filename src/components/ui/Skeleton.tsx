import { cn } from "@/lib/cn";

/** Bloc de chargement animé (balayage lumineux). Voir `.skeleton` dans globals.css. */
export function Skeleton({ className }: { className?: string }) {
  return <span className={cn("skeleton block", className)} aria-hidden />;
}
