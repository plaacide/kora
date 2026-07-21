"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { PlainError } from "./FormError";

export function TwoFactorChallenge() {
  const t = useTranslations("security.twoFactor");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function verify() {
    setError(undefined);
    setBusy(true);
    const supabase = createClient();
    const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
    if (fErr) {
      setBusy(false);
      return setError(fErr.message);
    }
    const factor = factors?.totp?.[0];
    if (!factor) {
      setBusy(false);
      return setError(t("noFactor"));
    }
    const ch = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (ch.error) {
      setBusy(false);
      return setError(ch.error.message);
    }
    const v = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: ch.data.id,
      code: code.trim(),
    });
    setBusy(false);
    if (v.error) return setError(t("codeIncorrect"));
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">
          {t("challengeTitle")}
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-secondary">
          {t("challengeSubtitle")}
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <PlainError message={error} />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder="123456"
          onKeyDown={(e) => {
            if (e.key === "Enter" && code.trim().length >= 6) verify();
          }}
          className="h-10 px-3 text-[17px] font-mono tracking-[0.35em] bg-surface text-ink rounded-field border border-line focus:border-accent focus:outline-none"
        />
        <Button
          variant="primary"
          onClick={verify}
          loading={busy}
          disabled={busy || code.trim().length < 6}
        >
          {busy ? t("verifying") : t("verify")}
        </Button>
      </div>
    </div>
  );
}
