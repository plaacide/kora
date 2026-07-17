"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PlainError } from "./FormError";

export function TwoFactorSetup({ initialEnabled }: { initialEnabled: boolean }) {
  const t = useTranslations("security.twoFactor");
  const tc = useTranslations("common");
  const [enabled, setEnabled] = useState(initialEnabled);
  const [qr, setQr] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function startEnroll() {
    setError(undefined);
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Kora TOTP ${Date.now()}`,
    });
    setBusy(false);
    if (error) return setError(error.message);
    setFactorId(data.id);
    setQr(data.totp.qr_code);
    setSecret(data.totp.secret);
  }

  async function verify() {
    if (!factorId) return;
    setError(undefined);
    setBusy(true);
    const supabase = createClient();
    const ch = await supabase.auth.mfa.challenge({ factorId });
    if (ch.error) {
      setBusy(false);
      return setError(ch.error.message);
    }
    const v = await supabase.auth.mfa.verify({
      factorId,
      challengeId: ch.data.id,
      code: code.trim(),
    });
    setBusy(false);
    if (v.error) return setError(t("codeIncorrect"));
    setEnabled(true);
    setQr(null);
    setFactorId(null);
    setSecret(null);
    setCode("");
  }

  async function disable() {
    setBusy(true);
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    for (const f of data?.totp ?? []) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    setBusy(false);
    setEnabled(false);
  }

  if (enabled) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Chip tone="success">{t("enabled")}</Chip>
          <span className="text-[12.5px] text-ink-secondary">
            {t("enabledHint")}
          </span>
        </div>
        <Button variant="ghost" onClick={disable} disabled={busy}>
          {t("disable")}
        </Button>
      </div>
    );
  }

  if (qr) {
    return (
      <div className="flex flex-col gap-4 max-w-sm">
        <p className="text-[12.5px] text-ink-secondary leading-relaxed">
          {t("scanHint")}
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qr}
          alt={t("qrAlt")}
          className="w-44 h-44 border border-line rounded-card bg-surface p-2"
        />
        <div className="text-[11px] text-ink-muted">
          {t("manualKey")}{" "}
          <code className="font-mono text-ink-secondary break-all">
            {secret}
          </code>
        </div>
        <PlainError message={error} />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          className="h-9 px-3 text-[15px] font-mono tracking-[0.3em] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none"
        />
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={verify}
            disabled={busy || code.length < 6}
          >
            {busy ? t("verifying") : t("enable")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setQr(null);
              setFactorId(null);
            }}
            disabled={busy}
          >
            {tc("cancel")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5">
        <Chip tone="neutral">{t("disabled")}</Chip>
        <span className="text-[12.5px] text-ink-secondary">
          {t("disabledHint")}
        </span>
      </div>
      <div className="flex flex-col items-end gap-1">
        <PlainError message={error} />
        <Button variant="primary" onClick={startEnroll} disabled={busy}>
          {t("enable")}
        </Button>
      </div>
    </div>
  );
}
