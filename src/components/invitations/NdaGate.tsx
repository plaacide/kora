"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { acceptInvitation } from "@/app/actions/invitations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlainError } from "@/components/auth/FormError";

export function NdaGate({
  token,
  dealName,
  orgName,
  ndaRequired,
  ndaTemplate,
}: {
  token: string;
  dealName: string;
  orgName: string;
  ndaRequired: boolean;
  /** Texte d'accord personnalisé du fondateur ; sinon texte générique. */
  ndaTemplate?: string | null;
}) {
  const t = useTranslations("invitations");
  const router = useRouter();
  const [name, setName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function sign() {
    setBusy(true);
    setError(undefined);
    const res = await acceptInvitation({ token, signerName: name.trim() });
    setBusy(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push("/data-room");
    router.refresh();
  }

  const ready = !ndaRequired || (accepted && name.trim().length >= 2);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">
          {ndaRequired ? t("ndaTitle") : t("accessTitle")}
        </h1>
        <p className="mt-1.5 text-[12.5px] text-ink-secondary leading-relaxed">
          {t("ndaIntro", { org: orgName, deal: dealName })}
        </p>
      </div>

      {ndaRequired && (
        <div className="bg-surface border border-line rounded-card p-4 max-h-52 overflow-y-auto text-[12px] text-ink-secondary leading-relaxed">
          <p className="font-[650] text-ink mb-2">{t("ndaHeading")}</p>
          {ndaTemplate?.trim() ? (
            <p className="whitespace-pre-wrap">{ndaTemplate}</p>
          ) : (
            <p>{t("ndaBody", { org: orgName, deal: dealName })}</p>
          )}
        </div>
      )}

      <PlainError message={error} />

      {ndaRequired && (
        <>
          <Input
            label={t("signerName")}
            name="signer"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aminata Diallo"
          />
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-[12px] text-ink-secondary leading-relaxed">
              {t("ndaConsent")}
            </span>
          </label>
        </>
      )}

      <Button
        variant="primary"
        onClick={sign}
        loading={busy}
        disabled={!ready || busy}
        className="w-full"
      >
        {busy ? t("signing") : ndaRequired ? t("signAndAccess") : t("access")}
      </Button>

      <p className="text-[11px] text-ink-muted leading-relaxed">
        {t("signatureNotice")}
      </p>
    </div>
  );
}
