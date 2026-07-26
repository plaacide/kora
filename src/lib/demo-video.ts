import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Chemin de la vidéo de démonstration, ou `null` si aucune n'est disponible.
 *
 * Deux voies, dans cet ordre :
 *  1. `NEXT_PUBLIC_DEMO_VIDEO` — pour pointer un chemin non conventionnel ;
 *  2. sinon, le fichier est cherché dans `public/`. Déposer `demo.mp4` suffit :
 *     aucune variable à déclarer dans Coolify.
 *
 * Le fichier est bien VÉRIFIÉ sur le disque. Afficher le bloc « Voir la démo »
 * en se fiant à une convention donnerait un bouton qui ouvre une vidéo en 404 —
 * pire qu'un bouton absent.
 *
 * ⚠️ Module SERVEUR (il lit le disque) : ne l'importer que depuis un composant
 * serveur, jamais depuis un composant client.
 */
const CANDIDATS = ["demo.mp4", "demo-sanza.mp4", "demo.webm"] as const;

export function demoVideoPath(): string | null {
  const explicite = process.env.NEXT_PUBLIC_DEMO_VIDEO;
  if (explicite) return explicite;

  for (const nom of CANDIDATS) {
    if (existsSync(join(process.cwd(), "public", nom))) return `/${nom}`;
  }
  return null;
}

/** Vignette optionnelle, affichée avant la lecture. Même logique. */
export function demoPosterPath(): string | undefined {
  const explicite = process.env.NEXT_PUBLIC_DEMO_POSTER;
  if (explicite) return explicite;

  for (const nom of ["demo.jpg", "demo.png", "demo-poster.jpg"]) {
    if (existsSync(join(process.cwd(), "public", nom))) return `/${nom}`;
  }
  return undefined;
}
