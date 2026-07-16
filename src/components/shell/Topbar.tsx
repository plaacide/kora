import Link from "next/link";
import { EncryptionBadge } from "@/components/ui/EncryptionBadge";

export function Topbar() {
  return (
    <header className="sticky top-0 z-[60] flex items-center gap-2.5 h-[52px] px-4 bg-[rgba(255,255,255,0.92)] backdrop-blur-md border-b border-line">
      <div className="flex items-center gap-2 pr-3.5 border-r border-line">
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
          aria-label="Kora — accueil"
        >
          <span className="grid place-items-center w-6 h-6 rounded-[6px] bg-gradient-to-br from-primary to-primary-strong text-white font-bold text-[12px]">
            K
          </span>
          <span className="text-[14px] font-[650] tracking-[-0.01em] text-ink">
            Kora
          </span>
        </Link>
        <span className="text-[11px] font-[550] text-ink-secondary bg-chip-neutral-bg rounded-chip px-1.5 py-0.5">
          Amani Capital
        </span>
      </div>

      <div className="flex items-center gap-2 w-[260px] h-8 px-2.5 border border-line rounded-field bg-surface text-ink-placeholder">
        <span className="text-[12.5px]">Rechercher un deal, un document…</span>
        <kbd className="ml-auto font-mono text-[10.5px] font-medium bg-chip-neutral-bg rounded-[4px] px-1.5 py-0.5 text-ink-secondary">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <EncryptionBadge />
        <span className="grid place-items-center w-[30px] h-[30px] rounded-full bg-primary text-white text-[11.5px] font-[650]">
          AD
        </span>
      </div>
    </header>
  );
}
