import "server-only";
import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import { officeConvert, officeConversionAvailable } from "./office";

/**
 * Lecture d'un tableur en grille, côté serveur.
 *
 * Un modèle financier rendu en image est illisible : colonnes tronquées, pas
 * de défilement, formules invisibles. On extrait donc les valeurs ET leur mise
 * en forme, et on les renvoie en JSON, que le navigateur affiche en tableau.
 *
 * Pourquoi la mise en forme n'est pas un luxe : dans un classeur réel, gras,
 * italique et couleurs PORTENT de l'information (« en gras : obligatoire »,
 * « légende de couleur à reporter dans les colonnes »). Une grille sans styles
 * perd silencieusement ce que le classeur voulait dire.
 *
 * Le fichier ne quitte pas le serveur pour autant — seules les valeurs
 * affichables partent, pas le classeur. Les formules ne sont PAS transmises :
 * seul leur résultat l'est. C'est volontaire, la logique de calcul d'un modèle
 * est souvent ce que le fondateur tient le moins à diffuser.
 */

// Garde-fous : un classeur de 100 000 lignes ne doit ni saturer la mémoire du
// conteneur ni partir dans une réponse HTTP. On tronque et on le DIT.
const MAX_SHEETS = 20;
const MAX_ROWS = 2_000;
const MAX_COLS = 60;

/**
 * Cellule. Champs courts et tous optionnels : à 2 000 × 60 cellules, des noms
 * verbeux et des valeurs par défaut explicites pèsent lourd dans la réponse.
 */
export interface Cell {
  /** Texte affichable, format du classeur appliqué. */
  v: string;
  b?: true;
  i?: true;
  u?: true;
  /** Couleur de police, #rrggbb. */
  fg?: string;
  /** Couleur de fond, #rrggbb. */
  bg?: string;
  a?: "left" | "center" | "right";
  /** Valeur numérique : alignée à droite comme dans Excel. */
  n?: true;
  /** Fusion : nombre de colonnes / lignes couvertes. */
  cs?: number;
  rs?: number;
  /** Cellule masquée par une fusion voisine : ne pas rendre de <td>. */
  h?: true;
}

export interface SheetData {
  name: string;
  rows: Cell[][];
  /** Largeurs de colonnes en pixels, dans l'ordre. */
  widths: number[];
  /** Vrai si cette feuille a été coupée par les garde-fous ci-dessus. */
  truncated: boolean;
  totalRows: number;
  totalCols: number;
}

export interface WorkbookData {
  sheets: SheetData[];
  /** Vrai si au moins une feuille — ou la liste des feuilles — est tronquée. */
  truncated: boolean;
}

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i).toLowerCase();
}

/**
 * ARGB d'Excel (« FFRRGGBB ») vers CSS. Renvoie undefined pour les couleurs
 * de thème ou indexées, qu'on ne sait pas résoudre sans la palette du
 * classeur : mieux vaut pas de couleur qu'une fausse.
 */
function argbToCss(color: Partial<ExcelJS.Color> | undefined): string | undefined {
  const argb = color?.argb;
  if (typeof argb !== "string") return undefined;
  if (argb.length === 8) {
    // Entièrement transparent : ne rien peindre.
    if (argb.slice(0, 2).toUpperCase() === "00") return undefined;
    return `#${argb.slice(2)}`;
  }
  if (argb.length === 6) return `#${argb}`;
  return undefined;
}

function formatDate(d: Date): string {
  const iso = d.toISOString();
  // Minuit pile : c'est une date, pas un instant — on n'affiche pas 00:00.
  return iso.endsWith("T00:00:00.000Z")
    ? iso.slice(0, 10)
    : iso.slice(0, 16).replace("T", " ");
}

/** La valeur de cette cellule est-elle un nombre (formule comprise) ? */
function isNumericValue(cell: ExcelJS.Cell): boolean {
  const v = cell.value;
  if (typeof v === "number") return true;
  if (v && typeof v === "object" && "formula" in v) {
    return typeof (v as ExcelJS.CellFormulaValue).result === "number";
  }
  return false;
}

/**
 * Texte affichable d'une cellule.
 *
 * On privilégie `cell.text`, qui applique le format d'affichage du classeur
 * (séparateurs de milliers, devises, pourcentages) : c'est ce que le lecteur
 * verrait dans Excel. On ne reformate pas nous-mêmes, au risque de trahir le
 * chiffre.
 */
function cellText(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v === null || v === undefined) return "";

  // Formule : on n'expose que le résultat, jamais l'expression.
  if (typeof v === "object" && "formula" in v) {
    const r = (v as ExcelJS.CellFormulaValue).result;
    if (r === null || r === undefined) return "";
    if (typeof r === "object" && "error" in r) return String(r.error);
    if (r instanceof Date) return formatDate(r);
    // `cell.text` applique le format d'affichage au résultat.
    try {
      return cell.text ?? String(r);
    } catch {
      return String(r);
    }
  }
  if (typeof v === "object" && "error" in v) {
    return String((v as ExcelJS.CellErrorValue).error);
  }
  if (typeof v === "object" && "richText" in v) {
    return (v as ExcelJS.CellRichTextValue).richText.map((p) => p.text).join("");
  }
  if (typeof v === "object" && "hyperlink" in v) {
    return (v as ExcelJS.CellHyperlinkValue).text ?? "";
  }
  if (v instanceof Date) return formatDate(v);

  try {
    return cell.text ?? String(v);
  } catch {
    return String(v);
  }
}

