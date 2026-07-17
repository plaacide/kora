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
