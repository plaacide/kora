import "server-only";
import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import { officeConvert, officeConversionAvailable } from "./office";

/**
 * Lecture d'un tableur en grille, côté serveur.
 *
 * Un modèle financier rendu en image est illisible : colonnes tronquées, pas
 * de défilement, formules invisibles. On extrait donc les valeurs et on les
 * renvoie en JSON, que le navigateur affiche en tableau.
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

export interface SheetData {
  name: string;
  rows: string[][];
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
    return String(r);
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

  // `cell.text` porte le format d'affichage ; il peut lever sur des cellules
  // exotiques, d'où le repli sur la valeur brute.
  try {
    return cell.text ?? String(v);
  } catch {
    return String(v);
  }
}

function formatDate(d: Date): string {
  const iso = d.toISOString();
  // Minuit pile : c'est une date, pas un instant — on n'affiche pas 00:00.
  return iso.endsWith("T00:00:00.000Z") ? iso.slice(0, 10) : iso.slice(0, 16).replace("T", " ");
}

async function loadWorkbook(
  bytes: Uint8Array,
  fileName: string,
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  const ext = extOf(fileName);

  if (ext === ".csv") {
    // exceljs lit le CSV depuis un flux.
    await wb.csv.read(Readable.from(Buffer.from(bytes)));
    return wb;
  }

  if (ext === ".xls" || ext === ".ods") {
    // Formats qu'exceljs ne sait pas ouvrir : LibreOffice les normalise en
    // .xlsx au passage. Sans LibreOffice, on ne peut rien faire.
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

/** Lit un tableur et renvoie ses feuilles sous forme de grilles de texte. */
export async function readWorkbook(
  bytes: Uint8Array,
  fileName: string,
): Promise<WorkbookData> {
  const wb = await loadWorkbook(bytes, fileName);

  const all = wb.worksheets.filter((ws) => ws.state !== "veryHidden");
  const kept = all.slice(0, MAX_SHEETS);
  const sheets: SheetData[] = [];

  for (const ws of kept) {
    const totalRows = ws.actualRowCount ?? ws.rowCount ?? 0;
    const totalCols = ws.actualColumnCount ?? ws.columnCount ?? 0;
    const rowLimit = Math.min(ws.rowCount ?? 0, MAX_ROWS);
    const colLimit = Math.min(Math.max(totalCols, 1), MAX_COLS);

    const rows: string[][] = [];
    for (let r = 1; r <= rowLimit; r++) {
      const row = ws.getRow(r);
      const cells: string[] = [];
      for (let c = 1; c <= colLimit; c++) {
        cells.push(cellText(row.getCell(c)));
      }
      rows.push(cells);
    }

    // Lignes entièrement vides en fin de feuille : Excel en garde souvent des
    // milliers. On les retire pour ne pas afficher un tableau creux.
    while (rows.length > 0 && rows[rows.length - 1].every((v) => v === "")) {
      rows.pop();
    }

    sheets.push({
      name: ws.name,
      rows,
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
