"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toggleVote, suggestFeature } from "@/app/actions/roadmap";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { PlainError } from "@/components/auth/FormError";
import { cn } from "@/lib/cn";

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: "planned" | "in_progress" | "shipped";
  eta_label: string | null;
  is_official: boolean;
  votes: number;
  voted: boolean;
}

const STATUS_TONE: Record<RoadmapItem["status"], ChipTone> = {
  shipped: "success",
  in_progress: "amber",
  planned: "neutral",
};

export function RoadmapList({
  items,
  isAuthenticated,
}: {
  items: RoadmapItem[];
  isAuthenticated: boolean;
}) {
  const t = useTranslations("roadmap");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [local, setLocal] = useState(items);

  function vote(id: string) {
    if (!isAuthenticated) return;

    // Optimiste, annulé si le serveur refuse.
    setLocal((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, voted: !i.voted, votes: i.votes + (i.voted ? -1 : 1) }
          : i,
      ),
    );
    startTransition(async () => {
      const res = await toggleVote(id);
      if (!res.ok) {
        setLocal(items);
        setError(res.error);
      }
    });
  }

  async function submit() {
    setError(undefined);
    const res = await suggestFeature({ title, description: desc });
    if (!res.ok) return setError(res.error);
    setOpen(false);
    setTitle("");
    setDesc("");
    router.refresh();
  }

  const shipped = local.filter((i) => i.status === "shipped");
  const building = local.filter((i) => i.status === "in_progress");
  // Les plus votés en tête : c'est le signal qu'on veut lire.
  const planned = local
    .filter((i) => i.status === "planned")
    .sort((a, b) => b.votes - a.votes);

  const section = (
    label: string,
    list: RoadmapItem[],
    hint?: string,
  ) =>
    list.length > 0 && (
      <section className="flex flex-col gap-2.5">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[13px] font-[650]">{label}</h2>
          <span className="text-[11px] text-ink-muted">{list.length}</span>
        </div>
        {hint && <p className="text-[11.5px] text-ink-muted -mt-1">{hint}</p>}
        <div className="flex flex-col gap-2">
          {list.map((i) => (
            <div
              key={i.id}
              className="flex items-start gap-3 bg-surface border border-line rounded-card p-3.5"
            >
              <button
                onClick={() => vote(i.id)}
                disabled={!isAuthenticated || pending}
                title={isAuthenticated ? t("voteHint") : t("loginToVote")}
                className={cn(
                  "flex flex-col items-center justify-center w-11 shrink-0 rounded-btn border py-1.5 transition-colors",
                  i.voted
                    ? "border-accent bg-chip-indigo-bg text-chip-indigo-fg"
                    : "border-line text-ink-secondary",
                  isAuthenticated
                    ? "cursor-pointer hover:border-line-strong"
                    : "cursor-not-allowed opacity-60",
                )}
              >
                <span className="text-[10px] leading-none">▲</span>
                <span className="font-mono text-[12.5px] font-medium leading-tight mt-0.5">
                  {i.votes}
                </span>
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold">{i.title}</span>
                  <Chip tone={STATUS_TONE[i.status]}>
                    {t(`status.${i.status}`)}
                  </Chip>
                  {i.eta_label && <Chip tone="indigo">{i.eta_label}</Chip>}
                  {!i.is_official && (
                    <Chip tone="outline">{t("community")}</Chip>
                  )}
                </div>
                {i.description && (
                  <p className="text-[12px] text-ink-secondary leading-relaxed mt-1">
                    {i.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    );

  return (
    <div className="flex flex-col gap-8">
      <PlainError message={error} />

      <div className="flex items-center justify-between gap-4">
        <p className="text-[12.5px] text-ink-secondary leading-relaxed max-w-xl">
          {t("intro")}
        </p>
        {isAuthenticated ? (
          <Button variant="primary" onClick={() => setOpen(true)}>
            {t("suggest")}
          </Button>
        ) : (
          <a href="/connexion">
            <Button variant="secondary">{t("loginToSuggest")}</Button>
          </a>
        )}
      </div>

      {section(t("sectionBuilding"), building)}
      {section(t("sectionPlanned"), planned, t("plannedHint"))}
      {section(t("sectionShipped"), shipped, t("shippedHint"))}

      <Modal open={open} onClose={() => setOpen(false)} title={t("suggest")}>
        <div className="flex flex-col gap-4">
          <Input
            label={t("suggestTitle")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("suggestTitlePlaceholder")}
            autoFocus
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px] font-medium text-ink-secondary">
              {t("suggestDesc")}
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              placeholder={t("suggestDescPlaceholder")}
              className="px-2.5 py-2 text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={submit}
              disabled={title.trim().length < 4}
            >
              {t("send")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
