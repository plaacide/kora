"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { createInvitation } from "@/app/actions/invitations";
import type { Level } from "@/lib/permissions";

/**
 * Bouton « Partager / Inviter » + son modal (handoff, modal Partager).
 *
 * RÉEL : le formulaire — e-mail, niveau d'accès, expiration, exiger un NDA —
 * appelle `createInvitation`, la même action que l'écran d'invitation. On
 * partage pour de vrai, pas en dummy.
 */

const NIVEAUX: { value: Level; label: string; hint: string }[] = [
  { value: "watermark", label: "lvlWatermark", hint: "lvlWatermarkHint" },
  { value: "view", label: "lvlView", hint: "lvlViewHint" },
  { value: "download", label: "lvlDownload", hint: "lvlDownloadHint" },
];

export function ShareButton({
  dealId,
  label,
  className,
  defaultNda = true,
  disabled = false,
  disabledTitle,
}: {
  dealId: string;
  label?: string;
  className?: string;
  /** Désactivé : on ne partage pas une data room vide (handoff §2.2). */
  disabled?: boolean;
  disabledTitle?: string;
  /** État initial de « exiger un NDA » — reprend le réglage de la data room. */
  defaultNda?: boolean;
}) {
  const t = useTranslations("dataroom.shareModal");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState<Level>("watermark");
  const [nda, setNda] = useState(defaultNda);
  const [expire, setExpire] = useState("");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | undefined>();
  const [lienManuel, setLienManuel] = useState<string | undefined>();

  const hint = NIVEAUX.find((n) => n.value === level)?.hint ?? "";

  async function envoyer() {
    if (!email.includes("@")) return;
    setBusy(true);
    setErreur(undefined);
    setLienManuel(undefined);
    const res = await createInvitation({
      dealId,
      email: email.trim(),
      ndaRequired: nda,
      level,
      expiresAt: expire || null,
    });
    setBusy(false);
    if (!res.ok) return setErreur(res.error);
    if (res.emailSkipped || res.emailError) {
      setLienManuel(res.link);
      return;
    }
    setOpen(false);
    setEmail("");
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={className} disabled={disabled} title={disabled ? disabledTitle : undefined}>
        {label ?? t("shareCta")}
      </button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="bg-white px-6 pt-5 pb-4 border-b border-[#E8E5DC]">
          <div className="text-[16px] font-[700] text-[#1A1B1F]">{t("title")}</div>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-[600] text-[#33353B]">{t("guestEmail")}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("phGuestEmail")}
              autoFocus
              className="bg-white h-9 px-3 text-[13px] border border-[#E4E2DC] rounded-[5px] focus:outline-none focus:border-[#C9C6BD]"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-[600] text-[#33353B]">{t("accessLevel")}</span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as Level)}
                className="h-9 px-2.5 text-[13px] border border-[#E4E2DC] rounded-[5px] bg-white focus:outline-none focus:border-[#C9C6BD]"
              >
                {NIVEAUX.map((n) => (
                  <option key={n.value} value={n.value}>{t(n.label)}</option>
                ))}
              </select>
              <span className="text-[11px] text-[#9DA0A8]">{t(hint)}</span>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-[600] text-[#33353B]">{t("expiresOn")}</span>
              <input
                type="date"
                value={expire}
                onChange={(e) => setExpire(e.target.value)}
                className="bg-white h-9 px-2.5 text-[13px] border border-[#E4E2DC] rounded-[5px] focus:outline-none focus:border-[#C9C6BD]"
              />
              <span className="text-[11px] text-[#9DA0A8]">{t("expiresHint")}</span>
            </label>
          </div>

          <button
            onClick={() => setNda((v) => !v)}
            className="flex items-center gap-2.5 text-left"
          >
            <span className={"inline-flex w-[34px] h-[19px] rounded-full relative shrink-0 transition-colors " + (nda ? "bg-[#1D9E75]" : "bg-[#DAD8D0]")}>
              <span className={"absolute top-0.5 w-[15px] h-[15px] rounded-full bg-white transition-all " + (nda ? "right-0.5" : "left-0.5")} />
            </span>
            <span className="text-[12.5px] text-[#55585F] leading-[1.5]">
              <b className="text-[#1A1B1F] font-[600]">{t("ndaToggle")}</b> {t("ndaToggleBody")}
            </span>
          </button>

          {erreur && <p className="text-[12px] text-[#A32D2D]">{erreur}</p>}
          {lienManuel && (
            <div className="rounded-[6px] border border-[#E4E2DC] bg-[#FAFAF8] px-3 py-2.5">
              <p className="text-[12px] text-[#6E727A]">{t("mailFailed")}</p>
              <code className="block mt-1 text-[11px] text-[#1A1B1F] break-all">{lienManuel}</code>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[#E8E5DC] flex justify-end gap-2.5">
          <button onClick={() => setOpen(false)} className="border border-[#E4E2DC] rounded-[5px] px-4 py-2 text-[13px] font-[600] text-[#33353B] hover:bg-[#FAF8F4]">{t("cancel")}</button>
          <button
            onClick={envoyer}
            disabled={busy || !email.includes("@")}
            className="rounded-[5px] bg-[#FF5A1F] px-4 py-2 text-[13px] font-[600] text-white hover:bg-[#E74C16] disabled:opacity-50"
          >
            {busy ? t("sending") : t("sendInvite")}
          </button>
        </div>
      </Modal>
    </>
  );
}