/** Style d'une cellule, réduit à ce qui porte du sens à l'écran. */
function cellStyle(cell: ExcelJS.Cell): Partial<Cell> {
  const out: Partial<Cell> = {};
  const font = cell.font;
  if (font?.bold) out.b = true;
  if (font?.italic) out.i = true;
  if (font?.underline) out.u = true;

  const fg = argbToCss(font?.color);
  if (fg) out.fg = fg;

  // Seuls les remplissages unis sont transposables ; les dégradés d'Excel
  // n'ont pas d'équivalent utile ici.
  const fill = cell.fill;
  if (fill && fill.type === "pattern" && fill.pattern === "solid") {
    const bg = argbToCss(fill.fgColor);
    if (bg) out.bg = bg;
  }

  const h = cell.alignment?.horizontal;
  if (h === "center" || h === "right" || h === "left") out.a = h;

  return out;
}

/** Convertit « A1:C3 » en bornes numériques. */
function parseRange(
  ref: string,
): { top: number; left: number; bottom: number; right: number } | null {
  const m = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(ref.toUpperCase());
  if (!m) return null;
  const col = (s: string) =>
    s.split("").reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0);
  return {
    left: col(m[1]),
    top: Number(m[2]),
    right: col(m[3]),
    bottom: Number(m[4]),
  };
}

async function loadWorkbook(
  bytes: Uint8Array,
  fileName: string,
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  const ext = extOf(fileName);

  if (ext === ".csv") {
    // exceljs lit le CSV depuis un flux. Un CSV n'a aucune mise en forme.
    await wb.csv.read(Readable.from(Buffer.from(bytes)));
    return wb;
  }

  if (ext === ".xls" || ext === ".ods") {
    // Formats qu'exceljs ne sait pas ouvrir : LibreOffice les normalise en
    // .xlsx au passage, styles compris. Sans LibreOffice, on ne peut rien faire.
    if (!(await officeConversionAvailable())) throw new Error("office_not_ready");
    const converted = await officeConvert(bytes, fileName, "xlsx");
    if (!converted) throw new Error("office_not_ready");
    await wb.xlsx.load(toArrayBuffer(converted));
    return wb;
  }

  await wb.xlsx.load(toArrayBuffer(bytes));
  return wb;
}

/** exceljs attend un ArrayBuffer, pas une vue. */
function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(u8.byteLength);
  copy.set(u8);
  return copy.buffer;
}

/**
 * Largeur Excel (en « caractères ») vers pixels. La formule d'Excel est
 * approximative par nature ; on borne pour éviter les colonnes invisibles ou
 * démesurées.
 */
function widthToPx(w: number | undefined): number {
  if (!w || !Number.isFinite(w)) return 100;
  return Math.min(420, Math.max(48, Math.round(w * 7 + 5)));
}

/** Lit un tableur et renvoie ses feuilles sous forme de grilles stylées. */
export async function readWorkbook(
  bytes: Uint8Array,
  fileName: string,
): Promise<WorkbookData> {
  const wb = await loadWorkbook(bytes, fileName);

  const all = wb.worksheets.filter((ws) => ws.state !== "veryHidden");
  const kept = all.slice(0, MAX_SHEETS);
  const sheets: SheetData[] = [];

  for (const ws of kept) {
    const totalRows = ws.rowCount ?? 0;
    const totalCols = ws.columnCount ?? 0;
    const rowLimit = Math.min(totalRows, MAX_ROWS);
    const colLimit = Math.min(Math.max(totalCols, 1), MAX_COLS);

    // Fusions : on note les cellules couvertes pour ne pas les rendre deux fois.
    const merges = (ws.model?.merges ?? []) as string[];
    const spans = new Map<string, { cs: number; rs: number }>();
    const hidden = new Set<string>();
    for (const ref of merges) {
      const r = parseRange(ref);
      if (!r) continue;
      spans.set(`${r.top}:${r.left}`, {
        cs: r.right - r.left + 1,
        rs: r.bottom - r.top + 1,
      });
      for (let y = r.top; y <= r.bottom; y++) {
        for (let x = r.left; x <= r.right; x++) {
          if (y !== r.top || x !== r.left) hidden.add(`${y}:${x}`);
        }
      }
    }

    const rows: Cell[][] = [];
    for (let r = 1; r <= rowLimit; r++) {
      const row = ws.getRow(r);
      const cells: Cell[] = [];
      for (let c = 1; c <= colLimit; c++) {
        const key = `${r}:${c}`;
        if (hidden.has(key)) {
          cells.push({ v: "", h: true });
          continue;
        }
        const cell = row.getCell(c);
        const base: Cell = { v: cellText(cell), ...cellStyle(cell) };
        if (isNumericValue(cell)) base.n = true;
        const span = spans.get(key);
        if (span) {
          if (span.cs > 1) base.cs = span.cs;
          if (span.rs > 1) base.rs = span.rs;
        }
        cells.push(base);
      }
      rows.push(cells);
    }

    // Lignes entièrement vides en fin de feuille : Excel en garde souvent des
    // milliers. On les retire pour ne pas afficher un tableau creux.
    while (
      rows.length > 0 &&
      rows[rows.length - 1].every((c) => c.v === "" && !c.bg)
    ) {
      rows.pop();
    }

    const widths: number[] = [];
    for (let c = 1; c <= colLimit; c++) {
      widths.push(widthToPx(ws.getColumn(c)?.width));
    }

    sheets.push({
      name: ws.name,
      rows,
      widths,
      truncated: totalRows > rowLimit || totalCols > colLimit,
      totalRows,
      totalCols,
    });
  }

  return {
    sheets,
    truncated: all.length > kept.length || sheets.some((s) => s.truncated),
  };
}
