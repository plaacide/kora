import { useCallback, useEffect, useRef } from "react";

/**
 * Mesure le temps de lecture RÉEL, page par page.
 *
 * Le principe : une seule page est « en lecture » à la fois — celle qui est
 * visible au centre de l'écran (la visionneuse la signale déjà via `onVisible`).
 * On chronomètre depuis son apparition ; quand le lecteur passe à une autre
 * page, ferme l'onglet ou masque la fenêtre, on clôt la tranche et on l'envoie.
 *
 * Trois précautions, sinon le chiffre ment :
 *   · onglet masqué → le chrono s'arrête. Lire suppose de regarder ; un onglet
 *     en arrière-plan n'est pas de la lecture.
 *   · au départ de la page → `navigator.sendBeacon`, le seul envoi qui survit à
 *     la fermeture. Un `fetch` normal serait tué avant de partir.
 *   · tranches < 1 s ignorées côté serveur → un simple passage au scroll ne
 *     compte pas.
 *
 * Retourne un `onVisible(page)` à passer tel quel à la visionneuse, en plus de
 * son propre suivi de page courante.
 */
export function usePageDwell(versionId: string) {
  const pageRef = useRef<number | null>(null);
  const depuisRef = useRef<number | null>(null);

  const envoyer = useCallback(
    (page: number, ms: number, beacon: boolean) => {
      if (ms < 1000) return;
      const payload = JSON.stringify({ versionId, page, ms: Math.round(ms) });
      if (beacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/viewer/dwell",
          new Blob([payload], { type: "application/json" }),
        );
      } else {
        // `keepalive` : autorise la requête à survivre à un changement de page.
        fetch("/api/viewer/dwell", {
          method: "POST",
          body: payload,
          keepalive: true,
          headers: { "Content-Type": "application/json" },
        }).catch(() => {});
      }
    },
    [versionId],
  );

  /** Clôt la tranche en cours et l'envoie. */
  const clore = useCallback(
    (beacon: boolean) => {
      const page = pageRef.current;
      const depuis = depuisRef.current;
      if (page !== null && depuis !== null) {
        envoyer(page, Date.now() - depuis, beacon);
      }
      depuisRef.current = null;
    },
    [envoyer],
  );

  const onVisible = useCallback(
    (page: number) => {
      if (page === pageRef.current) return;
      clore(false); // clôt la page précédente
      pageRef.current = page;
      depuisRef.current =
        typeof document !== "undefined" && document.visibilityState === "visible"
          ? Date.now()
          : null;
    },
    [clore],
  );

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden") {
        clore(true); // l'onglet part : on fige ce qui est acquis
      } else if (pageRef.current !== null && depuisRef.current === null) {
        depuisRef.current = Date.now(); // il revient : le chrono repart
      }
    }
    // `pagehide` couvre la fermeture et la navigation, y compris mobile où
    // `beforeunload` n'est pas fiable.
    function onLeave() {
      clore(true);
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onLeave);
    return () => {
      clore(true); // démontage (changement de document) : on envoie le reste
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onLeave);
    };
  }, [clore]);

  return onVisible;
}
