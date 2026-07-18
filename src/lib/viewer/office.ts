import "server-only";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Conversion bureautique -> PDF via LibreOffice headless, EN PROCESS.
 *
 * Kora est livré comme une image Docker unique contenant Next.js et
 * LibreOffice (`soffice` sur le PATH). La conversion se fait donc localement :
 * pas de service distant, pas de jeton. Le fichier ne quitte jamais le
 * conteneur, et c'est toujours un PDF filigrané qui est servi.
 *
 * Là où `soffice` est absent (dev local sans LibreOffice, ou déploiement
 * serverless type Vercel), les fonctions dégradent proprement : la visionneuse
 * affiche « aperçu bureautique bientôt disponible » au lieu de planter.
 */

// La détection est coûteuse (spawn) : on la mémorise pour la durée du process.
let availability: Promise<boolean> | null = null;

function detectSoffice(): Promise<boolean> {
  return new Promise((resolve) => {
    execFile("soffice", ["--version"], { timeout: 10_000 }, (err) => {
      resolve(!err);
    });
  });
}

export function officeConversionAvailable(): Promise<boolean> {
  if (!availability) availability = detectSoffice();
  return availability;
}

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i + 1).toLowerCase();
}

function runSoffice(
  inputPath: string,
  workDir: string,
  target: string,
): Promise<void> {
  // Profil LibreOffice jetable par appel : deux conversions simultanées ne
  // partagent aucun état, ce qui évite le blocage de soffice sur un profil
  // déjà verrouillé.
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
        target,
        "--outdir",
        workDir,
        inputPath,
      ],
      { timeout: 120_000 },
      (err) => (err ? reject(err) : resolve()),
    );
  });
}

/**
 * Convertit des octets bureautiques vers `target` (« pdf », « xlsx »…).
 * Renvoie null si LibreOffice n'est pas disponible ; lève une erreur si la
 * conversion elle-même échoue.
 */
export async function officeConvert(
  bytes: Uint8Array,
  fileName: string,
  target: string,
): Promise<Uint8Array | null> {
  if (!(await officeConversionAvailable())) return null;

  const workDir = await mkdtemp(join(tmpdir(), "kora-conv-"));
  try {
    const ext = extOf(fileName) || "bin";
    const inputPath = join(workDir, `${randomUUID()}.${ext}`);
    await writeFile(inputPath, bytes);

    await runSoffice(inputPath, workDir, target);

    // LibreOffice nomme la sortie <base>.<target> ; on la retrouve sans
    // supposer le nom exact. On exclut le fichier d'entrée : convertir un
    // .xlsx vers xlsx laisserait deux candidats dans le dossier.
    const suffix = `.${target}`;
    const produced = (await readdir(workDir)).find(
      (f) => f.endsWith(suffix) && join(workDir, f) !== inputPath,
    );
    if (!produced) throw new Error("no_output");
    // `readFile` renvoie un Buffer. C'est bien une sous-classe d'Uint8Array,
    // mais pdfjs le refuse explicitement (« Please provide binary data as
    // Uint8Array, rather than Buffer ») : on recopie la vue.
    const out = await readFile(join(workDir, produced));
    return new Uint8Array(out.buffer, out.byteOffset, out.byteLength);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

/** Raccourci historique : conversion vers PDF. */
export function officeToPdf(
  bytes: Uint8Array,
  fileName: string,
): Promise<Uint8Array | null> {
  return officeConvert(bytes, fileName, "pdf");
}
