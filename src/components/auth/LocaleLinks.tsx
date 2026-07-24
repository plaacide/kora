"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { setLocale } from "@/app/actions/auth";

/**
 * Choix de langue en PIED DE PAGE des écrans d'auth (handoff v2 §2) : deux
 * liens discrets, hors du formulaire — la langue n'est pas un champ à remplir
 * pour créer un compte, c'est une préférence d'affichage.
 */
const LANGUES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
] as const;

export function LocaleLinks() {
  const current = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <span className="flex items-center gap-2">
      {LANGUES.map((l, i) => (
        <span key={l.code} className="flex items-center gap-2">
          {i > 0 && <span className="text-[#D5D2CA]">·</span>}
          <button
            type="button"
            disabled={pending || current === l.code}
            onClick={() =>
              start(async () => {
                await setLocale(l.code);
                router.refresh();
              })
            }
            className={
              current === l.code
                ? "text-[#4A4E63] font-[600] cursor-default"
                : "hover:text-[#4A4E63] cursor-pointer"
            }
          >
            {l.label}
          </button>
        </span>
      ))}
    </span>
  );
}
