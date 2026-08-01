import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";

export interface RenderResult {
  png: Buffer;
  pageCount: number;
}

/**
 * Incruste le filigrane DANS les pixels de la page.
 *
 * Volontairement pas un overlay CSS : un overlay se supprime en trois clics
 * dans l'inspecteur. Ici, l'image servie contient le filigrane — il n'existe
 * aucune version propre côté client.
 */
function drawWatermark(
  ctx: SKRSContext2D,
  width: number,
  height: number,
  text: string,
): void {
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#2b2b55";
  ctx.font = "500 15px sans-serif";
  ctx.rotate((-20 * Math.PI) / 180);

  const stepX = 300;
  const stepY = 150;
  for (let y = -height; y < height * 2; y += stepY) {
    for (let x = -width; x < width * 2; x += stepX) {
      ctx.fillText(text, x, y);
    }
  }
  ctx.restore();
}

/** Rend une page PDF en PNG filigrané. */
export async function renderPdfPage(
  data: Uint8Array<ArrayBufferLike>,
  pageNo: number,
  watermark: string,
  scale = 1.6,
): Promise<RenderResult> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const task = pdfjs.getDocument({ data, useSystemFonts: true });
  const doc = await task.promise;

  const page = await doc.getPage(Math.min(Math.max(pageNo, 1), doc.numPages));
  const viewport = page.getViewport({ scale });

  const canvas = createCanvas(
    Math.ceil(viewport.width),
    Math.ceil(viewport.height),
  );
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    // Types pdfjs (DOM) vs napi-rs — compatibles à l'exécution.
    canvas: canvas as unknown as HTMLCanvasElement,
    canvasContext: ctx as unknown as CanvasRenderingContext2D,
    viewport,
  }).promise;

  // Filigrane uniquement si demandé (niveau 'watermark').
  if (watermark) drawWatermark(ctx, canvas.width, canvas.height, watermark);

  const png = await canvas.encode("png");
  const pageCount = doc.numPages;
  await task.destroy();

  return { png, pageCount };
}

/**
 * Rendre une IMAGE comme on rend une page de PDF.
 *
 * POURQUOI PASSER PAR LE CANVAS plutôt que servir le fichier tel quel. Le
 * modèle de sécurité de la visionneuse tient à une chose : ce que reçoit le
 * navigateur n'est JAMAIS le fichier d'origine, et le filigrane est incrusté
 * dans les pixels. Servir un JPEG directement le rendrait téléchargeable d'un
 * clic droit, filigrane compris s'il était posé en CSS — c'est-à-dire retirable
 * en trois clics dans l'inspecteur.
 *
 * Une image compte pour UNE page : le lecteur n'a donc rien de particulier à
 * faire, il affiche une page unique comme pour un PDF d'une feuille.
 */
export async function renderImage(
  data: Uint8Array<ArrayBufferLike>,
  watermark: string,
): Promise<RenderResult> {
  const { loadImage } = await import("@napi-rs/canvas");

  const image = await loadImage(Buffer.from(data));

  // Une très grande photo n'a pas à être servie en pleine résolution : elle
  // pèserait plusieurs mégaoctets pour un écran qui n'en montrera qu'une
  // fraction. On plafonne la largeur, en gardant les proportions.
  const MAX = 1800;
  const ratio = image.width > MAX ? MAX / image.width : 1;
  const largeur = Math.max(1, Math.round(image.width * ratio));
  const hauteur = Math.max(1, Math.round(image.height * ratio));

  const canvas = createCanvas(largeur, hauteur);
  const ctx = canvas.getContext("2d");

  // Un fond blanc sous l'image : une PNG transparente servie sur le fond sombre
  // du lecteur deviendrait illisible.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, largeur, hauteur);
  ctx.drawImage(image, 0, 0, largeur, hauteur);

  if (watermark) drawWatermark(ctx, largeur, hauteur, watermark);

  return { png: await canvas.encode("png"), pageCount: 1 };
}
