import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EncryptionBadge } from "@/components/ui/EncryptionBadge";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { logout } from "@/app/actions/auth";

function initials(email: string): string {
  const name = email.split("@")[0] ?? "";
  const parts = name.split(/[.\-_]/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "");
  return letters.toUpperCase() || "??";
}

export async function Topbar({
  orgName,
  userEmail,
}: {
  orgName: string;
  userEmail: string;
}) {
  const t = await getTranslations("shell");

  return (
    <header className="sticky top-0 z-[60] flex items-center gap-2.5 h-[52px] px-4 bg-[rgba(255,255,255,0.92)] backdrop-blur-md border-b border-line">
      <div className="flex items-center gap-2 pr-3.5 border-r border-line">
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
          aria-label={t("home")}
        >
          <span className="grid place-items-center w-6 h-6 rounded-[6px] bg-gradient-to-br from-primary to-primary-strong text-white font-bold text-[12px]">
            K
          </span>
          <span className="text-[14px] font-[650] tracking-[-0.01em] text-ink">
            Sanza
          </span>
        </Link>
        <span className="text-[11px] font-[550] text-ink-secondary bg-chip-neutral-bg rounded-chip px-1.5 py-0.5">
          {orgName}
        </span>
      </div>

      <div className="flex items-center gap-2 w-[260px] h-8 px-2.5 border border-line rounded-field bg-surface text-ink-placeholder">
        <span className="text-[12.5px]">{t("searchPlaceholder")}</span>
        <kbd className="ml-auto font-mono text-[10.5px] font-medium bg-chip-neutral-bg rounded-[4px] px-1.5 py-0.5 text-ink-secondary">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <EncryptionBadge />
        <LocaleSwitcher />
        <span
          className="grid place-items-center w-[30px] h-[30px] rounded-full bg-primary text-white text-[11.5px] font-[650]"
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
