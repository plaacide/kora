"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createInvitation } from "@/app/actions/invitations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlainError } from "@/components/auth/FormError";
import { LEVELS, type Level } from "@/lib/permissions";
import { cn } from "@/lib/cn";

export function InviteForm({ dealId }: { dealId: string }) {
  const t = useTranslations("invitations");
  const tp = useTranslations("permissions");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [level, setLevel] = useState<Level>("watermark");
  const [nda, setNda] = useState(true);
  const [expires, setExpires] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [link, setLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [emailIssue, setEmailIssue] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(undefined);
    setLink(null);
    setEmailIssue(null);

    const res = await createInvitation({
      dealId,
      email: email.trim(),
      ndaRequired: nda,
      level,
      expiresAt: expires || null,
    });
    setBusy(false);

    if (!res.ok || !res.link) {
      setError(res.error ?? "error");
      return;
    }

    // L'invitation est valide même si l'email n'est pas parti : on affiche
    // toujours le lien pour permettre une transmission manuelle.
    setLink(res.link);
    setEmailSent(!res.emailSkipped && !res.emailError);
    setEmailIssue(res.emailError ?? (res.emailSkipped ? "skipped" : null));
    setEmail("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <PlainError message={error} />

      <Input
        label={t("email")}
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="investisseur@proparco.fr"
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="level"
            className="text-[11.5px] font-medium text-ink-secondary"
          >
            {t("level")}
          </label>
          <select
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value as Level)}
            className="h-8 px-2.5 text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none"
          >
            {LEVELS.filter((l) => l !== "none" && l !== "edit").map((l) => (
              <option key={l} value={l}>
                {tp(`levels.${l}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="expires"
            className="text-[11.5px] font-medium text-ink-secondary"
          >
            {t("expiresAt")}
          </label>
          <input
            id="expires"
            type="date"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
            className="h-8 px-2.5 text-[12.5px] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={nda}
          onChange={(e) => setNda(e.target.checked)}
        />
        <span className="text-[12.5px] text-ink-secondary">
          {t("ndaRequired")}
        </span>
      </label>

      <Button
        variant="primary"
        onClick={submit}
        disabled={busy || email.trim().length < 5}
      >
        {busy ? t("creating") : t("invite")}
      </Button>

      {link && (
        <div
          className={cn(
            "flex flex-col gap-2 rounded-card p-3",
            emailSent ? "bg-chip-success-bg" : "bg-chip-amber-bg",
          )}
        >
          <span
            className={cn(
              "text-[11.5px] font-[650]",
              emailSent ? "text-chip-success-fg" : "text-chip-amber-fg",
            )}
          >
            {emailSent ? t("emailSent") : t("linkReady")}
          </span>

          {!emailSent && (
            <span className="text-[10.5px] text-ink-secondary leading-relaxed">
              {emailIssue === "skipped"
                ? t("emailNotConfigured")
                : t("emailFailed", { error: emailIssue ?? "" })}
            </span>
          )}

          <code className="font-mono text-[10.5px] text-ink-secondary break-all">
            {link}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(link)}
            className="self-start text-[11.5px] font-medium text-ink cursor-pointer underline"
          >
            {t("copyLink")}
          </button>
        </div>
      )}
    </div>
  );
}
