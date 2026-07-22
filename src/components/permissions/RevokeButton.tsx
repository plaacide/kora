"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPermission } from "@/app/actions/permissions";

/**
 * Révoque l'accès d'un invité : on met TOUS ses dossiers au niveau `none`
 * (fermé par défaut). `effective_permission` ignore alors ces règles et
 * retombe sur « aucun accès ». Chaque écriture est auditée côté base.
 */
export function RevokeButton({
  dealId,
  userId,
  folderIds,
  label,
  confirmLabel,
}: {
  dealId: string;
  userId: string;
  folderIds: string[];
  label: string;
  confirmLabel: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);

  function revoke() {
    if (!window.confirm(confirmLabel)) return;
    start(async () => {
      setError(false);
      for (const folderId of folderIds) {
        const res = await setPermission({ dealId, userId, folderId, level: "none" });
        if (!res.ok) {
          setError(true);
          return;
        }
      }
      router.refresh();
    });
  }

  return (
    <button
      onClick={revoke}
      disabled={pending || folderIds.length === 0}
      className={
        "text-right text-[12px] font-[600] cursor-pointer disabled:opacity-50 " +
        (error ? "text-[#A32D2D]" : "text-[#C24619] hover:text-[#1A1B1F]")
      }
    >
      {pending ? "…" : label}
    </button>
  );
}
