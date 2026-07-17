"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { setPermission } from "@/app/actions/permissions";
import { nextLevel, type Level } from "@/lib/permissions";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";

export interface PermUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface PermFolder {
  id: string;
  name: string;
  index_path: string;
}

/** level -> {clé de libellé, ton visuel} — reprend les couleurs du prototype. */
const TONES: Record<Level, ChipTone> = {
  none: "outline",
  watermark: "amber",
  view: "indigo",
  download: "success",
  edit: "neutral",
};

export function PermissionMatrix({
  dealId,
  users,
  folders,
  initial,
}: {
  dealId: string;
  users: PermUser[];
  folders: PermFolder[];
  initial: Record<string, Level>; // `${userId}:${folderId}` -> level
}) {
  const t = useTranslations("permissions");
  const [grid, setGrid] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function levelOf(userId: string, folderId: string): Level {
    return grid[`${userId}:${folderId}`] ?? "none";
  }

  function bump(userId: string, folderId: string) {
    const current = levelOf(userId, folderId);
    const next = nextLevel(current);
    const key = `${userId}:${folderId}`;

    // Optimiste : on affiche tout de suite, on corrige si le serveur refuse.
    setGrid((g) => ({ ...g, [key]: next }));
    setError(null);

    startTransition(async () => {
      const res = await setPermission({
        dealId,
        userId,
        folderId,
        level: next,
      });
      if (!res.ok) {
        setGrid((g) => ({ ...g, [key]: current }));
        setError(res.error ?? "error");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="text-[11.5px] text-[oklch(0.48_0.16_25)] bg-chip-error-bg rounded-chip px-2.5 py-2">
          {error}
        </p>
      )}

      <div className="bg-surface border border-line rounded-card shadow-card overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-bg border-b border-separator-soft">
              <th className="text-left px-3.5 py-2 text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted sticky left-0 bg-bg">
                {t("colUser")}
              </th>
              {folders.map((f) => (
                <th
                  key={f.id}
                  className="px-2 py-2 text-[10.5px] font-[650] text-ink-muted whitespace-nowrap"
                >
                  <span className="font-mono">{f.index_path}</span>{" "}
                  <span className="font-sans">{f.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-separator last:border-0">
                <td className="px-3.5 py-2.5 sticky left-0 bg-surface">
                  <div className="text-[12.5px] font-semibold">
                    {u.full_name || u.email}
                  </div>
                  <div className="text-[10.5px] text-ink-muted">{u.role}</div>
                </td>
                {folders.map((f) => {
                  const lvl = levelOf(u.id, f.id);
                  const admin = u.role === "owner" || u.role === "admin";
                  return (
                    <td key={f.id} className="px-2 py-2.5 text-center">
                      <button
                        onClick={() => !admin && bump(u.id, f.id)}
                        disabled={pending || admin}
                        title={admin ? t("adminAlways") : t("clickToCycle")}
                        className={cn(
                          "cursor-pointer disabled:cursor-default",
                          admin && "opacity-60",
                        )}
                      >
                        <Chip tone={admin ? "success" : TONES[lvl]}>
                          {admin ? t("levels.edit") : t(`levels.${lvl}`)}
                        </Chip>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11.5px] text-ink-muted">{t("hint")}</p>
    </div>
  );
}
