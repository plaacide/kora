/**
 * Assainit un nom de fichier pour en faire une clé d'objet Supabase Storage.
 *
 * Le stockage n'accepte qu'un jeu de caractères restreint : un tiret cadratin,
 * une apostrophe typographique, un accent ou une espace insécable — tout ce que
 * produisent macOS et Word — le font répondre « Invalid key », et le dépôt
 * échoue sans que rien n'indique quel caractère est en cause.
 *
 * ⚠️ Ceci ne touche QUE la clé technique. Le nom affiché est conservé
 * intégralement dans `documents.name` : un fondateur qui dépose
 * « Statuts — société.pdf » doit continuer de le lire ainsi, accents et tiret
 * compris. Assainir les deux reviendrait à défigurer son dossier pour une
 * contrainte de stockage qui ne le regarde pas.
 */

/** Longueur maximale du segment de nom, extension comprise. */
const MAX = 100;

export function cleStockage(nomFichier: string): string {
  const point = nomFichier.lastIndexOf(".");
  const aExtension = point > 0 && point < nomFichier.length - 1;
  const base = aExtension ? nomFichier.slice(0, point) : nomFichier;
  const ext = aExtension ? nomFichier.slice(point + 1) : "";

  const propre = (s: string) =>
    s
      // Décompose les accents (é → e + ́) puis retire les diacritiques.
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      // Tout ce qui n'est pas alphanumérique, point, tiret ou souligné devient
      // un tiret — y compris les espaces, apostrophes et tirets typographiques.
      .replace(/[^A-Za-z0-9._-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "");

  const b = propre(base).slice(0, MAX) || "document";
  const e = propre(ext).slice(0, 12);
  return e ? `${b}.${e}` : b;
}
