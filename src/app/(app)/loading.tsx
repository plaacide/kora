import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Écran de chargement de route (App Router) : Next l'affiche instantanément
 * pendant que le composant serveur récupère ses données. Feedback immédiat à
 * chaque navigation, au lieu d'un écran figé.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-3.5 w-72" />
        </div>
        <Skeleton className="h-9 w-28 rounded-btn" />
      </div>

      {/* Rangée de cartes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="border border-line rounded-card bg-surface p-4 flex flex-col gap-3"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>

      {/* Corps */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <div className="border border-line rounded-card bg-surface p-4 flex flex-col gap-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 flex flex-col gap-1.5">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-2.5 w-1/3" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <div className="border border-line rounded-card bg-surface p-4 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
