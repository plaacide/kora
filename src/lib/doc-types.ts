/**
 * Classement des formats pour la visionneuse. Module neutre (ni "use client"
 * ni "use server") : il exporte des constantes, donc il doit rester importable
 * des deux côtés — voir AGENTS.md.
 *
 * Trois familles :
 *   - pdf     : rendu direct par pdf.js, filigrané.
 *   - office  : converti en PDF par le worker LibreOffice, puis filigrané.
 *   - other   : ni l'un ni l'autre (archive, vidéo…) — pas d'aperçu.
 *
 * Le worker ne change PAS le modèle de sécurité : la conversion se fait sur
 * notre infra, le fichier source ne part jamais chez un tiers, et c'est
 * toujours un PDF filigrané qui est servi au navigateur.
 */

export type DocKind = "pdf" | "office" | "other";

// Formats que LibreOffice convertit proprement en PDF.
const OFFICE_EXT = [
  ".xlsx", ".xls", ".xlsm", ".ods", ".csv",
  ".pptx", ".ppt", ".odp",
  ".docx", ".doc", ".odt", ".rtf",
];

const OFFICE_MIME = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.oasis.opendocument.spreadsheet",
  "text/csv",
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
  if (OFFICE_EXT.includes(e) || OFFICE_MIME.includes(m)) return "office";
  return "other";
}

/** Un aperçu filigrané est-il possible pour ce fichier ? */
export function isViewable(name: string, mime: string | null): boolean {
  return docKind(name, mime) !== "other";
}
