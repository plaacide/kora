import "server-only";

/**
 * Client du worker de conversion bureautique.
 *
 * Le worker (dossier /worker) convertit xlsx/pptx/docx en PDF sur notre
 * infrastructure. Il est optionnel : sans `DOC_WORKER_URL`, la visionneuse
 * affiche un état honnête plutôt que de planter.
 */

export function workerConfigured(): boolean {
  return Boolean(process.env.DOC_WORKER_URL && process.env.DOC_WORKER_TOKEN);
}

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i + 1).toLowerCase();
}

/**
 * Convertit des octets bureautiques en PDF. Renvoie null si le worker n'est
 * pas configuré ; lève une erreur si la conversion échoue.
 */
export async function officeToPdf(
  bytes: Uint8Array,
  fileName: string,
): Promise<Uint8Array | null> {
  const base = process.env.DOC_WORKER_URL;
  const token = process.env.DOC_WORKER_TOKEN;
  if (!base || !token) return null;

  const ext = extOf(fileName);
  const res = await fetch(`${base.replace(/\/$/, "")}/convert?ext=${ext}`, {
    method: "POST",
    headers: {
      "X-Worker-Token": token,
      "Content-Type": "application/octet-stream",
    },
    body: bytes as unknown as BodyInit,
    // La conversion LibreOffice peut être lente à froid (scale-to-zero).
    signal: AbortSignal.timeout(130_000),
  });

  if (!res.ok) {
    throw new Error(`worker ${res.status}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}
