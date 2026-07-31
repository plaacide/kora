"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent, ReactNode } from "react";

import { registerV2Document } from "@/app/v2/(workspace)/operations/[operationId]/documents/actions";
import { cleStockage } from "@/lib/storage-key";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "./Icon";
import { UploadProgress, type UploadRow } from "./Upload";

/**
 * Dépôt de pièces — écran 16.
 *
 * Le fichier part du navigateur DIRECTEMENT vers le bucket privé : il ne
 * traverse pas le serveur Next. Une pièce de vingt mégaoctets n'a rien à faire
 * dans la mémoire d'un serveur de rendu, et la policy `kora_docs_insert`
 * contrôle l'appartenance à l'organisation à partir du premier segment de la
 * clé. Seule la métadonnée passe ensuite par une Server Action.
 *
 * Convention de clé reprise telle quelle de la V1 :
 *   {org_id}/{deal_id}/{uuid}/{nom assaini}
 * Le nom n'est assaini QUE pour la clé — Supabase refuse les caractères
 * non-ASCII. « Statuts — société.pdf » reste lisible tel quel dans la data
 * room ; c'est `documents.name` qui porte le nom d'origine, intact.
 */

/**
 * À partir de combien de pièces l'écran 16 s'ouvre.
 *
 * Pour une seule, la ligne de retour sous le bouton dit tout — déployer un
 * tableau ferait plus de bruit que d'information. Dès la deuxième, il faut
 * pouvoir suivre laquelle passe et laquelle a échoué.
 */
const SEUIL_TABLEAU = 2;

export function DocumentUpload({
  operationId,
  organizationId,
  folderId,
  children,
  className,
  variant,
}: {
  operationId: string;
  organizationId: string;
  /** `null` dépose à la racine — visible de l'équipe seule. */
  folderId: string | null;
  children: ReactNode;
  className?: string;
  variant?: "secondary";
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [busy, setBusy] = useState(false);

  async function send(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    setBusy(true);
    setUploads(
      list.map((file) => ({
        name: file.name,
        size: file.size,
        state: "pending" as const,
      })),
    );

    const supabase = createClient();
    let echecs = false;

    for (const [index, file] of list.entries()) {
      setUploads((current) =>
        current.map((row, i) => (i === index ? { ...row, state: "uploading" } : row)),
      );

      const key = `${organizationId}/${operationId}/${crypto.randomUUID()}/${cleStockage(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(key, file, { upsert: false, contentType: file.type });

      if (uploadError) {
        echecs = true;
        setUploads((current) =>
          current.map((row, i) =>
            i === index
              ? { ...row, state: "failed", error: uploadError.message }
              : row,
          ),
        );
        // On continue : l'échec d'une pièce ne doit pas retenir les suivantes.
        continue;
      }

      const registered = await registerV2Document({
        operationId,
        folderId,
        name: file.name,
        storageKey: key,
        size: file.size,
        mime: file.type,
      });

      if (!registered.ok) echecs = true;

      setUploads((current) =>
        current.map((row, i) =>
          i === index
            ? registered.ok
              ? { ...row, state: "done" }
              : { ...row, state: "failed", error: registered.error }
            : row,
        ),
      );
    }

    setBusy(false);

    // Rafraîchir remonte l'écran : un dossier qui passe de vide à rempli
    // change de branche, et ce composant est démonté avec son compte rendu.
    // Tant qu'une pièce a échoué, on ne rafraîchit donc pas — sinon la seule
    // trace de l'échec disparaîtrait et le fondateur croirait tout déposé.
    // Les pièces passées restent lisibles dans le tableau, marquées
    // « Déposée » ; le prochain chargement montrera la data room à jour.
    if (!echecs) router.refresh();
  }

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    void send(event.target.files ?? []);
    // Permet de redéposer le même fichier deux fois de suite : sans cela,
    // `change` ne se déclencherait pas la seconde fois.
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    void send(event.dataTransfer.files);
  }

  const failed = uploads.filter((row) => row.state === "failed");

  return (
    <>
      <input
        hidden
        multiple
        onChange={onPick}
        ref={input}
        type="file"
      />
      <button
        className={className ?? "v2-btn"}
        data-variant={variant}
        disabled={busy}
        onClick={() => input.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        type="button"
      >
        {busy ? "Dépôt en cours…" : children}
      </button>

      {/* Plusieurs pièces : l'écran 16, qui dit laquelle passe et laquelle a
          échoué. Une seule : la ligne ci-dessous suffit. */}
      {uploads.length >= SEUIL_TABLEAU && <UploadProgress uploads={uploads} />}

      {uploads.length > 0 && uploads.length < SEUIL_TABLEAU && (
        <div className="v2-upload-feedback" role="status">
          {busy && <span>Dépôt en cours…</span>}
          {!busy && failed.length === 0 && (
            <span data-tone="green">
              <Icon name="check" />
              Pièce déposée.
            </span>
          )}
          {!busy &&
            failed.map((row) => (
              <span data-tone="red" key={row.name}>
                {row.name} — {row.error ?? "dépôt refusé"}
              </span>
            ))}
        </div>
      )}
    </>
  );
}
