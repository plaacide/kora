/**
 * Classement des formats pour la visionneuse. Module neutre (ni "use client"
 * ni "use server") : il exporte des constantes, donc il doit rester importable
 * des deux côtés — voir AGENTS.md.
 *
 * Quatre familles :
 *   - pdf     : rendu direct par pdf.js, filigrané.
 *   - office  : converti en PDF par LibreOffice, puis filigrané (docx, pptx…).
 *   - sheet   : tableur — lu comme une grille, PAS comme une image.
 *   - other   : ni l'un ni l'autre (archive, vidéo…) — pas d'aperçu.
 *
 * Pourquoi les tableurs à part : un modèle financier rendu en PNG est
 * illisible (colonnes tronquées, pas de défilement, formules invisibles), et
 * LibreOffice découpe arbitrairement les classeurs larges en pages. On lit
 * donc les données et on les affiche en tableau.
 *
 * Le modèle de sécurité ne change pas : dans les deux cas le fichier source
 * est lu côté serveur et ne part jamais chez un tiers ni sur le poste du
 * lecteur, et chaque consultation est journalisée. Nuance à ne pas masquer
 * dans l'UI : un tableau est du texte, donc copiable — contrairement à une
 * page rendue en image. Voir `viewer.sheetNotice`.
 */

export type DocKind = "pdf" | "office" | "sheet" | "other";

// Tableurs : lus en grille.
const SHEET_EXT = [".xlsx", ".xls", ".xlsm", ".ods", ".csv"];

const SHEET_MIME = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.oasis.opendocument.spreadsheet",
  "text/csv",
];

// Documents à mise en page fixe : LibreOffice les convertit proprement en PDF.
const OFFICE_EXT = [
  ".pptx", ".ppt", ".odp",
  ".docx", ".doc", ".odt", ".rtf",
];

const OFFICE_MIME = [
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "application/vnd.oasis.opendocument.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.oasis.opendocument.text",
  "application/rtf",
];

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i).toLowerCase();
}

export function docKind(name: string, mime: string | null): DocKind {
  const e = ext(name);
  const m = (mime ?? "").toLowerCase();
  if (e === ".pdf" || m === "application/pdf") return "pdf";
  // L'extension prime sur le type MIME : les navigateurs envoient souvent
  // application/vnd.ms-excel pour un .csv, et octet-stream pour le reste.
  if (SHEET_EXT.includes(e)) return "sheet";
  if (OFFICE_EXT.includes(e)) return "office";
  if (SHEET_MIME.includes(m)) return "sheet";
  if (OFFICE_MIME.includes(m)) return "office";
  return "other";
}

/** Un aperçu est-il possible pour ce fichier ? */
export function isViewable(name: string, mime: string | null): boolean {
  return docKind(name, mime) !== "other";
}

/** Ce fichier se lit-il en grille plutôt qu'en pages rendues ? */
export function isSheet(name: string, mime: string | null): boolean {
  return docKind(name, mime) === "sheet";
}
