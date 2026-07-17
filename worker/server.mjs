import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.PORT ?? 8080);
const TOKEN = process.env.WORKER_TOKEN ?? "";
const MAX_BYTES = 40 * 1024 * 1024; // 40 Mo : un modèle financier reste raisonnable.

// Extensions que LibreOffice sait ouvrir. Sert de garde d'entrée : on ne lance
// pas soffice sur n'importe quoi.
const ALLOWED = new Set([
  "xlsx", "xls", "xlsm", "ods", "csv",
  "pptx", "ppt", "odp",
  "docx", "doc", "odt", "rtf",
]);

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (c) => {
      total += c.length;
      if (total > MAX_BYTES) {
        reject(new Error("too_large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/**
 * Convertit un fichier bureautique en PDF via LibreOffice headless.
 *
 * Chaque appel utilise un dossier de travail ET un profil LibreOffice
 * jetables : deux conversions simultanées ne partagent alors aucun état, ce
 * qui évite le blocage classique de soffice sur un profil déjà verrouillé.
 */
function convert(inputPath, workDir) {
  const profile = join(workDir, "profile");
  return new Promise((resolve, reject) => {
    execFile(
      "soffice",
      [
        "--headless",
        "--nologo",
        "--nofirststartwizard",
        `-env:UserInstallation=file://${profile}`,
        "--convert-to",
        "pdf",
        "--outdir",
        workDir,
        inputPath,
      ],
      { timeout: 120_000 },
      (err) => (err ? reject(err) : resolve()),
    );
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  if (req.method !== "POST" || url.pathname !== "/convert") {
    res.writeHead(404).end();
    return;
  }

  // Le worker est joignable publiquement : le jeton partagé est sa seule porte.
  if (!TOKEN || req.headers["x-worker-token"] !== TOKEN) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "unauthorized" }));
    return;
  }

  const ext = (url.searchParams.get("ext") ?? "").toLowerCase().replace(/^\./, "");
  if (!ALLOWED.has(ext)) {
    res.writeHead(415, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "unsupported_format" }));
    return;
  }

  let workDir;
  try {
    const body = await readBody(req);
    workDir = await mkdtemp(join(tmpdir(), "kora-conv-"));
    const inputPath = join(workDir, `${randomUUID()}.${ext}`);
    await writeFile(inputPath, body);

    await convert(inputPath, workDir);

    // LibreOffice nomme la sortie <base>.pdf ; on la retrouve sans supposer le nom.
    const produced = (await readdir(workDir)).find((f) => f.endsWith(".pdf"));
    if (!produced) throw new Error("no_output");
    const pdf = await readFile(join(workDir, produced));

    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Length": pdf.length,
    });
    res.end(pdf);
  } catch (e) {
    const code = e?.message === "too_large" ? 413 : 500;
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: e?.message ?? "conversion_failed" }));
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
});

server.listen(PORT, () => {
  console.log(`kora-doc-worker en écoute sur :${PORT}`);
});
