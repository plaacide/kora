"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { applyChecklist } from "@/app/actions/checklist";
import { Button } from "@/components/ui/Button";
import { PlainError } from "@/components/auth/FormError";

/** Permet d'appliquer la checklist à un deal créé avant son existence. */
export function ApplyChecklistButton({ dealId }: { dealId: string }) {
  const t = useTranslations("checklist");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function apply() {
    setBusy(true);
    setError(undefined);
    const res = await applyChecklist(dealId);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <PlainError message={error} />
      <Button variant="primary" onClick={apply} disabled={busy}>
        {busy ? t("applying") : t("applyTemplate")}
      </Button>
    </div>
  );
}
