"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPermission } from "@/app/actions/permissions";
import type { Level } from "@/lib/permissions";

/**
 * Change le niveau d'accès d'un invité, en ligne (menu déroulant). Le nouveau
 * niveau est appliqué à TOUS les dossiers de l'invité via `set_permission`
 * (RPC audité). « Révoquer » reste à part (niveau `none`).
 */
const NIVEAUX: { value: Level; label: string }[] = [
  { value: "watermark", label: "Filigrané" },
  { value: "view", label: "Lecture seule" },
  { value: "download", label: "Télécharger" },
];

export function RightsEditor({
  dealId,
  userId,
  folderIds,
  current,
}: {
  dealId: string;
  userId: string;
  folderIds: string[];
  current: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [level, setLevel] = useState(current);
  const [error, setError] = useState(false);

  function change(l: Level) {
    setOpen(false);
    if (l === level) return;
    setLevel(l);
    start(async () => {
      setError(false);
      for (const folderId of folderIds) {
        const res = await setPermission({ dealId, userId, folderId, level: l });
        if (!res.ok) {
          setError(true);
          setLevel(current);
          return;
        }
      }
      router.refresh();
    });
  }

  const label = NIVEAUX.find((n) => n.value === level)?.label ?? level;

  return (
    <span className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={pending || folderIds.length === 0}
        className={"flex items-center gap-1.5 text-[12.5px] font-[600] cursor-pointer disabled:opacity-50 " + (error ? "text-[#A32D2D]" : "")}
      >
        {pending ? "…" : label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#A0A3AB" strokeWidth="2.2" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <>
          <span className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <span className="absolute left-0 top-7 z-[91] w-40 rounded-[6px] border border-[#ECEBE6] bg-white shadow-[0_10px_30px_rgba(26,27,31,0.14)] py-1 flex flex-col">
            {NIVEAUX.map((n) => (
              <button
                key={n.value}
                onClick={() => change(n.value)}
                className={"text-left px-3 py-2 text-[12.5px] hover:bg-[#FAFAF8] " + (n.value === level ? "text-[#C24619] font-[600]" : "text-[#33353B]")}
              >
                {n.label}
              </button>
            ))}
          </span>
        </>
      )}
    </span>
  );
}
