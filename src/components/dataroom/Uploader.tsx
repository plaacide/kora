"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { registerDocument } from "@/app/actions/deals";
import { cn } from "@/lib/cn";

interface UploaderProps {
  orgId: string;
  dealId: string;
  folderId: string | null;
  folderIndex: string;
}

export function Uploader({
  orgId,
  dealId,
  folderId,
  folderIndex,
}: UploaderProps) {
  const t = useTranslations("dataroom");
  const router = useRouter();
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files?.length || !folderId) return;
    setError(null);
    setBusy(true);

    const supabase = createClient();

    for (const file of Array.from(files)) {
      // Chemin : {org_id}/{deal_id}/{uuid}/{nom} — la policy Storage vérifie
      // l'appartenance à l'org via le 1er segment.
      const key = `${orgId}/${dealId}/${crypto.randomUUID()}/${file.name}`;

      const { error: upErr } = await supabase.storage
        .from("documents")
        .upload(key, file, { upsert: false, contentType: file.type });

      if (upErr) {
        setError(upErr.message);
        break;
      }

      const res = await registerDocument({
        dealId,
        folderId,
        name: file.name,
        storageKey: key,
        size: file.size,
        mime: file.type,
      });

      if (!res.ok) {
        setError(res.error ?? "error");
        break;
      }
    }

    setBusy(false);
    router.refresh();
  }

  if (!folderId) return null;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        upload(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex items-center gap-2 px-3.5 py-2.5 text-[11.5px] cursor-pointer transition-colors bg-bg",
        over ? "bg-chip-indigo-bg text-chip-indigo-fg" : "text-ink-muted",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => upload(e.target.files)}
      />
      <span
        className={cn(
          "w-3.5 h-3.5 rounded-[4px] border-[1.5px] border-dashed flex-none",
          over ? "border-accent" : "border-[oklch(0.80_0.01_260)]",
        )}
        aria-hidden
      />
      {busy
        ? t("uploading")
        : error
          ? error
          : t("dropHint", { index: folderIndex })}
    </div>
  );
}
