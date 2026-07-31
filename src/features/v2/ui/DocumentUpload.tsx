"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent, ReactNode } from "react";

import {
  registerV2Document,
  suggestV2Associations,
} from "@/app/v2/(workspace)/operations/[operationId]/documents/actions";
import { cleStockage } from "@/lib/storage-key";
import { createClient } from "@/lib/supabase/client";
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
 *
 * ⚠️ Le téléversement passe par `XMLHttpRequest` et non par
 * `supabase.storage.upload()`. La méthode du client n'expose aucun
 * avancement, alors que la maquette affiche un pourcentage par pièce — et
 * `xhr.upload.onprogress` le donne. Le même objet sert à interrompre le
 * dépôt (« Tout annuler »), ce qu'une promesse ne permet pas.
 */

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
  const pathname = usePathname();
  const input = useRef<HTMLInputElement>(null);
  const encours = useRef<XMLHttpRequest | null>(null);
  const annule = useRef(false);

  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [visible, setVisible] = useState(true);
  const [busy, setBusy] = useState(false);

  function majLigne(index: number, patch: Partial<UploadRow>) {
    setUploads((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  /**
   * Téléverse un fichier en rendant son avancement.
   *
   * Résout avec l'erreur plutôt que de la lever : l'échec d'une pièce ne doit
   * pas interrompre le lot, et l'appelant décide quoi en faire.
   */
  function televerser(
    file: File,
    key: string,
    token: string,
    onProgress: (pourcent: number) => void,
  ): Promise<{ ok: boolean; error?: string }> {
    return new Promise((resolve) => {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/documents/${key}`;
      const xhr = new XMLHttpRequest();
      encours.current = xhr;

      xhr.open("POST", url);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("x-upsert", "false");
      if (file.type) xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      };

      xhr.onload = () => {
        encours.current = null;
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ ok: true });
          return;
        }
        let message = `dépôt refusé (${xhr.status})`;
        try {
          const corps = JSON.parse(xhr.responseText);
          if (corps?.message) message = corps.message;
        } catch {
          // Réponse non-JSON : on garde le message par défaut.
        }
        resolve({ ok: false, error: message });
      };

      xhr.onerror = () => {
        encours.current = null;
        resolve({ ok: false, error: "connexion interrompue" });
      };

      xhr.onabort = () => {
        encours.current = null;
        resolve({ ok: false, error: "annulé" });
      };

      xhr.send(file);
    });
  }

  async function send(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    annule.current = false;
    setVisible(true);
    setBusy(true);
    setUploads(
      list.map((file) => ({
        name: file.name,
        size: file.size,
        state: "pending" as const,
      })),
    );

    const deposees: string[] = [];
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;
    if (!token) {
      setUploads((current) =>
        current.map((row) => ({ ...row, state: "failed", error: "session expirée" })),
      );
      setBusy(false);
      return;
    }

    let echecs = false;

    for (const [index, file] of list.entries()) {
      if (annule.current) {
        majLigne(index, { state: "canceled" });
        echecs = true;
        continue;
      }

      majLigne(index, { state: "uploading", progress: 0 });

      const key = `${organizationId}/${operationId}/${crypto.randomUUID()}/${cleStockage(file.name)}`;

      const envoi = await televerser(file, key, token, (pourcent) =>
        majLigne(index, { progress: pourcent }),
      );

      if (!envoi.ok) {
        echecs = true;
        majLigne(index, {
          state: envoi.error === "annulé" ? "canceled" : "failed",
          error: envoi.error,
          progress: undefined,
        });
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
      if (registered.documentId) deposees.push(registered.documentId);

      majLigne(index, {
        state: registered.ok ? "done" : "failed",
        error: registered.error,
        progress: undefined,
      });
    }

    setBusy(false);

    // Rafraîchir remonte l'écran : un dossier qui passe de vide à rempli change
    // de branche, et cette carte est démontée avec son compte rendu. Tant
    // qu'une pièce a échoué ou été annulée, on ne rafraîchit donc pas — sinon
    // la seule trace de l'échec disparaîtrait et le fondateur croirait tout
    // déposé.
    if (echecs) return;

    // Le dépôt s'enchaîne sur la confirmation des associations (écran 17) :
    // c'est le moment où le fondateur a ses pièces en tête. Les identifiants
    // passent par l'URL — ainsi l'écran survit à un rechargement, et le lien
    // reste partageable avec un collègue.
    if (deposees.length > 0) {
      // Les suggestions sont écrites AVANT d'ouvrir l'écran 17, non
      // confirmées. Elles survivent ainsi à un onglet refermé : jusqu'ici,
      // quitter l'écran sans confirmer jetait tout le rapprochement.
      await suggestV2Associations({ operationId, documentIds: deposees });

      // Chemin absolu, et SANS `refresh()` derrière : re-rendre la route
      // courante juste après écrase la navigation en cours, et l'écran 17 ne
      // s'ouvrait jamais. La navigation recharge de toute façon les données
      // du serveur.
      router.push(`${pathname}?associations=${deposees.join(",")}`);
      return;
    }

    router.refresh();
  }

  function annulerTout() {
    annule.current = true;
    encours.current?.abort();
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

  return (
    <>
      <input hidden multiple onChange={onPick} ref={input} type="file" />
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

      {visible && (
        <UploadProgress
          onCancelAll={annulerTout}
          onClose={() => setVisible(false)}
          uploads={uploads}
        />
      )}
    </>
  );
}
