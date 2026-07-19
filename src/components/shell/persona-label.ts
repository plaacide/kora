import { useTranslations } from "next-intl";
import type { Persona } from "@/lib/persona";

/**
 * Libellé du métier, avec repli sur le libellé générique.
 *
 * Module NEUTRE (pas de "use client") : il n'exporte que des fonctions, et il
 * est importé aussi bien par des composants clients que par la version serveur
 * ci-dessous. Y mettre la directive ferait remplacer ces exports par des
 * références — cf. AGENTS.md.
 *
 * Convention de nommage des messages : le libellé spécifique vit sous
 * `<espace>.<métier>.<clé>`, le générique sous `<espace>.<clé>`. Écrire trois
 * listes complètes en parallèle aurait garanti qu'elles divergent dès la
 * première entrée ajoutée ; ici, seul ce qui doit changer est réécrit.
 */
export function usePersonaLabel(base: string, persona: Persona) {
  const t = useTranslations(base);
  return (cle: string) => {
    const specifique = `${persona}.${cle}`;
    return persona !== "fund" && t.has(specifique) ? t(specifique) : t(cle);
  };
}

/** Même résolution, pour un composant serveur. */
export function personaLabel(
  t: { (cle: string): string; has(cle: string): boolean },
  persona: Persona,
) {
  return (cle: string) => {
    const specifique = `${persona}.${cle}`;
    return persona !== "fund" && t.has(specifique) ? t(specifique) : t(cle);
  };
}
