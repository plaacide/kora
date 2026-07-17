"use client";

import { usePathname } from "next/navigation";

/**
 * Fondu d'entrée à chaque navigation. La `key` liée au chemin force le
 * remontage, ce qui rejoue l'animation d'un écran à l'autre.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-in">
      {children}
    </div>
  );
}
