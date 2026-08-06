"use client";

import { useTranslations } from "next-intl";
/** Impression / enregistrement en PDF de la preuve (via le navigateur). */
export function PrintButton() {
  const t = useTranslations("nda");
  return (
    <button
      onClick={() => window.print()}
      className="rounded-[5px] bg-[#FF5A1F] px-4 py-2 text-[13px] font-[600] text-white hover:bg-[#E74C16]"
    >{t("printPdf")}</button>
  );
}
