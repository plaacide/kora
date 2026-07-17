"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Chip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface FolderTemplate {
  id: string;
  title: string;
  description: string;
  body: string;
}

/**
 * Modèles rattachés au dossier courant.
 *
 * Ce ne sont PAS des documents du deal : ils ne comptent ni dans le nombre de
 * documents, ni dans le readiness. Un modèle vierge n'est pas une pièce
 * fournie — les confondre gonflerait artificiellement le score.
 */
export function FolderTemplates({
  templates,
}: {
  templates: FolderTemplate[];
}) {
  const t = useTranslations("dataroom");
  const [open, setOpen] = useState<FolderTemplate | null>(null);

  if (!templates.length) return null;

  function download(tpl: FolderTemplate) {
    const blob = new Blob([tpl.body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tpl.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="border-t border-separator-soft bg-bg">
        <div className="flex items-center gap-2 px-3.5 pt-3 pb-1.5">
          <span className="text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted">
            {t("templatesTitle")}
          </span>
          <Chip tone="indigo">{templates.length}</Chip>
        </div>
        <p className="px-3.5 pb-2 text-[11px] text-ink-muted leading-relaxed">
          {t("templatesHint")}
        </p>

        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="flex items-center gap-2.5 px-3.5 py-2.5 border-t border-separator"
          >
            <span className="grid place-items-center w-[26px] h-[26px] rounded-[6px] bg-chip-indigo-bg text-chip-indigo-fg font-mono text-[8px] font-semibold flex-none">
              TPL
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-semibold truncate">
                {tpl.title}
              </div>
              <div className="text-[10.5px] text-ink-muted truncate">
                {tpl.description}
              </div>
            </div>
            <button
              onClick={() => setOpen(tpl)}
              className="text-[11px] font-medium text-accent cursor-pointer flex-none"
            >
              {t("templateView")}
            </button>
            <button
              onClick={() => download(tpl)}
              className="text-[11px] font-medium text-ink-secondary hover:text-ink cursor-pointer flex-none"
            >
              {t("templateDownload")}
            </button>
          </div>
        ))}
      </div>

      <Modal
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open?.title}
        className="max-w-2xl"
      >
        <div className="flex flex-col gap-3">
          <p className="text-[12px] text-ink-secondary">{open?.description}</p>
          <pre className="bg-bg border border-separator-soft rounded-card p-3.5 text-[11.5px] font-mono leading-relaxed text-ink whitespace-pre-wrap max-h-[52vh] overflow-y-auto">
            {open?.body}
          </pre>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(null)}>
              {t("close")}
            </Button>
            <Button variant="primary" onClick={() => open && download(open)}>
              {t("templateDownload")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
