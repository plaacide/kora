"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { addIcNote, deleteIcNote } from "@/app/actions/deal-sections";
import { PlainError } from "@/components/auth/FormError";
import type { Persona } from "@/lib/persona";
import { usePersonaLabel } from "@/components/shell/persona-label";

export interface IcNoteItem {
  id: string;
  body: string;
  author: string;
  when: string;
  mine: boolean;
}

export function IcNotes({
  dealId,
  notes,
  canEdit,
  persona = "fund",
}: {
  dealId: string;
  notes: IcNoteItem[];
  canEdit: boolean;
  persona?: Persona;
}) {
  const t = useTranslations("deal");
  const mot = usePersonaLabel("deal", persona);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(undefined);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center px-4 py-3 border-b border-separator-soft">
        <span className="text-[13px] font-[650] flex items-center gap-1.5">
          {mot("icNotes")}
        </span>
        {canEdit && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-[11.5px] font-semibold border border-line bg-surface rounded-[7px] px-2.5 py-1 cursor-pointer text-ink-secondary hover:text-ink"
          >
            {t("newNote")}
          </button>
        )}
      </div>

      <div className="px-4 py-2">
        <PlainError message={error} />
      </div>

      {open && canEdit && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim().length < 2) return;
            run(() => addIcNote(dealId, body.trim()));
            setBody("");
            setOpen(false);
          }}
          className="px-4 pb-3 flex flex-col gap-2"
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            autoFocus
            placeholder={t("notePlaceholder")}
            className="w-full px-2.5 py-2 text-[12px] bg-bg text-ink rounded-[8px] border border-line focus:border-accent focus:outline-none resize-y leading-relaxed"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[11.5px] text-ink-secondary px-2 cursor-pointer"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={pending || body.trim().length < 2}
              className="text-[11.5px] font-semibold rounded-[7px] bg-accent text-white px-3 py-1.5 disabled:opacity-40 cursor-pointer disabled:cursor-default"
            >
              {t("saveNote")}
            </button>
          </div>
        </form>
      )}

      {notes.length === 0 && !open && (
        <p className="text-[12px] text-ink-muted px-4 py-3">{mot("noNotes")}</p>
      )}

      {notes.map((n) => (
        <div
          key={n.id}
          className="px-4 py-3 border-b border-separator last:border-0 group"
        >
          <p className="text-[12.5px] leading-[1.6] text-ink-secondary whitespace-pre-wrap">
            {n.body}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px] text-ink-muted">
              {n.author} · {n.when}
            </span>
            {canEdit && n.mine && (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => deleteIcNote(n.id))}
                className="text-[11px] text-ink-muted hover:text-[oklch(0.55_0.17_25)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {t("deleteNote")}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
