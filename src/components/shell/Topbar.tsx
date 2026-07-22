import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SanzaLogo } from "@/components/ui/SanzaLogo";
import { EncryptionBadge } from "@/components/ui/EncryptionBadge";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { logout } from "@/app/actions/auth";
import type { Persona } from "@/lib/persona";
import { personaLabel } from "./persona-label";

function initials(email: string): string {
  const name = email.split("@")[0] ?? "";
  const parts = name.split(/[.\-_]/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "");
  return letters.toUpperCase() || "??";
}

/** Sigle d'une organisation : initiales des deux premiers mots (Sulma Whole → SW). */
function orgInitials(name: string): string {
  const mots = name.trim().split(/\s+/).filter(Boolean);
  const letters = (mots[0]?.[0] ?? "") + (mots[1]?.[0] ?? mots[0]?.[1] ?? "");
  return letters.toUpperCase() || "??";
}

export async function Topbar({
  orgName,
  userEmail,
  persona = "fund",
}: {
  orgName: string;
  userEmail: string;
  persona?: Persona;
}) {
  const t = await getTranslations("shell");
  // Composant SERVEUR : variante `personaLabel`, pas le hook.
  const mot = personaLabel(t, persona);

  return (
    <header className="sticky top-0 z-[60] flex items-center gap-4 h-[56px] px-5 bg-white border-b border-[#ECEBE6]">
      <Link href="/dashboard" aria-label={t("home")}>
        <SanzaLogo size={20} />
      </Link>
      <span className="w-px h-[22px] bg-[#ECEBE6]" aria-hidden />

      {/* Sélecteur d'organisation — badge carré-arrondi + nom + chevron. */}
      <Link
        href="/deal"
        className="flex items-center gap-2.5 rounded-[5px] px-2.5 py-1.5 -ml-0.5 hover:bg-[#F5F4F0] transition-colors"
      >
        <span className="grid place-items-center w-6 h-6 rounded-[5px] bg-[#FBEDE6] text-[#C24619] text-[9.5px] font-[700]">
          {orgInitials(orgName)}
        </span>
        <span className="text-[13.5px] font-[600] text-ink truncate max-w-[160px]">
          {orgName}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A0A3AB" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </Link>

      <div className="flex items-center gap-2.5 w-[300px] h-9 px-3 rounded-[5px] bg-[#F5F4F0] text-[#A0A3AB]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <span className="text-[13px] truncate">{mot("searchPlaceholder")}</span>
        <kbd className="ml-auto font-mono text-[10px] text-[#9DA0A8]">⌘K</kbd>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <EncryptionBadge />
        {/* Partager = ouvrir le flux d'invitation (donner accès). */}
        <Link
          href="/invitations"
          className="sz-cta text-[13px] px-4 py-2 gap-2 inline-flex items-center"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
            <path d="M16 6l-4-4-4 4" />
            <path d="M12 2v13" />
          </svg>
          {t("share")}
        </Link>
        <LocaleSwitcher />
        <span
          className="grid place-items-center w-[31px] h-[31px] rounded-[6px] bg-[#1A1B1F] text-white text-[11px] font-[700]"
          title={userEmail}
        >
          {initials(userEmail)}
        </span>
        <form action={logout}>
          <button
            type="submit"
            className="text-[12px] font-medium text-ink-secondary hover:text-ink cursor-pointer"
          >
            {t("logout")}
          </button>
        </form>
      </div>
    </header>
  );
}
