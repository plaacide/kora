"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Apparition au défilement : fondu + translation de 16px, une seule fois.
 *
 * « Une seule fois » est le point important : une animation qui se rejoue à
 * chaque passage transforme la lecture en diaporama et fatigue. On se
 * désabonne dès le premier déclenchement.
 *
 * Repli assumé : si l'observateur ne se déclenche pas (onglet masqué, moteur
 * de rendu sans mise en page), le contenu s'affiche quand même. Un site
 * marketing invisible est pire qu'un site sans animation — c'est exactement le
 * piège rencontré sur la visionneuse.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  /** Décalage en ms, pour échelonner une grille de cartes. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Pas de branche « reduced motion » ici : la règle @media de globals.css
    // force déjà l'état visible et supprime la transition. La traiter aussi en
    // JavaScript ajouterait un rendu en cascade pour un résultat identique.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    io.observe(el);

    // Filet : si rien ne s'est déclenché, on montre le contenu.
    const secours = window.setTimeout(() => setShown(true), 1200);

    return () => {
      io.disconnect();
      window.clearTimeout(secours);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn("sz-reveal", shown && "sz-reveal-in", className)}
      style={shown && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
